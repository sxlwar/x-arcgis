import { XArcgisFormField } from '../base/dynamic-form';

export interface XArcgisTreeNode {
  id?: number;
  name: string;
  children?: XArcgisTreeNode[];
  fields?: XArcgisFormField[]
  [key: string]: any;
}