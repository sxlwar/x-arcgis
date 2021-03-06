import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';

// import { XArcgisModule } from 'x-arcgis';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import zh from '@angular/common/locales/zh';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { XArcgisModule } from '@x-arcgis';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CloseComponent, EsriMapComponent } from './esri-map/esri-map.component';

registerLocaleData(zh);

@NgModule({
  declarations: [AppComponent, EsriMapComponent, CloseComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    XArcgisModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NzRadioModule,
    NzIconModule,
    NzInputModule,
    NzAutocompleteModule,
    NzButtonModule,
    NzModalModule,
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent],
})
export class AppModule {}
