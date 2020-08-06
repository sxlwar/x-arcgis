import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';

// import { XArcgisModule } from 'x-arcgis';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import zh from '@angular/common/locales/zh';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { XArcgisModule } from '@x-arcgis';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CloseComponent, EsriMapComponent } from './esri-map/esri-map.component';

import esri = __esri;
registerLocaleData(zh);

const baseLayers: esri.FeatureLayerProperties[] = [
  {
    id: `point_layer`,
    geometryType: 'point',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/sxlwar/FeatureServer',
  },
  {
    id: `polyline_layer`,
    geometryType: 'polyline',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/lines/FeatureServer',
  },
  {
    id: `polygon_layer`,
    geometryType: 'polygon',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/polygon/FeatureServer',
  },
  {
    id: `point_layer_2`,
    geometryType: 'point',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/pointer2/FeatureServer',
  },
  {
    id: 'polyline_layer_2',
    geometryType: 'polyline',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/polyline2/FeatureServer',
  },
  {
    id: 'polygon_layer_2',
    geometryType: 'polygon',
    url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/polygon2/FeatureServer',
  },
];
const sceneLayers: esri.FeatureLayerProperties[] = [
  // {
  //   id: 'custom_scene_layer',
  //   url: 'https://services.arcgis.com/0VkaDfZ5oLYahA9k/arcgis/rest/services/building/FeatureServer'
  // },
  // TODO: 这一层后台怎么创建出来？
  {
    id: 'official_editable_scene_layer',
    url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/EditableFeatures3D/FeatureServer/1',
  },
];

@NgModule({
  declarations: [AppComponent, EsriMapComponent, CloseComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    XArcgisModule.forRoot({
      baseLayers,
      nodeUpdateUrl: '/api/update',
      sceneLayers,
      scenePortal: 'http://map.xinanyun.cn/arcgis',
      styleUrl: './assets/themes/light-blue/main.css',
    }),
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatIconModule,
    MatTooltipModule,
    NzIconModule,
    NzModalModule,
    ReactiveFormsModule,
  ],
  providers: [{ provide: NZ_I18N, useValue: zh_CN }],
  bootstrap: [AppComponent],
})
export class AppModule {}
