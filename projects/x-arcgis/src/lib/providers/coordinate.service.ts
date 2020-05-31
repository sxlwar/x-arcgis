import { Injectable } from '@angular/core';

const a = 6378245.0;
const f = 1 / 298.3;
const b = a * (1 - f);
const ee = 1 - (b * b) / (a * a);

export type Coordinate = [number, number];

@Injectable({ providedIn: 'root' })
export class CoordinateService {
  constructor() {}

  outOfChina(lng: number, lat: number): boolean {
    return 72.004 <= lng && lng <= 137.8347 && 0.8293 <= lat && lat <= 55.8271;
  }

  transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));

    ret = ret + ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
    ret = ret + ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
    ret = ret + ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320.0 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;

    return ret;
  }

  transformLon(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));

    ret = ret + ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
    ret = ret + ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
    ret = ret + ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x * Math.PI) / 30.0)) * 2.0) / 3.0;

    return ret;
  }

  wgs2gcj(wgsLon: number, wgsLat: number): Coordinate {
    if (this.outOfChina(wgsLon, wgsLat)) {
      return [wgsLon, wgsLat];
    }

    let dLat = this.transformLat(wgsLon - 105.0, wgsLat - 35.0);
    let dLon = this.transformLon(wgsLon - 105.0, wgsLat - 35.0);
    const radLat = (wgsLat / 180.0) * Math.PI;
    let magic = Math.sin(radLat);

    magic = 1 - ee * magic * magic;

    let sqrtMagic = Math.sqrt(magic);

    dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
    dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);

    const gcjLat = wgsLat + dLat;
    const gcjLon = wgsLon + dLon;

    return [gcjLon, gcjLat];
  }

  gcj2wgs(gcjLon: number, gcjLat: number): Coordinate {
    const g0 = [gcjLon, gcjLat];
    let w0 = g0;
    let g1 = this.wgs2gcj(w0[0], w0[1]);

    let arr = [
      [w0[0], g1[0], g0[0]],
      [w0[1], g1[1], g0[1]],
    ];
    let w1 = [arr[0][0] - (arr[0][1] - arr[0][2]), arr[1][0] - (arr[1][1] - arr[1][2])] as Coordinate;
    let arr2 = [
      [w1[0], w0[0]],
      [w1[1], w0[1]],
    ];
    let delta = [arr2[0][0] - arr2[0][1], arr2[1][0] - arr2[1][1]];
    while (Math.abs(delta[0]) >= 1e-6 || Math.abs(delta[1]) >= 1e-6) {
      w0 = w1;
      g1 = this.wgs2gcj(w0[0], w0[1]);

      arr = [
        [w0[0], g1[0], g0[0]],
        [w0[1], g1[1], g0[1]],
      ];
      w1 = [arr[0][0] - (arr[0][1] - arr[0][2]), arr[1][0] - (arr[1][1] - arr[1][2])];
      arr2 = [
        [w1[0], w0[0]],
        [w1[1], w0[1]],
      ];
      delta = [arr2[0][0] - arr2[0][1], arr2[1][0] - arr2[1][1]];
    }

    return w1;
  }

  gcj2bd(gcjLon: number, gcjLat: number): Coordinate {
    const z = Math.sqrt(gcjLon * gcjLon + gcjLat * gcjLat) + 0.00002 * Math.sin((gcjLat * Math.PI * 3000.0) / 180.0);
    const theta = Math.atan2(gcjLat, gcjLon) + 0.000003 * Math.cos((gcjLon * Math.PI * 3000.0) / 180.0);
    const bdLon = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;

    return [bdLon, bdLat];
  }

  bd2gcj(bdLon: number, bdLat: number): Coordinate {
    const x = bdLon - 0.0065;
    const y = bdLat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin((y * Math.PI * 3000.0) / 180.0);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos((x * Math.PI * 3000.0) / 180.0);
    const gcjLon = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);

    return [gcjLon, gcjLat];
  }

  wgs2bd(wgsLon: number, wgsLat: number): Coordinate {
    const gcj = this.wgs2gcj(wgsLon, wgsLat);

    return this.gcj2bd(gcj[0], gcj[1]);
  }

  bd2wgs(bdLon: number, bdLat: number): Coordinate {
    const gcj = this.bd2gcj(bdLon, bdLat);

    return this.gcj2wgs(gcj[0], gcj[1]);
  }
}
