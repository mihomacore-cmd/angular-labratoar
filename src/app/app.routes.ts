import { Routes } from '@angular/router';
import {LoginPage} from './pages/login-page/login-page';
import {authGuard} from './guards/auth.gaurd';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },

  { path: 'dashboard',

    loadComponent :()=> import('./pages/dashboard/dashboard-page').then(m => m.DashboardPage)
    , canActivate: [authGuard]
  }
];
