import esri = __esri;
import { iif, Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { Injectable, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';

import { Base } from '../base/base';
import { GeometryType } from '../model';
import { StoreService } from './store.service';

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
export class DrawService extends DrawBase {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  private editor: esri.Editor;

  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private closeNodeEventHandler: CloseEventHandler;

  constructor(private storeService: StoreService, private injector: Injector) {
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
  setCloseNode(component: any, closeEventHandler: CloseEventHandler = this.closeEditor.bind(this)): void {
    const CloseElement = createCustomElement(component, { injector: this.injector });
    const closeNodeTagName = 'close-element';
    customElements.define(closeNodeTagName, CloseElement);

    this.closeNodeTagName = closeNodeTagName;
    this.closeNodeEventHandler = closeEventHandler;
  }

  destroyEditor(view: esri.MapView): void {
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
      this.loadModulesObs<esri.EditorConstructor>(['esri/widgets/Editor']).pipe(
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
      map(({ esriMapView, esriMap }) => {
        this.destroyEditor(esriMapView);

        const { Editor } = this;
        const layerInfos = this.getLayInfos(esriMap, currentGeometryType);
        const editor = new Editor({
          view: esriMapView,
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
        esriMapView.ui.add(editor, 'top-left');

        return editor;
      })
    );
  }

  private addCloseElement(view: esri.MapView) {
    window.setTimeout(() => {
      const header = document.querySelector('.esri-editor__header');
      const closeNode = document.createElement(this.closeNodeTagName);

      if (this.closeNodeTagName === 'span') {
        closeNode.innerText = '退出';
        closeNode.className = 'close-editor';
        closeNode.style.cssText = 'cursor:pointer;';
        closeNode.setAttribute('title', '退出编辑');
      }

      closeNode.addEventListener('click', () => {
        this.closeNodeEventHandler(view);
      });
      header.appendChild(closeNode);
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
}
