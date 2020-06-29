import { BehaviorSubject, forkJoin, merge, Observable, of, Subject } from 'rxjs';
import {
    distinctUntilChanged, filter, map, mapTo, switchMap, tap, withLatestFrom
} from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IFeatureLayerEditsEvent, XArcgisTreeNode } from '../model';
import { deepSearchAllFactory, deepSearchFactory, PredicateFn } from '../util/search';

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
  nodeId: number | string;
  graphicIds: number[];
  action: BindAction;
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

  private autoUnbindObs: Observable<EditResultWithNodeInfo<UnbindEdits>>;

  private _treeNodeSourceData: XArcgisTreeNode[];

  constructor(private http: HttpClient, private snakeBar: MatSnackBar) {
    this.initObs();
  }

  getNodeById(id: string | number): XArcgisTreeNode {
    const key: keyof XArcgisTreeNode = 'children';
    const source = this.treeNodeSourceData;
    const predicate: PredicateFn<XArcgisTreeNode> = (data: XArcgisTreeNode, value: string | number) =>
      data.id === value;
    const deepSearchFn = deepSearchFactory(predicate, id, key);

    return deepSearchFn(source);
  }

  bindGraphicToNode(): Observable<any> {
    return this.getBindNodeAndGraphic().pipe(
      map((data) => this.getBindNodeParams(data)),
      switchMap((params) => forkJoin(params.map((param) => this.launchBindRequest(param))))
    );
  }

  unbindGraphicFromNode(): Observable<any> {
    return this.getUnbindNodeAndGraphic().pipe(
      map((data) => this.getUnbindNodeParams(data)),
      switchMap((params) => forkJoin(params.map((param) => this.launchBindRequest(param))))
    );
  }

  updateNodesAfterGraphicDeleted(): Observable<any> {
    return this.findNodesAfterGraphicDeleted().pipe(
      switchMap((data) => this.launchDeleteRequest(data.map((item) => item.id)).pipe(mapTo(data)))
    );
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

  // TODO: 接下来的处理取决于后台返回的结果，是返回更新后的treeNodeSource还是更新成功或失败的信息
  private launchBindRequest(params: BindRequest): Observable<any> {
    const reqObs = this.http.post('', params);
    const fakeReqObs = of(`${params.action} fake result`);

    return fakeReqObs.pipe(
      tap((_) => {
        const { action } = params;
        const msg = {
          unbind: '解绑成功',
          bind: '绑定成功',
        };

        this.snakeBar.open(msg[action], '', { duration: 3000, verticalPosition: 'top' });
        this.linkNode$.next(null);
      }),
      map((msg) => ({ msg, params }))
    );
  }

  // TODO: 接下来的处理取决于后台返回的结果，是返回更新后的treeNodeSource还是更新成功或失败的信息
  private launchDeleteRequest(graphicIds: number[]): Observable<any> {
    const reqObs = this.http.post('', { graphicIds });
    const fakeReqObs = of(null);

    return fakeReqObs;
  }

  private getBindNodeParams(info: EditResultWithNodeInfo<BindEdits>): BindRequest[] {
    const { node, action, result } = info;
    const { addedFeatures, updatedFeatures } = result;
    const graphicIdsOnNode = node?.feature?.graphicIds;
    const graphicIds = [
      ...this.findIds(addedFeatures, graphicIdsOnNode),
      ...this.findIds(updatedFeatures, graphicIdsOnNode),
    ];

    return [{ nodeId: node.id, graphicIds, action }];
  }

  private getUnbindNodeParams(info: EditResultWithNodeInfo<UnbindEdits>): BindRequest[] {
    const { node, action, result } = info;
    const { updatedFeatures } = result;
    const graphicIdsOnNode = node?.feature?.graphicIds;
    const graphicIds = this.findIds(updatedFeatures, graphicIdsOnNode);

    return [{ nodeId: node.id, graphicIds, action }];
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
