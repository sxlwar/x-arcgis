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