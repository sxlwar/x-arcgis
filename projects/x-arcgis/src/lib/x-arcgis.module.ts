import { CommonModule } from '@angular/common';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTreeModule } from '@angular/material/tree';

import { DynamicFormFieldComponent } from './dynamic-form-field/dynamic-form-field.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { MapComponent } from './map/map.component';
import { DynamicFormFieldService } from './providers/dynamic-form.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { TreeFormComponent } from './tree-form/tree-form.component';
import { TreeComponent } from './tree/tree.component';

@NgModule({
  declarations: [
    MapComponent,
    TreeComponent,
    DynamicFormComponent,
    DynamicFormFieldComponent,
    TreeFormComponent,
    SidenavComponent,
  ],
  imports: [
    HttpClientModule,
    HttpClientJsonpModule,
    CommonModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  exports: [MapComponent, SidenavComponent],
  providers: [DynamicFormFieldService],
})
export class XArcgisModule {}
