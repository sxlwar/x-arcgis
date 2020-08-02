import { from, iif, Observable } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';

import { Inject, Injectable } from '@angular/core';

import { Base } from '../base/base';
import { ConfigOption } from '../model';
import { X_ARCGIS_CONFIG } from './config.service';

import esri = __esri;

export abstract class FeatureLayer extends Base {}

const sceneLayerConfig: esri.FeatureLayerProperties = {
  title: '自定义',
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
        label: '滑梯',
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
        label: '秋千',
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
      {
        value: '3',
        label: '消防栓',
        symbol: {
          type: 'point-3d',
          symbolLayers: [
            {
              type: 'object',
              resource: {
                href: 'https://static.arcgis.com/arcgis/styleItems/RealisticStreetScene/gltf/resource/Fire_Hydrant.glb',
              },
            },
          ],
          styleOrigin: {
            styleName: 'EsriRealisticStreetSceneStyle',
            name: 'Fire_Hydrant',
          },
        },
      },
      {
        value: '4',
        label: '奥迪A6',
        symbol: {
          type: 'point-3d',
          symbolLayers: [
            {
              type: 'object',
              resource: {
                href: 'https://static.arcgis.com/arcgis/styleItems/RealisticTransportation/web/resource/Audi_A6.json',
              },
            },
          ],
          styleOrigin: {
            styleName: 'EsriRealisticTransportationStyle',
            name: 'Audi_A6'
          }
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

  /**
   * add feature layers to the map in 2d or the web scene in 3d
   */
  addBaseFeatureLayer(map: esri.Map | esri.WebScene, is2D = true): Observable<esri.FeatureLayer[]> {
    const addLayers = () => this.getLayers(is2D).pipe(tap((layers) => layers.forEach((layer) => map.add(layer))));

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
