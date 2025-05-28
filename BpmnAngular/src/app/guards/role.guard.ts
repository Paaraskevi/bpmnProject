import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthenticationService, 
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    const requiredRoles = route.data['roles'] as Array<string>;
    const requiredPermissions = route.data['permissions'] as Array<{resource: string, action: string}>;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check roles if specified
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = this.authService.hasAnyRole(requiredRoles);
      if (!hasRole) {
        console.warn('Access denied: missing required role');
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    // Check permissions if specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(perm => 
        this.authService.hasPermission(perm.resource, perm.action)
      );
      if (!hasPermission) {
        console.warn('Access denied: missing required permission');
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }
}
