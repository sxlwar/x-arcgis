import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';

import { CommonModule } from '@angular/common';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DynamicFormFieldComponent } from './dynamic-form-field/dynamic-form-field.component';
import { DynamicFormComponent } from './dynamic-form/dynamic-form.component';
import { FormEditComponent } from './form-edit/form-edit.component';
import { MapComponent } from './map/map.component';
import { XArcgisMatDrawToolbarComponent } from './mat-draw-toolbar/mat-draw-toolbar.component';
import { XArcgisMatSearchboxComponent } from './mat-searchbox/mat-searchbox.component';
import { ConfigOption } from './model';
import {
    XArcgisNgZorroDrawToolbarComponent
} from './ng-zorro-draw-toolbar/ng-zorro-draw-toolbar.component';
import { XArcgisNgZorroSearchboxComponent } from './ng-zorro-searchbox/ng-zorro-searchbox.component';
import { ControlTypePipe } from './pipes/control-type.pipe';
import { X_ARCGIS_CONFIG } from './providers';
import { DynamicFormFieldService } from './providers/dynamic-form.service';
import { SideNavSwitcherComponent } from './side-nav-switcher/side-nav-switcher.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { ThemePickerComponent } from './theme-picker/theme-picker.component';
import { TreeFormComponent } from './tree-form/tree-form.component';
import { TreeComponent } from './tree/tree.component';
import { FieldKeyValidatorDirective } from './validators';
import { XArcgisMatFloorComponent } from './mat-floor/mat-floor.component';

@NgModule({
  declarations: [
    ControlTypePipe,
    DynamicFormComponent,
    DynamicFormFieldComponent,
    FieldKeyValidatorDirective,
    FormEditComponent,
    MapComponent,
    SideNavSwitcherComponent,
    SidenavComponent,
    ThemePickerComponent,
    TreeComponent,
    TreeFormComponent,
    XArcgisMatDrawToolbarComponent,
    XArcgisMatFloorComponent,
    XArcgisMatSearchboxComponent,
    XArcgisNgZorroDrawToolbarComponent,
    XArcgisNgZorroSearchboxComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientJsonpModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatTreeModule,
    NzAutocompleteModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzRadioModule,
    ReactiveFormsModule,
  ],
  exports: [
    MapComponent,
    SidenavComponent,
    ThemePickerComponent,
    XArcgisMatDrawToolbarComponent,
    XArcgisMatFloorComponent,
    XArcgisMatSearchboxComponent,
    XArcgisNgZorroDrawToolbarComponent,
    XArcgisNgZorroSearchboxComponent,
  ],
  providers: [DynamicFormFieldService],
})
export class XArcgisModule {
  static forRoot(config: ConfigOption): ModuleWithProviders<XArcgisModule> {
    return {
      ngModule: XArcgisModule,
      providers: [{ provide: X_ARCGIS_CONFIG, useValue: config }],
    };
  }
}
