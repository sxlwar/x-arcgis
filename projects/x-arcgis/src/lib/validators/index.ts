import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

export const fieldKeyReg = /^[a-z][a-zA-Z\d]{1,14}$/;

function fieldKeyValidator(control: AbstractControl): { [key: string]: any } | null {
  return fieldKeyReg.test(control.value)
    ? null
    : { format: { hint: '必须以小写字母开头，由大小写字母及下划线组成，长度为2-15个字符' } };
}

@Directive({
  selector: '[fieldKey]',
  providers: [{ provide: NG_VALIDATORS, useExisting: FieldKeyValidatorDirective, multi: true }],
})
export class FieldKeyValidatorDirective implements Validator {
  constructor() {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    return fieldKeyValidator(control);
  }
}
