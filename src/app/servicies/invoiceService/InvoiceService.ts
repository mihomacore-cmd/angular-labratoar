import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private http = inject(HttpClient);

  private baseUrl =
    'http://localhost:8080/api/factor';

  getInvoices(): Observable<any[]> {

    const token =
      localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any[]>(
      `${this.baseUrl}/getAll`,
      { headers }
    );
  }


  sendSms(invoiceId: number): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get(`${this.baseUrl}/sendSms/${invoiceId}`, { headers });
  }


  // =============================================================
  // متد اصلاح‌شده: ثبت شماره فاکتور برای چند سفارش
  // =============================================================
  setInvoiceNumber(orderIds: number[], invoiceNumber: string): Observable<string> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { orderIds, invoiceNumber };
    
    return this.http.post(`${this.baseUrl}/setInvoiceNumber`, body, {
      headers,
      responseType: 'text'   // <-- کلید حل مشکل
    });
  }
}