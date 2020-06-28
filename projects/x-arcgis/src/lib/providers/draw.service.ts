import { combineLatest, iif, Observable, Subscription } from 'rxjs';
import {
    distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap
} from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Base } from '../base/base';
import { GeometryType } from '../model';
import { NodeOperation, SidenavService } from './sidenav.service';
import { StoreService } from './store.service';
import { WebComponentService } from './web-component.service';
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

@Injectable({ providedIn: 'root' })
export class DrawService extends DrawBase {
  isModulesLoaded = false;

  private Editor: esri.EditorConstructor;

  private activeEditor: esri.Editor;

  private watchFeatureHandler: IHandle;

  constructor(
    private storeService: StoreService,
    private widgetService: WidgetService,
    private sidenavService: SidenavService,
    private snackbar: MatSnackBar,
    private webComponentService: WebComponentService,
  ) {
    super();
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
        this.webComponentService.addCloseElement(view, editor, this.destroyEditor.bind(this) );
        this.checkFeatureFormViewModel(editor, nodeOpt);
      });

    return destroy$$.add(draw$$);
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
        this.webComponentService.addUnbindElement(id);
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

  /**
   * TODO: BUG ----> if enable the button in program, 'feature-layer-source:edit-failure' error occurs
   */
  // private allowUpdateBtn(): void {
  //   const btn: HTMLButtonElement = this.document.querySelector('.esri-editor__control-button');

  //   if (btn) {
  //     btn.disabled = false;
  //     btn.className = btn.className.replace('esri-button--disabled', '');
  //   }
  // }
}
