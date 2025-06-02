import { Component, inject } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(
    private authenticationService: AuthenticationService,
    private storage: LocalStorageService
  ) { }

  router = inject(Router);

  userForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rememberMe: new FormControl(false)
  });

  login() {
    this.storage.remove('auth-key');

    const formValue = this.userForm.value;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      alert('Please fill in all fields correctly.');
      return;
    }

    const request = {
      email: formValue.username,
      password: formValue.password
    };

    this.authenticationService.login(request).subscribe({
      next: (res) => {
        this.setSession(res);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.storage.remove('auth-key');
        alert('Login failed. Please check your credentials.');
      }
    });
  } private setSession(response: any): void {
    const expiresAt = Date.now() + response.expiresIn * 1000; 

    this.storage.set('auth-key', response.access_token);
    this.storage.set('refresh-token', response.refresh_token);
    this.storage.set('user', JSON.stringify(response.user));
    this.storage.set('expires-at', expiresAt.toString());
  }

}
