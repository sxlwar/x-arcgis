import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneSwitchComponent } from './scene-switch.component';

describe('SceneSwitchComponent', () => {
  let component: SceneSwitchComponent;
  let fixture: ComponentFixture<SceneSwitchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SceneSwitchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SceneSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
