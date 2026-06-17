import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse } from '../interfaces/auth.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private API_URL = 'http://localhost:8080/api/auth';

  // ✅ LOGIN (خیلی مهم: withCredentials)
  login(username: string, password: string) {
    return this.http.post<AuthResponse>(
      `${this.API_URL}/login`,
      { username, password },
    //  { withCredentials: true } // 👈 برای ارسال/دریافت کوکی
    );
  }

  // ✅ فقط refreshToken ذخیره میشه
handleLoginResponse(response: AuthResponse) {
  if (isPlatformBrowser(this.platformId)) {
    localStorage.setItem('access_token', response.access_token);
    debugger;
    localStorage.setItem('refresh_token', response.refresh_token);
  }
}

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  // ❌ accessToken رو دیگه نمی‌خونیم (HttpOnly هست)
  // getAccessToken حذف شد

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('refreshToken');
    }

    // درخواست به سرور برای حذف کوکی
    this.http.post(`${this.API_URL}/logout`, {}, {
      withCredentials: true
    }).subscribe();

    this.router.navigateByUrl('/login');
  }

  // ساده‌ترین چک لاگین
  isAuthenticated(): boolean {
    return !!this.getRefreshToken();
  }

  // 🔄 رفرش توکن (واقعی)
  refreshAccessToken() {
    const refreshToken = this.getRefreshToken();

    return this.http.post<any>(
      `${this.API_URL}/refresh`,
      { refreshToken },
      { withCredentials: true }
    );
  }
}