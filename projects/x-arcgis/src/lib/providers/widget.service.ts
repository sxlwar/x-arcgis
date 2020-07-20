import esri = __esri;
import { from, iif, Observable, Subject, Subscription } from 'rxjs';
import { filter, map, reduce, withLatestFrom } from 'rxjs/operators';

import { Injectable, OnDestroy } from '@angular/core';

import { Base } from '../base/base';
import { IWebComponents, SceneType } from '../model';
import { BasemapService } from './basemap.service';

export type Constructor = new (...args: any[]) => any;

export abstract class Widget extends Base {}

export enum XArcgisWidgets {
  HOME = 'esri/widgets/Home',
  EDITOR = 'esri/widgets/Editor',
  VIEW_SWITCHER = 'x-widgets/ViewSwitcher',
  FEATURE_FORM = 'esri/widgets/FeatureForm',
  LAYER_LIST = 'esri/widgets/LayerList',
  EXPEND = 'esri/widgets/Expand',
  BASEMAP_GALLERY = 'esri/widgets/BasemapGallery',
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

  sceneType$: Subject<SceneType> = new Subject();

  /**
   * Custom web components;
   */
  private webComponents: IWebComponents[] = [];

  private widgets: IWidget[] = []; // Widget constructors;

  constructor(private basemapService: BasemapService) {
    super();
  }

  /**
   * @returns widget constructor observable.
   */
  getWidgets<T>(paths: string[]): Observable<T[]>;
  getWidgets<T, T2>(paths: string[]): Observable<[T, T2]>;
  getWidgets<T, T2, T3>(paths: string[]): Observable<[T, T2, T3]>;
  getWidgets<T, T2, T3, T4>(paths: string[]): Observable<[T, T2, T3, T4]>;
  getWidgets<T, T2, T3, T4>(paths: string[]): Observable<[T, T2, T3, T4]>;
  getWidgets<T, T2, T3, T4, T5>(paths: string[]): Observable<[T, T2, T3, T4, T5]>;
  getWidgets<T, T2, T3, T4, T5, T6>(paths: string[]): Observable<[T, T2, T3, T4, T5, T6]>;
  getWidgets(paths: string[]): Observable<any[]> {
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

  addWidgets(view: esri.MapView | esri.SceneView, is2D = true): Subscription {
    return this.getWidgets<
      esri.HomeConstructor,
      Constructor,
      esri.LayerListConstructor,
      esri.ExpandConstructor,
      esri.EditorConstructor,
      esri.BasemapGalleryConstructor
    >([
      XArcgisWidgets.HOME,
      XArcgisWidgets.VIEW_SWITCHER,
      XArcgisWidgets.LAYER_LIST,
      XArcgisWidgets.EXPEND,
      XArcgisWidgets.EDITOR,
      XArcgisWidgets.BASEMAP_GALLERY,
    ])
      .pipe(withLatestFrom(this.basemapService.getAllAvailableBasemap()))
      .subscribe(([[Home, ViewSwitcher, LayerList, Expand, Editor, BasemapGallery], basemaps]) => {
        const homeWidget = new Home({ view });
        const viewSwitcherWidget = new ViewSwitcher({ view, type: '2d' });
        const layerListOrEditorExpand = new Expand({
          view,
          content: is2D ? new LayerList({ view }) : new Editor({ view }),
          expanded: false,
        });
        const basemapGalleryExpand = new Expand({
          view,
          content: new BasemapGallery({ view }),
          expanded: false,
        });

        view.ui.add(homeWidget);
        view.ui.add(viewSwitcherWidget);
        view.ui.add(layerListOrEditorExpand);
        view.ui.add(basemapGalleryExpand);
        view.ui.move(
          ['zoom', homeWidget, viewSwitcherWidget, layerListOrEditorExpand, basemapGalleryExpand],
          'top-left'
        );
        viewSwitcherWidget.watch('type', (newVal: string) => {
          const sceneType = newVal.toLocaleUpperCase() as SceneType;

          this.sceneType$.next(sceneType);
        });
      });
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
