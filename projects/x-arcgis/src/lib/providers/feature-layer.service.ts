import { from, iif, Observable } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base } from '../base/base';

import esri = __esri;

export abstract class FeatureLayer extends Base {}

@Injectable({ providedIn: 'root' })
export class FeatureLayerService extends FeatureLayer {
  isModulesLoaded = false;

  FeatureLayer: esri.FeatureLayerConstructor;

  private baseLayerUrl = `https://xinanyun.gisnet.cn/server/rest/services/xinan_gis/FeatureServer`;

  /**
   * TODO: 重构至业务层，需要由业务层提供相关配置，在库启动时获取此配置
   */
  private baseLayers: esri.FeatureLayerProperties[] = [
    {
      id: `point_${this.layerIDSuffix}`,
      geometryType: 'point',
      url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/sxlwar/FeatureServer',
    },
    {
      id: `polyline_${this.layerIDSuffix}`,
      geometryType: 'polyline',
      url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/lines/FeatureServer',
    },
    {
      id: `polygon_${this.layerIDSuffix}`,
      geometryType: 'polygon',
      url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/polygon/FeatureServer',
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
            // url: `${this.baseLayerUrl}/${item.index}`,
            url: item.url,
            outFields: ['*'],
            geometryType: item.geometryType,
          })
      ),
      reduce((acc, cur) => [...acc, cur], [])
    );
  }
}
