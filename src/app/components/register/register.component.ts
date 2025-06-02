import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';
import { AuthenticationService, RegisterRequest } from '../../services/authentication.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  constructor(private authenticationService: AuthenticationService, private storage: LocalStorageService) { }

  msg: string | undefined;

  // Updated form to include email field
  signupForm: FormGroup = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    address: new FormControl(''),
    mobileno: new FormControl(''),
    age: new FormControl('')
  })

  public onSubmit() {
    if (!this.signupForm.valid) {
      this.msg = 'Please fill in all required fields correctly.';
      return;
    }

    this.storage.remove('auth-key');

    const formValue = this.signupForm.value;

    const request: RegisterRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
      address: formValue.address,
      mobileno: formValue.mobileno,
      age: formValue.age,
      roleNames: ['ROLE_VIEWER'] 
    };
console.log(request);

    this.authenticationService.register(request).subscribe({
      next: (res) => {
        console.log('Registration successful:', res);
        this.msg = 'Registration successful!';
        // Store the access token
        this.storage.set('auth-key', res.accessToken);
      },
      error: (err) => {
        console.log("Registration error:", err);
        if (err.error && err.error.message) {
          this.msg = err.error.message;
        } else if (err.message) {
          this.msg = err.message;
        } else {
          this.msg = 'Registration failed. Please try again.';
        }
      }
    })
  }
}