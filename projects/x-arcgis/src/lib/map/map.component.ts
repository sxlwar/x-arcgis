import { combineLatest, from, Observable } from 'rxjs';
import { map, mapTo, switchMap } from 'rxjs/operators';

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { Address, GeometryType } from '../model';
import { DrawService } from '../providers';
import { BasemapService } from '../providers/basemap.service';
import { FeatureLayerService } from '../providers/feature-layer.service';
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

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

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
    private searchService: SearchService,
    private basemapService: BasemapService,
    private featureLayerService: FeatureLayerService,
    private storeService: StoreService,
    private drawService: DrawService
  ) {}

  ngOnInit() {
    this.initMap();

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

  private initMap() {
    const basemap = this.basemapService.getBasemap('imagery', 'google');
    const modules = this.basemapService.loadModulesObs<
      esri.MapConstructor,
      esri.MapViewConstructor,
      esri.SceneViewConstructor
    >(['esri/Map', 'esri/views/MapView', 'esri/views/SceneView']);

    combineLatest(modules, basemap, ([EsriMap, EsriMapView, EsriSceneView], googleBasemap) => {
      const map = new EsriMap({ basemap: googleBasemap });
      const view = new EsriMapView({
        ...this.initialView,
        map,
        container: this.mapViewEl.nativeElement,
      });

      return { esriMapView: view, esriMap: map };
    })
      .pipe(
        switchMap(({ esriMap, esriMapView }) => from(esriMapView.when()).pipe(mapTo({ esriMap, esriMapView }))),
        switchMap(({ esriMap, esriMapView }) =>
          this.featureLayerService
            .addBaseFeatureLayer(esriMap)
            .pipe(map((featureLayers) => ({ esriMap, esriMapView, featureLayers })))
        )
      )
      .subscribe(
        ({ esriMap, esriMapView, featureLayers }) => {
          this._view = esriMapView;
          this.mapUnloaded = false;
          this.mapLoadedEvent.emit(true); // emit map loaded event;
          this.storeService.store.next({ esriMap, esriMapView });
        },
        (err) => console.warn(err),
        () => console.log('is complete')
      );
  }
}
