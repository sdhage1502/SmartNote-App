import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async signIn() {
    this.isLoading = true;
    try {
      await this.authService.signInAnonymously();
      this.router.navigate(['/notes']);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }
}