import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { DoctorCalendarComponent } from './components/doctor-calendar/doctor-calendar.component';
import { DoctorAvailabilityComponent } from './components/doctor-availability/doctor-availability.component';
import { DoctorAbsenceComponent } from './components/doctor-absence/doctor-absence.component';
import { PatientCalendarComponent } from './components/patient-calendar/patient-calendar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './auth.guard';
import { AdminSettingsComponent } from './components/admin-settings/admin-settings.component';
import { DoctorsListComponent } from './components/doctors-list/doctors-list.component';
import { HistoricalConsultationsComponent } from './components/historical-consultations/historical-consultations.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent }, // Public route
  { path: 'register', component: RegisterComponent }, // Public route
  { path: 'home', component: HomePageComponent }, // Public route
  { path: 'doctors-list', component: DoctorsListComponent},
  { path: 'koszyk-zakupowy', component: ShoppingCartComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'doctor-calendar', component: DoctorCalendarComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'availability', component: DoctorAvailabilityComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'absence', component: DoctorAbsenceComponent, canActivate: [AuthGuard] }, // Protected route
  { path: 'harmonogram', component: PatientCalendarComponent, canActivate: [AuthGuard] }, // Protected route
  {path: 'admin-settings', component: AdminSettingsComponent, canActivate: [AuthGuard]},
  {path: 'historia', component: HistoricalConsultationsComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: 'home', pathMatch: 'full' }, // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
