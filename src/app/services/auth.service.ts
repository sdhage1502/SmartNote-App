import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, onAuthStateChanged, signInAnonymously, signOut, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private _user = signal<User | null>(null);

  // Readonly signal for components to consume
  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());

  constructor() {
    // Listen to auth state
    onAuthStateChanged(this.auth, (user) => {
      this._user.set(user);
    });
  }

  async signInAnonymously(): Promise<void> {
    await signInAnonymously(this.auth);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  // For reactive use in components (optional)
  user$(): Observable<User | null> {
    return new Observable((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        observer.next(user);
      });
      return { unsubscribe };
    });
  }
}
