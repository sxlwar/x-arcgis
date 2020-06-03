import { valueof } from '../util';

import esri = __esri;

export type GeometryType = valueof<Pick<esri.FeatureLayerProperties, 'geometryType'>>;

export type SceneType = '2D' | '3D';

export type IWebComponents = { tagName: string; node: HTMLElement; listener: (...args: any[]) => any };
