import { merge, Observable, Subject } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';

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

  modified$: Subject<XArcgisFormField[]> = new Subject();

  constructor(
    private formService: DynamicFormFieldService,
    public sidenavService: SidenavService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.fields = merge(
      this.sidenavService.activeNodeObs.pipe(
        filter((node) => !!node && !!node.fields),
        map((node: XArcgisTreeNode) => node.fields)
      ),
      this.modified$.asObservable()
    ).pipe(map((fields) => fields.map((field) => this.formService.createField(field)).sort(this.formService.sort)));
  }

  editFields(node: XArcgisTreeNode): void {
    this.dialog
      .open(FormEditComponent, { data: node, width: '70vw' })
      .afterClosed()
      .pipe(withLatestFrom(this.sidenavService.activeNode$))
      .subscribe(([fields, node]) => {
        if (!!fields) {
          node.fields = fields;
          this.modified$.next(fields);
        }
      });
  }
}
