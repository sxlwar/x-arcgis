import { combineLatest, iif, Observable, Subscription, timer } from 'rxjs';
import {
    distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap
} from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Injector, OnDestroy, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Base } from '../base/base';
import { GeometryType, IWebComponents } from '../model';
import { NodeOperation, SidenavService } from './sidenav.service';
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

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase implements OnDestroy {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  private activeEditor: esri.Editor;

  /**
   * By default, we add a span element to the editor popup in order to exit the draw process
   */
  private closeNodeTagName = 'span';

  private webComponents: IWebComponents[] = [];

  private watchFeatureHandler: IHandle;

  private closeIconListener: (event: MouseEvent) => void;

  private unbindIconListener: (event: MouseEvent) => void;

  constructor(
    private storeService: StoreService,
    private widgetService: WidgetService,
    private injector: Injector,
    private sidenavService: SidenavService,
    private snackbar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {
    super();
    this.defineCustomElements();
  }

  /**
   * handle draw event;
   */
  handleDraw(drawObs: Observable<GeometryType>): Subscription {
    const editorObs = drawObs.pipe(
      filter((value) => !!value),
      switchMap((geometryType) => this.loadEditor(geometryType))
    );
    const viewObs = this.storeService.store.pipe(
      filter((config) => !!config),
      map((config) => config.esriMapView),
      distinctUntilChanged()
    );
    const destroy$$ = combineLatest(drawObs, viewObs)
      .pipe(takeUntil(this.storeService.destroy))
      .subscribe(([geometryType, view]) => {
        if (!geometryType && !this.activeEditor?.destroyed) {
          this.destroyEditor(view, this.activeEditor);
        }
      });
    const linkNodeObs = this.sidenavService.linkNodeObs.pipe(startWith(null));
    const draw$$ = combineLatest(editorObs, viewObs, linkNodeObs)
      .pipe(
        filter(([editor]) => !!editor && !editor.destroyed),
        takeUntil(this.storeService.destroy)
      )
      .subscribe(([editor, view, nodeOpt]) => {
        this.addCloseElement(view, editor);
        this.checkFeatureFormViewModel(editor, nodeOpt);
      });

    return destroy$$.add(draw$$);
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
    if (editor && !editor.destroyed) {
      editor.destroy();
      view.ui.remove(editor);
    }

    if (this.watchFeatureHandler) {
      this.watchFeatureHandler.remove();
    }

    this.sidenavService.linkNode$.next(null);
  }

  /**
   * Check whether the selected graphic had bound to a node, show alerting message if bounded, set bound information to the active tree node
   * Bound information: boundNodeName and boundNodeId
   */
  private checkFeatureFormViewModel(editor: esri.Editor, nodeOpt: NodeOperation): void {
    const model = editor.viewModel?.featureFormViewModel;

    if (!model) {
      return;
    }

    const watcher = (feature: esri.Graphic) => {
      if (!feature) {
        return;
      }

      const id: number = feature.getAttribute('boundNodeId');
      const hadBoundToAnotherNode = !!id && !!nodeOpt && nodeOpt.action === 'bind' && id !== nodeOpt.node.id;

      // The relationship between node and feature: one-to-many, a node can bind multiple features, but a feature can only be bound to a node.
      if (hadBoundToAnotherNode) {
        this.openSnackbar(`此图形已绑定节点。节点名称：${feature.getAttribute('boundNodeName')}，节点ID：${id}`);
      }

      if (!!id) {
        this.sidenavService.activeNode$.next(this.sidenavService.getNodeById(id));
        this.addUnbindElement(id);
      }

      if (!!nodeOpt) {
        const {
          node: { id, name },
          action,
        } = nodeOpt;

        if (action === 'bind') {
          feature.attributes = { ...feature.attributes, boundNodeName: name, boundNodeId: id };
        }

        if (action === 'unbind') {
          feature.attributes = { ...feature.attributes, boundNodeName: null, boundNodeId: null };
        }

        /**
         * Here we force the form refresh by setting the top-level data source which here is the feature, because of the widget is implemented by JSX.
         *
         * Even though we can use graphic.setAttribute or accessor.set method to modify the attribute, it actually works, but the ui state is not
         * consistent with the attribute.
         */
        model.set('feature', feature);
      }
    };

    let watchHandler = this.watchFeatureHandler;

    if (model.feature) {
      watcher(model.feature);
    } else {
      watchHandler = model.watch('feature', watcher);
    }

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
        this.destroyEditor(view, this.activeEditor);

        const { Editor } = this;
        const layerInfos = this.getLayerInfos(iMap, currentGeometryType);
        const editor = new Editor({
          view,
          layerInfos,
          label: 'editor',
        });

        this.activeEditor = editor;
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

  private addUnbindElement(boundNodeId: number): void {
    timer(1000, 0)
      .pipe(take(1))
      .subscribe((_) => {
        const boundNameControl = this.document.querySelector('.esri-feature-form__label');

        if (!boundNameControl) {
          return;
        }

        const appended = boundNameControl.querySelector('mat-icon');
        let node = null;

        if (!!appended) {
          return;
        }

        const unbindNode = this.document.createElement('mat-icon');

        unbindNode.innerText = 'link_off';
        unbindNode['color'] = 'warn';
        unbindNode.title = '解绑当前节点';

        const listener = (nodeId: number) => (event: MouseEvent) => {
          this.sidenavService.linkNode$.next({ node: this.sidenavService.getNodeById(nodeId), action: 'unbind' });
        };

        node = unbindNode;
        this.unbindIconListener && node.removeEventListener('click', this.unbindIconListener);
        // create a new event listener
        this.unbindIconListener = listener(boundNodeId);
        node.addEventListener('click', this.unbindIconListener);

        node.id = 'x-arcgis-unbind-node-icon';
        boundNameControl.appendChild(node);
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
      // !FIXME: confused! If remove the required field, the form state in the UI is different from the value sent to the server.
      { name: 'name', label: '名称', hint: '你可以为当前编辑的图形设置单独的名称', required: true },
      { name: 'description', label: '描述', editorType: 'text-area' },
    ] as esri.FieldConfig[];
  }

  private openSnackbar(message: string): void {
    this.snackbar.open(message, '', { duration: 3000, verticalPosition: 'top' });
  }

  private defineCustomElements(): void {
    const unbindEle = createCustomElement(MatIcon, { injector: this.injector });

    customElements.define('mat-icon', unbindEle);
  }

  /**
   * TODO: BUG ----> if enable the button in program, 'feature-layer-source:edit-failure' error occurs
   */
  private allowUpdateBtn(): void {
    const btn: HTMLButtonElement = this.document.querySelector('.esri-editor__control-button');

    if (btn) {
      btn.disabled = false;
      btn.className = btn.className.replace('esri-button--disabled', '');
    }
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
