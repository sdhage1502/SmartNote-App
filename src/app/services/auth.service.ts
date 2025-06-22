import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<any>;

  constructor(private auth: AngularFireAuth) {
    this.user$ = this.auth.user;
  }

  async signInAnonymously(): Promise<void> {
    await this.auth.signInAnonymously();
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map((user) => !!user));
  }
}
