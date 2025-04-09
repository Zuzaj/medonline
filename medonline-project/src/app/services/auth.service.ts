import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import firebase from 'firebase/compat/app'; 

export type PersistenceMode = 'local' | 'session' | 'none';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private persistenceMode: PersistenceMode = 'session'; 
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  public userRole$ = this.userRoleSubject.asObservable();


  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private userNameSubject = new BehaviorSubject<string | null>(null);  // Add userNameSubject
  public userName$ = this.userNameSubject.asObservable();


  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.isAuthenticatedSubject.next(true);
        this.setUserRole(user.uid); // Fetch role after login
        this.setUserName(user.uid); 
      } else {
        this.isAuthenticatedSubject.next(false);
        this.userRoleSubject.next(null); // Set role to null if not authenticated
        this.userNameSubject.next(null)
      }
    });
  }

  setPersistenceMode(mode: PersistenceMode): void {
    this.persistenceMode = mode;
    this.applyPersistenceMode();
  }

  private applyPersistenceMode(): void {
    let persistence;
    switch (this.persistenceMode) {
      case 'local':
        persistence = this.afAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        break;
      case 'session':
        persistence = this.afAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        break;
      case 'none':
        persistence = this.afAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        break;
    }

    persistence
      .then(() => console.log(`Persistence mode set to: ${this.persistenceMode}`))
      .catch((error) => console.error('Error setting persistence mode', error));
  }

  // Get the current persistence mode
  getPersistenceMode(): PersistenceMode {
    return this.persistenceMode;
  }


  // Login method
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(userCredential => {
        const uid = userCredential.user?.uid;
        if (uid) {
            console.log('uid', uid);
          this.setUserRole(uid);
          this.setUserName(uid);
          return userCredential.user;
        }
        return null;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of(null);
      })
    );
  }

  // Set user role after login
  private setUserRole(uid: string): void {
    this.db
      .object(`users/${uid}`)
      .valueChanges()
      .pipe(
        map((user: any) => {
          const role = user?.type; // 'doctor' or 'patient'
          this.userRoleSubject.next(role); // Update role in the observable
        }),
        catchError(error => {
          console.error('Error fetching user role:', error);
          this.userRoleSubject.next(null);
          return of(null);
        })
      )
      .subscribe();
  }

  private setUserName(uid: string): void {
    this.db
      .object(`users/${uid}`)
      .valueChanges()
      .pipe(
        map((user: any) => {
          const name = user?.name;  // Assuming name is stored in the 'name' field
          this.userNameSubject.next(name); // Update user name in the observable
        }),
        catchError(error => {
          console.error('Error fetching user name:', error);
          this.userNameSubject.next(null);
          return of(null);
        })
      )
      .subscribe();
  }

  // Logout method
  logout(): void {
    this.afAuth.signOut().then(() => {
      this.isAuthenticatedSubject.next(false);
      this.userRoleSubject.next(null); // Clear role on logout
    });
  }

  // Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated$.pipe(
      map(authenticated => authenticated)
    );
  }

  // Fetch the current user role
  getUserRole(): Observable<string | null> {
    return this.userRole$.pipe(
      map(role => role)
    );
  }

  // Sign up a new user (example, if needed)
  register(name: string, surname: string, email: string, password: string, type: string, specialization?: string): Observable<any> {
    console.log('Registering user:', { name, surname, email, type });
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
      map(userCredential => {
        console.log('User registered:', userCredential);
        const uid = userCredential.user?.uid;
        if (uid) {
          this.db.object(`users/${uid}`).set({
            email,
            name,
            surname,
            type,
            user_id: uid,
            created_at: new Date().toISOString(),
            specialization
          });
          return userCredential.user;
        }
        return null;
      }),
      catchError(error => {
        console.error('Signup error:', error.message);
        throw new Error(error.message || 'Registration failed');
      })
    );
}

// Delete a user by their ID
deleteUser(userId: string): Observable<any> {
  return new Observable(observer => {
    this.db.object(`users/${userId}`).remove()
      .then(() => {
        observer.next({ success: true });
        observer.complete();
      })
      .catch(error => {
        console.error('Error deleting user:', error);
        observer.error(error);
      });
  });
}

  
}
