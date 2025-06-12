import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AdminSettingsComponent } from './admin-settings.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('AdminSettingsComponent', () => {
  let component: AdminSettingsComponent;
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', ['setPersistenceMode']);

    await TestBed.configureTestingModule({
      declarations: [AdminSettingsComponent],
      imports: [FormsModule],
      providers: [{ provide: AuthService, useValue: spy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have default persistence mode as "local"', () => {
    expect(component.selectedMode).toBe('local');
  });

  it('should call AuthService.setPersistenceMode with the selected mode', () => {
    component.selectedMode = 'none';
    component.changePersistenceMode();
    expect(authServiceSpy.setPersistenceMode).toHaveBeenCalledWith('none');
  });

  it('should change persistence mode to "session"', () => {
    spyOn(window, 'alert');
    component.selectedMode = 'session';
    component.changePersistenceMode();
    expect(window.alert).toHaveBeenCalledWith('Persistence mode changed to: session');
  });
});
