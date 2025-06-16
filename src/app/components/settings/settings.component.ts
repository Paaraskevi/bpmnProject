
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../services/notification.service';
import { AuthenticationService, User } from '../../services/authentication.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

export interface UserService {
  profile: {
    firstName: string; 
    lastName: string;
    email: string;
    address: string;
    phone: string;
    profilePicture: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      push: boolean;
    };
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
  settings: {
    activeTab: string;
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  activeTab = 'profile';
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;
  securityForm!: FormGroup;
  passwordForm!: FormGroup;

  loading = false;
  saving = false;

  languages = [
    { code: 'en', name: 'English' },
    { code: 'gr', name: 'Greek' },
  ];

  timezones = [
    { value: 'UTC', name: 'UTC' },
    { value: 'Europe/Athens', name: 'Europe/Athens' },
    { value: 'America/New_York', name: 'America/New_York' }
  ];

  dateFormats = [
    { value: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', name: 'YYYY-MM-DD' }
  ];

  // Permission flags
  canView: boolean = false;
  canEdit: boolean = false;
  canDelete: boolean = false;
  canCreate: boolean = false;
  isViewerOnly: boolean = false;
  isAdmin: boolean = false;
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    if (!this.checkAccess()) {
      return
    }
    this.loadUserSettings();
  }

  checkAccess(): boolean {
    if (!this.authenticationService.isLoggedIn()) {
      this.notificationService.showError('Please log in to access settings');
      this.router.navigate(['/login']);
      return false;
    }

    this.currentUser = this.authenticationService.getCurrentUser();
    
    // Set permission flags
    this.isAdmin = this.authenticationService.isAdmin();
    this.canView = this.authenticationService.canView() || this.isAdmin;
    this.canEdit = this.authenticationService.canEdit() || this.isAdmin;
    //this.canDelete = this.authenticationService.canDelete() || this.isAdmin;
    
    this.isViewerOnly = this.authenticationService.isViewer() &&
      !this.authenticationService.isModeler() &&
      !this.isAdmin;

    // Allow access if user has at least view permissions or is admin
    if (!this.canView && !this.isAdmin) {
      this.notificationService.showError('You do not have permission to access settings');
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      phone: [''],
      profilePicture: ['']
    });

    this.preferencesForm = this.fb.group({
      theme: ['light'],
      language: ['en'],
      timezone: ['UTC'],
      dateFormat: ['MM/DD/YYYY'],
      notifications: this.fb.group({
        email: [true],
        inApp: [true],
        push: [true]
      })
    });

    this.securityForm = this.fb.group({
      twoFactorAuth: [false],
      sessionTimeout: [30, [Validators.min(1), Validators.max(480)]],
      loginNotifications: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator.bind(this) });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  loadUserSettings(): void {
    this.loading = true;
    this.settingsService.getUserSettings().subscribe({
      next: (settings: UserService) => {
        this.profileForm.patchValue(settings.profile);
        this.preferencesForm.patchValue(settings.preferences);
        this.securityForm.patchValue(settings.security);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Settings load error:', error);
        this.notificationService.showError('Failed to load settings');
        this.loading = false;
      }
    });
  }

  onSaveProfile(): void {
    if (!this.canEdit && !this.isAdmin) {
      this.notificationService.showError('You do not have permission to edit settings');
      return;
    }

    if (this.profileForm.valid) {
      this.saving = true;
      this.settingsService.updateProfile(this.profileForm.value).subscribe({
        next: (response:any) => {
          this.notificationService.showSuccess('Profile updated successfully');
          this.saving = false;
        },
        error: (error:any) => {
          this.notificationService.showError('Failed to update profile');
          this.saving = false;
        }
      });
    }
  }

  onSavePreferences(): void {
    if (!this.canEdit && !this.isAdmin) {
      this.notificationService.showError('You do not have permission to edit settings');
      return;
    }

    if (this.preferencesForm.valid) {
      this.saving = true;
      this.settingsService.updatePreferences(this.preferencesForm.value).subscribe({
        next: (response:any) => {
          this.notificationService.showSuccess('Preferences updated successfully');
          this.saving = false;
        },
        error: (error:any) => {
          this.notificationService.showError('Failed to update preferences');
          this.saving = false;
        }
      });
    }
  }

  onSaveSecurity(): void {
    if (!this.canEdit && !this.isAdmin) {
      this.notificationService.showError('You do not have permission to edit security settings');
      return;
    }

    if (this.securityForm.valid) {
      this.saving = true;
      this.settingsService.updateSecurity(this.securityForm.value).subscribe({
        next: (response:any) => {
          this.notificationService.showSuccess('Security settings updated successfully');
          this.saving = false;
        },
        error: (error:any) => {
          this.notificationService.showError('Failed to update security settings');
          this.saving = false;
        }
      });
    }
  }

  onChangePassword(): void {
    if (!this.canEdit && !this.isAdmin) {
      this.notificationService.showError('You do not have permission to change password');
      return;
    }

    if (this.passwordForm.valid) {
      this.saving = true;
      this.settingsService.changePassword(this.passwordForm.value).subscribe({
        next: (response:any) => {
          this.notificationService.showSuccess('Password changed successfully');
          this.passwordForm.reset();
          this.saving = false;
        },
        error: (error:any) => {
          this.notificationService.showError('Failed to change password');
          this.saving = false;
        }
      });
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  hasRole(role: string): boolean {
    return this.authenticationService.hasRole(role);
  }

  get isFormDisabled(): boolean {
    return this.isViewerOnly && !this.isAdmin;
  }
}