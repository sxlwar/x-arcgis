import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import {
    XArcgisFormField, XArcgisFormFieldType, XArcgisFormOption, XArcgisInputFormField
} from '../base/dynamic-form';
import { XArcgisTreeNode } from '../model';
import { SidenavService } from '../providers/sidenav.service';
import { fieldKeyReg } from '../validators';

interface RowData extends XArcgisFormField {
  editing: boolean;
}

@Component({
  selector: 'x-arcgis-form-edit',
  templateUrl: './form-edit.component.html',
  styleUrls: ['./form-edit.component.scss'],
})
export class FormEditComponent implements OnInit {
  dataSource: RowData[];

  displayedColumns: string[] = [
    'position',
    'label',
    'key',
    'defaultValue',
    'isRequired',
    'order',
    'controlType',
    'options',
    'operation',
  ];
  snackbarConfig: MatSnackBarConfig = { duration: 3000, verticalPosition: 'top' };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: XArcgisTreeNode,
    public dialogRef: MatDialogRef<FormEditComponent>,
    private snackbar: MatSnackBar,
    private sidenavService: SidenavService
  ) {}

  ngOnInit(): void {
    this.dataSource = this.data.fields.map((item) => ({ ...item, editing: false }));
  }

  editComplete(target: RowData) {
    const { label, key, controlType, options } = target;
    const isLabelValid = !!label;
    const isKeyValid = !!key && fieldKeyReg.test(key);
    const isControlTypeAndOptionsValid = this.isControlTypeAndOptionsValid(controlType, options);

    if (!isLabelValid) {
      this.snackbar.open('请输入正确的名称', '', this.snackbarConfig);
      return;
    }

    if (!isKeyValid) {
      this.snackbar.open('请输入正确的键名', '', this.snackbarConfig);
      return;
    }

    if (!isControlTypeAndOptionsValid) {
      this.snackbar.open('请设置正确的控件类型和选项', '', this.snackbarConfig);
      return;
    }

    target.editing = false;
  }

  private isControlTypeAndOptionsValid(type: XArcgisFormFieldType, options: XArcgisFormOption[]): boolean {
    const optionTypes: XArcgisFormFieldType[] = ['radio', 'checkbox', 'select'];

    return (
      !optionTypes.includes(type) ||
      options.every(({ label, value }) => {
        const isLabelValid = !!label && label.length >= 1 && label.length <= 20;
        const isValueValid = !!value && value >= 0 && value <= 50;
        return isLabelValid && isValueValid;
      })
    );
  }

  add(): void {
    this.dataSource = [...this.dataSource, { ...new XArcgisInputFormField(), editing: true }];
  }

  remove(index: number) {
    this.dataSource = this.dataSource.filter((_, idx) => idx !== index);
  }

  removeOption(idx: number, source: XArcgisFormField): void {
    if (source.options.length > 1) {
      source.options = source.options.filter((_, index) => index !== idx);
    }
  }

  addOption(source: XArcgisFormField): void {
    source.options = [...source.options, { label: '', value: null }];
  }

  getOptions(source: XArcgisFormField): XArcgisFormOption[] {
    if (!source.options) {
      source.options = [{ label: '', value: null }];
    }

    return source.options;
  }

  confirm(): void {
    if (this.dataSource.some((item) => item.editing)) {
      this.snackbar.open('无法保存，当前表格中有行处于编辑状态', '', this.snackbarConfig);
      return;
    }

    const fields = this.dataSource.map((item) => {
      const res = { ...item };

      delete res.editing;

      return res;
    });

    this.sidenavService.updateNodeFields({ id: this.data.id, fields: fields }).subscribe((success) => {
      if (success) {
        this.dialogRef.close(fields);
      } else {
        this.snackbar.open('更新失败，请稍候再试！', '', this.snackbarConfig);
      }
    });
  }
}
