import { from, iif, Observable } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base } from '../base/base';
import { GeometryType } from '../model';

import esri = __esri;
export interface BaseLayer {
  id: string;
  geometryType: GeometryType;
  index: number;
}

export abstract class FeatureLayer extends Base {}

@Injectable({ providedIn: 'root' })
export class FeatureLayerService extends FeatureLayer {
  isModulesLoaded = false;

  FeatureLayer: esri.FeatureLayerConstructor;

  private baseLayerUrl = `https://xinanyun.gisnet.cn/server/rest/services/xinan_gis/FeatureServer`;

  private baseLayers: BaseLayer[] = [
    {
      id: `point_${this.layerIDSuffix}`,
      geometryType: 'point',
      index: 0,
    },
    {
      id: `polyline_${this.layerIDSuffix}`,
      geometryType: 'polyline',
      index: 1,
    },
    {
      id: `polygon_${this.layerIDSuffix}`,
      geometryType: 'polygon',
      index: 2,
    },
  ];

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

    return from(this.baseLayers.reverse()).pipe(
      map(
        (item) =>
          new FeatureLayer({
            url: `${this.baseLayerUrl}/${item.index}`,
            outFields: ['*'],
            id: item.id,
            geometryType: item.geometryType,
          })
      ),
      reduce((acc, cur) => [...acc, cur], [])
    );
  }
}
