import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntegrationService } from '../../services/integration.service';
import { LocalStorageService } from '../../services/local-storage.service';
import { SignupRequest } from '../../models/signup-request';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  constructor(private authenticationService: AuthenticationService, private storage: LocalStorageService) { }

  request: SignupRequest = new SignupRequest;
  msg: string | undefined;

  signupForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    mobileno: new FormControl('', [Validators.required]),
    age: new FormControl('', [Validators.required])
  })

  public onSubmit() {
    this.storage.remove('auth-key');

    const formValue =  this.signupForm.value;

    this.request.name = formValue.name;
    this.request.username = formValue.username;
    this.request.password = formValue.password;
    this.request.mobileno = formValue.mobileno;
    this.request.address = formValue.address;
    this.request.age = formValue.age;

    if (this.signupForm.valid) {
      console.log("Form is valoid");

      this.authenticationService.register(this.request).subscribe({
        next: (res) => {
          console.log(res);

          this.msg = 'Registration successful!';
        }, error: (err) => {
          console.log("Error Received:", err);
        }
      })
    } else {
      console.log("On submit failed.");
    }
  }
}
