import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../services/auth.service';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  // Subjects to simulate observables in AuthService
  let isLoggedInSubject: Subject<boolean>;
  let userRoleSubject: Subject<string>;
  let userNameSubject: Subject<string>;

  beforeEach(() => {
    isLoggedInSubject = new Subject<boolean>();
    userRoleSubject = new Subject<string>();
    userNameSubject = new Subject<string>();

    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(isLoggedInSubject.asObservable()),
      userRole$: userRoleSubject.asObservable(),
      userName$: userNameSubject.asObservable(),
      logout: jasmine.createSpy('logout')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should update isLoggedIn on authService.isLoggedIn() emit', () => {
    isLoggedInSubject.next(true);
    expect(component.isLoggedIn).toBeTrue();

    isLoggedInSubject.next(false);
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should update role booleans based on userRole$ emits', () => {
    userRoleSubject.next('doctor');
    expect(component.isDoctor).toBeTrue();
    expect(component.isPatient).toBeFalse();
    expect(component.isAdmin).toBeFalse();

    userRoleSubject.next('patient');
    expect(component.isDoctor).toBeFalse();
    expect(component.isPatient).toBeTrue();
    expect(component.isAdmin).toBeFalse();

    userRoleSubject.next('admin');
    expect(component.isDoctor).toBeFalse();
    expect(component.isPatient).toBeFalse();
    expect(component.isAdmin).toBeTrue();

    userRoleSubject.next('other');
    expect(component.isDoctor).toBeFalse();
    expect(component.isPatient).toBeFalse();
    expect(component.isAdmin).toBeFalse();
  });

  it('should update userName on userName$ emit', () => {
    userNameSubject.next('Alice');
    expect(component.userName).toBe('Alice');

    userNameSubject.next("");
    expect(component.userName).toBe("");
  });

  it('should call logout on authService and navigate to /home on logout()', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
    // Spy on unsubscribe of each subscription
    spyOn(component['authSubscription'], 'unsubscribe').and.callThrough();
    spyOn(component['roleSubscription'], 'unsubscribe').and.callThrough();
    spyOn(component['userNameSubscription'], 'unsubscribe').and.callThrough();

    component.ngOnDestroy();

    expect(component['authSubscription'].unsubscribe).toHaveBeenCalled();
    expect(component['roleSubscription'].unsubscribe).toHaveBeenCalled();
    expect(component['userNameSubscription'].unsubscribe).toHaveBeenCalled();
  });
});
