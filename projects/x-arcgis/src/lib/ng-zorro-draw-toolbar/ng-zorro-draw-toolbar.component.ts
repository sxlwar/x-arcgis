import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'x-arcgis-ng-zorro-draw-toolbar',
  templateUrl: './ng-zorro-draw-toolbar.component.html',
  styleUrls: ['./ng-zorro-draw-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class XArcgisNgZorroDrawToolbarComponent implements OnInit {
  @Input('control') draw: FormControl;

  constructor() { }

  ngOnInit(): void {
  }

}
