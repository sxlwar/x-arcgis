import { BehaviorSubject, forkJoin, merge, Observable, of, Subject } from 'rxjs';
import {
    catchError, distinctUntilChanged, filter, map, switchMap, tap, withLatestFrom
} from 'rxjs/operators';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    ConfigOption, GeometryType, IFeatureLayerEditsEvent, UpdateTreeNodeRequest,
    UpdateTreeNodeResponse, XArcgisTreeNode
} from '../model';
import { deepSearchAllFactory, deepSearchFactory, PredicateFn } from '../util/search';
import { X_ARCGIS_CONFIG } from './config.service';

import esri = __esri;
export type BindAction = 'unbind' | 'bind' | 'reset';

export interface NodeOperation {
  node: XArcgisTreeNode;
  action: BindAction;
}

export interface AutoUnbindNodeOperation extends NodeOperation {
  graphicId: number;
}

interface EditResultWithNodeInfo<T = IFeatureLayerEditsEvent> extends NodeOperation {
  result: T;
}

interface BindRequest {
  nodeId: number;
  graphicIds: number[];
  action: BindAction;
  featureId: string;
  geometryType: GeometryType;
}

interface BindResponse extends BindRequest {
  success: boolean;
}

type DeleteEdits = Pick<IFeatureLayerEditsEvent, 'deletedFeatures' | 'target'>;

type BindEdits = Pick<IFeatureLayerEditsEvent, 'addedFeatures' | 'updatedFeatures' | 'target'>;

type UnbindEdits = Pick<IFeatureLayerEditsEvent, 'updatedFeatures' | 'target'>;

@Injectable({ providedIn: 'root' })
export class SidenavService {
  activeNode$: BehaviorSubject<XArcgisTreeNode | null> = new BehaviorSubject(null);

  activeNodeObs: Observable<XArcgisTreeNode | null>;

  linkNode$: Subject<NodeOperation | null> = new Subject();

  linkNodeObs: Observable<NodeOperation | null>;

  editResponse$: Subject<IFeatureLayerEditsEvent> = new Subject();

  deleteResponseObs: Observable<DeleteEdits>;

  bindResponseObs: Observable<BindEdits>;

  unbindResponseObs: Observable<UnbindEdits>;

  autoUnbind$: Subject<AutoUnbindNodeOperation | null> = new Subject();

  highlightNode$: Subject<number> = new Subject();

  showBindButton$: Subject<boolean> = new Subject();

  private autoUnbindObs: Observable<EditResultWithNodeInfo<UnbindEdits>>;

  private _treeNodeSourceData: XArcgisTreeNode[];

  constructor(
    private http: HttpClient,
    @Inject(X_ARCGIS_CONFIG) private config: ConfigOption,
    private snakeBar: MatSnackBar
  ) {
    this.initObs();
  }

  getNodeById(id: number): XArcgisTreeNode {
    const key: keyof XArcgisTreeNode = 'children';
    const source = this.treeNodeSourceData;
    const predicate: PredicateFn<XArcgisTreeNode> = (data: XArcgisTreeNode, value: string | number) =>
      data.id === +value;
    const deepSearchFn = deepSearchFactory(predicate, id, key);

    return deepSearchFn(source);
  }

  bindGraphicToNode(): Observable<BindResponse[]> {
    return this.getBindNodeAndGraphic().pipe(
      map((data) => this.getBindNodeParams(data)),
      filter((params) => !!params),
      switchMap((params) => forkJoin(params.map((param) => this.launchBindRequest(param))))
    );
  }

  unbindGraphicFromNode(): Observable<BindResponse[]> {
    return this.getUnbindNodeAndGraphic().pipe(
      map((data) => this.getUnbindNodeParams(data)),
      filter((params) => !!params),
      switchMap((params) => forkJoin(params.map((param) => this.launchBindRequest(param))))
    );
  }

  updateNodesAfterGraphicDeleted(): Observable<BindResponse[]> {
    return this.findNodesAfterGraphicDeleted().pipe(
      switchMap((data) => {
        const requests: BindRequest[] = data
          .map((item) => {
            const { id: graphicId, nodes } = item;

            return nodes.map((node) => {
              const {
                feature: { id: featureId, geometryType },
                id,
              } = node;
              const request: BindRequest = {
                nodeId: id,
                graphicIds: [graphicId],
                action: 'unbind',
                featureId,
                geometryType,
              };

              return request;
            });
          })
          .reduce((acc, cur) => [...acc, ...cur], []);

        return forkJoin(requests.map((req) => this.launchBindRequest(req)));
      })
    );
  }

  updateNodeFields(req: UpdateTreeNodeRequest): Observable<UpdateTreeNodeResponse> {
    return this.http.post<boolean>(this.config.nodeUpdateUrl, req);
  }

  private initObs(): void {
    this.activeNodeObs = this.activeNode$.asObservable().pipe(distinctUntilChanged());
    this.linkNodeObs = this.linkNode$.asObservable();
    this.deleteResponseObs = this.editResponse$.asObservable().pipe(
      map(({ deletedFeatures, target }) => ({ deletedFeatures, target })),
      filter((data) => !!data.deletedFeatures.length)
    );
    this.bindResponseObs = this.editResponse$.asObservable().pipe(
      map(({ addedFeatures, updatedFeatures, target }) => ({ addedFeatures, updatedFeatures, target })),
      filter((data) => !!data.addedFeatures.length || !!data.updatedFeatures.length)
    );
    this.unbindResponseObs = this.editResponse$.asObservable().pipe(
      map(({ updatedFeatures, target }) => ({ updatedFeatures, target })),
      filter((data) => !!data.updatedFeatures.length)
    );
    this.autoUnbindObs = this.getBindNodeAndGraphic().pipe(
      withLatestFrom(this.autoUnbind$, (data, autoUnbindOpt) => {
        /**
         * the following 3 conditions are met, need to unbind a graphic from a node automatically.
         * 1. A bind operation occurs
         * 2. Auto unbind observable send notification;
         * 3. This graph ID still exists in the graph list on the node
         */
        if (!autoUnbindOpt) {
          return null;
        }

        const {
          result: { updatedFeatures, target },
        } = data;
        const { node: autoNode, graphicId, action } = autoUnbindOpt;
        const targetGraphic = updatedFeatures.find((item) => item.objectId === graphicId);

        return !!targetGraphic && autoNode?.feature?.graphicIds.includes(graphicId)
          ? { node: autoNode, action, result: { updatedFeatures: [targetGraphic], target } }
          : null;
      }),
      filter((data) => !!data)
    );
  }

  private getBindNodeAndGraphic(): Observable<EditResultWithNodeInfo<BindEdits>> {
    return this.updateNodeByGraphicEditRes(this.bindResponseObs).pipe(filter((opt) => opt.action === 'bind'));
  }

  private getUnbindNodeAndGraphic(): Observable<EditResultWithNodeInfo<UnbindEdits>> {
    const unbindObs = this.updateNodeByGraphicEditRes(this.unbindResponseObs).pipe(
      filter((opt) => opt.action === 'unbind')
    );

    return merge(unbindObs, this.autoUnbindObs);
  }

  /**
   * --------e-------e------e------e---- edit res obs e: edit response
   *
   * -----l-------l------n------l------ link node obs l:link node n:null
   *
   * -------el-------el-----en-----el---- combined obs  el: edit and link node en: edit and null
   *
   * -------el-------el------------el---- obs need to handle
   */
  private updateNodeByGraphicEditRes<T>(bindObs: Observable<T>): Observable<EditResultWithNodeInfo<T>> {
    return bindObs.pipe(
      withLatestFrom(this.linkNodeObs.pipe(filter((opt) => !!opt)), (result, data) => ({ result, ...data })),
      filter((data) => !!data.node)
    );
  }

  /**
   * @returns id - graphic id; nodes - Nodes that has linked to the graphic
   */
  private findNodesAfterGraphicDeleted(): Observable<{ id: number; nodes: XArcgisTreeNode[] }[]> {
    const predicateFn = (node: XArcgisTreeNode, id: number) => {
      const ids = node?.feature?.graphicIds;

      return !!ids && ids.includes(id);
    };
    const key: keyof XArcgisTreeNode = 'children';
    const searchAll = (id: number) => deepSearchAllFactory(predicateFn, id, key)(this.treeNodeSourceData);

    return this.deleteResponseObs.pipe(
      map((result) => {
        const { deletedFeatures } = result;
        const deletedIds = deletedFeatures.map((item) => item.objectId);

        return deletedIds.map((id) => ({ id, nodes: searchAll(id) }));
      })
    );
  }

  private launchBindRequest(params: BindRequest): Observable<BindResponse> {
    const { nodeUpdateUrl } = this.config;
    const { action, nodeId, featureId, graphicIds, geometryType } = params;
    const body = {
      id: nodeId,
      feature: { id: featureId, geometryType, graphicIds, action },
    } as UpdateTreeNodeRequest;
    const getTipMsg = (isSuccess: boolean, action: string): string => {
      const msg = {
        unbind: '解绑',
        bind: '绑定',
      };

      return `${msg[action]}${isSuccess ? '成功' : '失败'}`;
    };

    return this.http.post<boolean>(nodeUpdateUrl, body).pipe(
      tap((res) => {
        this.snakeBar.open(getTipMsg(res, action), '', { duration: 3000, verticalPosition: 'top' });
        this.linkNode$.next(null);
      }),
      map((res) => ({ ...params, success: res })),
      catchError((err: HttpErrorResponse) => {
        console.error(err.message);

        return of(null);
      })
    );
  }

  private getBindNodeParams(info: EditResultWithNodeInfo<BindEdits>): BindRequest[] {
    const { node, action, result } = info;
    const { addedFeatures, updatedFeatures, target } = result;
    const graphicIdsOnNode = node?.feature?.graphicIds;
    const graphicIds = [
      ...this.findIds(addedFeatures, graphicIdsOnNode),
      ...this.findIds(updatedFeatures, graphicIdsOnNode),
    ];

    if (!graphicIds.length) {
      return null;
    }

    return [{ nodeId: node.id, graphicIds, action, featureId: target.id, geometryType: target.geometryType }];
  }

  private getUnbindNodeParams(info: EditResultWithNodeInfo<UnbindEdits>): BindRequest[] {
    const { node, action, result } = info;
    const { updatedFeatures, target } = result;
    const graphicIdsOnNode = node?.feature?.graphicIds;
    const graphicIds = updatedFeatures
      .map((item) => item.objectId)
      .filter((id) => (!!graphicIdsOnNode ? graphicIdsOnNode.includes(id) : null));

    if (!graphicIds.length) {
      console.warn(
        'There is no bound graphic on this node, or the graphic to be unbound does not bound to this node yet!',
        `The node bounded graphics: ${graphicIdsOnNode}`,
        `The graphics to be unbounded: ${updatedFeatures.map((item) => item.objectId)}`
      );

      return null;
    }

    return [{ nodeId: node.id, graphicIds, action, featureId: target.id, geometryType: target.geometryType }];
  }

  private findIds(result: esri.FeatureEditResult[], graphicIdsOnNode: number[]): number[] {
    return result
      .map((item) => item.objectId)
      .filter((id) => {
        return !!graphicIdsOnNode ? !graphicIdsOnNode.includes(id) : id;
      });
  }

  get treeNodeSourceData(): XArcgisTreeNode[] {
    return this._treeNodeSourceData;
  }

  set treeNodeSourceData(input: XArcgisTreeNode[]) {
    this._treeNodeSourceData = input;
  }
}
