import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonModule, CardModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async login() {
    try {
      await this.authService.signInAnonymously();
      this.router.navigate(['/notes']);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
}