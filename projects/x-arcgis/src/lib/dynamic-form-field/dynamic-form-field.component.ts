import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { XArcgisCheckboxValue, XArcgisFormField } from '../base/dynamic-form';

@Component({
  selector: 'x-arcgis-dynamic-form-field',
  templateUrl: './dynamic-form-field.component.html',
  styleUrls: ['./dynamic-form-field.component.scss'],
})
export class DynamicFormFieldComponent {
  @Input() field: XArcgisFormField<string>;

  @Input() form: FormGroup;

  get isValid() {
    return this.form.controls[this.field.key].valid;
  }

  onCheckboxValueChanges(event: MatCheckboxChange) {
    const control = this.form.get(this.field.key);
    const value: XArcgisCheckboxValue[] = control.value;

    if (event.checked) {
      control.setValue([...value, event.source.value]);
    } else {
      control.setValue(value.filter((item) => item !== (event.source as any).value));
    }
  }
}
