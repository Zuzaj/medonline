import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShoppingCartComponent } from './shopping-cart.component';
import { FirebaseService } from 'src/app/services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { of } from 'rxjs';

describe('ShoppingCartComponent', () => {
  let component: ShoppingCartComponent;
  let fixture: ComponentFixture<ShoppingCartComponent>;
  let mockFirebaseService: any;
  let mockAngularFireAuth: any;

  const mockAppointments = [
    {
      appointment_id: 'a1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
      time: '10:00',
      type: 'consultation',
      description: 'Check-up',
      patient_id: 'p1',
      duration: 30,
      price: 100,
      paid: false
    },
    {
      appointment_id: 'a2',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // day after tomorrow
      time: '14:00',
      type: 'follow-up',
      description: 'Review',
      patient_id: 'p2',
      duration: 20,
      price: 150,
      paid: true
    }
  ];

  beforeEach(async () => {
    mockFirebaseService = {
      getAppointments: jasmine.createSpy().and.returnValue(of(mockAppointments)),
      updateAppointment: jasmine.createSpy().and.returnValue(Promise.resolve())
    };

    mockAngularFireAuth = {
      authState: of({ uid: 'test-user-id' })
    };

    await TestBed.configureTestingModule({
      declarations: [ShoppingCartComponent],
      providers: [
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AngularFireAuth, useValue: mockAngularFireAuth }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShoppingCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set userId from auth and load appointments on init', () => {
    expect(component.userId).toBe('test-user-id');
    expect(mockFirebaseService.getAppointments).toHaveBeenCalledWith('test-user-id');
    expect(component.upcomingAppointments.length).toBe(2);
  });

  it('should only count unpaid appointments towards total price', () => {
    expect(component.totalUpcomingAppointmentsPrice).toBe(100); // only first one unpaid
  });

  it('should call updateAppointment for each appointment in buy()', async () => {
    spyOn(window, 'alert'); // prevent actual alert

    await component.buy();

    expect(mockFirebaseService.updateAppointment).toHaveBeenCalledTimes(2); // has 2 appointments
    expect(mockFirebaseService.updateAppointment).toHaveBeenCalledWith(
      'test-user-id',
      'a1',
      jasmine.objectContaining({ paid: true })
    );
  });

  it('should refetch appointments after buy', async () => {
    spyOn(component, 'getUpcomingAppointments');
    await component.buy();
    expect(component.getUpcomingAppointments).toHaveBeenCalled();
  });
});
