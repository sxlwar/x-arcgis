import esri = __esri;
import { from, iif, Observable } from 'rxjs';
import { filter, map, reduce } from 'rxjs/operators';

import { Injectable, OnDestroy } from '@angular/core';

import { Base } from '../base/base';
import { IWebComponents } from '../model';

export abstract class Widget extends Base {}

export enum XArcgisWidgets {
  HOME = 'esri/widgets/Home',
  EDITOR = 'esri/widgets/Editor',
  ViewSwitcher = 'x-widgets/ViewSwitcher',
}

export interface IWidget<T = { new (properties: any): any }> {
  path: string;
  constructor: T;
}

@Injectable({ providedIn: 'root' })
export class WidgetService extends Widget implements OnDestroy {
  /**
   * 在这个服务上此字段没有意义，因为模块需要根据实际业务进行加载
   */
  isModulesLoaded = false;

  /**
   * Custom web components;
   */
  private webComponents: IWebComponents[] = [];

  private widgets: IWidget[] = []; // Widget constructors;

  constructor() {
    super();
  }

  /**
   * @returns widget constructor observable.
   */
  getWidgets<T>(paths: string[]): Observable<T[]>;
  getWidgets<T, T2>(paths: string[]): Observable<(T | T2)[]>;
  getWidgets<T, T2, T3>(paths: string[]): Observable<(T | T2 | T3)[]> {
    const { isAllLoaded, unloaded } = this.isAllWidgetsLoaded(paths);

    return iif(
      () => isAllLoaded,
      from(this.widgets).pipe(
        filter((widget) => paths.includes(widget.path)),
        map((widget) => widget.constructor),
        reduce((acc, cur) => [...acc, cur], [])
      ),
      this.loadModulesObs<any>(unloaded).pipe(
        map((modules) => {
          this.widgets = [...this.widgets, ...paths.map((path, index) => ({ path, constructor: modules[index] }))];

          return modules;
        })
      )
    );
  }

  private isAllWidgetsLoaded(paths: string[]): { isAllLoaded: boolean; unloaded: string[] } {
    const predicate = (path: string) => this.widgets.findIndex((item) => item.path === path) >= 0;
    const isAllLoaded = paths.every(predicate);
    let unloaded: string[] = [];

    if (!isAllLoaded) {
      unloaded = paths.filter((path) => !predicate(path));
    }

    return { isAllLoaded, unloaded };
  }

  /**
   * Release source before service destroy;
   */
  ngOnDestroy() {
    this.webComponents.forEach((item) => {
      item.node.removeEventListener('click', item.listener);
    });

    this.webComponents = null;
  }
}
