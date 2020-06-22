import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { IFeatureLayerEditsEvent, XArcgisTreeNode } from '../model';

import esri = __esri;

@Injectable({ providedIn: 'root' })
export class SidenavService {
  activeNode$: BehaviorSubject<XArcgisTreeNode | null> = new BehaviorSubject(null);

  activeNodeObs: Observable<XArcgisTreeNode | null>;

  editResponse$: Subject<IFeatureLayerEditsEvent> = new Subject();

  editResponseObs: Observable<IFeatureLayerEditsEvent>;

  editingGraphic$:Subject<esri.Graphic> = new Subject(); 

  editingGraphicObs: Observable<esri.Graphic>;

  constructor() {
    this.activeNodeObs = this.activeNode$.asObservable();
    this.editResponseObs = this.editResponse$.asObservable();
    this.editingGraphicObs = this.editingGraphic$.asObservable();
  }

  combineActiveNodeAndGraphic(): Observable<any> {
    return combineLatest(
      this.activeNodeObs,
      this.editingGraphicObs,
      (node, graphic) => ({ node, graphic})
    ).pipe(
      filter(({ node, graphic}) => !!node && !!graphic)
    )
  }
}
