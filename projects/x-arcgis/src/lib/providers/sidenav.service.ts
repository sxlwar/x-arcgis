import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { XArcgisTreeNode } from '../model';

@Injectable({ providedIn: 'root' })
export class SidenavService {
  activeNode$: BehaviorSubject<XArcgisTreeNode> = new BehaviorSubject(null);

  activeNodeObs: Observable<XArcgisTreeNode>;

  constructor() {
    this.activeNodeObs = this.activeNode$.asObservable();
  }
}
