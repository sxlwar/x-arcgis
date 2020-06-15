import { Observable } from 'rxjs';

import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { XArcgisFormField } from '../base/dynamic-form';
import { DynamicFormFieldService } from '../providers/dynamic-form.service';

@Component({
  selector: 'x-arcgis-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})
export class DynamicFormComponent implements OnInit {
  @Input() fields: Observable<XArcgisFormField<string>[]>;

  form: FormGroup;

  constructor(private formService: DynamicFormFieldService) {}

  ngOnInit() {
    this.fields.subscribe((fields) => {
      this.form = this.formService.toFormGroup(fields);
    });
  }

  onSubmit() {
    const result = this.form.getRawValue();

    this.formService.submit$.next(result);
  }
}
