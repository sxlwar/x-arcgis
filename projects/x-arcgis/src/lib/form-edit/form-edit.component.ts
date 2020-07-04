import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { XArcgisFormField, XArcgisFormOption, XArcgisInputFormField } from '../base/dynamic-form';
import { XArcgisTreeNode } from '../model';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: XArcgisTreeNode,
    public dialogRef: MatDialogRef<FormEditComponent>
  ) {}

  ngOnInit(): void {
    console.log(this.data);
    this.dataSource = this.data.fields.map((item) => ({ ...item, editing: false }));
  }

  edit(index: number) {
    this.dataSource[index].editing = !this.dataSource[index].editing;
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
    const data = this.dataSource.map((item) => {
      const res = { ...item };

      delete res.editing;

      return res;
    });

    this.dialogRef.close(data);
  }
}
