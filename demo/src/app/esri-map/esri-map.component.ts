import { iif, Observable, of, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Address, XArcgisSearchService } from '@x-arcgis';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss'],
})
export class EsriMapComponent implements OnInit, OnDestroy {
  geomType: any = '';

  listOfOption: Observable<Address[]>;

  search: FormControl = new FormControl('');

  search$: Subject<Address> = new Subject();

  constructor(private searchService: XArcgisSearchService) {}

  ngOnInit() {
    this.listOfOption = this.searchService.search(this.search.valueChanges as Observable<string>);
  }

  ngOnDestroy() {}

  switchGeom() {
    if (this.geomType != '') {
      // this.handleMapEditor();
    }
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
