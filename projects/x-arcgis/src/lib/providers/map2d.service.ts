import { iif, Observable, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base, MapBase } from '../base/base';

import esri = __esri;

export abstract class Map2dBase extends Base {}

@Injectable({ providedIn: 'root' })
export class Map2dService extends Map2dBase implements MapBase {
  isModulesLoaded = false;

  EsriMap: esri.MapConstructor;

  EsriMapView: esri.MapViewConstructor;

  loadMap(basemapObs: Observable<esri.Basemap>): Observable<esri.Map> {
    return iif(
      () => this.isModulesLoaded,
      basemapObs.pipe(map((basemap) => new this.EsriMap({ basemap }))),
      zip(
        basemapObs,
        this.loadModulesObs<esri.MapConstructor, esri.MapViewConstructor>(['esri/Map', 'esri/views/MapView']).pipe(
          tap((modules) => {
            const [EsriMap, EsriMapView] = modules;

            this.EsriMap = EsriMap;
            this.EsriMapView = EsriMapView;
            this.isModulesLoaded = true;
          })
        ),
        (basemap, modules) => {
          const [EsriMap] = modules;

          return new EsriMap({ basemap });
        }
      )
    );
  }
}
