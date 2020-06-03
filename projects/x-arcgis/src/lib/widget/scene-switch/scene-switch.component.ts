import { Component, OnInit } from '@angular/core';

import { SceneType } from '../../model';

@Component({
  selector: 'x-arcgis-scene-switch',
  templateUrl: './scene-switch.component.html',
  styleUrls: ['./scene-switch.component.scss'],
})
export class SceneSwitchComponent implements OnInit {
  sceneType: SceneType = '2D';

  ngOnInit(): void {}

  onClick() {
    this.sceneType = this.sceneType === '2D' ? '3D' : '2D';
  }
}
