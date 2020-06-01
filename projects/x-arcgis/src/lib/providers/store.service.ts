import { BehaviorSubject, Subject } from 'rxjs';

import { Injectable } from '@angular/core';

import esri = __esri;

export interface Store {
  esriMap: esri.Map;
  esriMapView: esri.MapView;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  /**
   * Store the all loaded map related elements;
   */
  store: BehaviorSubject<Store> = new BehaviorSubject(null);

  /**
   * map destroy notify;
   */
  destroy: Subject<boolean> = new Subject();
}
