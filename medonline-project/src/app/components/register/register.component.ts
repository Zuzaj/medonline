import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import { FirebaseService } from '../../services/firebase.service';
import { map,Observable } from 'rxjs';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
    isAdmin$: Observable<boolean>;
    auth: AuthService
    router: Router

    name: string
    nameError: string
    surname: string
    surnameError: string
    email: string
    emailError: string
    password: string
    passwordError: string
    type: string = ""; // Default to "patient"
    patientTypeError: string = "";
    specialization? : string
    specializationError: string = ""

    constructor(auth: AuthService, router: Router, private firebaseService: FirebaseService) {
        this.auth = auth
        this.router = router
        this.name = ""
        this.nameError = ""
        this.surname = ""
        this.surnameError = ""
        this.email = ""
        this.emailError = ""
        this.password = ""
        this.passwordError = ""
        this.type = ""
        this.patientTypeError= ""
        this.specialization = ""
        this.specializationError = ""
        this.checkAdminStatus();
    }

    ngOnInit() {
        this.isAdmin$.subscribe(isAdmin => {
            this.type = isAdmin ? 'doctor' : 'patient';
        });
    }

    private checkAdminStatus(): void {
        this.isAdmin$ = this.auth.getUserRole().pipe(
          map(role => role === 'admin') 
        );
      }

    updateName(event: any) {
        this.name = event.target.value
    }

    updateSurname(event: any) {
        this.surname = event.target.value
    }

    updateEmail(event: any) {
        this.email = event.target.value
    }

    updatePassword(event: any) {
        this.password = event.target.value
    }

    updatePatientType(event: any) {
        this.type = event.target.value;
    }

    updateSpecialization(event: any) {
        this.specialization = event.target.value;
    }

    cancel() {
        this.router.navigate(['/home']).catch(e => console.log(e))
    }

    async submit() {
        this.nameError = '';
        this.surnameError = '';
        this.emailError = '';
        this.passwordError = '';
        this.patientTypeError = '';
        this.specializationError = '';
    
        if (!this.name) this.nameError = 'Name cannot be empty';
        if (!this.surname) this.surnameError = 'Surname cannot be empty';
        if (!this.email) this.emailError = 'Email cannot be empty';
        if (!this.password) this.passwordError = 'Password cannot be empty';
        if (!this.type) this.patientTypeError = 'Please select a type';
        // if (!this.specialization) this.specializationError = 'Please select a specialization';
    
        if (this.nameError || this.surnameError || this.emailError || this.passwordError || this.patientTypeError || this.specializationError) {
            return;
        }
    
        try {
            const result = await this.auth.register(this.name, this.surname, this.email, this.password, this.type, this.specialization).toPromise();
            console.log('Registration successful:', result);
            // if (this.isAdmin$){
            //     this.ngOnInit();
            //     this.router.navigate(['doctors-list']);
            // }
            // else{
                this.router.navigate(['/home']);
            // }
        } catch (error: any) {
            console.error('Registration failed:', error.message);
            this.passwordError = error.message || 'Registration failed';
        }
    }
    
    

}