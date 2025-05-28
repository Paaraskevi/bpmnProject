import { Component, inject } from '@angular/core';
import { IntegrationService } from '../../services/integration.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  constructor(
    private integration: IntegrationService,
    private storage: LocalStorageService
  ) {}

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
      username: formValue.username,
      password: formValue.password
    };

    this.integration.doLogin(request).subscribe({
      next: (res) => {
        this.storage.set('auth-key', res.token);
      },
      error: () => {
        this.storage.remove('auth-key');
        alert('Login failed. Please check your credentials.');
      }
    });
  }
}
