import { valueof } from '../util';

import esri = __esri;

export type GeometryType = valueof<Pick<esri.FeatureLayerProperties, 'geometryType'>>;

export type SceneType = '2D' | '3D';

export type IWebComponents = { tagName: string; node: HTMLElement; listener: (...args: any[]) => any };

export interface IHandle {
  remove(): void;
}

export type IFeatureLayerEditsEvent = esri.FeatureLayerEditsEvent & { target: esri.FeatureLayer };

export interface ConfigOption {
  baseLayers: esri.FeatureLayerProperties[];
  nodeUpdateUrl: string;
}