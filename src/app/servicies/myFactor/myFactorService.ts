// myFactorService.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MyFactorService {

  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/factor';

  // متد دریافت فاکتورهای اختصاصی
  getInvoices(): Observable<any[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any[]>(`${this.baseUrl}/getMyFactor`, { headers });
  }

  // متد ارسال پیامک (مشابه سرویس قبلی)
  sendSms(invoiceId: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.baseUrl}/sendSms/${invoiceId}`, { headers });
  }
}