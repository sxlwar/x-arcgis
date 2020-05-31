export interface ILocation {
  lat: number;
  lng: number;
}

export interface Address {
  name: string;
  location: ILocation;
  uid: string;
  province: string;
  city: string;
  district: string;
  business: string;
  cityid: string;
  adcode: string;
}
