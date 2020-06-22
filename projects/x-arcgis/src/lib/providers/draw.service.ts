import { combineLatest, iif, Observable, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Injector, OnDestroy, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Base } from '../base/base';
import { GeometryType, IWebComponents, XArcgisTreeNode } from '../model';
import { SidenavService } from './sidenav.service';
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

type CloseEventHandler = (view: esri.MapView, editor: esri.Editor) => (event: MouseEvent) => void;

type AllowedWorkFlow = 'create' | 'update';

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase implements OnDestroy {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private webComponents: IWebComponents[] = [];

  private watchFeatureHandler: IHandle;

  private closeIconListener: (event: MouseEvent) => void;

  constructor(
    private storeService: StoreService,
    private widgetService: WidgetService,
    private injector: Injector,
    private sidenavService: SidenavService,
    private snackbar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {
    super();
  }

  /**
   * handle draw event;
   */
  handleDraw(drawObs: Observable<GeometryType>): Subscription {
    return combineLatest(
      drawObs.pipe(
        filter((value) => !!value),
        switchMap((geometryType) => this.loadEditor(geometryType))
      ),
      this.storeService.store.pipe(
        filter((config) => !!config),
        map((config) => config.esriMapView),
        distinctUntilChanged()
      ),
      this.sidenavService.activeNodeObs
    )
      .pipe(takeUntil(this.storeService.destroy))
      .subscribe(([editor, view, activeNode]) => {
        this.addCloseElement(view, editor);
        /**
         * 1. 启动后需要监听用户选择的图形
         *   1-1 如果图形已经被创建好，则允许绑定
         * 2. 如果用户设置了当前需要绑定的节点，需要更新表单字段
         */

        this.updateEditorFields(activeNode, editor);
      });
  }

  /**
   * set the html element that use for close the draw modal;
   * component: The component that will display in to editor popup, used to exit the draw process;
   */
  setCloseNode(
    // tslint: disable-next-line: no-any;
    component: Type<any>,
    closeEventHandler: CloseEventHandler = this.closeEditor.bind(this),
    closeNodeTagName = 'close-element'
  ): void {
    const CloseElement = createCustomElement(component, { injector: this.injector });

    customElements.define(closeNodeTagName, CloseElement);

    const node = this.document.createElement(closeNodeTagName);

    this.closeNodeTagName = closeNodeTagName;
    this.webComponents.push({ tagName: closeNodeTagName, node, listener: closeEventHandler });
  }

  destroyEditor(view: esri.MapView | esri.SceneView, editor?: esri.Editor): void {
    if (editor) {
      editor.destroy();
      view.ui.remove(editor);
    }

    if (this.watchFeatureHandler) {
      this.watchFeatureHandler.remove();
    }
  }

  private updateEditorFields(activeNode: XArcgisTreeNode | null, editor: esri.Editor): void {
    if (this.watchFeatureHandler) {
      this.watchFeatureHandler.remove();
    }

    const model = editor.viewModel?.featureFormViewModel;

    if (!model) {
      return;
    }

    const watchHandler = model.watch('feature', (feature: esri.Graphic) => {
      if (!feature) {
        return;
      }

      const id = feature.getAttribute('boundNodeId');
      const hadBoundToAnotherNode = !!id && id !== activeNode?.id;

      // The relationship between node and feature: one-to-many, a node can bind multiple features, but a feature can only be bound to a node.
      if (hadBoundToAnotherNode) {
        this.openSnackbar(`此图形已绑定节点。节点名称：${feature.getAttribute('boundNodeName')}，节点ID：${id}`);
        const workflowWatcher = editor.activeWorkflow.watch('hasPreviousStep', (nValue, oValue) => {
          if (nValue) {
            editor.activeWorkflow.previous();
            workflowWatcher.remove();
          }
        });
      } else {
        if (!!activeNode) {
          feature.attributes = { ...feature.attributes, boundNodeName: activeNode.name, boundNodeId: activeNode.id };
          // Arcgis official document doest not offer a method to update the value of specific field, here we force the
          // form refresh by setting the top-level data source which here is the feature, because of the widget is implemented by JSX.
          this.sidenavService.editingGraphic$.next(feature);
        }
        model.set('feature', feature);
      }
    });

    this.watchFeatureHandler = watchHandler;
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
        const layerInfos = this.getLayerInfos(iMap, currentGeometryType);
        const editor = new Editor({
          view,
          layerInfos,
          label: 'editor',
        });

        view.ui.add(editor, 'top-left');

        return editor;
      })
    );
  }

  private addCloseElement(view: esri.MapView, editor: esri.Editor) {
    timer(1000, 0)
      .pipe(take(1))
      .subscribe((_) => {
        const header = this.document.querySelector('.esri-editor__header');

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

          node = this.document.createElement(this.closeNodeTagName);
          node.innerText = '退出';
          node.className = 'close-editor';
          node.style.cssText = 'cursor:pointer;';
          node.setAttribute('title', '退出编辑');
          this.closeIconListener && node.removeEventListener('click', this.closeIconListener);
          this.closeIconListener = () => listener(view, editor);
          node.addEventListener('click', this.closeIconListener);
          this.webComponents.push({ tagName: this.closeNodeTagName, node, listener });
        } else {
          const index = this.webComponents.findIndex((item) => (item.tagName = this.closeNodeTagName));
          const { tagName, listener, node: closeNode } = this.webComponents[index];
          node = closeNode;
          // the node element only created once, so we must remove the listener first;
          this.closeIconListener && node.removeEventListener('click', this.closeIconListener);
          // create a new event listener
          this.closeIconListener = listener(view, editor);
          node.addEventListener('click', this.closeIconListener);
          this.webComponents[index] = { tagName, node, listener };
        }

        node.id = 'x-arcgis-close-editor-icon';
        header.appendChild(node);
      });
  }

  private closeEditor(view: esri.MapView, editor: esri.Editor) {
    const confirmed = window.confirm('Confirm to close this editor?');

    if (confirmed) {
      this.destroyEditor(view, editor);
    }
  }

  private getLayerInfos(map: esri.Map, currentGeometryType: GeometryType): esri.LayerInfo[] {
    const result: esri.LayerInfo[] = [];

    map.layers
      // .filter((layer) => layer.id.includes(this.layerIDSuffix))
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

  private getFieldConfig(): esri.FieldConfig[] {
    return [
      {
        name: 'boundNodeName',
        label: '绑定节点名称',
        editable: false,
        hint: '从左侧导航栏中选择需要绑定的节点',
      },
      { name: 'name', label: '名称', hint: '你可以为当前编辑的图形设置单独的名称' },
      { name: 'description', label: '描述', editorType: 'text-area' },
    ] as esri.FieldConfig[];
  }

  /**
   * !TODO: remove this method.
   * @deprecated Remove this
   * Because of the relationship between node and graphic is one-to-many, so both creation and update are all allowed.
   */
  private getAllowedWorkFlows(): AllowedWorkFlow[] {
    let result: AllowedWorkFlow[] = ['create', 'update'];

    this.sidenavService.activeNodeObs.pipe(take(1)).subscribe((activeNode) => {
      if (!!activeNode?.graphic?.id) {
        result = ['update'];
      }
    });

    return result;
  }

  private openSnackbar(message: string): void {
    this.snackbar.open(message, '', { duration: 3000, verticalPosition: 'top' });
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
