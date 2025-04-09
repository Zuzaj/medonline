import { Component, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import {Router} from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnDestroy {
  isLoggedIn: boolean = false;
  isDoctor: boolean = false;
  isPatient: boolean = false;
  isAdmin: boolean = false;
  userName: string | null = null; 
  private authSubscription: Subscription;
  private roleSubscription: Subscription;
  private userNameSubscription: Subscription; 
  router: Router;

  constructor(private authService: AuthService,  router: Router) {
    // Subscribe to the logged-in status
    this.authSubscription = this.authService.isLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn; // Update the isLoggedIn status
    });

    // Subscribe to role changes
    this.roleSubscription = this.authService.userRole$.subscribe(role => {
      this.isDoctor = role === 'doctor';
      this.isPatient = role === 'patient';
      this.isAdmin = role === 'admin';
    });

    this.userNameSubscription = this.authService.userName$.subscribe(name => {
      this.userName = name; // Update the user's name
    });

    this.router = router;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    // Clean up the subscriptions when the component is destroyed
    this.authSubscription.unsubscribe();
    this.roleSubscription.unsubscribe();
    this.userNameSubscription.unsubscribe(); 
  }
}
