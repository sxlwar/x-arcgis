import esriLoader from 'esri-loader';
import { from, Observable } from 'rxjs';

export abstract class Base {
  protected readonly layerIDSuffix = 'layer';

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
