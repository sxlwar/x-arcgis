import { iif, Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { Injectable, Injector, OnDestroy, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';

import { Base } from '../base/base';
import { GeometryType, IWebComponents } from '../model';
import { StoreService } from './store.service';
import { WidgetService, XArcgisWidgets } from './widget.service';

import esri = __esri;
export enum GeometryTypeToDes {
  'point' = '点标注',
  'polyline' = '线标注',
  'polygon' = '面标注',
}

export abstract class DrawBase extends Base {
  abstract handleDraw(source: Observable<GeometryType>): Subscription;
}

type CloseEventHandler = (view: esri.MapView) => void;

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase implements OnDestroy {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  private editor: esri.Editor;

  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private webComponents: IWebComponents[] = [];

  constructor(private storeService: StoreService, private widgetService: WidgetService, private injector: Injector) {
    super();
  }

  /**
   * handle draw event;
   */
  handleDraw(onDraw: Observable<GeometryType>): Subscription {
    return onDraw
      .pipe(
        filter((value) => !!value),
        switchMap((geometryType) => this.loadEditor(geometryType)),
        switchMap((_) => this.storeService.store.pipe(map((config) => config.esriMapView))),
        takeUntil(this.storeService.destroy)
      )
      .subscribe((view) => this.addCloseElement(view));
  }

  /**
   * set the html element that use for close the draw modal;
   * component: The component that will display in to editor popup, used to exit the draw process;
   */
  // tslint: disable-next-line: no-any;
  setCloseNode(
    component: Type<any>,
    closeEventHandler: CloseEventHandler = this.closeEditor.bind(this),
    closeNodeTagName = 'close-element'
  ): void {
    const CloseElement = createCustomElement(component, { injector: this.injector });

    customElements.define(closeNodeTagName, CloseElement);

    const node = document.createElement(closeNodeTagName);

    this.closeNodeTagName = closeNodeTagName;
    this.webComponents.push({ tagName: closeNodeTagName, node, listener: closeEventHandler });
  }

  destroyEditor(view: esri.MapView | esri.SceneView): void {
    if (this.editor) {
      this.editor.destroy();
      view.ui.remove(this.editor);
      this.editor = null;
    }
  }

  private loadEditor(type: GeometryType): Observable<esri.Editor> {
    return iif(
      () => this.isModulesLoaded,
      this.createEditor(type),
      this.widgetService
        .getWidgets<esri.EditorConstructor>([XArcgisWidgets.EDITOR])
        .pipe(
          switchMap((modules) => {
            const [EsriEditor] = modules;

            this.Editor = EsriEditor;
            return this.createEditor(type);
          }),
          tap(() => (this.isModulesLoaded = true))
        )
    );
  }

  private createEditor(currentGeometryType: GeometryType): Observable<esri.Editor> {
    return this.storeService.store.pipe(
      take(1),
      map(({ esriMapView, esriMap, esriSceneView, esriWebScene }) => {
        const view = esriMapView || esriSceneView;
        const iMap = esriMap || esriWebScene;
        this.destroyEditor(view);

        const { Editor } = this;
        const layerInfos = this.getLayInfos(iMap, currentGeometryType);
        const editor = new Editor({
          view,
          layerInfos,
          label: 'editor',
          supportingWidgetDefaults: {
            featureTemplates: {
              groupBy: (_) => GeometryTypeToDes[currentGeometryType],
              filterEnabled: true,
            },
          },
        });

        this.editor = editor;
        view.ui.add(editor, 'top-left');

        return editor;
      })
    );
  }

  private addCloseElement(view: esri.MapView) {
    window.setTimeout(() => {
      const header = document.querySelector('.esri-editor__header');

      if (!header) {
        return;
      }

      const appended = header.querySelector(this.closeNodeTagName);
      let node = null;

      if (!!appended) {
        return;
      }

      if (this.closeNodeTagName === 'span') {
        const listener = this.closeEditor.bind(this);

        node = document.createElement(this.closeNodeTagName);
        node.innerText = '退出';
        node.className = 'close-editor';
        node.style.cssText = 'cursor:pointer;';
        node.setAttribute('title', '退出编辑');
        node.addEventListener('click', listener);
        this.webComponents.push({ tagName: this.closeNodeTagName, node, listener });
      } else {
        const index = this.webComponents.findIndex((item) => (item.tagName = this.closeNodeTagName));
        const { tagName, listener, node: closeNode } = this.webComponents[index];
        const listenerWrapper = () => listener(view);

        node = closeNode;
        // the node element only created once, so we must remove the listener first;
        node.removeEventListener('click', listener);
        node.addEventListener('click', listenerWrapper);
        this.webComponents[index] = { tagName, node, listener: listenerWrapper };
      }

      header.appendChild(node);
    }, 1000);
  }

  private closeEditor(view: esri.MapView) {
    const confirmed = window.confirm('Confirm to close this editor?');

    if (confirmed) {
      this.destroyEditor(view);
    }
  }

  private getLayInfos(map: esri.Map, currentGeometryType: GeometryType): esri.LayerInfo[] {
    const result: esri.LayerInfo[] = [];

    map.layers
      .filter((layer) => layer.id.includes(this.layerIDSuffix))
      .forEach((layer) => {
        const config = {
          layer,
          enabled: layer.get('geometryType') === currentGeometryType,
          fieldConfig: this.getFieldConfig(),
        } as esri.LayerInfo;

        result.push(config);
      });

    return result;
  }

  private getFieldConfig(): Partial<esri.FieldConfig>[] {
    return [
      { name: 'category', label: '类型' },
      { name: 'name', label: '名称' },
      { name: 'address', label: '地址' },
      { name: 'phone', label: '电话' },
      { name: 'describe', label: '描述' },
      { name: 'floor', label: '楼层' },
      { name: 'comment', label: '备注' },
    ];
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
