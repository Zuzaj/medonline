import { FirebaseService } from './../../services/firebase.service';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Appointment {
  appointment_id: string;
  date: string; // Data w formacie YYYY-MM-DD
  time: string; // Godzina w formacie HH:mm
  type: string;
  description: string;
  patient_id: string;
  duration: number;
  price:number;
  paid:boolean;
}


@Component({
  selector: 'app-historical-consultations',
  templateUrl: './historical-consultations.component.html',
  styleUrls: ['./historical-consultations.component.scss']
})
export class HistoricalConsultationsComponent implements OnInit {
  pastAppointments: Appointment[] = [];
  userId = '';

  constructor(
    private appointmentService: FirebaseService, // Inject the appointment service
    private auth: AngularFireAuth) {}

  ngOnInit() {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.getPastAppointments();
      }
    });
  }
  getPastAppointments() {
    this.appointmentService.getAppointments(this.userId).subscribe((appointments: any[]) => {
      const now = new Date();
      this.pastAppointments = appointments.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate <= now;
      });
    });
  }
}
