import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'x-arcgis-mat-draw-toolbar',
  templateUrl: './mat-draw-toolbar.component.html',
  styleUrls: ['./mat-draw-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class XArcgisMatDrawToolbarComponent implements OnInit {
  @Input('control') draw: FormControl;
  
  constructor() { }

  ngOnInit(): void {
  }

}
