import { from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base } from '../base/base';

import esri = __esri;
export type BasemapType = 'vector' | 'imagery' | 'streets' | 'streets-satellite' | 'hybrid';

export type BasemapPublisher = 'google' | 'bing' | 'mapbox' | 'tianditu';

export interface BaseMapConfig {
  type: BasemapType;
  publisher: BasemapPublisher;
}

/**
 * abstract class must be extended
 */
export abstract class Basemap extends Base {
  abstract getBasemap(
    type: BasemapType,
    publisher: BasemapPublisher
  ): esri.Basemap | Observable<esri.Basemap> | Promise<esri.Basemap>;
}

/**
 * Default basemap service;
 */
@Injectable({ providedIn: 'root' })
export class BasemapService extends Basemap {
  Basemap: esri.BasemapConstructor;

  WebTileLayer: esri.WebTileLayerConstructor;

  isModulesLoaded = false;

  getBasemap(type: BasemapType, publisher: BasemapPublisher) {
    const basemap = () => {
      switch (publisher) {
        case 'google':
          return this.getGoogleBasemap(type);
        case 'bing':
          return this.getBingBasemap(type);
        case 'mapbox':
          return this.getMapboxBasemap(type);
        case 'tianditu':
          return this.getTiandituBasemap(type);
        default:
          return this.getGoogleBasemap(type);
      }
    };

    return this.isModulesLoaded ? basemap() : this.loadBaseModules().pipe(switchMap(() => basemap()));
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

  private getGoogleBasemap(type: BasemapType): Observable<esri.Basemap> {
    const { WebTileLayer, Basemap, tk } = this;
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
        };
        break;
      default:
        options = {};
    }

    return of(new Basemap({ ...options, id: 'basemap' }));
  }

  private getBingBasemap(type: BasemapType): Observable<esri.Basemap> {
    const { Basemap } = this;

    return from(this.loadModules(['esri/layers/BingMapsLayer'])).pipe(
      map((module) => {
        const [BingMapsLayer] = module;
        const bingMapsLayer: esri.BingMapsLayer = new BingMapsLayer({
          style: type,
          key: 'AiNnKvCpj_aD_-4DxDzNdD63KTgbZvaNr7YNnjwuCtX6ufIfHMls4Hwv9J5PumGp',
          culture: 'zh-cn',
          region: 'CHN',
        });

        return new Basemap({
          baseLayers: [bingMapsLayer],
          id: 'basemap',
        });
      })
    );
  }

  private getMapboxBasemap(type: BasemapType): Observable<esri.Basemap> {
    const { Basemap, WebTileLayer } = this;
    const access_token = 'pk.eyJ1IjoiamFtZXNnaXMiLCJhIjoiY2swMHBwY2Q0MTNmNzNocHJnY2dxeGYweiJ9.NgyalCxjXiqDAs93ICVH7Q';
    const url = `https://{subDomain}.tiles.mapbox.com/v4/mapbox.${type}/{level}/{col}/{row}.png?access_token=${access_token}`;
    const webTileLayer = new WebTileLayer({
      urlTemplate: url,
      subDomains: ['a', 'b', 'c'],
    });

    return of(
      new Basemap({
        baseLayers: [webTileLayer],
        title: 'mapbox_' + type,
        id: 'basemap',
      })
    );
  }

  private getTiandituBasemap(type: BasemapType): Observable<esri.Basemap> {
    const { WebTileLayer, Basemap, tk } = this;
    let options: esri.BasemapProperties = null;

    switch (type) {
      case 'vector':
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
        };
        break;
      case 'imagery':
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
        };
        break;
      default:
        options = {};
    }

    return of(
      new Basemap({
        ...options,
        id: 'basemap',
      })
    );
  }
}
