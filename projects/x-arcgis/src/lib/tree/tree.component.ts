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

  /**
   * bind button has two state: 
   * 1. bind - in this state we need to send the bind action to linkObs
   * 2. reset - in this state we need cancel binding.
   */
  action: string;

  constructor(public sidenavService: SidenavService) {}

  ngOnInit(): void {
    // update treeNodeSource (graphic field) after graphic bind to a node;
    this.sidenavService.bindGraphicToNode().subscribe((res) => {
      console.log('bind result: ', res);
      // TODO: update treeNodeSource after backend updated success;
    });

    // update treeNodeSource (graphic field) after graphic unbind from a node;
    this.sidenavService.unbindGraphicFromNode().subscribe((res) => {
      console.log('unbind result: ', res);
      // TODO: update treeNodeSource after backend updated success;
    });

    // update treeNodeSource (graphic field) after graphic deleted from the feature;
    this.sidenavService.updateNodesAfterGraphicDeleted().subscribe((res) => {
      console.log('deleted graphic and related node: ', res);
      // TODO: update treeNodeSource after backend updated success;
    });
  }

  onNodeClick(node: XArcgisTreeNode): void {
    this.sidenavService.activeNode$.next(node);
  }

  onLinkClick(node: XArcgisTreeNode): void {
    this.sidenavService.linkNode$.next({ node, action: 'bind' });
  }
}
