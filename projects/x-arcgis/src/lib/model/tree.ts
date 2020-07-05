import { XArcgisFormField } from '../base/dynamic-form';
import { GeometryType } from './common';

export interface XArcgisTreeNode {
  id?: number;
  name: string;
  children?: XArcgisTreeNode[];
  fields?: XArcgisFormField[]; // form fields config for the form displayed in the sidenav;
  feature?: { 
    id?: string;
    geometryType?: GeometryType;
    graphicIds?: number[];
  };
}

export interface TreeNodeFeature {
  id: string;
  geometryType: string;
  graphicIds: number[];
  action: 'bind' | 'unbind';
}

export interface UpdateTreeNodeRequest {
  id: number;
  name?: string;
  children?: XArcgisTreeNode[];
  fields?: XArcgisFormField[];
  feature?: TreeNodeFeature;
  parentId?: number;
}

export type UpdateTreeNodeResponse = boolean;