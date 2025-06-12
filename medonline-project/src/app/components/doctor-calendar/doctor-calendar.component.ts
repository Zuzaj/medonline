import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface Appointment {
  date: string; // Data w formacie YYYY-MM-DD
  time: string; // Godzina w formacie HH:mm
  type: string;
  description: string;
}

interface Absence {
  date: string; // Data nieobecności
  reason: string; // Powód nieobecności
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Availability {
  type: 'cyclic' | 'one-time';
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[]; // ['Monday', 'Tuesday', ...]
  timeSlots?: TimeSlot[];
  specificDate?: string;
}

@Component({
  selector: 'app-doctor-calendar',
  templateUrl: './doctor-calendar.component.html',
  styleUrls: ['./doctor-calendar.component.scss']
})
export class DoctorCalendarComponent implements OnInit {
  userId = ''; // ID zalogowanego lekarza
  appointments: Appointment[] = [];
  absences: Absence[] = [];
  availability: Availability[] = [];
  currentWeek: Date[] = [];
  timeSlots: string[] = [];
  displayedTimeSlots: string[] = [];
  currentStartHour: number = 7; // Start time of the visible block
  hoursPerPage: number = 6; 
  hoveredAppointment: Appointment | null = null;


  constructor(private firebaseService: FirebaseService, private auth: AngularFireAuth) {}

  ngOnInit(): void {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.loadCalendarData();
        this.generateWeek(new Date());
        this.generateTimeSlots();
        this.updateDisplayedTimeSlots();

      }
    });
  }

  loadCalendarData(): void {
    this.firebaseService.getAppointments(this.userId).subscribe((appointments: Appointment[]) => {
      this.appointments = appointments;
    });

    this.firebaseService.getAbsences(this.userId).subscribe((absences: Absence[]) => {
      this.absences = absences;
    });

    this.firebaseService.getAvailability(this.userId).subscribe((availability: Availability[]) => {
      this.availability = availability;
    });
  }
  updateDisplayedTimeSlots(): void {
    this.displayedTimeSlots = this.timeSlots.slice(this.currentStartHour - 7, this.currentStartHour - 7 + this.hoursPerPage * 2);
  }
  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 7; hour <= 22; hour++) {
      this.timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      this.timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  generateWeek(action: string | Date): void {
    let startOfWeek: Date;
  
    if (typeof action === 'string') {
      // Handle 'previous' or 'next' week navigation
      const currentStartOfWeek = this.currentWeek.length ? this.currentWeek[0] : new Date();
      const dateAdjustment = action === 'previous' ? -7 : 7;
      startOfWeek = new Date(currentStartOfWeek);
      startOfWeek.setDate(startOfWeek.getDate() + dateAdjustment);
    } else {
      // Default to today's week
      const today = new Date(action);
      const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
      const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust Sunday to -6, other days to start of the week
      startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + offsetToMonday); // Move to Monday
    }
  
    // Generate the week (Monday to Sunday)
    this.currentWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }
  
  
  getAppointmentsCount(day: Date): number {
    const formattedDate = day.toISOString().split('T')[0];
    return this.appointments.filter(
      (appointment) => appointment.date === formattedDate
    ).length;
  }

  isAbsent(day: Date): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    return this.absences.some(absence => absence.date === formattedDate);
  }

  isAppointmentSlot(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    return this.appointments.some(
      (appointment) => appointment.date === formattedDate && appointment.time === time
    );
  }

  isPastAppointment(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    const appointment = this.appointments.find(
      (appt) => appt.date === formattedDate && appt.time === time
    );
    return appointment ? new Date(`${appointment.date}T${appointment.time}`).getTime() < Date.now() : false;
  }


  getAppointment(day: Date, time: string): Appointment | undefined  {
    const formattedDate = day.toISOString().split('T')[0];
    const appointment = this.appointments.find(
      (appt) => appt.date === formattedDate && appt.time === time
    );
    return appointment;
  }


  isToday(day: Date): boolean {
    const today = new Date();
    return day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
  }

  isCurrentTimeSlot(day: Date, hour: string): boolean {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
  
    // Assuming hours are in the format "HH:MM"
    const [slotHour, slotMinute] = hour.split(':').map(num => parseInt(num));
  
    // Check if the day matches and if the hour is the current hour
    return (
      day.getDate() === currentDay &&
      slotHour === currentHour &&
      slotMinute <= currentMinute && slotMinute + 30 > currentMinute
    );
  }
  getConsultationTypeClass(day: Date, hour: string): string {
    const appointment = this.appointments.find(app => app.date === day.toISOString().split('T')[0] && app.time === hour);
    if (appointment) {
      // Zmodyfikuj logikę przypisywania typu wizyty
      return appointment.type; // np. na podstawie jakiejś innej właściwości
    }
    return '';
  }
  showNextWeek(): void {
    this.generateWeek('next');
  }

  showPreviousWeek(): void {
    this.generateWeek('previous');
  }
  showNextHours(): void {
    this.currentStartHour = Math.min(22, this.currentStartHour + this.hoursPerPage);
    this.updateDisplayedTimeSlots();
  }

  showPreviousHours(): void {
    this.currentStartHour = Math.max(7, this.currentStartHour - this.hoursPerPage);
    this.updateDisplayedTimeSlots();
  }
  // Przykładowa funkcja sprawdzająca typ konsultacji
isRegularConsultation(day: Date, hour: string): boolean {
  return this.getAppointmentType(day, hour) === 'regular';
}

isEmergencyConsultation(day: Date, hour: string): boolean {
  return this.getAppointmentType(day, hour) === 'emergency';
}

isConsultation(day: Date, hour: string): boolean {
  return this.getAppointmentType(day, hour) === 'consultation';
}

// Funkcja, która zwraca szczegóły wizyty
getAppointmentDescription(day: Date, hour: string): string {
  const appointment = this.getAppointment(day, hour); // Zakłada, że masz funkcję, która zwraca obiekt appointment
  return appointment ? appointment.description : 'Brak szczegółów';
}

// Funkcja do pobrania typu konsultacji
getAppointmentType(day: Date, hour: string): string {
  const appointment = this.getAppointment(day, hour);
  return appointment ? appointment.type : 'regular'; // Domyślny typ to 'regular'
}
showDetails(day: Date, hour: string): void {
  const appointment = this.getAppointment(day, hour);
  if (appointment) {
    this.hoveredAppointment = appointment;
  }
}

// Function to hide details when the mouse leaves
hideDetails(): void {
  this.hoveredAppointment = null;
}

isAvailableSlot(day: Date, time: string): boolean {
  const formattedDate = day.toISOString().split('T')[0];
  
  // Check if there's any existing appointment for the given day and time
  if (this.isAppointmentSlot(day, time)) {
    return false; // Slot is already booked
  }

  // Check for absences on the given day
  if (this.isAbsent(day)) {
    return false; // Doctor is absent on this day
  }

  // Check availability for each availability entry (cyclic or one-time)
  for (let available of this.availability) {
    if (available.type === 'cyclic') {
      // Check if the current day is within the cyclic availability range
      if (available.daysOfWeek && available.daysOfWeek.includes(this.getDayOfWeek(day))) {
        // Check if the time slot matches with any of the cyclic time slots
        if (available.timeSlots?.some(slot => this.isTimeBetween(time, slot.startTime, slot.endTime))) {
          return true; // Slot is available
        }
      }
    } else if (available.type === 'one-time') {
      // Check if the current date matches the specific one-time date and the time slot matches
      if (available.startDate === formattedDate) {
        if (available.timeSlots?.some(slot => this.isTimeBetween(time, slot.startTime, slot.endTime))) {
          return true; // Slot is available
        }
      }
    }
  }
  
  return false; // Slot is not available in any case
}



isUnavailableSlot(day: Date, time: string): boolean {
  return !this.isAvailableSlot(day, time) && !this.isAppointmentSlot(day, time);
}

getDayOfWeek(date: Date): string {
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  return daysOfWeek[date.getDay()];
}
isTimeBetween(time: string, startTime: string, endTime: string): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const timeMinutes = toMinutes(time);
  return timeMinutes >= toMinutes(startTime) && timeMinutes < toMinutes(endTime);
}
}