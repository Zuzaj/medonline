import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
})
export class AdminSettingsComponent {
  selectedMode: 'local' | 'session' | 'none' = 'local';  // Default to local persistence

  constructor(private loginStateService: AuthService) {}

  // Set the persistence mode when admin selects a new mode
  changePersistenceMode(): void {
    this.loginStateService.setPersistenceMode(this.selectedMode);
    alert(`Persistence mode changed to: ${this.selectedMode}`);
  }
}
