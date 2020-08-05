import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { XArcgisTreeNode } from '@x-arcgis';

@Injectable({ providedIn: 'root' })
export class ApiService {
  url = '/api';

  isAuthSuccess = false;

  constructor(private http: HttpClient) {}

  getTreeNodes(): Observable<XArcgisTreeNode[]> {
    return this.http.get<XArcgisTreeNode[]>(this.url);
  }

  auth(params: { account: string; password: string}): boolean {
    const { account, password } = params;
    
    this.isAuthSuccess =  account === 'test' && password === '1234';

    return this.isAuthSuccess
  }
}
