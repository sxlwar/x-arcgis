import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { XArcgisTreeNode } from '@x-arcgis';

@Injectable({ providedIn: 'root' })
export class ApiService {
  url = '/api';

  isAuthSuccess = false;

  constructor(private http: HttpClient) {
    this.isAuthSuccess = localStorage.getItem('xArcgisAuthAccount') === 'test';
  }

  getTreeNodes(): Observable<XArcgisTreeNode[]> {
    return this.http.get<XArcgisTreeNode[]>(this.url);
  }

  auth(params: { account: string; password: string }): boolean {
    const { account, password } = params;

    this.isAuthSuccess = account === 'test' && password === '1234';

    if (this.isAuthSuccess) {
      localStorage.setItem('xArcgisAuthAccount', account);
    }

    return this.isAuthSuccess;
  }
}
