import { XArcgisFormField } from '../base/dynamic-form';
import { GeometryType } from './common';

export interface XArcgisTreeNode {
  id?: number | string;
  name: string;
  children?: XArcgisTreeNode[];
  fields?: XArcgisFormField[]; // form fields config for the form displayed in the sidenav;
  graphic?: { 
    id?: string | number;
    type?: GeometryType;
  };
}