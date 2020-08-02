import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'x-arcgis-side-nav-switcher',
  templateUrl: './side-nav-switcher.component.html',
  styleUrls: ['./side-nav-switcher.component.scss'],
})
export class SideNavSwitcherComponent implements OnInit {
  @Input() isSideNavDisplay = true;

  constructor() {}

  ngOnInit(): void {}

  @HostBinding('style.right') get positionRight() {
    return this.isSideNavDisplay ? 0 : '-30px';
  }

  @HostBinding('style.transform') get hide() {
    return this.isSideNavDisplay ? 'rotateY(180deg)' : 'rotateY(0)';
  }
}
