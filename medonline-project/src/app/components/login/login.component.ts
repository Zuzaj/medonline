import {Component} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    auth: AuthService
    router: Router
    email: string
    emailError: string
    password: string
    passwordError: string

    constructor(auth: AuthService, router: Router) {
        this.auth = auth
        this.router = router
        this.email = ""
        this.emailError = ""
        this.password = ""
        this.passwordError = ""
    }

    updateEmail(event: any) {
        this.email = event.target.value
    }

    updatePassword(event: any) {
        this.password = event.target.value
    }

    cancel() {
        this.router.navigate(['/home']).catch(e => console.log(e))
    }

    async login() {
        this.emailError = "";
        this.passwordError = "";
    
        if (!this.email) this.emailError = "Email cannot be empty";
        if (!this.password) this.passwordError = "Password cannot be empty";
    
        if (this.emailError || this.passwordError) return;
    
        try {
            console.log("Attempting login...");
            await this.auth.login(this.email, this.password).toPromise(); 
            this.router.navigate(['/home']);
            console.log("Login successful!");
        } catch (error: any) {
            this.passwordError = "Invalid credentials";
            console.error("Login failed:", error);
        }
    }
    

}