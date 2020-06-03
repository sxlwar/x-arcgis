import { NzModalService } from 'ng-zorro-antd/modal';
import { iif, Observable, of, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Address, DrawService, SearchService, WidgetService, XArcgisWidgets } from '@x-arcgis';

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

  constructor(
    private searchService: SearchService,
    private drawService: DrawService,
    private widgetService: WidgetService,
    private modalService: NzModalService,
  ) {}

  ngOnInit() {
    this.listOfOption = this.searchService.getFuzzyMatchList(this.search.valueChanges as Observable<string>);

    this.drawService.setCloseNode(CloseComponent, (view) => {
      this.modalService.confirm({
        nzTitle: '<i>信息提示?</i>',
        nzContent: '<b>确定要退出编辑吗？</b>',
        nzOnOk: () => {
          this.drawService.destroyEditor(view);
        },
      });
    });
  }

  ngOnDestroy() {}

  addWidget(view: esri.MapView | esri.SceneView) {
    this.widgetService
      .getWidgets<esri.HomeConstructor>([XArcgisWidgets.HOME])
      .subscribe(([Home]) => {
        const homeWidget = new Home({ view });

        view.ui.add(homeWidget);

        view.ui.move(['zoom', homeWidget], 'top-left');
      });
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
}
