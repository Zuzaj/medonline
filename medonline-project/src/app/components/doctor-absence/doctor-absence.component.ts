import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';


interface Absence {
  key?:string;
  date: string;
  reason: string;
}

interface Appointment {
  appointment_id: string;
  date: string;
  time: string;
  doctorId: string;
  patientId: string;
  status: 'scheduled' | 'canceled';
  description: string;
  type: string;
  price?: number;
  duration?: number;
  paid? : boolean;
}

@Component({
  selector: 'app-doctor-absence',
  templateUrl: './doctor-absence.component.html',
  styleUrls: ['./doctor-absence.component.scss']
})
export class DoctorAbsenceComponent {
  userId = ''; // Doctor's user ID
  // patientId = 'user2'; // Patient's user ID
  absences: Absence[] = [];
  appointments: Appointment[] = [];
  newAbsence: Absence = { date: '', reason: '' , key: ''};

  constructor(private db: AngularFireDatabase, private auth: AngularFireAuth) {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadAbsences();
        this.loadAppointments();
      }
  });
}

  // Load absences from Firebase Realtime Database
  loadAbsences(): void {
    this.db.list(`users/${this.userId}/absences`).valueChanges().subscribe((absences) => {
      this.absences = absences as Absence[];
    });
  }

  // Load appointments for the doctor
  loadAppointments(): void {
    this.db.list(`users/${this.userId}/appointments`).valueChanges().subscribe((appointments) => {
      this.appointments = appointments as Appointment[];
    });
  }

  // Add new absence to Firebase and delete conflicting appointments
  addAbsence(): void {
    if (this.isAbsenceConflict(this.newAbsence.date)) {
      alert('Konflikt z zaplanowaną dostępnością lub istniejącymi wizytami! Konsultacje zostały odwołane.');
      return;
    }
    
    // Add absence to Firebase
    const absenceId = this.db.createPushId();
    this.newAbsence.key = absenceId;
    this.db.object(`users/${this.userId}/absences/${absenceId}`).set(this.newAbsence);
    this.resetAbsenceForm();
  }

  deleteAbsence(absenceKey: string): void {
    this.db.object(`users/${this.userId}/absences/${absenceKey}`).remove().then(() => {
      console.log(`Absence on ${absenceKey} has been deleted.`);
    }).catch((error) => {
      console.error('Error deleting absence:', error);
    });
  }

  // Check if the absence conflicts with the scheduled appointments
  isAbsenceConflict(absenceDate: string): boolean {
    // Check if there's a conflicting appointment for the doctor
    const conflictingAppointmentDoctor = this.appointments.find(appointment => appointment.date === absenceDate);
    if (conflictingAppointmentDoctor) {
      console.warn(`Doctor has an appointment on ${absenceDate}. Deleting the appointment from doctor and patient.`);
      const patientId = conflictingAppointmentDoctor.patientId;
      
      // Step 1: Find the patient's appointment based on the conflicting appointment's date and time
// const patientAppointmentRef = this.db.object(`users/${conflictingAppointmentDoctor.patientId}/appointments/${conflictingAppointmentDoctor.appointment_id}`);
const patientAppointmentRef = this.db.object(`users/${patientId}/appointments/${conflictingAppointmentDoctor.appointment_id}`);


// Step 2: Delete the conflicting appointment from the patient's appointments
patientAppointmentRef.remove().then(() => {
  console.log(`Patient's appointment on ${conflictingAppointmentDoctor.date} at ${conflictingAppointmentDoctor.time} has been canceled.`);
}).catch(error => {
  console.error('Error deleting patient appointment:', error);
});

      // Step 3: Delete the conflicting appointment from the doctor's appointments
      const doctorAppointmentRef = this.db.object(`users/${this.userId}/appointments/${conflictingAppointmentDoctor.appointment_id}`);
      doctorAppointmentRef.remove().then(() => {
        console.log(`Doctor's appointment on ${conflictingAppointmentDoctor.date} at ${conflictingAppointmentDoctor.time} has been canceled.`);
      }).catch(error => {
        console.error('Error deleting doctor appointment:', error);
      });

      return true;
    }
    
    // No conflict found
    return false;
  }

  // Reset the absence form
  resetAbsenceForm(): void {
    this.newAbsence = { date: '', reason: '' };
  }
}
