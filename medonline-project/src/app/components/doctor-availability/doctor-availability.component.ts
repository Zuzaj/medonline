import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { map, Observable } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Availability {
  key?:string;
  type: 'cyclic' | 'one-time';
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[]; // ['Monday', 'Tuesday', ...]
  timeSlots?: TimeSlot[];
  specificDate?: string;
}

@Component({
  selector: 'app-doctor-availability',
  templateUrl: './doctor-availability.component.html',
  styleUrls: ['./doctor-availability.component.scss'],
})
export class DoctorAvailabilityComponent implements OnInit {
  availability$: Observable<Availability[]>;  // Now an Observable

  newAvailability: Availability = {
    type: 'cyclic',  // default to cyclic
    startDate: '',
    endDate: '',
    daysOfWeek: [],  // Will contain days of the week
    timeSlots: [{ startTime: '', endTime: '' }],
    specificDate: ''  // This should be set for one-time events
  };

  daysOfWeekOptions = [
    { label: 'Monday', value: 'Monday' },
    { label: 'Tuesday', value: 'Tuesday' },
    { label: 'Wednesday', value: 'Wednesday' },
    { label: 'Thursday', value: 'Thursday' },
    { label: 'Friday', value: 'Friday' },
    { label: 'Saturday', value: 'Saturday' },
    { label: 'Sunday', value: 'Sunday' },
  ];

  userId = ''; 

  constructor(private db: AngularFireDatabase, private auth: AngularFireAuth) {}

  ngOnInit(): void {
    this.auth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.fetchAvailability();
      }
    });
  }
  
  fetchAvailability(): void {
    this.availability$ = this.db
      .list(`users/${this.userId}/availability`)
      .valueChanges()
      .pipe(
        map((data: any) =>
          data.map((item: any) => ({
            key: item.key,
            type: item.type, // Directly use the 'type' field from the payload
            startDate: item.startDate, // Directly use 'startDate'
            endDate: item.endDate, // Directly use 'endDate'
            daysOfWeek: item.type === 'cyclic' ? (item.daysOfWeek?.split(', ') || []) : [], // Only split if 'cyclic'
            timeSlots: item.timeSlots || [], // Use 'timeSlots' as is
            specificDate: item.type !== 'cyclic' ? item.startDate : undefined, // 'specificDate' for 'one-time'
          }))
        )
      );
  }
  
  
  addTimeSlot(): void {
    this.newAvailability.timeSlots!.push({ startTime: '', endTime: '' });
  }

  removeTimeSlot(index: number): void {
    this.newAvailability.timeSlots!.splice(index, 1);
  }

  saveAvailability(): void {
    const availabilityKey = this.db.createPushId();
    
    // Ensure timeSlots is always an array
    const timeSlots = this.newAvailability.timeSlots ?? [];
  
    // Prepare the payload while preserving the 'cyclic' type structure
    const payload = this.newAvailability.type === 'cyclic'
      ? {
          key: availabilityKey,
          type: 'cyclic', // Keep 'cyclic' structure for type
          startDate: this.newAvailability.startDate,
          endDate: this.newAvailability.endDate,
          daysOfWeek: this.newAvailability.daysOfWeek?.join(', '), // Store as comma-separated string
          timeSlots: timeSlots, // Directly use timeSlots as it is
        }
      : {
          key: availabilityKey,
          type: 'one-time', // Keep 'one-time' structure for type
          startDate: this.newAvailability.specificDate,
          endDate: this.newAvailability.specificDate,
          timeSlots: timeSlots, // Directly use timeSlots as it is
        };
  
    // Save the availability to the database
    this.db
      .object(`users/${this.userId}/availability/${availabilityKey}`)
      .set(payload)
      .then(() => {
        this.fetchAvailability(); // Refresh availability after saving.
        this.resetForm();
      })
      .catch((error) => console.error('Error saving availability:', error));
  }
  

  resetForm(): void {
    this.newAvailability = {
      type: 'cyclic',
      daysOfWeek: [],
      timeSlots: [{ startTime: '', endTime: '' }],
    };
  }

  toggleDaySelection(day: string): void {
    if (!this.newAvailability.daysOfWeek) {
      this.newAvailability.daysOfWeek = [];
    }

    const index = this.newAvailability.daysOfWeek.indexOf(day);
    if (index === -1) {
      this.newAvailability.daysOfWeek.push(day);
    } else {
      this.newAvailability.daysOfWeek.splice(index, 1);
    }
  }

  deleteAvailability(availabilityKey: string): void {
    // Delete the availability entry from the database
    this.db
      .object(`users/${this.userId}/availability/${availabilityKey}`)
      .remove()
      .then(() => {
        this.fetchAvailability(); // Refresh availability after deletion.
      })
      .catch((error) => console.error('Error deleting availability:', error));
  }
}
