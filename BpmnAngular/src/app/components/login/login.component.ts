import { Component, inject } from '@angular/core';
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
      username: formValue.username,
      password: formValue.password
    };

    this.authenticationService.login(request).subscribe({
      next: (res) => {
        console.log('Login response:', res); 
        this.setSession(res);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.storage.remove('auth-key');

        let errorMessage = 'Login failed. Please check your credentials.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Invalid username or password.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        alert(errorMessage);
      }
    });
  }

  private setSession(response: any): void {
    console.log('Setting session with response:', response); 
  
    if (!response.accessToken) {
      console.error('No access token in response');
      alert('Login failed: Invalid response from server');
      return;
    }
    let expiresAt: number;
    if (response.expiresIn) {
      if (response.expiresIn < 1000000000000) {
        // Seems to be seconds (duration), convert to timestamp
        expiresAt = Date.now() + (response.expiresIn * 1000);
      } else {

        expiresAt = response.expiresIn;
      }
    } else {
  
      expiresAt = Date.now() + (60 * 60 * 1000);
    }

    this.storage.set('auth-key', response.accessToken);  
    
    if (response.refreshToken) {
      this.storage.set('refresh-token', response.refreshToken);  
    }
    
    if (response.user) {
      this.storage.set('user', JSON.stringify(response.user));
    }
    
    this.storage.set('expires-at', expiresAt.toString());
    
    console.log('Session set successfully'); 
  }
}