import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
 private baseUrl = 'http://localhost:8080/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check for existing token on service initialization
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('current_user');
    
    if (token && userData) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  // Authentication Methods
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials, this.getHttpOptions())
      .pipe(
        map(response => {
          this.setAuthData(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData, this.getHttpOptions())
      .pipe(
        map(response => {
          this.setAuthData(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    // Call backend logout endpoint
    this.http.post(`${this.baseUrl}/logout`, {}, this.getAuthHeaders()).subscribe({
      complete: () => this.clearAuthData()
    });
    
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, 
      { refreshToken }, this.getHttpOptions())
      .pipe(
        map(response => {
          this.setAuthData(response);
          return response;
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  // User Management
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`, this.getAuthHeaders());
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, userData, this.getAuthHeaders())
      .pipe(
        map(user => {
          this.currentUserSubject.next(user);
          localStorage.setItem('current_user', JSON.stringify(user));
          return user;
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/change-password`, 
      { oldPassword, newPassword }, this.getAuthHeaders());
  }

  // Role and Permission Methods
  getUserRoles(): string[] {
    const user = this.getCurrentUserValue();
    return user ? user.roles.map(role => role.name) : [];
  }

  hasRole(roleName: string): boolean {
    const user = this.getCurrentUserValue();
    return user ? user.roles.some(role => role.name === roleName) : false;
  }

  hasPermission(resource: string, action: string): boolean {
    const user = this.getCurrentUserValue();
    if (!user) return false;

    return user.roles.some(role => 
      role.permissions.some(permission => 
        permission.resource === resource && permission.action === action
      )
    );
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(role => this.hasRole(role));
  }

  // Admin Methods
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`, this.getAuthHeaders());
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`, this.getAuthHeaders());
  }

  updateUserRoles(userId: string, roleIds: string[]): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${userId}/roles`, 
      { roleIds }, this.getAuthHeaders());
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${userId}/deactivate`, 
      {}, this.getAuthHeaders());
  }

  activateUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/users/${userId}/activate`, 
      {}, this.getAuthHeaders());
  }

  // Role Management
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles`, this.getAuthHeaders());
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.baseUrl}/roles`, role, this.getAuthHeaders());
  }

  updateRole(id: string, role: Partial<Role>): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/roles/${id}`, role, this.getAuthHeaders());
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${id}`, this.getAuthHeaders());
  }

  // Utility Methods
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token != null && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private setAuthData(response: AuthResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    
    this.tokenSubject.next(response.token);
    this.currentUserSubject.next(response.user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  private handleError(error: any) {
    console.error('Auth service error:', error);
    return throwError(() => error);
  }
}
