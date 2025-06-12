import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HistoricalConsultationsComponent } from './historical-consultations.component';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of, BehaviorSubject } from 'rxjs';

describe('HistoricalConsultationsComponent', () => {
  let component: HistoricalConsultationsComponent;
  let fixture: ComponentFixture<HistoricalConsultationsComponent>;
  let mockFirebaseService: any;
  let mockAngularFireAuth: any;
  let authState$: BehaviorSubject<any>;

  beforeEach(async () => {
    // Mock AngularFireAuth with a BehaviorSubject for authState
    authState$ = new BehaviorSubject<any>(null);
    mockAngularFireAuth = {
      authState: authState$.asObservable()
    };

    // Mock FirebaseService with a getAppointments spy
    mockFirebaseService = {
      getAppointments: jasmine.createSpy('getAppointments')
    };

    await TestBed.configureTestingModule({
      declarations: [HistoricalConsultationsComponent],
      providers: [
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AngularFireAuth, useValue: mockAngularFireAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoricalConsultationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set userId and call getPastAppointments on auth state change', () => {
    const testUser = { uid: 'user123' };
    const appointments = [
      { appointment_id: '1', date: '2023-01-01', time: '10:00', type: 'Checkup', description: '', patient_id: 'user123', duration: 30, price: 50, paid: true },
      { appointment_id: '2', date: '2099-12-31', time: '11:00', type: 'Consultation', description: '', patient_id: 'user123', duration: 45, price: 75, paid: false }
    ];

    mockFirebaseService.getAppointments.and.returnValue(of(appointments));

    // Emit user login
    authState$.next(testUser);

    fixture.detectChanges();

    expect(component.userId).toBe('user123');
    expect(mockFirebaseService.getAppointments).toHaveBeenCalledWith('user123');

    // Past appointments should only include appointments with dates <= today
    expect(component.pastAppointments.length).toBe(1);
    expect(component.pastAppointments[0].appointment_id).toBe('1');
  });

  it('should not set userId or call getPastAppointments if no user', () => {
    mockFirebaseService.getAppointments.and.returnValue(of([]));

    // Emit no user (null)
    authState$.next(null);

    fixture.detectChanges();

    expect(component.userId).toBe('');
    expect(mockFirebaseService.getAppointments).not.toHaveBeenCalled();
    expect(component.pastAppointments.length).toBe(0);
  });
});
