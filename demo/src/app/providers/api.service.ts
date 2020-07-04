import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { XArcgisTreeNode } from '@x-arcgis';

@Injectable({ providedIn: 'root' })
export class ApiService {
  url = '/api';

  constructor(private http: HttpClient) {}

  getTreeNodes(): Observable<XArcgisTreeNode[]> {
    return this.http.get<XArcgisTreeNode[]>(this.url);
  }
}
