import { combineLatest, from, Observable } from 'rxjs';
import { distinctUntilKeyChanged, filter, map, mapTo, switchMap } from 'rxjs/operators';

import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';

import { Address } from '../model';
import { BasemapService } from '../providers/basemap.service';
import { CoordinateService } from '../providers/coordinate.service';
import { FeatureLayerService } from '../providers/feature-layer.service';
import { XArcgisSearchService } from '../providers/x-arcgis.search.service';

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

  @Input() onSearch: Observable<Address>;

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
    private searchService: XArcgisSearchService,
    private basemapService: BasemapService,
    private featureLayerService: FeatureLayerService,
    private coordinateService: CoordinateService
  ) {}

  ngOnInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
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

      return { view, map };
    })
      .pipe(switchMap(({ view, map }) => from(view.when()).pipe(mapTo({ view, map }))))
      .subscribe(
        ({ view, map }) => {
          // this.searchService.addSearch(view);
          this._view = view;
          this.featureLayerService.addBaseFeatureLayer(map);
          this.mapLoadedEvent.emit(true); // emit map loaded event;
          this.handleSearch(view);
        },
        (err) => console.warn(err),
        () => console.log('is complete')
      );
  }

  private handleSearch(esriMapView: esri.MapView): void {
    if (this.onSearch) {
      this.onSearch
        .pipe(
          filter((v) => !!v),
          distinctUntilKeyChanged('location'),
          map((address) => {
            const { location } = address;

            return { center: this.coordinateService.bd2wgs(location.lng, location.lat), address };
          })
        )
        .subscribe((option) => {
          const { center, address } = option;

          esriMapView.goTo({ zoom: 16, center });

          this.searchService.displayPopup(address, esriMapView);
        });
    }
  }
}
