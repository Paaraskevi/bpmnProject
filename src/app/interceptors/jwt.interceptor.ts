// import { Injectable } from '@angular/core';
// import {
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpInterceptor,
//   HttpErrorResponse
// } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { AuthenticationService } from '../services/authentication.service';
// import { Router } from '@angular/router';

// @Injectable()
// export class JwtInterceptor implements HttpInterceptor {

//   constructor(
//     private authService: AuthenticationService,
//     private router: Router
//   ) { }

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     console.log('JWT Interceptor - Processing request to:', req.url);
    
//     const authToken = this.authService.getToken();
//     console.log('JWT Interceptor - Auth token present:', !!authToken);

//     // Add auth header to all requests except auth endpoints
//     let authReq = req;
//     if (authToken && !this.isAuthEndpoint(req.url)) {
//       authReq = this.addTokenHeader(req, authToken);
//       console.log('JWT Interceptor - Added auth header to request');
//       console.log('JWT Interceptor - Request headers:', authReq.headers.keys());
//     }

//     return next.handle(authReq).pipe(
//       catchError((error: HttpErrorResponse) => {
//         console.log('JWT Interceptor - HTTP Error occurred:', error.status, error.message);
//         console.log('JWT Interceptor - Error details:', error);
        
//         // Handle 401 errors - token expired or invalid
//         if (error.status === 401 && !this.isAuthEndpoint(req.url)) {
//           console.log('JWT Interceptor - 401 error, logging out user');
//           this.authService.logout();
//           return throwError(() => error);
//         }
        
//         // Handle 403 errors - insufficient permissions
//         if (error.status === 403) {
//           console.warn('JWT Interceptor - 403 error - access forbidden');
//           console.warn('JWT Interceptor - Current user roles:', this.authService.getUserRoles());
//           console.warn('JWT Interceptor - Request URL:', req.url);
//           console.warn('JWT Interceptor - Request method:', req.method);
          
//           // Don't redirect for API calls, let the component handle it
//           if (!req.url.includes('/api/')) {
//             this.router.navigate(['/unauthorized']);
//           }
//         }
        
//         return throwError(() => error);
//       })
//     );
//   }

//   private isAuthEndpoint(url: string): boolean {
//     const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/logout'];
//     return authEndpoints.some(endpoint => url.includes(endpoint));
//   }

//   private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
//     // Clone the request and add the authorization header
//     return request.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }
// }