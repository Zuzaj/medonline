import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserRole', 'register']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true)); // Must resolve to boolean

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: FirebaseService, useValue: {} }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    authServiceSpy.getUserRole.and.returnValue(of('admin')); // Default role
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to /home on cancel', fakeAsync(() => {
    component.cancel();
    tick();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('should set type to doctor if user is admin', fakeAsync(() => {
    authServiceSpy.getUserRole.and.returnValue(of('admin'));
    component.ngOnInit();
    tick();
    component.isAdmin$.subscribe((isAdmin) => {
      expect(isAdmin).toBeTrue();
      expect(component.type).toBe('doctor');
    });
  }));

  it('should not submit if required fields are missing', fakeAsync(() => {
    component.name = '';
    component.surname = '';
    component.email = '';
    component.password = '';
    component.type = '';
    component.submit();
    tick();
    expect(component.nameError).toBe('Name cannot be empty');
    expect(component.surnameError).toBe('Surname cannot be empty');
    expect(component.emailError).toBe('Email cannot be empty');
    expect(component.passwordError).toBe('Password cannot be empty');
    expect(component.patientTypeError).toBe('Please select a type');
  }));

  it('should call authService.register and navigate on successful submit', fakeAsync(() => {
    component.name = 'John';
    component.surname = 'Doe';
    component.email = 'john@example.com';
    component.password = 'password123';
    component.type = 'doctor';
    component.specialization = 'Cardiology';

    authServiceSpy.register.and.returnValue(of({ success: true }));

    component.submit();
    tick();
    expect(authServiceSpy.register).toHaveBeenCalledWith(
      'John', 'Doe', 'john@example.com', 'password123', 'doctor', 'Cardiology'
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  }));
});
