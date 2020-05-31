import { Observable } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Base } from '../base/base';
import { Address } from '../model';
import { CoordinateService } from './coordinate.service';

import esri = __esri;

@Injectable({ providedIn: 'root' })
export class XArcgisSearchService extends Base {
  modulePath = 'esri/widgets/Search';

  Point: esri.PointConstructor;

  view: esri.MapView;

  constructor(private http: HttpClient, private coordinateService: CoordinateService) {
    super();
  }

  /**
   * value: search value, usually from a input;
   * @returns Address list fuzzy matching the search value;
   */
  search(value: Observable<string>): Observable<Address[]> {
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

  private showPopup(address: string | HTMLElement | esri.Widget, point: esri.Point, view: esri.MapView) {
    view.popup.open({
      title: +Math.round(point.longitude * 100000) / 100000 + ',' + Math.round(point.latitude * 100000) / 100000,
      content: address,
      location: point,
    });
  }

  displayPopup(address: Address, view: esri.MapView) {
    const show = () => {
      const {
        name,
        location: { lat, lng },
      } = address;
      const { Point } = this;
      // TODO： 坐标转换？ 现在显示的和实际位置差异太大
      const [longitude, latitude] = this.coordinateService.bd2wgs(lng, lat);

      this.showPopup(name, new Point({ latitude, longitude }), view);
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
