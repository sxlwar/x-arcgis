import { iif, Observable, zip } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Base, MapBase } from '../base/base';

import esri = __esri;

export abstract class Map3dBase extends Base {}

@Injectable({ providedIn: 'root' })
export class Map3dService extends Map3dBase implements MapBase {
  isModulesLoaded = false;

  WebScene: esri.WebSceneConstructor;

  SceneView: esri.SceneViewConstructor;

  loadMap(esriMapObs: Observable<esri.Map>, config: esri.SceneViewProperties): Observable<esri.SceneView> {
    return iif(
      () => this.isModulesLoaded,
      esriMapObs.pipe(map((esriMap) => new this.SceneView({ map: esriMap }))),
      zip(
        esriMapObs,
        this.loadModulesObs<esri.WebSceneConstructor, esri.SceneViewConstructor>([
          'esri/WebScene',
          'esri/views/SceneView',
        ]).pipe(
          tap((modules) => {
            const [WebScene, SceneView] = modules;

            this.WebScene = WebScene;
            this.SceneView = SceneView;
            this.isModulesLoaded = true;
          })
        ),
        (esriMap, modules) => {
          const [_, SceneView] = modules;

          return new SceneView({ ...config, map: esriMap });
        }
      )
    );
  }
}
