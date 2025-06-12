import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DoctorAbsenceComponent } from './doctor-absence.component';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

// Mocks
const mockAuthState = of({ uid: 'doctor123' });

const objectSpies: { [path: string]: any } = {};

const mockDatabase = {
  list: jasmine.createSpy().and.callFake((path: string) => ({
    valueChanges: () => {
      if (path.includes('absences')) {
        return of([
          { date: '2025-05-10', reason: 'Conference' },
          { date: '2025-05-12', reason: 'Sick leave' }
        ]);
      }
      if (path.includes('appointments')) {
        return of([
          {
            appointment_id: 'appt1',
            date: '2025-05-14',
            time: '10:00',
            doctorId: 'doctor123',
            patientId: 'patientA',
            status: 'scheduled',
            description: '',
            type: 'consultation'
          }
        ]);
      }
      return of([]);
    }
  })),
  object: jasmine.createSpy().and.callFake((path: string) => {
    if (!objectSpies[path]) {
      objectSpies[path] = {
        set: jasmine.createSpy('set'),
        remove: jasmine.createSpy('remove').and.returnValue(Promise.resolve())
      };
    }
    return objectSpies[path];
  }),
  createPushId: () => 'mockAbsenceId'
};


const mockAuth = {
  authState: mockAuthState
};

describe('DoctorAbsenceComponent', () => {
  let component: DoctorAbsenceComponent;
  let fixture: ComponentFixture<DoctorAbsenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DoctorAbsenceComponent],
      imports: [
        FormsModule,
      ],
      providers: [
        { provide: AngularFireDatabase, useValue: mockDatabase },
        { provide: AngularFireAuth, useValue: mockAuth }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorAbsenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and load initial data', () => {
    expect(component).toBeTruthy();
    expect(component.userId).toEqual('doctor123');
    expect(component.absences.length).toBe(2);
    expect(component.appointments.length).toBe(1);
  });

  it('should add a new absence when there is no conflict', () => {
    component.newAbsence = { date: '2025-05-11', reason: 'Holiday' };

    spyOn(component, 'isAbsenceConflict').and.returnValue(false);
    component.addAbsence();

    expect(mockDatabase.object).toHaveBeenCalledWith('users/doctor123/absences/mockAbsenceId');
    expect(mockDatabase.object('users/doctor123/absences/mockAbsenceId').set).toHaveBeenCalledWith({
      date: '2025-05-11',
      reason: 'Holiday',
      key: 'mockAbsenceId'
    });
  });

  it('should NOT add an absence if there is a conflict', () => {
    component.newAbsence = { date: '2025-05-14', reason: 'Vacation' };

    spyOn(window, 'alert');
    const result = component.addAbsence();
    expect(window.alert).toHaveBeenCalledWith('Konflikt z zaplanowaną dostępnością lub istniejącymi wizytami! Konsultacje zostały odwołane.');
  });

  it('should detect a conflict and remove conflicting appointments', fakeAsync(() => {
    const conflict = component.isAbsenceConflict('2025-05-14');
    tick();

    expect(conflict).toBeTrue();
    expect(mockDatabase.object).toHaveBeenCalledWith('users/patientA/appointments/appt1');
    expect(mockDatabase.object('users/patientA/appointments/appt1').remove).toHaveBeenCalled();
    expect(mockDatabase.object).toHaveBeenCalledWith('users/doctor123/appointments/appt1');
    expect(mockDatabase.object('users/doctor123/appointments/appt1').remove).toHaveBeenCalled();
  }));

  it('should return false when there is no conflict', () => {
    const conflict = component.isAbsenceConflict('2025-05-20');
    expect(conflict).toBeFalse();
  });

  it('should delete an absence', fakeAsync(() => {
    component.deleteAbsence('mockAbsenceId');
    tick();

    expect(mockDatabase.object).toHaveBeenCalledWith('users/doctor123/absences/mockAbsenceId');
    expect(mockDatabase.object('users/doctor123/absences/mockAbsenceId').remove).toHaveBeenCalled();
  }));

  it('should reset absence form', () => {
    component.newAbsence = { date: '2025-05-15', reason: 'Test', key: 'x' };
    component.resetAbsenceForm();
    expect(component.newAbsence).toEqual({ date: '', reason: '' });
  });
});
