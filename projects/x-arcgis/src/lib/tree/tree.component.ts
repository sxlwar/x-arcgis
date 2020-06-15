import { ArrayDataSource } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';

import { XArcgisTreeNode } from '../model';
import { SidenavService } from '../providers/sidenav.service';

@Component({
  selector: 'x-arcgis-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit {
  treeControl = new NestedTreeControl<XArcgisTreeNode>((node) => node.children);

  @Input() set source(input: XArcgisTreeNode[]) {
    if (!!input && input.length) {
      this.dataSource = new ArrayDataSource(input);
      this._source = input;
    }
  }

  get source() {
    return this._source;
  }

  private _source: XArcgisTreeNode[];

  dataSource: ArrayDataSource<XArcgisTreeNode>;

  hasChild = (_: number, node: XArcgisTreeNode) => !!node.children && node.children.length > 0;

  constructor(public sidenavService: SidenavService) {}

  ngOnInit(): void {}

  onNodeClick(node: XArcgisTreeNode): void {
    this.sidenavService.activeNode$.next(node);
  }
}
