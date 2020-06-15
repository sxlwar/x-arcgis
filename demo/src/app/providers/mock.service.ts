import { Observable, of } from 'rxjs';

import { Injectable } from '@angular/core';
import { XArcgisTreeNode } from '@x-arcgis';

const TREE_DATA: XArcgisTreeNode[] = [
  {
    name: '厂区位置',
    fields: [
      {
        label: '名称',
        key: 'name',
        controlType: 'input',
        order: 1,
      },
      {
        label: '区域',
        key: 'area',
        controlType: 'select',
        options: [
          { value: 'west', label: 'w' },
          { value: 'east', label: 'e' },
        ],
        order: 2,
      },
      {
        label: '描述',
        key: 'des',
        controlType: 'textarea',
        order: 9,
      },
      {
        label: '节点类型',
        key: 'nodeType',
        controlType: 'radio',
        options: [
          { label: '隐患', value: 1 },
          { label: '风险', value: 2 },
          { label: '其它', value: 3 },
        ],
        order: 3,
      },
      {
        label: '节点属性',
        key: 'nodeAttr',
        controlType: 'checkbox',
        options: [
          { label: '餐厅', value: 1 },
          { label: '建筑', value: 2 },
          { label: '公共', value: 3 },
          { label: '局部范围', value: 4 },
        ],
        order: 3,
      },
    ],
    children: [
      { name: '子公司1' },
      { name: '子公司2', fields: [{ label: '员工人数', key: 'memberCount', controlType: 'input', type: 'number' }] },
      { name: '公司总部' },
    ],
  },
  {
    name: '办公楼',
    children: [
      {
        name: '1#楼',
        children: [{ name: '1单元' }, { name: '2单元' }],
      },
      {
        name: '2#楼',
        children: [{ name: '1单元' }, { name: '2单元', children: [{ name: '18楼' }] }],
      },
    ],
    fields: [
      {
        label: '地址',
        key: 'address',
        controlType: 'input',
        value: '河南省郑州市XX区',
        order: 1,
      },
      {
        label: '楼栋号',
        key: 'buildingNumber',
        controlType: 'select',
        value: 3,
        options: [
          { value: 1, label: '1#楼' },
          { value: 2, label: '2#楼' },
          { value: 3, label: '3#楼' },
          { value: 4, label: '4#楼' },
          { value: 5, label: '5#楼' },
        ],
        order: 2,
      },
      {
        label: '描述',
        key: 'des',
        controlType: 'textarea',
        order: 9,
        value: '这个办公地址很恶心',
      },
      {
        label: '产权',
        key: 'isOwn',
        controlType: 'radio',
        options: [
          { label: '自有', value: 1 },
          { label: '租赁', value: 2 },
          { label: '第三方提供', value: 3 },
        ],
        order: 3,
        value: 2,
      },
      {
        label: '周边',
        key: 'Surrounding',
        controlType: 'checkbox',
        options: [
          { label: '近地铁口', value: 1 },
          { label: '有公交', value: 2 },
          { label: '处于商业中心', value: 3 },
          { label: '方便停车', value: 4 },
        ],
        order: 3,
        value: [1, 2, 3, 4],
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class MockService {
  constructor() {}

  getTree(): Observable<XArcgisTreeNode[]> {
    return of(TREE_DATA);
  }
}
