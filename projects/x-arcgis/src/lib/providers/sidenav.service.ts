import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IFeatureLayerEditsEvent, XArcgisTreeNode } from '../model';
import { deepSearchAllFactory, deepSearchFactory, PredicateFn } from '../util/search';

import esri = __esri;
interface IEditResponse {
  editResults: IFeatureLayerEditsEvent;
  editFeatures: esri.FeatureSet;
}

interface EditResultWithNodeInfo {
  node: XArcgisTreeNode;
  result: IFeatureLayerEditsEvent;
}

interface BoundRequest {
  nodeId: number | string;
  graphicIds: number[];
  action: 'unbind' | 'bind';
}

@Injectable({ providedIn: 'root' })
export class SidenavService {
  activeNode$: BehaviorSubject<XArcgisTreeNode | null> = new BehaviorSubject(null);

  activeNodeObs: Observable<XArcgisTreeNode | null>;

  linkNode$: Subject<XArcgisTreeNode> = new Subject();

  linkNodeObs: Observable<XArcgisTreeNode>;

  editResponse$: Subject<IEditResponse> = new Subject();

  editResponseObs: Observable<IEditResponse>;

  deleteGraphic$: Subject<IFeatureLayerEditsEvent> = new Subject();

  deleteGraphicObs: Observable<IFeatureLayerEditsEvent>;

  private _treeNodeSourceData: XArcgisTreeNode[];

  constructor(private http: HttpClient, private snakeBar: MatSnackBar) {
    this.initObs();
  }

  private initObs(): void {
    this.activeNodeObs = this.activeNode$.asObservable().pipe(distinctUntilChanged());
    this.linkNodeObs = this.linkNode$.asObservable();
    this.editResponseObs = this.editResponse$.asObservable();
    this.deleteGraphicObs = this.deleteGraphic$.asObservable();
  }

  /**
   * Sent the result after one of add, delete, update operations completed of the graphic.
   * At the same time, the related tree node also be sent out.
   * If the node exist, may be need to bind the graphic to the node;
   */
  combineNodeAndGraphic(): Observable<EditResultWithNodeInfo> {
    return this.editResponseObs.pipe(
      map((res) => {
        const { editFeatures, editResults } = res;
        const { features } = editFeatures;
        const nodeId = features[0].attributes.boundNodeId;
        const node = !!nodeId ? this.getActiveTreeNodeById(nodeId) : null;

        return { node, result: editResults };
      }),
      filter(({ node }) => !!node)
    );
  }

  updateGraphicsAfterDeleted(): Observable<{ id: number; nodes: XArcgisTreeNode[] }[]> {
    const predicateFn = (node: XArcgisTreeNode, id: number) => {
      const ids = node?.feature?.graphicIds;

      return !!ids && ids.includes(id);
    };
    const key: keyof XArcgisTreeNode = 'children';
    const searchAll = (id: number) => deepSearchAllFactory(predicateFn, id, key)(this.treeNodeSourceData);

    return this.deleteGraphicObs.pipe(
      map((result) => {
        const { deletedFeatures } = result;
        const deletedIds = deletedFeatures.map((item) => item.objectId);

        return deletedIds.map((id) => ({ id, nodes: searchAll(id) }));
      })
    );
  }

  // TODO: 接下来的处理取决于后台返回的结果，是返回更新后的treeNodeSource还是更新成功或失败的信息
  launchBoundRequest(params: BoundRequest): Observable<any> {
    const reqObs = this.http.post('', params);
    const fakeReqObs = of(null);

    return fakeReqObs.pipe(
      tap((_) => {
        const { action } = params;
        const msg = {
          unbind: '解绑成功',
          bind: '绑定成功',
        };

        this.snakeBar.open(msg[action], '', { duration: 3000, verticalPosition: 'top' });
      })
    );
  }

  // TODO: 接下来的处理取决于后台返回的结果，是返回更新后的treeNodeSource还是更新成功或失败的信息
  launchDeleteRequest(graphicIds: number[]): Observable<any> {
    const reqObs = this.http.post('', { graphicIds });
    const fakeReqObs = of(null);

    return fakeReqObs;
  }

  getBoundRequestParams(info: EditResultWithNodeInfo): BoundRequest[] {
    const { node } = info;
    const unbindIds = this.getUnboundIds(info);
    const deleteIds = this.getRemovedIds(info);
    const boundReq: BoundRequest = { nodeId: node.id, graphicIds: unbindIds, action: 'bind' };
    const unbind: BoundRequest = { nodeId: node.id, graphicIds: deleteIds, action: 'unbind' };

    return [boundReq, unbind];
  }

  /**
   * @returns unbind ids;
   */
  private getUnboundIds(info: EditResultWithNodeInfo): number[] {
    const { node, result } = info;
    const { addedFeatures, updatedFeatures } = result;
    const graphicIdsOnNode = node?.feature?.graphicIds;

    return [...this.findIds(addedFeatures, graphicIdsOnNode), ...this.findIds(updatedFeatures, graphicIdsOnNode)];
  }

  /**
   * @returns delete ids
   */
  private getRemovedIds(info: EditResultWithNodeInfo): number[] {
    const { result, node } = info;
    const { deletedFeatures } = result;

    return this.findIds(deletedFeatures, node?.feature?.graphicIds);
  }

  private getActiveTreeNodeById(id: string | number): XArcgisTreeNode {
    const key: keyof XArcgisTreeNode = 'children';
    const source = this.treeNodeSourceData;
    const predicate: PredicateFn<XArcgisTreeNode> = (data: XArcgisTreeNode, value: string | number) =>
      data.id === value;
    const deepSearchFn = deepSearchFactory(predicate, id, key);

    return deepSearchFn(source);
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
