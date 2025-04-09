import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import {NgxPaginationModule} from 'ngx-pagination';
import { DoctorCalendarComponent } from './components/doctor-calendar/doctor-calendar.component';
import { DoctorAvailabilityComponent } from './components/doctor-availability/doctor-availability.component';
import { DoctorAbsenceComponent } from './components/doctor-absence/doctor-absence.component';
import { PatientCalendarComponent } from './components/patient-calendar/patient-calendar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { environment } from './environment';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { DoctorsListComponent } from './components/doctors-list/doctors-list.component';
import { HistoricalConsultationsComponent } from './components/historical-consultations/historical-consultations.component';



@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ShoppingCartComponent,
    HomePageComponent,
    DoctorCalendarComponent,
    DoctorAvailabilityComponent,
    DoctorAbsenceComponent,
    PatientCalendarComponent,
    LoginComponent,
    RegisterComponent,
    AdminSettingsComponent,
    DoctorsListComponent,
    HistoricalConsultationsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    ReactiveFormsModule,
    NgxPaginationModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
