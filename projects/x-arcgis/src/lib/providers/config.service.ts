import { loadScript } from 'esri-loader';

import { Injectable, InjectionToken } from '@angular/core';

import { Base } from '../base/base';
import { ConfigOption } from '../model';

import esri = __esri;

export const X_ARCGIS_CONFIG = new InjectionToken<ConfigOption[]>('X_ARCGIS_CONFIG');

export abstract class ConfigBase extends Base {}

@Injectable({ providedIn: 'root' })
export class ConfigService extends ConfigBase {
  isModulesLoaded = false;

  async setArcgisConfigs() {
    // set dojoConfig at first;
    this.setCustomWidgets();

    // loadCss(`${this.arcgisJsApiUrl}esri/themes/light/main.css`, 'link[rel="icon"]');
    // loadScript({ url: `${this.arcgisJsApiUrl}init.js` });
    loadScript({ url: 'https://js.arcgis.com/4.15/' });

    // const [esriConfig] = await this.loadModules<[esri.config]>(['esri/config']);

    // esriConfig.portalUrl = `https://${this.host}/arcgis`;

    this.isModulesLoaded = true;
  }

  setCustomWidgets(): void {
    const locationPath = location.pathname.replace(/\/[^\/]+$/, '');

    (window as any).dojoConfig = {
      packages: [
        {
          name: 'x-widgets',
          // location: locationPath,
          location: 'http://localhost:4200/assets/x-widgets/src', // just for test purpose, need a server to store the widgets.
        },
      ],
    };
  }
}
