import { loadModules } from 'esri-loader';
import { from, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

export abstract class XArcgisBaseService {
  public abstract modulePath: string;

  // tslint:disable-next-line:no-any
  protected loadModules(path: string | string[]): Observable<any[]> {
    const sources = typeof path === 'string' ? [path] : path;

    return from(loadModules(sources));
  }
}

@Injectable({
  providedIn: 'root',
})
export class XArcgisService extends XArcgisBaseService {
  modulePath = '';

  module = null;

  constructor() {
    super();
  }

  loadModules() {
    return null;
  }
}
