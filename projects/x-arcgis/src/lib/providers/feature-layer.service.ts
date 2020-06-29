import { from, iif, Observable } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';

import { Inject, Injectable } from '@angular/core';

import { Base } from '../base/base';
import { ConfigOption } from '../model';
import { X_ARCGIS_CONFIG } from './config.service';

import esri = __esri;

export abstract class FeatureLayer extends Base {}

@Injectable({ providedIn: 'root' })
export class FeatureLayerService extends FeatureLayer {
  isModulesLoaded = false;

  FeatureLayer: esri.FeatureLayerConstructor;

  private baseLayers: esri.FeatureLayerProperties[];

  constructor(@Inject(X_ARCGIS_CONFIG) private config: ConfigOption) {
    super();
    this.baseLayers = config.baseLayers;
  }

  addBaseFeatureLayer(map: esri.Map): Observable<esri.FeatureLayer[]> {
    const addLayers = () => this.getLayers().pipe(tap((layers) => layers.forEach((layer) => map.add(layer))));

    return iif(
      () => this.isModulesLoaded,
      addLayers(),
      this.loadModulesObs<esri.FeatureLayerConstructor>(['esri/layers/FeatureLayer']).pipe(
        switchMap((modules) => {
          const [FeatureLayer] = modules;

          this.FeatureLayer = FeatureLayer;
          this.isModulesLoaded = true;
          return addLayers();
        })
      )
    );
  }

  private getLayers(): Observable<esri.FeatureLayer[]> {
    const { FeatureLayer } = this;

    return from(this.baseLayers).pipe(
      map(
        (item) =>
          new FeatureLayer({
            url: item.url,
            outFields: ['*'],
            geometryType: item.geometryType,
          })
      ),
      reduce((acc, cur) => [...acc, cur], [])
    );
  }
}
