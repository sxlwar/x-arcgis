import { takeWhile } from 'rxjs/operators';

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { XArcgisTreeNode } from '../model';
import { DynamicFormFieldService } from '../providers/dynamic-form.service';
import { SidenavService } from '../providers/sidenav.service';

@Component({
  selector: 'x-arcgis-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  @Input('treeSource') dataSource: XArcgisTreeNode[];

  @Input() sideNavTitle = '';

  @Output() save: EventEmitter<any> = new EventEmitter();

  activeNode: XArcgisTreeNode;

  isAlive = true;

  constructor(public sidenavService: SidenavService, private formService: DynamicFormFieldService) {}

  ngOnInit(): void {
    this.formService.submit$.pipe(takeWhile(() => this.isAlive)).subscribe(this.save);

    this.sidenavService.activeNodeObs.pipe(takeWhile(() => this.isAlive)).subscribe((node) => {
      this.activeNode = node;
    });
  }

  ngOnDestroy() {
    this.isAlive = false;
  }
}
