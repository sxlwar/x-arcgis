import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { StyleManagerService } from '../providers/style-manager.service';

export interface XArcgisTheme {
  primary: string;
  accent: string;
  displayName: string;
  name: string;
  isDark: boolean;
  isDefault?: boolean;
}

@Component({
  selector: 'x-arcgis-theme-picker',
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.scss'],
})
export class ThemePickerComponent implements OnInit {

  @Output() themeChanged: EventEmitter<XArcgisTheme> = new EventEmitter();

  currentTheme: XArcgisTheme;

  // The below colors need to align with the themes defined in theme-picker.scss
  themes: XArcgisTheme[] = [
    { primary: '#242424', accent: '#adadad', displayName: '暗-默认', name: 'dark', isDark: true },
    { primary: '#242424', accent: '#69dcff', displayName: '暗-蓝', name: 'dark-blue', isDark: true },
    { primary: '#242424', accent: '#71de6e', displayName: '暗-绿', name: 'dark-green', isDark: true },
    { primary: '#242424', accent: '#b096ff', displayName: '暗-紫', name: 'dark-purple', isDark: true },
    { primary: '#242424', accent: '#ff642e', displayName: '暗-红', name: 'dark-red', isDark: true },
    { primary: '#ffffff', accent: '#ffffff', displayName: '亮-默认', name: 'light', isDark: false },
    { primary: '#ffffff', accent: '#aadbfa', displayName: '亮-蓝', name: 'light-blue', isDark: false, isDefault: true },
    { primary: '#ffffff', accent: '#b0e2b0', displayName: '亮-绿', name: 'light-green', isDark: false },
    { primary: '#ffffff', accent: '#daccff', displayName: '亮-紫', name: 'light-purple', isDark: false },
    { primary: '#ffffff', accent: '#e4a793', displayName: '亮-红', name: 'light-red', isDark: false },
  ];

  constructor(private styleManager: StyleManagerService) {
    // const themeName = localStorage.getItem('theme');
    // if (themeName) {
    //   this.selectTheme(themeName);
    // }
  }

  ngOnInit() {
    this.currentTheme = this.themes.find((item) => item.isDefault);
  }

  selectTheme(themeName: string): void {
    this.setTheme(themeName);
  }

  setTheme(themeName?: string): void | boolean {
    const theme = this.themes.find((currentTheme) => currentTheme.name === themeName);

    if (!theme) {
      return false;
    }

    this.currentTheme = theme;

    if (theme.isDefault) {
      this.styleManager.removeStyle('theme');
    } else {
      this.styleManager.setStyle('theme', `assets/themes/${theme.name}/main.css`);
    }

    if (this.currentTheme) {
      localStorage.setItem('theme', this.currentTheme.name);
    }

    this.themeChanged.next(this.currentTheme);
    this.styleManager.isDarkMode.next(this.currentTheme.isDark);
  }
}
