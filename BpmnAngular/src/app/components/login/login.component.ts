import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';
import { LoginRequest } from '../../services/authentication.service';
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
  request: LoginRequest = { username: '', password: '' }

  userForm: FormGroup = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    rememberMe: new FormControl(false)
  });

  login() {

    this.storage.remove('auth-key');
    
    const formValue =  this.userForm.value;

    if(formValue.username == '' || formValue.password == '') {
      alert('Wrong Credentilas');
      return;
    }

;
    this.request.username = formValue.username;
    this.request.password = formValue.password;

    this.authenticationService.login(this.request).subscribe({
      next:(res) => {
        console.log("Received Response:"+res.accessToken);
        this.router.navigate(['/dashboard']);
        this.storage.set('auth-key', res.accessToken);

      }, error: (err:any) => {
        console.log("Error Received Response:"+err);
        this.storage.remove('auth-key');
      }
    });
  }
}
