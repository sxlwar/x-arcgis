import { iif, Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';

import { Injectable, Injector, OnDestroy, Type } from '@angular/core';
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

type CloseEventHandler = (view: esri.MapView) => void;

type AllowedWorkFlow = 'create' | 'update';

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase implements OnDestroy {
  isModulesLoaded = false;

  editor: esri.Editor;

  private Editor: esri.EditorConstructor;

  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private webComponents: IWebComponents[] = [];

  constructor(
    private storeService: StoreService,
    private widgetService: WidgetService,
    private injector: Injector,
    private sidenavService: SidenavService,
    private snackbar: MatSnackBar
  ) {
    super();
  }

  /**
   * handle draw event;
   */
  handleDraw(drawObs: Observable<GeometryType>): Subscription {
    return drawObs
      .pipe(
        filter((value) => !!value),
        switchMap((geometryType) => this.loadEditor(geometryType)),
        switchMap((_) => this.storeService.store.pipe(map((config) => config.esriMapView))),
        withLatestFrom(this.sidenavService.activeNodeObs),
        takeUntil(this.storeService.destroy)
      )
      .subscribe(([view, activeNode]) => {
        const editor = this.editor;
        this.addCloseElement(view);

        if (activeNode?.graphic?.id) {
          // TODO: forbidden editor back button
          editor.startUpdateWorkflowAtFeatureSelection().then((_) => {
            this.updateEditorFields(activeNode);
          });
        }
      });
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

  private updateEditorFields(activeNode: XArcgisTreeNode | null): void {
    if (!activeNode) {
      return;
    }

    const editor = this.editor;
    const model = editor.viewModel.featureFormViewModel;

    const watchHandler = model.watch('feature', (feature: esri.Graphic) => {
      if (!feature) {
        return;
      }

      const id = feature.getAttribute('boundNodeId');
      const { id: activeNodeId, graphic } = activeNode;
      const unbound = !id;
      const hadBoundToAnotherNode = !!id && id !== activeNodeId;
      const hadBoundToAnotherFeature = !!graphic?.id;

      if (hadBoundToAnotherNode) {
        this.openSnackbar(`此图形已绑定节点。节点名称：${feature.getAttribute('boundNodeName')}，节点ID：${id}`);
      }

      if (hadBoundToAnotherFeature) {
        this.openSnackbar(`此节点已绑定图形。 图形名称：${activeNode.graphic.type}，图形ID：${activeNode.graphic.id}`);
      }

      if (hadBoundToAnotherFeature || hadBoundToAnotherNode) {
        const workflowWatcher = this.editor.activeWorkflow.watch('hasPreviousStep', (nValue, oValue) => {
          if (nValue) {
            this.editor.activeWorkflow.previous();
            workflowWatcher.remove();
          }
        });
      }

      if (unbound) {
        feature.attributes = { ...feature.attributes, boundNodeName: activeNode.name, boundNodeId: activeNode.id };
        model.set('feature', feature);
      }
    });
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
          allowedWorkflows: this.getAllowedWorkFlows(),
          label: 'editor',
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

  private getFieldConfig(): Partial<esri.FieldConfig>[] {
    return [
      {
        name: 'boundNodeName',
        label: '绑定节点名称',
        editable: false,
        hint: '从左侧导航栏中选择需要绑定的节点',
      },
      { name: 'name', label: '名称', hint: '你可以为当前编辑的图形设置单独的名称' },
      { name: 'description', label: '描述', editorType: 'text-area' },
    ];
  }

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
