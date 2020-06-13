import { ArrayDataSource } from '@angular/cdk/collections';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';

/**
 * Food data with nested structure.
 * Each node has a name and an optiona list of children.
 */
interface XArcgisTreeNode {
  id?: number;
  name: string;
  children?: XArcgisTreeNode[];
  [key: string]: any;
}

const TREE_DATA: XArcgisTreeNode[] = [
  {
    name: '厂区位置',
    children: [{ name: '子公司1' }, { name: '子公司2' }, { name: '公司总部' }],
  },
  {
    name: '办公楼',
    children: [
      {
        name: '1号楼',
        children: [{ name: '1单元' }, { name: '2单元' }],
      },
      {
        name: '2号楼',
        children: [{ name: '1单元' }, { name: '2单元' }],
      },
    ],
  },
];

@Component({
  selector: 'x-arcgis-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent implements OnInit {
  treeControl = new NestedTreeControl<XArcgisTreeNode>((node) => node.children);
  dataSource = new ArrayDataSource(TREE_DATA);

  hasChild = (_: number, node: XArcgisTreeNode) => !!node.children && node.children.length > 0;

  constructor() {}

  ngOnInit(): void {}
}
