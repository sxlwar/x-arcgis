import esri = __esri;
import { iif, Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  private editor: esri.Editor;

  constructor(private storeService: StoreService) {
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
      .subscribe((view) => this.addClose(view));
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

  private destroyEditor(view: esri.MapView) {
    if (this.editor) {
      this.editor.destroy();
      view.ui.remove(this.editor);
      this.editor = null;
    }
  }

  private addClose(view: esri.MapView, closeFn: (view: esri.MapView) => void = this.closeEditor.bind(this)) {
    window.setTimeout(() => {
      const header = document.querySelector('.esri-editor__header');
      const closeNode = document.createElement('span');

      closeNode.innerText = 'x';
      closeNode.className = 'close-editor';
      closeNode.style.cssText = 'cursor:pointer;';
      closeNode.setAttribute('title', '退出编辑');
      closeNode.onclick = () => closeFn(view);
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
