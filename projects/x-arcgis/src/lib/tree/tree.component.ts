import { merge, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ArrayDataSource } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { XArcgisTreeNode } from '../model';
import { NodeOperation, SidenavService } from '../providers/sidenav.service';
import { StyleManagerService } from '../providers/style-manager.service';
import { deepSearchRecordFactory, searchCascadeNodes } from '../util';

@Component({
  selector: 'x-arcgis-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit, OnDestroy {
  @Input() set source(input: XArcgisTreeNode[]) {
    if (!!input && input.length) {
      this.setDataSource(input);
    }
  }

  get source() {
    return this._source;
  }

  @Input() sideNavTitle = '';

  private _source: XArcgisTreeNode[];

  treeControl = new NestedTreeControl<XArcgisTreeNode>((node) => node.children);

  dataSource: ArrayDataSource<XArcgisTreeNode>;

  hasChild = (_: number, node: XArcgisTreeNode) => !!node.children && node.children.length > 0;

  operation: NodeOperation;

  highlightNodeId: number;

  isBindIconDisplay: Observable<boolean>;

  subscription: Subscription;

  isDarkMode: Observable<boolean>;

  constructor(public sidenavService: SidenavService, private styleManagerService:StyleManagerService) {}

  ngOnInit(): void {
    this.isDarkMode = this.styleManagerService.isDarkMode.asObservable();

    this.isBindIconDisplay = this.sidenavService.showBindButton$.asObservable();

    const bind$$ = this.sidenavService.bindGraphicToNode().subscribe((responses) => {
      responses.forEach((res) => {
        const { nodeId, graphicIds, featureId, geometryType, success } = res;

        if (!success) {
          return;
        }

        const node = this.sidenavService.getNodeById(nodeId);

        if (!node.feature) {
          node.feature = {
            id: featureId,
            geometryType,
            graphicIds,
          };
        }

        if (!node.feature?.graphicIds) {
          node.feature.graphicIds = graphicIds;
        } else {
          node.feature.graphicIds = [...node.feature.graphicIds, ...graphicIds];
        }
      });
    });

    const unbind$$ = merge(this.sidenavService.unbindGraphicFromNode(), this.sidenavService.updateNodesAfterGraphicDeleted()).subscribe(
      (responses) => {
        responses.forEach((res) => {
          const { nodeId, graphicIds, success } = res;

          if (!success) {
            return;
          }

          const node = this.sidenavService.getNodeById(nodeId);

          node.feature.graphicIds = node.feature.graphicIds.filter((id) => !graphicIds.includes(id));
        });
      }
    );

    const link$$ = this.sidenavService.linkNodeObs.subscribe((opt) => {
      this.operation = opt;
    });

    const highlight$$ = this.sidenavService.highlightNode$
      .asObservable()
      .pipe(map((id) => Number(id)))
      .subscribe((id) => {
        this.highlightNodeId = id;

        if (!!id) {
          this.getCascadeNodes(id)
            .slice(0, -1)
            .forEach((node) => this.treeControl.expand(node));
        }
      });

    this.subscription = bind$$.add(unbind$$).add(link$$).add(highlight$$);
  }

  onNodeClick(node: XArcgisTreeNode): void {
    this.sidenavService.activeNode$.next(node);
  }

  onLinkClick(node: XArcgisTreeNode): void {
    this.sidenavService.linkNode$.next({ node, action: 'bind' });
  }

  onResetClick(node: XArcgisTreeNode): void {
    this.sidenavService.linkNode$.next({ node, action: 'reset' });
  }

  private setDataSource(input: XArcgisTreeNode[]): void {
    this.dataSource = new ArrayDataSource(input);
    this._source = input;
    this.sidenavService.treeNodeSourceData = input;
  }

  private getCascadeNodes(id: number): XArcgisTreeNode[] {
    const searchKey: keyof XArcgisTreeNode = 'children';
    const fn = (data: XArcgisTreeNode, id: number | string) => data?.id === id;
    const deepSearchRecordFn = deepSearchRecordFactory(fn, id, searchKey);
    const records = deepSearchRecordFn(this.source);

    return searchCascadeNodes(this.source, records, searchKey);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
