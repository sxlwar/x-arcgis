import { loadScript } from 'esri-loader';

import { Inject, Injectable, InjectionToken } from '@angular/core';

import { Base } from '../base/base';
import { ConfigOption } from '../model';

import esri = __esri;

export const X_ARCGIS_CONFIG = new InjectionToken<ConfigOption[]>('X_ARCGIS_CONFIG');

export abstract class ConfigBase extends Base {}

@Injectable({ providedIn: 'root' })
export class ConfigService extends ConfigBase {
  isModulesLoaded = false;

  constructor(@Inject(X_ARCGIS_CONFIG) private config: ConfigOption) {
    super();
  }

  async setArcgisConfigs(): Promise<boolean> {
    // set dojoConfig at first;
    this.setCustomWidgets();

    loadScript({ url: 'https://js.arcgis.com/4.15/' });

    const isPortalSet = await this.setPortalUrl();

    this.isModulesLoaded = true;

    return isPortalSet;
  }

  setCustomWidgets(): Promise<boolean> {
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

    return Promise.resolve(true);
  }

  private async setPortalUrl(): Promise<boolean> {
    const { scenePortal } = this.config;

    if (!!scenePortal) {
      try {
        const [esriConfig] = await this.loadModules<[esri.config]>(['esri/config']);

        esriConfig.portalUrl = this.config.scenePortal;

        return true;
      } catch (err) {
        console.error('Web scene portal url set failed: ',err);
        return false;
      }
    } else {
      return true;
    }
  }
}
