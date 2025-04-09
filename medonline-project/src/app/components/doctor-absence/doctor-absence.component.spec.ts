import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorAbsenceComponent } from './doctor-absence.component';

describe('DoctorAbsenceComponent', () => {
  let component: DoctorAbsenceComponent;
  let fixture: ComponentFixture<DoctorAbsenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DoctorAbsenceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorAbsenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
