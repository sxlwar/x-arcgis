import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { IFeatureLayerEditsEvent, XArcgisTreeNode } from '../model';
import { deepSearchFactory, PredicateFn } from '../util/search';

import esri = __esri;
@Injectable({ providedIn: 'root' })
export class SidenavService {
  activeNode$: BehaviorSubject<XArcgisTreeNode | null> = new BehaviorSubject(null);

  activeNodeObs: Observable<XArcgisTreeNode | null>;

  linkNode$: Subject<XArcgisTreeNode> = new Subject();

  linkNodeObs: Observable<XArcgisTreeNode>;

  editResponse$: Subject<IFeatureLayerEditsEvent> = new Subject();

  editResponseObs: Observable<IFeatureLayerEditsEvent>;

  editingGraphic$:Subject<esri.Graphic> = new Subject(); 

  editingGraphicObs: Observable<esri.Graphic>;

  private _treeNodeSourceData: XArcgisTreeNode[];

  constructor() {
    this.activeNodeObs = this.activeNode$.asObservable().pipe(distinctUntilChanged());
    this.linkNodeObs = this.linkNode$.asObservable();
    this.editResponseObs = this.editResponse$.asObservable();
    this.editingGraphicObs = this.editingGraphic$.asObservable();
  }

  combineActiveNodeAndGraphic(): Observable<any> {
    return combineLatest(
      this.activeNodeObs, // TODO: 需要另一条obs
      this.editingGraphicObs,
      (node, graphic) => ({ node, graphic})
    );
  }

  activeTreeNode(id: string | number): void {
    const key: keyof XArcgisTreeNode = 'children';
    const source = this.treeNodeSourceData;
    const predicate: PredicateFn<XArcgisTreeNode> = (data: XArcgisTreeNode, value:  string | number) => data.id === value;
    const deepSearchFn = deepSearchFactory(predicate, id, key);
    // const deepSearchRecordFn = deepSearchRecordFactory(predicate, id, key);
    const node = deepSearchFn(source);
    // const recorder = deepSearchRecordFn(source);
    // const cascadeNodes = searchCascadeNodes(source, recorder, key);
    
    this.activeNode$.next(node);
    // console.log(node, recorder, cascadeNodes);
  }

  get treeNodeSourceData(): XArcgisTreeNode[] {
    return this._treeNodeSourceData;
  }

  set treeNodeSourceData(input: XArcgisTreeNode[]) {
    this._treeNodeSourceData = input;
  }
}
