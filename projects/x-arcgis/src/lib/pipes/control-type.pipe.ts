import { Pipe, PipeTransform } from '@angular/core';

import { XArcgisFormFieldType } from '../base/dynamic-form';

@Pipe({
  name: 'controlType',
})
export class ControlTypePipe implements PipeTransform {
  transform(value: XArcgisFormFieldType): string {
    const labels = {
      input: '文本框',
      select: '下拉列表',
      radio: '单选',
      checkbox: '多选',
      textarea: '多行文本',
    };

    return labels[value];
  }
}
