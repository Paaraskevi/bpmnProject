import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { LayoutComponent } from './components/layout/layout.component';
import { BpmnModelerComponent } from './components/bpmn-modeler/bpmn-modeler.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'modeler', component: BpmnModelerComponent, canActivate: [AuthGuard] },
    {
        path: 'app', 
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: 'modeler', component: BpmnModelerComponent },
            { path: 'dashboard', component: DashboardComponent }
        ]
    },
    { path: '**', redirectTo: 'login' }
];
