import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
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
  selector: 'app-patient-calendar',
  templateUrl: './patient-calendar.component.html',
  styleUrls: ['./patient-calendar.component.scss']
})
export class PatientCalendarComponent implements OnInit {
  doctors: { user_id: string; name: string }[] = []; // Lista dostępnych lekarzy
  selectedDoctorId: string = ''; // Wybrany lekarz
  currentPatientId: string = '';
  commonAppointments: Appointment[] = [];
  otherAppointments: Appointment[] = [];
  absences: Absence[] = [];
  availability: Availability[] = [];
  currentWeek: Date[] = [];
  timeSlots: string[] = [];
  displayedTimeSlots: string[] = [];
  currentStartHour: number = 7; // Start time of the visible block
  hoursPerPage: number = 6;
  hoveredAppointment: Appointment | null = null;

  constructor(private firebaseService: FirebaseService,  private auth: AngularFireAuth) {}

  ngOnInit(): void {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.currentPatientId= user.uid;
        this.loadDoctors(); // Załaduj listę lekarzy
        this.generateWeek(new Date());
        this.generateTimeSlots();
        this.updateDisplayedTimeSlots();
        }
      });
  }

  loadDoctors(): void {
    this.firebaseService.getDoctors().subscribe((doctors) => {
      this.doctors = doctors;
      if (this.doctors.length > 0) {
        this.selectedDoctorId = this.doctors[0].user_id; // Domyślnie wybierz pierwszego lekarza
        this.loadCalendarData();
      }
    });
  }

  loadCalendarData(): void {

    if (!this.selectedDoctorId) return;

    // Load appointments for the selected doctor
    this.firebaseService.getAppointments(this.selectedDoctorId).subscribe((appointments: Appointment[]) => {
      // Filter common appointments (current patient's appointments)
      this.commonAppointments = appointments.filter(appointment => appointment.patient_id === this.currentPatientId);

      // Filter other appointments (doctor's appointments with other patients)
      this.otherAppointments = appointments.filter(appointment => appointment.patient_id !== this.currentPatientId);

      // Here you can also update your available slots based on common_appointments and other_appointments
    });

    this.firebaseService.getAbsences(this.selectedDoctorId).subscribe((absences: Absence[]) => {
      this.absences = absences;
    });

    this.firebaseService.getAvailability(this.selectedDoctorId).subscribe((availability: Availability[]) => {
      this.availability = availability;
    });
  }

  onDoctorChange(): void {
    this.loadCalendarData(); // Załaduj dane dla wybranego lekarza
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
      const currentStartOfWeek = this.currentWeek.length ? this.currentWeek[0] : new Date();
      const dateAdjustment = action === 'previous' ? -7 : 7;
      startOfWeek = new Date(currentStartOfWeek);
      startOfWeek.setDate(startOfWeek.getDate() + dateAdjustment);
    } else {
      const today = new Date(action);
      const dayOfWeek = today.getDay();
      const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + offsetToMonday);
    }

    this.currentWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }
  
  getAppointmentsCount(day: Date): number {
    const formattedDate = day.toISOString().split('T')[0];
    return this.commonAppointments.filter(
      (appointment) => appointment.date === formattedDate
    ).length;
  }

  isAbsent(day: Date): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    return this.absences.some(absence => absence.date === formattedDate);
  }

  isAppointmentSlot(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    return this.commonAppointments.some(
      (appointment) => appointment.date === formattedDate && appointment.time === time
    );
  }

  isPastAppointment(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    const appointment = this.commonAppointments.find(
      (appt) => appt.date === formattedDate && appt.time === time
    );
    return appointment ? new Date(`${appointment.date}T${appointment.time}`).getTime() < Date.now() : false;
  }


  getAppointment(day: Date, time: string): Appointment | undefined  {
    const formattedDate = day.toISOString().split('T')[0];
    const appointment = this.commonAppointments.find(
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
    const appointment = this.commonAppointments.find(app => app.date === day.toISOString().split('T')[0] && app.time === hour);
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


isUnavailableSlot(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    // Check if it's an unavailable slot due to other appointments or absence
    const isOtherAppointment = this.otherAppointments.some(
      (appointment) => appointment.date === formattedDate && appointment.time === time
    );
    return !this.isAvailableSlot(day, time) || isOtherAppointment;
  }

  isAvailableSlot(day: Date, time: string): boolean {
    const formattedDate = day.toISOString().split('T')[0];
    const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' });
  
    // Check if the slot is free (no appointments or absences)
    const isFree = !this.commonAppointments.some(appt => appt.date === formattedDate && appt.time === time) &&
                   !this.otherAppointments.some(appt => appt.date === formattedDate && appt.time === time) &&
                   !this.absences.some(absence => absence.date === formattedDate);
  
    if (!isFree) return false;
  
    // Check if the slot matches the updated availability structure
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
  
  getDayOfWeek(date: Date): string {
    const daysOfWeek = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    return daysOfWeek[date.getDay()];
  }
  isTimeBetween(time: string, startTime: string, endTime: string): boolean {
    return time >= startTime && time <= endTime;
  }

  isBookingModalVisible: boolean = false; // Controls modal visibility
  bookingDetails: {
    length: number; // Length in minutes
    type: 'regular' | 'emergency' | 'consultation'; // Type of consultation
    patientName: string; // Patient's name
    patientSurname: string;
    gender: string; // Gender of patient
    age: number; // Age of patient
    doctorNotes: string; // Notes for the doctor
    date: string; // Selected date
    time: string; // Selected time
  } = {
    length: 30,
    type: 'regular',
    patientName: '',
    patientSurname: '',
    gender: '',
    age: 0,
    doctorNotes: '',
    date: '',
    time: '',
  };


  // Close the modal
  closeBookingModal(): void {
    
    this.isBookingModalVisible = false;
  }

  // Book the consultation
  bookConsultation(): void {
    const { date, time, length, type, patientName, gender, age, doctorNotes } = this.bookingDetails;

    // Validate slot availability
    if (!this.isAvailableSlot(new Date(date), time)) {
      alert('The selected slot is unavailable.');
      return;
    }

    // Check for conflicts with the next slots for the given length
    const requiredSlots = Math.ceil(length/30);
    const slots = this.generateTimeSlotsForLength(time, requiredSlots);
    const hasConflict = slots.some((slot) => !this.isAvailableSlot(new Date(date), slot));

    if (hasConflict) {
      alert('Conflict with the next slots. Please choose another time or reduce the consultation length.');
      return;
    }

    // Create appointment
    const newAppointment: Appointment = {
      date,
      time,
      type, 
      description: doctorNotes,
      patient_id: this.currentPatientId,
      duration : length,
      price: requiredSlots*100,
      appointment_id: `APPT-${new Date().toISOString().split('T')[0]}-${Math.floor(Math.random() * 10000)}`,
      paid : false


    };

    // Add the appointment to the database
    this.firebaseService.addAppointment(newAppointment.patient_id, newAppointment, newAppointment.appointment_id)
    this.firebaseService.addAppointment(this.selectedDoctorId, newAppointment, newAppointment.appointment_id).subscribe(() => {
      this.commonAppointments.push(newAppointment);
      alert('Consultation booked successfully!');
      this.loadCalendarData();
      this.closeBookingModal();
    });
  }

  // Generate slots based on length  
  generateTimeSlotsForLength(startTime: string, requiredSlots: number): string[] {
    const index = this.timeSlots.indexOf(startTime);
    return this.timeSlots.slice(index, index + requiredSlots);
  }

  showModal(day: Date, time: string): void {
    if (!this.isBookingModalVisible && this.isAvailableSlot(day,time)) {
      this.bookingDetails.date = day.toISOString().split('T')[0];
      this.bookingDetails.time = time;
      this.isBookingModalVisible = true;
    }
    const appointment = this.getAppointment(day, time);
  if (appointment && !this.isConfirmationModalVisible) {
    this.selectedAppointment = appointment;
    this.isConfirmationModalVisible = true; // Show the confirmation modal
  }
  
}


isConfirmationModalVisible: boolean = false;  // Flag for showing confirmation modal
  selectedAppointment: Appointment | null = null; 


confirmCancellation(): void {
  if (this.selectedAppointment) {

    this.firebaseService.deleteAppointment(this.selectedDoctorId, this.selectedAppointment.patient_id, this.selectedAppointment.appointment_id)
      this.loadCalendarData();  // Reload the calendar after cancellation
      this.closeConfirmationModal();
  }
}

closeConfirmationModal(): void {
  this.isConfirmationModalVisible = false;
  this.selectedAppointment = null;
}

}

  
