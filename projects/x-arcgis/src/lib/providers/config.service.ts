import { loadCss, loadScript } from 'esri-loader';

import { Injectable } from '@angular/core';

import { Base } from '../base/base';

export abstract class ConfigBase extends Base {}

@Injectable({ providedIn: 'root' })
export class ConfigService extends ConfigBase {
  isModulesLoaded = false;

  async setArcgisConfigs() {
    loadCss(`${this.arcgisJsApiUrl}esri/themes/light/main.css`, 'link[rel="icon"]');
    loadScript({ url: `${this.arcgisJsApiUrl}init.js` });

    const [esriConfig] = await this.loadModules(['esri/config']);

    esriConfig.portalUrl = `https://${this.host}/arcgis`;

    this.isModulesLoaded = true;
  }
}
