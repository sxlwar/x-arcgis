import { Observable, Subscription } from 'rxjs';
import {
    debounceTime, distinctUntilKeyChanged, filter, map, switchMap, takeUntil, withLatestFrom
} from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Base } from '../base/base';
import { Address } from '../model';
import { CoordinateService } from './coordinate.service';
import { StoreService } from './store.service';

import esri = __esri;

export abstract class SearchBase extends Base {
  abstract handleSearch(source: Observable<Address>): Subscription;
}

@Injectable({ providedIn: 'root' })
export class SearchService extends SearchBase {
  Point: esri.PointConstructor;

  view: esri.MapView;

  isModulesLoaded = false;

  constructor(
    private http: HttpClient,
    private coordinateService: CoordinateService,
    private storeService: StoreService
  ) {
    super();
  }

  /**
   * handle the search event
   */
  handleSearch(searchObs: Observable<Address>): Subscription {
    return searchObs
      .pipe(
        filter((v) => !!v),
        distinctUntilKeyChanged('location'), // the key in Address interface;
        map((address) => {
          const { location } = address;

          return { center: this.coordinateService.bd2wgs(location.lng, location.lat), address };
        }),
        withLatestFrom(this.storeService.store.pipe(filter((v) => !!v)), (option, { esriMapView }) => ({
          ...option,
          esriMapView,
        })),
        takeUntil(this.storeService.destroy)
      )
      .subscribe((option) => {
        const { center, address, esriMapView } = option;

        esriMapView.goTo({ zoom: 16, center });

        this.displayPopup(address, esriMapView);
      });
  }

  /**
   * value: search value, usually from a input;
   * @returns Address list fuzzy matching the search value;
   */
  getFuzzyMatchList(value: Observable<string>): Observable<Address[]> {
    return value.pipe(
      debounceTime(200),
      switchMap((query) => {
        const url = `http://api.map.baidu.com/place/v2/suggestion?ak=fvKTtYr8qjLGxeYqm9yYnfzAA0slAHxM&query=${query}&region=全国&city_limit=false&output=json`;

        return this.http
          .jsonp(url, 'callback')
          .pipe(map((res: { msg: string; result: Address[]; code: number }) => res.result));
      })
    );
  }

  /**
   *  Display search result
   */
  private displayPopup(address: Address, view: esri.MapView) {
    const show = () => {
      const {
        name,
        location: { lat, lng },
      } = address;
      const { Point } = this;
      // TODO： 坐标转换？ 现在显示的和实际位置差异太大
      const [longitude, latitude] = this.coordinateService.bd2wgs(lng, lat);

      view.popup.open({
        title: '当前位置',
        content: name,
        location: new Point({ latitude, longitude }),
      });
    };

    if (this.Point) {
      show();
    } else {
      this.loadModulesObs<esri.PointConstructor>(['esri/geometry/Point']).subscribe((modules) => {
        const [Point] = modules;
        this.Point = Point;

        show();
      });
    }
  }
}
