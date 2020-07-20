import { from, iif, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base } from '../base/base';
import { availableBaseMaps, BaseMapConfig, BasemapPublisher, BasemapType } from '../model/basemap';

import esri = __esri;
/**
 * abstract class must be extended
 */
export abstract class Basemap extends Base {
  abstract getBasemap(config: BaseMapConfig): Observable<esri.Basemap | string>;

  abstract readonly availableBaseMaps: Map<BasemapPublisher, BasemapType[]>;
}

type LoadedBaseMap = BaseMapConfig & {
  options: esri.BasemapProperties;
};

const getDefaultLayerOptions: (tk: string) => esri.WebTileLayerProperties[] = (tk: string) => [
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=vec_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图矢量',
    // copyright: "天地图"
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cva_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图注记',
    // copyright: "天地图"
  },
  {
    urlTemplate: `http://{subDomain}.google.com/kh/v=863&hl=en&x={col}&y={row}&z={level}&s=Galileo`,
    subDomains: ['khm0', 'khm1', 'khm2', 'khm3'],
    title: '谷歌地图影像',
    // copyright: "天地图"
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cia_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图注记',
    // copyright: "天地图"
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=vec_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图矢量',
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cva_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,

    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图注记',
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=img_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图影像',
    // copyright: "天地图"
  },
  {
    urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cia_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
    subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
    title: '天地图注记',
    // copyright: "天地图"
  },
];

/**
 * Default basemap service;
 */
@Injectable({ providedIn: 'root' })
export class BasemapService extends Basemap {
  Basemap: esri.BasemapConstructor;

  WebTileLayer: esri.WebTileLayerConstructor;

  isModulesLoaded = false;

  readonly availableBaseMaps = availableBaseMaps;

  private activeBasemap: esri.Basemap;

  private readonly loadedBaseMaps: LoadedBaseMap[] = [];

  getBasemap(option: BaseMapConfig) {
    const { type, publisher } = option;
    const basemap = () => {
      const target = this.loadedBaseMaps.find((item) => item.publisher === publisher && item.type === type);
      const { Basemap } = this;

      if (!!this.activeBasemap) {
        this.activeBasemap.destroy();
        this.activeBasemap = null;
      }

      let options: Observable<esri.BasemapProperties | string>;

      if (!!target) {
        options = of(target.options);
      } else {
        switch (publisher) {
          case 'google':
            options = this.getGoogleBasemap(type);
            break;
          case 'bing':
            options = this.getBingBasemap(type);
            break;
          case 'mapbox':
            options = this.getMapboxBasemap(type);
            break;
          case 'tianditu':
            options = this.getTiandituBasemap(type);
            break;
          case 'osm':
            options = of('osm');
            break;
          case 'esri':
            options = of('satellite');
            break;
          default:
            options = this.getGoogleBasemap(type);
        }
      }

      return options.pipe(
        map((option) => (typeof option === 'string' ? option : new Basemap(option))),
        tap((basemap) => {
          if (typeof basemap !== 'string') {
            this.activeBasemap = basemap;
          }
        })
      );
    };

    return this.isModulesLoaded ? basemap() : this.loadBaseModules().pipe(switchMap(() => basemap()));
  }

  getAllAvailableBasemap(): Observable<esri.BasemapProperties[]> {
    const { WebTileLayer, tk } = this;
    const layerOptions = getDefaultLayerOptions(tk);
    const getAll = () => of(layerOptions.map((option) => new WebTileLayer(option)));

    return iif(() => this.isModulesLoaded, getAll(), this.loadBaseModules().pipe(switchMap(() => getAll())));
  }

  private loadBaseModules() {
    return this.loadModulesObs<esri.WebTileLayerConstructor, esri.BasemapConstructor>([
      'esri/layers/WebTileLayer',
      'esri/Basemap',
    ]).pipe(
      tap((modules) => {
        const [WebTileLayer, Basemap] = modules;

        this.Basemap = Basemap;
        this.WebTileLayer = WebTileLayer;
        this.isModulesLoaded = true;
      })
    );
  }

  private getGoogleBasemap(type: BasemapType): Observable<esri.BasemapProperties> {
    const { WebTileLayer, tk } = this;
    let options: esri.BasemapProperties = null;

    switch (type) {
      case 'vector':
        options = {
          baseLayers: [
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=vec_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图矢量',
              // copyright: "天地图"
            }),
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cva_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图注记',
              // copyright: "天地图"
            }),
          ],
          title: '矢量',
          id: 'google_vector',
        };
        break;
      case 'imagery':
        options = {
          baseLayers: [
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.google.com/kh/v=863&hl=en&x={col}&y={row}&z={level}&s=Galileo`,
              subDomains: ['khm0', 'khm1', 'khm2', 'khm3'],
              title: '谷歌地图影像',
              // copyright: "天地图"
            }),
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cia_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图注记',
              // copyright: "天地图"
            }),
          ],
          title: '影像',
          id: 'google_imagery',
        };
        break;
      default:
        console.warn(
          `You may trying to get a basemap that type is ${type} and published by google, but it may be not exist!`
        );
        options = {};
    }

    this.loadedBaseMaps.push({ publisher: 'google', type, options });
    return of(options);
  }

  private getBingBasemap(type: BasemapType): Observable<esri.BasemapProperties> {
    return from(this.loadModules(['esri/layers/BingMapsLayer'])).pipe(
      map((module) => {
        const [BingMapsLayer] = module;
        const bingMapsLayer: esri.BingMapsLayer = new BingMapsLayer({
          style: type,
          key: 'AiNnKvCpj_aD_-4DxDzNdD63KTgbZvaNr7YNnjwuCtX6ufIfHMls4Hwv9J5PumGp',
          culture: 'zh-cn',
          region: 'CHN',
        });
        const options = {
          baseLayers: [bingMapsLayer],
          id: 'bing_hybrid',
        };

        this.loadedBaseMaps.push({ publisher: 'bing', type: 'hybrid', options });
        return options;
      })
    );
  }

  private getMapboxBasemap(type: BasemapType): Observable<esri.BasemapProperties> {
    const { WebTileLayer } = this;
    const access_token = 'pk.eyJ1IjoiamFtZXNnaXMiLCJhIjoiY2swMHBwY2Q0MTNmNzNocHJnY2dxeGYweiJ9.NgyalCxjXiqDAs93ICVH7Q';
    const url = `https://{subDomain}.tiles.mapbox.com/v4/mapbox.${type}/{level}/{col}/{row}.png?access_token=${access_token}`;
    const webTileLayer = new WebTileLayer({
      urlTemplate: url,
      subDomains: ['a', 'b', 'c'],
    });
    const options = {
      baseLayers: [webTileLayer],
      title: 'mapbox_' + type,
      id: `mapbox_${type}`,
    };

    this.loadedBaseMaps.push({ publisher: 'mapbox', type, options });
    return of(options);
  }

  private getTiandituBasemap(type: BasemapType): Observable<esri.BasemapProperties> {
    const { WebTileLayer, tk } = this;
    let options: esri.BasemapProperties = null;

    switch (type) {
      case 'vector': {
        options = {
          baseLayers: [
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=vec_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图矢量',
            }),
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cva_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,

              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图注记',
            }),
          ],
          title: '矢量',
          id: 'tianditu_vector',
        };
        break;
      }
      case 'imagery': {
        options = {
          baseLayers: [
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=img_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图影像',
              // copyright: "天地图"
            }),
            new WebTileLayer({
              urlTemplate: `http://{subDomain}.tianditu.com/DataServer?T=cia_w&x={col}&y={row}&l={level}&tk=${tk}&timeStamp=${new Date().getTime()}`,
              subDomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
              title: '天地图注记',
              // copyright: "天地图"
            }),
          ],
          title: '影像',
          id: 'tianditu_imagery',
        };
        break;
      }
      default:
        console.warn(
          `You may trying to get a basemap that type is ${type} and published by tianditu, but it may be not exist!`
        );
        options = {};
    }

    this.loadedBaseMaps.push({ publisher: 'tianditu', type, options });
    return of(options);
  }
}
