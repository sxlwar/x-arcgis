

import { Subject } from 'rxjs';

import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import {
    XArcgisCheckboxFormField, XArcgisFormField, XArcgisInputFormField, XArcgisRadioFormField,
    XArcgisSelectFormField, XArcgisTextareaFormField
} from '../base/dynamic-form';

@Injectable()
export class DynamicFormFieldService {
  submit$: Subject<any> = new Subject();

  toFormGroup(fields: XArcgisFormField<string>[]) {
    let group: any = {};

    fields.forEach((field) => {
      group[field.key] = field.required
        ? new FormControl(field.value || '', Validators.required)
        : new FormControl(field.value || '');
    });

    return new FormGroup(group);
  }

  createField(field: XArcgisFormField) {
    switch (field.controlType) {
      case 'input':
        return new XArcgisInputFormField(field);

      case 'checkbox':
        return new XArcgisCheckboxFormField(field);

      case 'radio':
        return new XArcgisRadioFormField(field);

      case 'select':
        return new XArcgisSelectFormField(field);

      case 'textarea':
        return new XArcgisTextareaFormField(field);

      default:
        return new XArcgisInputFormField(field);
    }
  }

  sort(field1: XArcgisFormField, field2: XArcgisFormField) {
    const { order: o1 } = field1;
    const { order: o2 } = field2;

    return o1 && o2 ? o1 - o2 : 0;
  }
}
