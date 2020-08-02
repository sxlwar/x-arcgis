import { NzModalService } from 'ng-zorro-antd/modal';
import { iif, Observable, of, Subject } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';

// import {
//     Address, BaseMapConfig, DrawService, SearchService, WidgetService, XArcgisWidgets
// } from 'x-arcgis';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
    Address, BaseMapConfig, DrawService, GeometryType, SceneType, SearchService, WidgetService,
    XArcgisTreeNode
} from '@x-arcgis';

import {
    WebComponentService
} from '../../../../projects/x-arcgis/src/lib/providers/web-component.service';
import { ApiService } from '../providers/api.service';

import esri = __esri;
@Component({
  selector: 'close-icon',
  template: '<i nz-icon nzType="close" nzTheme="outline" (click)="onClick()"></i>',
  styles: [
    `
      :host {
        cursor: pointer;
      }
    `,
  ],
})
export class CloseComponent {
  onClick() {
    console.log('close icon clicked');
  }
}

export interface BaseMap extends BaseMapConfig {
  label: string;
  image: string;
}

const basemapList: BaseMap[] = [
  {
    label: '谷歌影像',
    image: 'google_imagery.jpg',
    type: 'imagery',
    publisher: 'google',
  },
  {
    label: '天地图影像',
    image: 'tianditu_imagery.jpg',
    type: 'imagery',
    publisher: 'tianditu',
  },
  {
    label: '天地图矢量',
    image: 'tianditu_vector.jpg',
    type: 'vector',
    publisher: 'tianditu',
  },
  {
    label: 'ESRI影像',
    image: 'esri_imagery.jpg',
    type: 'satellite',
    publisher: 'esri',
  },
  {
    label: 'OSM',
    image: 'osm.jpg',
    type: 'osm',
    publisher: 'osm',
  },
  {
    label: 'Mapbox矢量',
    image: 'mapbox_vector.jpg',
    type: 'streets',
    publisher: 'mapbox',
  },
  {
    label: 'Mapbox影像',
    image: 'mapbox_imagery.jpg',
    type: 'streets-satellite',
    publisher: 'mapbox',
  },
  {
    label: '必应影像',
    image: 'bing_imagery.jpg',
    type: 'hybrid',
    publisher: 'bing',
  },
];

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss'],
})
export class EsriMapComponent implements OnInit, OnDestroy {
  listOfOption: Observable<Address[]>;

  search: FormControl = new FormControl('');

  draw: FormControl = new FormControl('');

  search$: Subject<Address> = new Subject();

  basemapList = basemapList;

  activeBaseMap: BaseMap = basemapList[0];

  basemapObs$: Subject<BaseMapConfig> = new Subject();

  basemapObs: Observable<BaseMapConfig>;

  sceneType: SceneType = '2D';

  treeSource: Observable<XArcgisTreeNode[]>;

  bounce: any;

  constructor(
    private searchService: SearchService,
    private drawService: DrawService,
    private widgetService: WidgetService,
    private modalService: NzModalService,
    private webComponentService: WebComponentService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.treeSource = this.apiService.getTreeNodes();

    this.basemapObs = this.basemapObs$.asObservable().pipe(startWith(this.activeBaseMap));

    this.listOfOption = this.searchService.getFuzzyMatchList(this.search.valueChanges as Observable<string>);

    this.webComponentService.setCloseNode(CloseComponent, (view, editor) => (event) => {
      this.modalService.confirm({
        nzTitle: '<i>信息提示?</i>',
        nzContent: '<b>确定要退出编辑吗？</b>',
        nzOnOk: () => {
          this.drawService.destroyEditor(view, editor);
          this.draw.setValue(null);
        },
      });
    });
  }

  switchBasemap(config: BaseMap): void {
    this.activeBaseMap = config;
    this.basemapObs$.next(config);
  }

  addWidget(view: esri.MapView | esri.SceneView) {
    // do something after view initialization
  }

  handleSearch(option: Address) {
    iif(
      () => !!option,
      of(option),
      this.listOfOption.pipe(
        take(1),
        map((options) => options.find((option) => option.name === this.search.value))
      )
    ).subscribe((option) => this.search$.next(option));
  }

  onSidenavFormSubmit(event: any) {
    console.log('Receive side nav submit', event);
  }

  onDraw(event: GeometryType): void {
    if (event !== this.draw.value) {
      this.draw.setValue(event);
    }
  }

  ngOnDestroy() {}
}
