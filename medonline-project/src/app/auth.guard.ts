import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.isLoggedIn().pipe(
      first(), // Take the first emitted value
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true; // Allow navigation
        } else {
          this.router.navigate(['/login']); // Redirect to login page
          return false; // Block navigation
        }
      })
    );
  }
}