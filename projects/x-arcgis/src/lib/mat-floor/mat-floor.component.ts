import { StoreService } from '../providers/store.service';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { filter } from 'rxjs/operators';
import { FloorOperateResult, FloorOperateType } from '../model/floor';

import esri = __esri;

@Component({
  selector: 'x-arcgis-mat-floor',
  templateUrl: './mat-floor.component.html',
  styleUrls: ['./mat-floor.component.scss'],
})
export class XArcgisMatFloorComponent implements OnInit {
  /**
   * emit floor events, includes query, delete, update, etc.
   */
  @Output() floorOperated: EventEmitter<FloorOperateResult> = new EventEmitter();

  /**
   * floor names
   */
  @Input() floors: string[] = ['Z1'];

  /**
   * 需要更新的 arcgis-online 数据库中的字段
   *
   * 默认为更新 description 字段的值;
   */
  @Input() floorField: string = 'description';

  private view: esri.MapView;

  private map: esri.Map;

  private featureLayers: esri.Collection<esri.FeatureLayer> = null;

  private highlightSelected: esri.Handle = null;

  private featureSetWithLayer: { featureSet: esri.FeatureSet; layer: esri.FeatureLayer }[];

  private highlightLayerIndex = 0;

  private highlightFeatureIndex = 0;

  private pointCache: esri.Point;

  indexes: string[] = [];

  calculating = false;

  constructor(private storeService: StoreService) {}

  ngOnInit(): void {
    this.storeService.store
      .pipe(filter((data) => !!data && !!data.esriMap && !!data.esriMapView))
      .subscribe(({ esriMap, esriMapView }) => {
        this.view = esriMapView;
        this.map = esriMap;

        this.featureLayers = this.map.layers.filter(
          (layer) => layer.type === 'feature' && (<esri.FeatureLayer>layer).geometryType === 'polygon'
        ) as esri.Collection<esri.FeatureLayer>;

        this.view.on('click', (event) => {
          const point = this.view.toMap(event);

          this.pointCache = point;
          this.queryAllGraphics(point);
        });
      });
  }

  highlightNext() {
    this.updateIndexes(1);
    this.highlight();
  }

  highlightPre() {
    this.updateIndexes(-1);
    this.highlight();
  }

  addGraphic() {
    this.launchFloorOperate('addFeatures');
  }

  removeGraphic() {
    this.launchFloorOperate('deleteFeatures');
  }

  setFloor(floor: string) {
    this.launchFloorOperate('updateFeatures', floor);
  }

  private queryAllGraphics(point: esri.Point) {
    this.calculating = true;

    const featureSets = this.featureLayers
      .map(async (layer) => {
        const featureSet = await layer.queryFeatures({
          geometry: point,
          distance: 0.5,
          units: 'miles',
          spatialRelationship: 'intersects',
          returnGeometry: true,
          returnQueryGeometry: true,
          outFields: ['*'],
        });

        return !!featureSet.features.length ? { layer, featureSet } : null;
      })
      .filter((item) => !!item)
      .toArray();

    Promise.all(featureSets)
      .then((sets) => {
        this.featureSetWithLayer = sets.filter((item) => !!item);
        this.indexes = this.createIndexes();
        this.highlightLayerIndex = 0;
        this.highlightFeatureIndex = 0;

        if (this.featureSetWithLayer.length) {
          this.highlight();
        } else {
          if (this.highlightSelected) {
            this.highlightSelected.remove();
          }

          this.highlightSelected = null;
        }
      })
      .catch((err) => {
        console.error('Some error occurs during feature searching', err);
      })
      .finally(() => (this.calculating = false));
  }

  private highlight() {
    const { layer, featureSet } = this.featureSetWithLayer[this.highlightLayerIndex];

    this.view.whenLayerView(layer).then((layerView) => {
      if (this.highlightSelected) {
        this.highlightSelected.remove();
      }

      this.highlightSelected = layerView.highlight(featureSet.features[this.highlightFeatureIndex]);
    });
  }

  /**
   * 创建出feature索引,方便查找对应的图形,索引feature需要在所有的layer上的features里找，类似于做以下的映射。
   *
   * const data = [[1,2,3], [4,5], [6,7]];
   *
   * 建立索引：["00", "01", "02", "10", "11", "20", "21"]；
   * 则通过 11 可以索引到 4
   */
  private createIndexes(): string[] {
    return this.featureSetWithLayer
      .map((item, index) => item.featureSet.features.map((_, innerIndex) => this.createIndex(index, innerIndex)))
      .reduce((acc, cur) => [...acc, ...cur], []);
  }

  /**
   * 更新feature索引
   */
  private updateIndexes(step: 1 | -1): void {
    const current = this.createIndex(this.highlightLayerIndex, this.highlightFeatureIndex);
    const currentIndex = this.indexes.findIndex((item) => item === current);
    let result: string;

    if (step > 0) {
      result = currentIndex + 1 >= this.indexes.length ? '0-0' : this.indexes[currentIndex + 1];
    } else {
      result = currentIndex - 1 >= 0 ? this.indexes[currentIndex - 1] : this.indexes[this.indexes.length - 1];
    }

    const [layerIndex, graphicIndex] = result.split('-');

    this.highlightLayerIndex = Number(layerIndex);
    this.highlightFeatureIndex = Number(graphicIndex);
  }

  private createIndex(layerIndex: number, graphicIndex: number): string {
    return layerIndex + '-' + graphicIndex;
  }

  private launchFloorOperate(type: FloorOperateType, floor?: string): void {
    const target = this.featureSetWithLayer[this.highlightLayerIndex];
    const layer = target.layer;
    const highlightGraphic = target.featureSet.features[this.highlightFeatureIndex];

    if (floor) {
      highlightGraphic.setAttribute(this.floorField, floor);
    }

    const params: esri.FeatureLayerApplyEditsEdits = {
      [type]: [highlightGraphic],
    };
    this.calculating = true;

    layer
      .applyEdits(params)
      .then((results) => {
        this.floorOperated.emit({ type, response: results, success: true });
        this.queryAllGraphics(this.pointCache);
      })
      .catch((err) => {
        this.floorOperated.emit({ type, response: err, success: false });
        this.calculating = false;
      });
  }
}
