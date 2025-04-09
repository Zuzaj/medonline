import { FirebaseService } from './../../services/firebase.service';
import { Component, OnInit} from '@angular/core';
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
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})

export class ShoppingCartComponent implements OnInit{

  upcomingAppointments: Appointment[] = [];  // Store the upcoming appointments
  totalUpcomingAppointmentsPrice: number = 0; // Sum of upcoming appointments prices
  userId = '';

  

  constructor(
    private appointmentService: FirebaseService, // Inject the appointment service
    private auth: AngularFireAuth) {}

  ngOnInit() {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.getUpcomingAppointments();
      }
    });
  }

  // Fetch upcoming appointments and calculate the total price
  getUpcomingAppointments() {
    this.appointmentService.getAppointments(this.userId).subscribe((appointments: any[]) => {
      const now = new Date();
      this.upcomingAppointments = appointments.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= now 
      });

      this.totalUpcomingAppointmentsPrice = this.upcomingAppointments.reduce((sum, appointment: Appointment) => {
        return sum + (appointment.paid === false ? appointment.price || 0: 0); // Add price if available
      }, 0);
    });
  }


  buy() {
    this.upcomingAppointments.forEach((appointment: any) => {

      if (appointment.appointment_id) {
        const updatedAppointment = { ...appointment, paid: true };

        console.log('Updating appointment:', {
          path: `users/${this.userId}/appointments/${appointment.id}`,
          data: { ...appointment, paid: true },
        });

        
        this.appointmentService.updateAppointment(this.userId, appointment.appointment_id, updatedAppointment)
          .then(() => {
            console.log(`Appointment ${appointment.id} marked as paid.`);
          })
          .catch((error) => {
            console.error(`Failed to update appointment ${appointment.id}: `, error);
          });
      } else {
        console.error('Appointment ID is missing.');
      }
    });
    alert("Pomyślnie zakupiono wizyty!");
    this.getUpcomingAppointments();
  }
}
