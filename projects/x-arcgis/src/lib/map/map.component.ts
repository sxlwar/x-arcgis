import { from, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, map, mapTo, switchMap, takeUntil, tap } from 'rxjs/operators';

import {
    Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';

import { Address, GeometryType, IFeatureLayerEditsEvent, IHandle, SceneType } from '../model';
import { BaseMapConfig } from '../model/basemap';
import { BasemapService } from '../providers/basemap.service';
import { ConfigService } from '../providers/config.service';
import { DrawService } from '../providers/draw.service';
import { FeatureLayerService } from '../providers/feature-layer.service';
import { Map2dService } from '../providers/map2d.service';
import { Map3dService } from '../providers/map3d.service';
import { SearchService } from '../providers/search.service';
import { SidenavService } from '../providers/sidenav.service';
import { StoreService } from '../providers/store.service';

import esri = __esri;

@Component({
  selector: 'x-arcgis-map',
  template: ``,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, OnDestroy {
  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: [number, number]) {
    this._center = center;
  }

  get center(): [number, number] {
    return this._center;
  }

  @Input()
  set initialView(params: esri.MapViewProperties) {
    if (!!params && typeof params === 'object') {
      this._initialView = {
        ...this._initialView,
        ...params,
      };
    }
  }

  get initialView(): esri.MapViewProperties {
    return this._initialView;
  }

  /**
   * the search component will be displayed and search event will be handled if received;
   */
  @Input() searchObs: Observable<Address>;

  /**
   * the draw component will be displayed and the draw process will be launched if received;
   */
  @Input() drawObs: Observable<GeometryType>;

  /**
   * Show 2D/3D switch button;
   */
  @Input() showSceneBtn = true;

  @Input() basemapObs: Observable<BaseMapConfig>;

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  @Output() mapLoaded = new EventEmitter<esri.MapView | esri.SceneView>();

  @Input() set sceneType(value: SceneType) {
    if (!!value && value !== this._sceneType) {
      this._sceneType = value;
      this.loadMap();
    }
  }

  get sceneType(): SceneType {
    return this._sceneType;
  }

  /**
   * geometry type being operated
   */
  @Output() drawingType: EventEmitter<GeometryType> = new EventEmitter();

  private _sceneType: SceneType = '2D';

  mapUnloaded = true;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   */
  private _zoom = 13;

  private _center: [number, number] = [113.656723, 34.764252];

  private _view: esri.MapView | esri.SceneView = null;

  private _initialView: esri.MapViewProperties = {
    zoom: this.zoom,
    center: this._center,
    highlightOptions: {
      color: [235, 191, 122, 1],
      haloOpacity: 0.9,
      fillOpacity: 0,
    },
  };

  private destroy$: Subject<boolean> = new Subject();

  private layerEditHandlers: IHandle[] = [];

  constructor(
    private configService: ConfigService,
    private searchService: SearchService,
    private basemapService: BasemapService,
    private featureLayerService: FeatureLayerService,
    private storeService: StoreService,
    private drawService: DrawService,
    private map2dService: Map2dService,
    private map3dService: Map3dService,
    private sidenavService: SidenavService
  ) {}

  async ngOnInit() {
    await this.configService.setArcgisConfigs();

    this.loadMap();
  }

  ngOnDestroy() {
    if (this._view) {
      this._view.container = null;
      this.storeService.destroy.next(true);
      this.destroy$.next(true);
    }

    this.layerEditHandlers.forEach((handler) => handler.remove());
  }

  private loadMap() {
    this.mapUnloaded = true;

    if (!this.basemapObs) {
      this.basemapObs = of({ type: 'imagery', publisher: 'google' });
    }

    if (this.sceneType === '2D') {
      this.basemapObs.pipe(takeUntil(this.destroy$)).subscribe((config) => this.load2DMap(config));
    } else {
      // 3D map does not support change basemap now;
      this.load3DMap();
    }
  }

  private load3DMap() {
    const basemap = this.basemapService.getBasemap({ type: 'imagery', publisher: 'google' });
    const esriMapObs = this.map2dService.loadMap(basemap);

    this.map3dService
      .loadMap(esriMapObs, {
        zoom: this.zoom,
        center: this.center,
      })
      .subscribe(
        (sceneView) => {
          const WebScene = this.map3dService.WebScene;
          const webScene = new WebScene({
            portalItem: {
              id: '7f7546e9ae014e43a82f49fba6d1b965',
            },
          });

          sceneView.map = webScene;
          sceneView.container = this.mapViewEl.nativeElement;

          this.setMapLoadedState(sceneView);
          this.storeService.store.next({ esriSceneView: sceneView, esriWebScene: webScene });
        },
        (error) => console.error(error),
        () => console.log('3D map loaded')
      );
  }

  private load2DMap(config: BaseMapConfig) {
    const basemap = this.basemapService.getBasemap(config);

    this.map2dService
      .loadMap(basemap)
      .pipe(
        switchMap((esriMap) => {
          const esriMapView = new this.map2dService.EsriMapView({
            ...this.initialView,
            map: esriMap,
            container: this.mapViewEl.nativeElement,
          });

          return from(esriMapView.when()).pipe(mapTo({ esriMap, esriMapView }));
        }),
        switchMap(({ esriMap, esriMapView }) =>
          this.featureLayerService
            .addBaseFeatureLayer(esriMap)
            .pipe(map((featureLayers) => ({ esriMap, esriMapView, featureLayers })))
        )
      )
      .subscribe(
        ({ esriMap, esriMapView, featureLayers }) => {
          this.setMapLoadedState(esriMapView, featureLayers);
          this.storeService.store.next({ esriMap, esriMapView });
        },
        (err) => console.warn(err),
        () => console.log('2D Map loaded')
      );
  }

  private setMapLoadedState(view: esri.MapView | esri.SceneView, layers?: esri.FeatureLayer[]) {
    this.mapUnloaded = false;
    this._view = view;
    this.mapLoaded.emit(view);

    if (this.searchObs) {
      this.searchService.handleSearch(this.searchObs);
    }

    this.layerEditHandlers = layers.map((layer) =>
      layer.on('edits', (event: IFeatureLayerEditsEvent) => {
        this.sidenavService.editResponse$.next(event);
      })
    );
    
    if (this.drawObs) {
      this.drawService.handleDraw(this.getDrawEvents());
    }
  }

  private getDrawEvents(): Observable<GeometryType> {
    return this.drawObs.pipe(
      distinctUntilChanged(),
      tap((type) => this.drawingType.next(type))
    );
  }
}
