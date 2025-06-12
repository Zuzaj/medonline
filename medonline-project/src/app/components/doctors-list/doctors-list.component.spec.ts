import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DoctorsListComponent } from './doctors-list.component';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from 'src/app/services/auth.service';

describe('DoctorsListComponent', () => {
  let component: DoctorsListComponent;
  let fixture: ComponentFixture<DoctorsListComponent>;
  let mockFirebaseService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockFirebaseService = {
      getDoctors: jasmine.createSpy('getDoctors').and.returnValue(of([{ id: '1', name: 'Dr. Test' }]))
    };

    mockAuthService = {
      getUserRole: jasmine.createSpy('getUserRole').and.returnValue(of('admin')),
      deleteUser: jasmine.createSpy('deleteUser').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      declarations: [DoctorsListComponent],
      providers: [
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctors on init', fakeAsync(() => {
    component.ngOnInit();
    component.doctors$?.subscribe(doctors => {
      expect(doctors.length).toBe(1);
      expect(doctors[0].name).toBe('Dr. Test');
    });
  }));

  it('should detect admin user on init', fakeAsync(() => {
    component.ngOnInit();
    component.isAdmin$?.subscribe(isAdmin => {
      expect(isAdmin).toBeTrue();
    });
  }));

  it('should confirm before deleting doctor', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteDoctor('123');
    expect(mockAuthService.deleteUser).not.toHaveBeenCalled();
  });

  it('should handle delete error', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockAuthService.deleteUser.and.returnValue(throwError(() => new Error('Delete failed')));
    spyOn(window, 'alert');
    spyOn(console, 'error');

    component.deleteDoctor('123');
    tick();

    expect(console.error).toHaveBeenCalledWith('Error deleting doctor:', jasmine.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Failed to delete the doctor.');
    flush();
  }));
});
