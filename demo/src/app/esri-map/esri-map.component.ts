import { iif, Observable, of, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Address, SearchService } from '@x-arcgis';

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
  ) {}

  ngOnInit() {
    this.listOfOption = this.searchService.getFuzzyMatchList(this.search.valueChanges as Observable<string>);
  }

  ngOnDestroy() {}

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
