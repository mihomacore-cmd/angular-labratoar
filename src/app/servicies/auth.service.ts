import {inject, Injectable, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {AuthResponse} from '../interfaces/auth.interface'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken = signal<string | null>(null);
  private refreshToken = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router) {}

  login(username: string, password: string) {
   return this.http.post<AuthResponse>("http://localhost:8080/api/auth/login",
      { username, password })
  }

  logout() {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }

  getAccessToken() {
    return this.accessToken() || localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return this.refreshToken() || localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // اگر بخوای refresh token رو اعمال کنی
  refreshAccessToken() {
    // اینجا درخواست واقعی به سرور می‌فرستی، فعلاً تستی:
    const newAccess = 'NEW_ACCESS_TOKEN';
    localStorage.setItem('access_token', newAccess);
    this.accessToken.set(newAccess);
  }
}