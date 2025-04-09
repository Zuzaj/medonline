import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from 'src/app/services/auth.service';
import { map, of, Observable } from 'rxjs';

@Component({
  selector: 'app-doctors-list',
  templateUrl: './doctors-list.component.html',
  styleUrls: ['./doctors-list.component.scss']
})
export class DoctorsListComponent implements OnInit {
  doctors$: Observable<any[]> | null = null;
  isAdmin$: Observable<boolean> = of(false);

  constructor(private firebaseService: FirebaseService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.checkAdminStatus();
  }

  private loadDoctors(): void {
    this.doctors$ = this.firebaseService.getDoctors();
  }
  private checkAdminStatus(): void {
    this.isAdmin$ = this.auth.getUserRole().pipe(
      map(role => role === 'admin') // Check if the role is 'admin'
    );
  }

  deleteDoctor(doctorId: string): void {
    if (confirm('Are you sure you want to delete this doctor?')) {
      this.auth.deleteUser(doctorId).subscribe({
        next: () => {
          alert('Doctor deleted successfully.');
          window.location.reload();
        },
        error: (err) => {
          console.error('Error deleting doctor:', err);
          alert('Failed to delete the doctor.');
        }
      });
    }
  }
}
