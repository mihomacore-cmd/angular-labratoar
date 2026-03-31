import { Routes } from '@angular/router';
import { AuthLayOut } from './layOut/auth_layOut/auth-lay-out';
import { MasterLayOut } from './layOut/master_layOut/master-lay-out';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ✅ auth layout
  {
    path: '',
    component: AuthLayOut,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login-page/login-page').then(m => m.LoginPage),
      },
    ],
  },

  // ✅ main app layout
  {
    path: '',
    component: MasterLayOut,
    // canActivate: [authGuard]
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page').then(m => m.DashboardPage),
      },
      {
        path: 'addOrder',
        loadComponent: () =>
          import('./components/addOrder/add-order.component').then(m => m.AddOrderComponent),
      },
    ],
  },
];