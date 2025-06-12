import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PatientCalendarComponent } from './patient-calendar.component';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';


describe('PatientCalendarComponent', () => {
  let component: PatientCalendarComponent;
  let fixture: ComponentFixture<PatientCalendarComponent>;
  let firebaseServiceMock: any;
  let authMock: any;

  const mockDoctors = [
    { user_id: 'doc1', name: 'Dr. Smith' },
    { user_id: 'doc2', name: 'Dr. Jane' },
  ];

  const mockAppointments = [
    { appointment_id: 'a1', date: '2025-05-23', time: '10:00', type: 'regular', description: 'Checkup', patient_id: 'patient1', duration: 30, price: 100, paid: false },
    { appointment_id: 'a2', date: '2025-05-23', time: '11:00', type: 'emergency', description: 'Urgent', patient_id: 'patient2', duration: 60, price: 200, paid: true },
  ];

  const mockAbsences = [
    { date: '2025-05-24', reason: 'Vacation' }
  ];

  const mockAvailability = [
    {
      type: 'cyclic',
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday'],
      timeSlots: [{ startTime: '07:00', endTime: '12:00' }]
    }
  ];

  beforeEach(async () => {
    firebaseServiceMock = {
      getDoctors: jasmine.createSpy('getDoctors').and.returnValue(of(mockDoctors)),
      getAppointments: jasmine.createSpy('getAppointments').and.returnValue(of(mockAppointments)),
      getAbsences: jasmine.createSpy('getAbsences').and.returnValue(of(mockAbsences)),
      getAvailability: jasmine.createSpy('getAvailability').and.returnValue(of(mockAvailability)),
    };

    // Simulate authState observable with a user
    authMock = {
      authState: new BehaviorSubject({ uid: 'patient1' }),
    };

    await TestBed.configureTestingModule({
      declarations: [PatientCalendarComponent],
      providers: [
        { provide: FirebaseService, useValue: firebaseServiceMock },
        { provide: AngularFireAuth, useValue: authMock },
      ],
      imports: [
        FormsModule   // <-- add it here
  ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientCalendarComponent);
    component = fixture.componentInstance;
  });

  it('should create and initialize data on ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // for async subscription

    expect(component.currentPatientId).toBe('patient1');
    expect(firebaseServiceMock.getDoctors).toHaveBeenCalled();
    expect(component.doctors.length).toBe(2);
    expect(component.selectedDoctorId).toBe('doc1');
    expect(firebaseServiceMock.getAppointments).toHaveBeenCalledWith('doc1');
    expect(component.commonAppointments.length).toBe(1); // only patient1 appointments
    expect(component.otherAppointments.length).toBe(1);  // others
    expect(component.absences.length).toBe(1);
    expect(component.availability.length).toBe(1);
    expect(component.currentWeek.length).toBe(7);
    expect(component.timeSlots.length).toBeGreaterThan(0);
    expect(component.displayedTimeSlots.length).toBe(component.hoursPerPage * 2);
  }));

  it('should generate correct time slots', () => {
    component.generateTimeSlots();
    expect(component.timeSlots[0]).toBe('07:00');
    expect(component.timeSlots[1]).toBe('07:30');
    expect(component.timeSlots[component.timeSlots.length - 1]).toBe('22:30');
  });

  it('should update displayed time slots correctly', () => {
    component.generateTimeSlots();
    component.currentStartHour = 7;
    component.hoursPerPage = 6;
    component.updateDisplayedTimeSlots();
    expect(component.displayedTimeSlots.length).toBe(12);
    expect(component.displayedTimeSlots[0]).toBe('07:00');
  });

  it('should generate the correct week starting Monday', () => {
    component.generateWeek(new Date('2025-05-21')); // Wednesday
    expect(component.currentWeek[0].getDay()).toBe(1); // Monday
    expect(component.currentWeek.length).toBe(7);
  });

  it('should correctly count appointments on a given day', () => {
    component.commonAppointments = mockAppointments.filter(a => a.patient_id === 'patient1');
    const count = component.getAppointmentsCount(new Date('2025-05-23'));
    expect(count).toBe(1);
  });

  it('should correctly detect absences', () => {
    component.absences = mockAbsences;
    expect(component.isAbsent(new Date('2025-05-24'))).toBeTrue();
    expect(component.isAbsent(new Date('2025-05-25'))).toBeFalse();
  });

  it('should detect if slot is an appointment slot', () => {
    component.commonAppointments = mockAppointments.filter(a => a.patient_id === 'patient1');
    expect(component.isAppointmentSlot(new Date('2025-05-23'), '10:00')).toBeTrue();
    expect(component.isAppointmentSlot(new Date('2025-05-23'), '11:00')).toBeFalse();
  });

  it('should return the correct appointment from getAppointment', () => {
    component.commonAppointments = mockAppointments.filter(a => a.patient_id === 'patient1');
    const appt = component.getAppointment(new Date('2025-05-23'), '10:00');
    expect(appt).toBeDefined();
    expect(appt?.description).toBe('Checkup');
  });

  it('should show and hide booking details', () => {
    component.commonAppointments = mockAppointments.filter(a => a.patient_id === 'patient1');
    const day = new Date('2025-05-23');
    component.showDetails(day, '10:00');
    expect(component.hoveredAppointment).toBeDefined();
    expect(component.hoveredAppointment?.description).toBe('Checkup');
    component.hideDetails();
    expect(component.hoveredAppointment).toBeNull();
  });

  it('should correctly determine availability of slot', () => {
    component.commonAppointments = [];
    component.otherAppointments = [];
    component.absences = [];
    component.availability = [
      {
        type: 'cyclic',
        daysOfWeek: [component.getDayOfWeek(new Date('2025-05-19'))], // Monday
        timeSlots: [{ startTime: '07:00', endTime: '12:00' }],
      }
    ];

    const day = new Date('2025-05-19'); // Monday
    expect(component.isAvailableSlot(day, '08:00')).toBeTrue();
    expect(component.isAvailableSlot(day, '06:00')).toBeFalse();
  });

  it('should correctly navigate weeks', () => {
    component.generateWeek(new Date('2025-05-21')); // Wednesday
    const initialFirstDay = component.currentWeek[0];
    component.showNextWeek();
    expect(component.currentWeek[0].getTime()).toBe(initialFirstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
    component.showPreviousWeek();
    expect(component.currentWeek[0].getTime()).toBe(initialFirstDay.getTime());
  });

  it('should limit currentStartHour when showing next and previous hours', () => {
    component.currentStartHour = 7;
    component.hoursPerPage = 6;
    component.generateTimeSlots();
    component.showPreviousHours();
    expect(component.currentStartHour).toBe(7);

    component.currentStartHour = 16;
    component.showNextHours();
    expect(component.currentStartHour).toBe(22);

    component.currentStartHour = 10;
    component.showNextHours();
    expect(component.currentStartHour).toBe(16);

    component.currentStartHour = 16;
    component.showPreviousHours();
    expect(component.currentStartHour).toBe(10);
  });
});
