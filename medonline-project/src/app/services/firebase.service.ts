import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { of, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private db: AngularFireDatabase) {}

  // Pobranie użytkowników
  getUsers(): Observable<any> {
    return this.db.list('users').valueChanges();
  }

  // Pobranie wizyt dla danego użytkownika
  getAppointments(userId: string): Observable<any> {
    return this.db.list(`users/${userId}/appointments`).valueChanges();
  }

  // Pobranie dostępności lekarza
  getAvailability(userId: string): Observable<any> {
    return this.db.list(`users/${userId}/availability`).valueChanges();
    
  }

  // Pobranie nieobecności lekarza
  getAbsences(userId: string): Observable<any> {
    return this.db.list(`users/${userId}/absences`).valueChanges();
  }

  // Dodanie wizyty
  addAppointment(userId: string, appointment: any, appointmentId: string): Observable<any> {
    const appointmentRef = this.db.object(`users/${userId}/appointments/${appointmentId}`);
    appointmentRef.set(appointment);
    return of({ success: true });
  }

  // Usuwanie wizyty
  deleteAppointment(doctorId: string, patientId: string, appointmentId: string): Observable<any> {
    this.db.object(`users/${doctorId}/appointments/${appointmentId}`).remove().then(() => {
      console.log(`Patient's appointment`);
    }).catch(error => {
      console.error('Error deleting patient appointment:', error);
    });
    
    this.db.object(`users/${patientId}/appointments/${appointmentId}`).remove().then(() => {
      console.log(`Patient's appointment`);
    }).catch(error => {
      console.error('Error deleting patient appointment:', error);
    });
    return of({ success: true });
  }

  getDoctors(): Observable<any> {
    return this.db.list('users')
      .valueChanges()
      .pipe(
        map((users: any[]) =>
          users.filter(user => user.type === 'doctor')
        )
      );
  }
  updateAppointment(userId: string, appointmentId: string, updatedData: any): Promise<void> {
    return this.db.object(`users/${userId}/appointments/${appointmentId}`).update(updatedData);
  }
  

  
}
