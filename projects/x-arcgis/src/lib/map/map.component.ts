import { from, Observable } from 'rxjs';
import { map, mapTo, switchMap } from 'rxjs/operators';

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { Address, GeometryType, SceneType } from '../model';
import { BasemapService, ConfigService, DrawService } from '../providers';
import { FeatureLayerService } from '../providers/feature-layer.service';
import { Map2dService } from '../providers/map2d.service';
import { Map3dService } from '../providers/map3d.service';
import { SearchService } from '../providers/search.service';
import { StoreService } from '../providers/store.service';

import esri = __esri;
@Component({
  selector: 'x-arcgis-map',
  template: ``,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
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

  mapUnloaded = true;

  /**
   * the search component will be displayed and search event will be handled if received;
   */
  @Input() onSearch: Observable<Address>;

  /**
   * the draw component will be displayed and the draw process will be launched if received;
   */
  @Input() onDraw: Observable<GeometryType>;

  /**
   * Show 2D/3D switch button;
   */
  @Input() showSceneBtn = true;

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  sceneType: SceneType = '2D';

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   */
  private _zoom = 5;

  private _center: [number, number] = [113.656723, 34.764252];

  private _view: esri.MapView = null;

  private _initialView: esri.MapViewProperties = {
    zoom: this.zoom,
    center: this._center,
    highlightOptions: {
      color: [235, 191, 122, 1],
      haloOpacity: 0.9,
      fillOpacity: 0,
    },
  };

  constructor(
    private configService: ConfigService,
    private searchService: SearchService,
    private basemapService: BasemapService,
    private featureLayerService: FeatureLayerService,
    private storeService: StoreService,
    private drawService: DrawService,
    private map2dService: Map2dService,
    private map3dService: Map3dService
  ) {}

  async ngOnInit() {
    await this.configService.setArcgisConfigs();

    this.loadMap();

    if (this.onSearch) {
      this.searchService.handleSearch(this.onSearch);
    }

    if (this.onDraw) {
      this.drawService.handleDraw(this.onDraw);
    }
  }

  ngOnDestroy() {
    if (this._view) {
      this._view.container = null;
      this.storeService.destroy.next(true);
    }
  }

  switchView() {
    this.sceneType = this.sceneType === '2D' ? '3D' : '2D';

    this.loadMap();
  }

  private loadMap() {
    if (this.sceneType === '2D') {
      this.load2DMap();
    } else {
      this.load3DMap();
    }
  }

  private load3DMap() {
    const basemap = this.basemapService.getBasemap('imagery', 'google');
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
        },
        (error) => console.error(error),
        () => console.log('3D map loaded')
      );
  }

  private load2DMap() {
    const basemap = this.basemapService.getBasemap('imagery', 'google');

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
        ({ esriMap, esriMapView }) => {
          this._view = esriMapView;
          this.mapUnloaded = false;
          this.mapLoadedEvent.emit(true); // emit map loaded event;
          this.storeService.store.next({ esriMap, esriMapView });
        },
        (err) => console.warn(err),
        () => console.log('2D Map loaded')
      );
  }
}
