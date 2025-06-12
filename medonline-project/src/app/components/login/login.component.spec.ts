import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show error messages when email and password are empty', () => {
    component.login();
    expect(component.emailError).toBe('Email cannot be empty');
    expect(component.passwordError).toBe('Password cannot be empty');
  });

  it('should call AuthService.login and navigate on successful login', fakeAsync(() => {
    component.email = 'test@example.com';
    component.password = 'password123';
    authServiceSpy.login.and.returnValue(of({ uid: '123' }));

    component.login();
    tick(); 

    expect(authServiceSpy.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('should show error message on login failure', fakeAsync(() => {
    component.email = 'test@example.com';
    component.password = 'wrongpassword';
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    component.login();
    tick(); 

    expect(component.passwordError).toBe('Invalid credentials');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));
});
