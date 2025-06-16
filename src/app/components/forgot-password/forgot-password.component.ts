import { Component } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  constructor(private authenticationService: AuthenticationService) {
  }

  // ngOnInit() {
  //   this.forgotPasswordForm = this.formBuilder.group({
  //     email: ['', [Validators.required, Validators.email]]
  //   });
  // }
  // hadle
}
