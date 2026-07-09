import { Routes } from '@angular/router';
import { AuthLayOut } from './layOut/auth_layOut/auth-lay-out';
import { MasterLayOut } from './layOut/master_layOut/master-lay-out';

export const routes: Routes = [
  // Home page (without any layout)
  {
    path: '',
    loadComponent: () =>
      import('./components/homepage/home.component').then(
        (m) => m.HomeComponent
      ),
  },

  // Authentication layout (ورود و ثبت‌نام)
  {
    path: '',
    component: AuthLayOut,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/login-page/login-page').then(
            (m) => m.LoginPage
          ),
      },
      // ========== اضافه کردن مسیر ثبت‌نام ==========
      {
        path: 'register',
        loadComponent: () =>
          import('./components/register/register').then(
            (m) => m.RegisterComponent
          ),
      },
      // ============================================
    ],
  },

  // Main application layout (پس از ورود)
  {
    path: '',
    component: MasterLayOut,
    // canActivate: [authGuard]
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'addOrder',
        loadComponent: () =>
          import('./components/addOrder/add-order.component').then(
            (m) => m.AddOrderComponent
          ),
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: '',
  },
];