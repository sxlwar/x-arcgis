import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { MapComponent } from './map/map.component';

@NgModule({
  declarations: [MapComponent],
  imports: [HttpClientModule, HttpClientJsonpModule],
  exports: [MapComponent],
})
export class XArcgisModule {}
