import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';
import { AuthenticationService, LoginRequest } from '../../services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);

  constructor(
    private authenticationService: AuthenticationService,
    private storage: LocalStorageService
  ) {}

  userForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rememberMe: new FormControl(false)
  });

  login(): void {
    const formValue = this.userForm.value;

    if (!formValue.username || !formValue.password) {
      alert('Please provide both username and password.');
      return;
    }

    const request: LoginRequest = {
      username: formValue.username,
      password: formValue.password
    };

    this.storage.remove('access_token');

    this.authenticationService.login(formValue.username, formValue.password).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        this.storage.set('access_token', res.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.storage.remove('access_token');
        alert('Login failed. Please check your credentials.');
      }
    });
  }
}
