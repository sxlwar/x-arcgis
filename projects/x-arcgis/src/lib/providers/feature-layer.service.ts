import { Injectable } from '@angular/core';

import { Base } from '../base/base';
import { valueof } from '../util';

import esri = __esri;

export type GeometryType = valueof<Pick<esri.FeatureLayerProperties, 'geometryType'>>;

export interface BaseLayer {
  id: string;
  geometryType: GeometryType;
  index: number;
}

export abstract class FeatureLayer extends Base {}

@Injectable({ providedIn: 'root' })
export class FeatureLayerService extends FeatureLayer {
  private baseLayerUrl = `https://xinanyun.gisnet.cn/server/rest/services/xinan_gis/FeatureServer`;

  private baseLayers: BaseLayer[] = [
    {
      id: 'point_label',
      geometryType: 'point',
      index: 0,
    },
    {
      id: 'polyline_label',
      geometryType: 'polyline',
      index: 1,
    },
    {
      id: 'polygon_label',
      geometryType: 'polygon',
      index: 2,
    },
  ];

  addBaseFeatureLayer(map: esri.Map): void {
    this.loadModulesObs<esri.FeatureLayerConstructor>(['esri/layers/FeatureLayer']).subscribe((modules) => {
      const [FeatureLayer] = modules;

      this.baseLayers.reverse().forEach((item) => {
        let featureLayer = new FeatureLayer({
          url: `${this.baseLayerUrl}/${item.index}`,
          outFields: ['*'],
          id: item.id,
          geometryType: item.geometryType,
        });

        map.add(featureLayer);
      });
    });
  }
}
