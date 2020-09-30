import esri = __esri;

export type FloorOperateType = keyof esri.FeatureLayerApplyEditsEdits;

export interface FloorOperateResult {
  success: boolean;
  type: FloorOperateType;
  response: any;
}
