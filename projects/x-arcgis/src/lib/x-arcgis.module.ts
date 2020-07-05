import { CommonModule } from '@angular/common';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';

import { DynamicFormFieldComponent } from './dynamic-form-field/dynamic-form-field.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FormEditComponent } from './form-edit/form-edit.component';
import { MapComponent } from './map/map.component';
import { ConfigOption } from './model';
import { ControlTypePipe } from './pipes/control-type.pipe';
import { X_ARCGIS_CONFIG } from './providers';
import { DynamicFormFieldService } from './providers/dynamic-form.service';
import { SidenavComponent } from './sidenav/sidenav.component';
import { TreeFormComponent } from './tree-form/tree-form.component';
import { TreeComponent } from './tree/tree.component';
import { FieldKeyValidatorDirective } from './validators';

@NgModule({
  declarations: [
    DynamicFormComponent,
    DynamicFormFieldComponent,
    MapComponent,
    SidenavComponent,
    TreeComponent,
    TreeFormComponent,
    FormEditComponent,
    ControlTypePipe,
    FieldKeyValidatorDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientJsonpModule,
    HttpClientModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatTreeModule,
    ReactiveFormsModule,
  ],
  exports: [MapComponent, SidenavComponent],
  providers: [DynamicFormFieldService],
})
export class XArcgisModule {
  static forRoot(config: ConfigOption): ModuleWithProviders<XArcgisModule> { 
    return {
      ngModule: XArcgisModule,
      providers: [
        { provide: X_ARCGIS_CONFIG, useValue: config },
      ]
    }
  }
}
