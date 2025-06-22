import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User, signOut } from 'firebase/auth';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth;
  private userSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    try {
      const app = initializeApp(environment.firebase);
      this.auth = getAuth(app);
      this.auth.onAuthStateChanged(
        (user) => this.userSubject.next(user),
        (error) => console.error('Auth state change error:', error)
      );
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  async signInAnonymously() {
    try {
      const { user } = await signInAnonymously(this.auth);
      return user;
    } catch (error) {
      console.error('Anonymous login failed:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.userSubject.next(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  get currentUser() {
    return this.userSubject.asObservable();
  }
}