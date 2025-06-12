import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorCalendarComponent } from './doctor-calendar.component';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of } from 'rxjs';

describe('DoctorCalendarComponent', () => {
  let component: DoctorCalendarComponent;
  let fixture: ComponentFixture<DoctorCalendarComponent>;
  let mockFirebaseService: any;
  let mockAngularFireAuth: any;

  beforeEach(async () => {
    mockFirebaseService = {
      getAppointments: jasmine.createSpy().and.returnValue(of([
        { date: '2025-05-20', time: '10:00', type: 'regular', description: 'Checkup' }
      ])),
      getAbsences: jasmine.createSpy().and.returnValue(of([
        { date: '2025-05-21', reason: 'Vacation' }
      ])),
      getAvailability: jasmine.createSpy().and.returnValue(of([
        {
          type: 'cyclic',
          daysOfWeek: ['Tuesday'],
          timeSlots: [{ startTime: '08:00', endTime: '15:00' }]
        }
      ])),
    };

    mockAngularFireAuth = {
      authState: of({ uid: 'doctor123' })
    };

    await TestBed.configureTestingModule({
      declarations: [DoctorCalendarComponent],
      providers: [
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AngularFireAuth, useValue: mockAngularFireAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load data on init', () => {
    expect(component).toBeTruthy();
    expect(component.userId).toBe('doctor123');
    expect(mockFirebaseService.getAppointments).toHaveBeenCalled();
    expect(mockFirebaseService.getAbsences).toHaveBeenCalled();
    expect(mockFirebaseService.getAvailability).toHaveBeenCalled();
    expect(component.appointments.length).toBe(1);
    expect(component.absences.length).toBe(1);
    expect(component.availability.length).toBe(1);
  });

  it('should generate week correctly from today', () => {
    const week = component.currentWeek;
    expect(week.length).toBe(7);
    expect(week[0].getDay()).toBe(1); // Monday
  });

  it('should generate time slots from 07:00 to 22:30', () => {
    expect(component.timeSlots[0]).toBe('07:00');
    expect(component.timeSlots.includes('22:30')).toBeTrue();
    expect(component.timeSlots.length).toBe(32); // 16 hours × 2 slots/hour
  });

  it('should return true for isAppointmentSlot if date/time match', () => {
    const date = new Date('2025-05-20');
    expect(component.isAppointmentSlot(date, '10:00')).toBeTrue();
  });

  it('should return false for isAppointmentSlot if no match', () => {
    const date = new Date('2025-05-22');
    expect(component.isAppointmentSlot(date, '10:00')).toBeFalse();
  });

  it('should detect absence on a given day', () => {
    const date = new Date('2025-05-21');
    expect(component.isAbsent(date)).toBeTrue();
  });

  it('should identify available slot from cyclic availability', () => {
    const date = new Date('2025-05-20'); // Tuesday
    expect(component.isAvailableSlot(date, '9:00')).toBeTrue();
  });

  it('should return correct appointment type and description', () => {
    const date = new Date('2025-05-20');
    expect(component.getAppointmentType(date, '10:00')).toBe('regular');
    expect(component.getAppointmentDescription(date, '10:00')).toBe('Checkup');
  });

  it('should show and hide appointment details', () => {
    const date = new Date('2025-05-20');
    component.showDetails(date, '10:00');
    expect(component.hoveredAppointment?.description).toBe('Checkup');

    component.hideDetails();
    expect(component.hoveredAppointment).toBeNull();
  });

  it('should navigate between hours and update displayed slots', () => {
    const initialLength = component.displayedTimeSlots.length;
    component.showNextHours();
    expect(component.currentStartHour).toBeGreaterThan(7);
    expect(component.displayedTimeSlots.length).toBe(initialLength);
  });

  it('should correctly detect unavailable slots', () => {
    const date = new Date('2025-05-21'); // absence date
    expect(component.isUnavailableSlot(date, '10:00')).toBeTrue();
  });

});
