import { CommonModule } from '@angular/common';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';

import { MapComponent } from './map/map.component';
import { TreeComponent } from './tree/tree.component';

@NgModule({
  declarations: [MapComponent, TreeComponent],
  imports: [HttpClientModule, HttpClientJsonpModule, CommonModule, MatTreeModule, MatIconModule, MatButtonModule],
  exports: [MapComponent],
})
export class XArcgisModule {}
