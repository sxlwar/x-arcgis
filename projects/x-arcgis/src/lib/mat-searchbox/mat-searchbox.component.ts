import { Observable } from 'rxjs';

import {
    ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Address } from '../model';

@Component({
  selector: 'x-arcgis-mat-searchbox',
  templateUrl: './mat-searchbox.component.html',
  styleUrls: ['./mat-searchbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XArcgisMatSearchboxComponent implements OnInit {
  @Input('control') search: FormControl;

  @Input('options') listOfOption: Observable<Address>;

  @Output() onSearch: EventEmitter<Address> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

}
