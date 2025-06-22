import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  isOnline$: Observable<boolean>;
  userName$: Observable<string>;

  constructor(private auth: AngularFireAuth) {
    this.isOnline$ = of(navigator.onLine);
    this.userName$ = this.auth.user.pipe(
      map(user => (user ? 'Anonymous User' : 'Guest'))
    );
  }

  ngOnInit() {
    window.addEventListener('online', () => (this.isOnline$ = of(true)));
    window.addEventListener('offline', () => (this.isOnline$ = of(false)));
  }

  async signOut() {
    await this.auth.signOut();
  }
}
