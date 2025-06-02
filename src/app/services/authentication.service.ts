import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  enabled: boolean;
}

export interface Role {
  id: number;
  name: string;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface AuthenticationResponse {
  accessToken:string;
  refreshToken:string;
  token: string;
  type: string;
  user: User;
  expiresIn?: number;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  address?: string;
  mobileno?: string;
  age?: string;
  roleNames?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly API_URL = 'http://localhost:8080/api/v1/auth';
  private readonly TOKEN_KEY = 'accessToken';
  private readonly USER_KEY = 'currentUser';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check token validity on service initialization
    this.checkTokenValidity();
  }

  private getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  private checkTokenValidity(): void {
    const token = this.getToken();
    if (token && this.isTokenExpired(token)) {
      this.logout();
    }
  }

  // Authentication Methods
 login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, credentials, { responseType: 'text' });
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, JSON.stringify(userData))
      .pipe(catchError(this.handleError));
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthenticationResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthenticationResponse>(`${this.API_URL}/refresh-token`, {
      refreshToken: refreshToken
    }).pipe(
      map(response => {
        if (response.token) {
          this.setSession(response);
        }
        return response;
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Session Management
  private setSession(authResult: AuthenticationResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, authResult.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(authResult.user));

      this.tokenSubject.next(authResult.token);
      this.currentUserSubject.next(authResult.user);
    }
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('refreshToken');
    }

    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  // Token Methods
  getToken(): string | null {
    return localStorage.getItem('auth-key');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token != null && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const expiry = this.getTokenExpiration(token);
      return expiry ? expiry <= Date.now() : true;
    } catch (error) {
      return true;
    }
  }

  private getTokenExpiration(token: string): number | null {
    try {
      const payload = this.getTokenPayload(token);
      return payload.exp ? payload.exp * 1000 : null;
    } catch (error) {
      return null;
    }
  }

  private getTokenPayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      return null;
    }
  }

  // User and Role Methods
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.roles) return false;

    return user.roles.some(role =>
      role.name === roleName || role.name === `ROLE_${roleName.toUpperCase()}`
    );
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(role => this.hasRole(role));
  }

  hasAllRoles(roleNames: string[]): boolean {
    return roleNames.every(role => this.hasRole(role));
  }

  // Permission Methods
  canEdit(): boolean {
    return this.hasAnyRole(['MODELER', 'ADMIN']) ||
      this.hasAnyRole(['ROLE_MODELER', 'ROLE_ADMIN']);
  }

  canView(): boolean {
    return this.hasAnyRole(['VIEWER', 'MODELER', 'ADMIN']) ||
      this.hasAnyRole(['ROLE_VIEWER', 'ROLE_MODELER', 'ROLE_ADMIN']);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('ROLE_ADMIN');
  }

  isModeler(): boolean {
    return this.hasRole('MODELER') || this.hasRole('ROLE_MODELER');
  }

  isViewer(): boolean {
    return this.hasRole('VIEWER') || this.hasRole('ROLE_VIEWER');
  }

  // User Profile Methods
  updateCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/user`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => {
        this.setCurrentUser(user);
        return user;
      }),
      catchError(this.handleError)
    );
  }

  private setCurrentUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  // HTTP Headers
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Utility Methods
  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles?.map(role => role.name) || [];
  }

  getUserRoleNames(): string[] {
    return this.getUserRoles().map(role =>
      role.startsWith('ROLE_') ? role.substring(5) : role
    );
  }

  // Error Handling
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  // Token Auto-Refresh (Optional)
  startTokenRefreshTimer(): void {
    const token = this.getToken();
    if (!token) return;

    const expiration = this.getTokenExpiration(token);
    if (!expiration) return;

    const timeout = expiration - Date.now() - (5 * 60 * 1000); // Refresh 5 minutes before expiry

    if (timeout > 0) {
      setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => this.startTokenRefreshTimer(),
          error: () => this.logout()
        });
      }, timeout);
    }
  }
}