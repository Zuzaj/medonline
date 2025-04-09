import { Component } from '@angular/core';
import { AuthService, PersistenceMode } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'medonline-project';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Set initial persistence mode if needed
    this.authService.setPersistenceMode('local'); // or any default
  }

  // Example method for changing persistence mode
  changePersistenceMode(mode: PersistenceMode): void {
    this.authService.setPersistenceMode(mode);
  }
}