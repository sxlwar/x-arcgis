export type BasemapType = 'vector' | 'imagery' | 'streets' | 'streets-satellite' | 'hybrid' | 'osm' | 'satellite';

export type BasemapPublisher = 'google' | 'bing' | 'mapbox' | 'tianditu' | 'osm' | 'esri';

export interface BaseMapConfig {
  type: BasemapType;
  publisher: BasemapPublisher;
}

export const availableBaseMaps: Map<BasemapPublisher, BasemapType[]> = new Map([
  ['google', ['imagery']],
  ['bing', ['hybrid']],
  ['mapbox', ['streets', 'streets-satellite']],
  ['tianditu', ['imagery', 'vector']],
  ['osm', ['osm']],
  ['esri', ['satellite']],
]);
