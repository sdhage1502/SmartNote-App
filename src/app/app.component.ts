import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth, signOut, user } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  isOnline = signal(navigator.onLine);
  userName = signal('Guest');

  constructor(private auth: Auth) {
    // Track online/offline status
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Track user auth state
    effect(() => {
      user(this.auth).subscribe(currentUser => {
        this.userName.set(currentUser ? 'Anonymous User' : 'Guest');
      });
    });
  }

  async signOut() {
    await signOut(this.auth);
  }
}
