import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { XArcgisFormField } from '../base/dynamic-form';
import { FormEditComponent } from '../form-edit/form-edit.component';
import { XArcgisTreeNode } from '../model';
import { DynamicFormFieldService } from '../providers/dynamic-form.service';
import { SidenavService } from '../providers/sidenav.service';

@Component({
  selector: 'x-arcgis-tree-form',
  templateUrl: './tree-form.component.html',
  styleUrls: ['./tree-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeFormComponent implements OnInit {
  fields: Observable<XArcgisFormField[]>;

  constructor(
    private formService: DynamicFormFieldService,
    public sidenavService: SidenavService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.fields = this.sidenavService.activeNodeObs.pipe(
      filter((node) => !!node && !!node.fields),
      map((node: XArcgisTreeNode) =>
        node.fields.map((field) => this.formService.createField(field)).sort(this.formService.sort)
      )
    );
  }

  editFields(node: XArcgisTreeNode): void {
    this.dialog
      .open(FormEditComponent, { data: node, width: '70vw' })
      .afterClosed()
      .subscribe((data) => {
        console.log(data);
      });
  }
}
