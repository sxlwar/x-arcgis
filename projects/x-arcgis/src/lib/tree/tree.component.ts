import { merge } from 'rxjs';
import { filter, map, mapTo, switchMap } from 'rxjs/operators';

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
  @Input() set source(input: XArcgisTreeNode[]) {
    if (!!input && input.length) {
      this.dataSource = new ArrayDataSource(input);
      this._source = input;
      this.sidenavService.treeNodeSourceData = input;
    }
  }

  get source() {
    return this._source;
  }

  private _source: XArcgisTreeNode[];

  treeControl = new NestedTreeControl<XArcgisTreeNode>((node) => node.children);

  dataSource: ArrayDataSource<XArcgisTreeNode>;

  hasChild = (_: number, node: XArcgisTreeNode) => !!node.children && node.children.length > 0;

  constructor(public sidenavService: SidenavService) {}

  ngOnInit(): void {
    // update treeNodeSource (graphic field) after graphic bind or unbind to a node;
    this.sidenavService
      .combineNodeAndGraphic()
      .pipe(
        map((info) =>
          this.sidenavService.getBoundRequestParams(info).filter((item) => !!item.graphicIds && item.graphicIds.length)
        ),
        filter((params) => !!params.length),
        switchMap((params) => merge(...params.map((param) => this.sidenavService.launchBoundRequest(param))))
      )
      .subscribe((res) => {
        console.log('bind result: ', res);
      });

    // update treeNodeSource (graphic field) after graphic deleted from the feature;
    this.sidenavService
      .updateGraphicsAfterDeleted()
      .pipe(switchMap((data) => this.sidenavService.launchDeleteRequest(data.map((item) => item.id)).pipe(mapTo(data))))
      .subscribe((res) => {
        console.log('deleted graphic and related node: ', res);
        // TODO: update treeNodeSource after backend updated success;
      });
  }

  onNodeClick(node: XArcgisTreeNode): void {
    this.sidenavService.activeNode$.next(node);
  }

  onLinkClick(node: XArcgisTreeNode): void {
    this.sidenavService.linkNode$.next(node);
  }
}
