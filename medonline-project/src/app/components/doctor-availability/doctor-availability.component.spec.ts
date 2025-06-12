import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { DoctorAvailabilityComponent } from './doctor-availability.component';
import { FormsModule } from '@angular/forms';

describe('DoctorAvailabilityComponent', () => {
  let component: DoctorAvailabilityComponent;
  let fixture: ComponentFixture<DoctorAvailabilityComponent>;

  const mockAuthState = of({ uid: 'test-user-id' });

  const mockDb = {
    createPushId: () => 'new-key',
    list: jasmine.createSpy().and.returnValue({
      valueChanges: jasmine.createSpy().and.returnValue(of([
        { key: '1', type: 'cyclic', startDate: '2024-01-01', endDate: '2024-01-31', daysOfWeek: 'Monday, Tuesday', timeSlots: [{ startTime: '09:00', endTime: '10:00' }] },
        { key: '2', type: 'one-time', startDate: '2024-02-01', endDate: '2024-02-01', timeSlots: [{ startTime: '11:00', endTime: '12:00' }] },
      ]))
    }),
    object: jasmine.createSpy().and.returnValue({
      set: jasmine.createSpy().and.returnValue(Promise.resolve()),
      remove: jasmine.createSpy().and.returnValue(Promise.resolve())
    })
  };

  const mockAuth = {
    authState: mockAuthState
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DoctorAvailabilityComponent],
      imports: [FormsModule], 
      providers: [
        { provide: AngularFireDatabase, useValue: mockDb },
        { provide: AngularFireAuth, useValue: mockAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch availability and transform data', (done) => {
    component.availability$.subscribe(availabilities => {
      expect(availabilities.length).toBe(2);
      expect(availabilities[0].daysOfWeek).toEqual(['Monday', 'Tuesday']);
      expect(availabilities[1].specificDate).toEqual('2024-02-01');
      done();
    });
  });

  it('should add a time slot', () => {
    const initialLength = component.newAvailability.timeSlots!.length;
    component.addTimeSlot();
    expect(component.newAvailability.timeSlots!.length).toBe(initialLength + 1);
  });

  it('should remove a time slot', () => {
    component.newAvailability.timeSlots = [
      { startTime: '08:00', endTime: '09:00' },
      { startTime: '10:00', endTime: '11:00' }
    ];
    component.removeTimeSlot(0);
    expect(component.newAvailability.timeSlots!.length).toBe(1);
    expect(component.newAvailability.timeSlots![0].startTime).toBe('10:00');
  });

  it('should reset the form', () => {
    component.newAvailability.daysOfWeek = ['Monday'];
    component.newAvailability.timeSlots = [];
    component.resetForm();
    expect(component.newAvailability.type).toBe('cyclic');
    expect(component.newAvailability.daysOfWeek).toEqual([]);
    expect(component.newAvailability.timeSlots?.length).toBe(1);
  });

  it('should toggle day selection', () => {
    component.newAvailability.daysOfWeek = ['Monday'];
    component.toggleDaySelection('Tuesday');
    expect(component.newAvailability.daysOfWeek).toContain('Tuesday');
    component.toggleDaySelection('Monday');
    expect(component.newAvailability.daysOfWeek).not.toContain('Monday');
  });

  it('should save availability to database', async () => {
    component.userId = 'test-user-id';
    component.newAvailability = {
      type: 'cyclic',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      daysOfWeek: ['Monday'],
      timeSlots: [{ startTime: '10:00', endTime: '11:00' }]
    };
    await component.saveAvailability();
    expect(mockDb.object).toHaveBeenCalledWith('users/test-user-id/availability/new-key');
    expect(mockDb.object().set).toHaveBeenCalled();
  });

  it('should delete availability from database', async () => {
    component.userId = 'test-user-id';
    await component.deleteAvailability('test-key');
    expect(mockDb.object).toHaveBeenCalledWith('users/test-user-id/availability/test-key');
    expect(mockDb.object().remove).toHaveBeenCalled();
  });
});
