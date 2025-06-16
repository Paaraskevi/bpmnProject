import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../components/settings/settings.component';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = 'http://localhost:4200"/api/settings'; // Adjust based on your backend URL

  constructor(private http: HttpClient) { }

  private getHttpOptions() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  getUserSettings(): Observable<UserService> {
    return this.http.get<UserService>(`${this.apiUrl}/user`, this.getHttpOptions())
      .pipe(
        catchError(this.handleError<UserService>('getUserSettings', this.getDefaultSettings()))
      );
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profile, this.getHttpOptions())
      .pipe(catchError(this.handleError<any>('updateProfile')));
  }

  updatePreferences(preferences: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferences`, preferences, this.getHttpOptions())
      .pipe(catchError(this.handleError<any>('updatePreferences')));
  }

  updateSecurity(security: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/security`, security, this.getHttpOptions())
      .pipe(catchError(this.handleError<any>('updateSecurity')));
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/password`, passwordData, this.getHttpOptions())
      .pipe(catchError(this.handleError<any>('changePassword')));
  }

  private getDefaultSettings(): UserService {
    return {
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        phone: '',
        profilePicture: ''
      },
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        notifications: {
          email: true,
          inApp: true,
          push: true
        }
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        loginNotifications: false
      },
      settings: {
        activeTab: 'profile'
      }
    };
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}