import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Intercepting request to:', req.url);
    
    const authToken = this.authService.getToken();

    // Add auth header to all requests except auth endpoints
    let authReq = req;
    if (authToken && !this.isAuthEndpoint(req.url)) {
      authReq = this.addTokenHeader(req, authToken);
      console.log('Added auth header to request');
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('HTTP Error occurred:', error.status, error.message);
        
        // Handle 401 errors - simple logout for now
        if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
          console.log('401 error - token expired or invalid, logging out');
          this.authService.logout();
          return throwError(() => error);
        }
        
        // Handle 403 errors
        if (error.status === 403) {
          console.warn('403 error - access forbidden, insufficient privileges');
          this.router.navigate(['/unauthorized']);
        }
        
        return throwError(() => error);
      })
    );
  }

  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/logout'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}