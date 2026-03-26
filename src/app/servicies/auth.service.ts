import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken = signal<string | null>(null);
  private refreshToken = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  // تستی - بدون درخواست واقعی
  login(username: string, password: string) {
    // در حالت واقعی اینجا باید از http.post استفاده کنی
    if (username === '1' && password === '123456') {
      const fakeAccess = 'FAKE_ACCESS_TOKEN';
      const fakeRefresh = 'FAKE_REFRESH_TOKEN';
      this.accessToken.set(fakeAccess);
      this.refreshToken.set(fakeRefresh);
      localStorage.setItem('access_token', fakeAccess);
      localStorage.setItem('refresh_token', fakeRefresh);
      return true;
    }
    return false;
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
