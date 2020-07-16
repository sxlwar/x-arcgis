import { from, iif, Observable } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';

import { Inject, Injectable } from '@angular/core';

import { Base } from '../base/base';
import { ConfigOption } from '../model';
import { X_ARCGIS_CONFIG } from './config.service';

import esri = __esri;

export abstract class FeatureLayer extends Base {}

const sceneLayerConfig: esri.FeatureLayerProperties = {
  title: 'Recreation',
  elevationInfo: {
    mode: 'absolute-height',
  },
  renderer: {
    // tslint:disable-next-line
    type: 'unique-value', // autocasts as new UniqueValueRenderer()
    field: 'TYPE',
    visualVariables: [
      {
        // size can be modified with the interactive handle
        type: 'size',
        field: 'SIZE',
        axis: 'height',
        valueUnit: 'meters',
      },
      {
        // rotation can be modified with the interactive handle
        type: 'rotation',
        field: 'ROTATION',
      },
    ],
    uniqueValueInfos: [
      {
        value: '1',
        label: 'Slide',
        symbol: {
          type: 'point-3d', // autocasts as new PointSymbol3D()
          symbolLayers: [
            {
              type: 'object',
              resource: {
                href: 'https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Slide.glb',
              },
            },
          ],
          styleOrigin: {
            styleName: 'EsriRecreationStyle',
            name: 'Slide',
          },
        },
      },
      {
        value: '2',
        label: 'Swing',
        symbol: {
          type: 'point-3d', // autocasts as new PointSymbol3D()
          symbolLayers: [
            {
              type: 'object',
              resource: {
                href: 'https://static.arcgis.com/arcgis/styleItems/Recreation/gltf/resource/Swing.glb',
              },
            },
          ],
          styleOrigin: {
            styleName: 'EsriRecreationStyle',
            name: 'Swing',
          },
        },
      },
    ],
  },
} as esri.FeatureLayerProperties;

@Injectable({ providedIn: 'root' })
export class FeatureLayerService extends FeatureLayer {
  isModulesLoaded = false;

  FeatureLayer: esri.FeatureLayerConstructor;

  private baseLayers: esri.FeatureLayerProperties[];

  private sceneLayers: esri.FeatureLayerProperties[];

  constructor(@Inject(X_ARCGIS_CONFIG) private config: ConfigOption) {
    super();
    this.baseLayers = this.config.baseLayers;
    this.sceneLayers = this.config.sceneLayers;
  }

  addBaseFeatureLayer(map: esri.Map, is2D = true): Observable<esri.FeatureLayer[]> {
    const addLayers = () =>
      this.getLayers(is2D).pipe(tap((layers) => layers.forEach((layer) => map.add(layer))));

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

  private getLayers(is2D: boolean): Observable<esri.FeatureLayer[]> {
    const { FeatureLayer } = this;
    const layers = is2D ? this.baseLayers : this.sceneLayers;

    return from(layers).pipe(
      map(
        (item) =>
          new FeatureLayer(
            is2D
              ? {
                  url: item.url,
                  outFields: ['*'],
                  geometryType: item.geometryType,
                }
              : {
                  ...sceneLayerConfig,
                  url: item.url,
                }
          )
      ),
      reduce((acc, cur) => [...acc, cur], [])
    );
  }
}
