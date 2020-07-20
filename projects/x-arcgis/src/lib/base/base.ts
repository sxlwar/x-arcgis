import esriLoader from 'esri-loader';
import { from, Observable } from 'rxjs';

import esri = __esri;

export abstract class Base {
  protected readonly tk = 'b24f842759c479d657913702c3684369';

  /**
   * indicates wether the modules required in specific service has been loaded;
   */
  abstract isModulesLoaded: boolean;

  baseId = Math.random();

  loadModules = esriLoader.loadModules;

  loadModulesObs<T>(modules: string[]): Observable<[T]>;
  loadModulesObs<T, T2>(modules: string[]): Observable<[T, T2]>;
  loadModulesObs<T, T2, T3>(modules: string[]): Observable<[T, T2, T3]>;
  loadModulesObs<T, T2, T3, T4>(modules: string[]): Observable<[T, T2, T3, T4]>;
  loadModulesObs(modules: string[]): Observable<any[]> {
    return from(this.loadModules(modules));
  }
}

export interface MapBase {
  loadMap(...params: any[]): Observable<any>;
}
