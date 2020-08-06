import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { ApiService } from './providers/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('mask', [
      transition(':enter', [style({ opacity: 0 }), animate('1s', style({ opacity: 1 }))]),
      transition(':leave', [animate('1s', style({ opacity: 0 }))]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  title = '鑫安云数据可视化平台';

  @ViewChild('loginTpl') loginTpl: TemplateRef<any>;

  @ViewChild('overlayTpl') overlayTpl: TemplateRef<any>;

  form: FormGroup;

  dialogRef: MatDialogRef<TemplateRef<any>>;

  constructor(
    private dialog: MatDialog,
    private formBuilder: FormBuilder,
    private snackbar: MatSnackBar,
    private titleService: Title,
    public apiService: ApiService
  ) {}

  ngOnInit() {
    this.titleService.setTitle(this.title);
    this.initForm();
  }

  initForm() {
    this.form = this.formBuilder.group({
      account: '',
      password: '',
    });
  }

  openLoginDialog() {
    this.dialogRef = this.dialog.open(this.loginTpl, { width: '400px', height: 'max-content' });
  }

  login() {
    const isAuthPassed = this.apiService.auth(this.form.value);

    if (isAuthPassed) {
      this.dialogRef.close();
    } else {
      this.snackbar.open('登录失败请检查帐号密码!', '', { duration: 3000, verticalPosition: 'top' });
    }
  }

  get account(): AbstractControl {
    return this.form.get('account');
  }

  get password(): AbstractControl {
    return this.form.get('password');
  }
}
