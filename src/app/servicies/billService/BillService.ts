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
export class BillService {

  private http = inject(HttpClient);

  private baseUrl =
    'http://localhost:8080/api/bill';

 getFactorsToCreateBill(): Observable<any[]> {

    const token =
      localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any[]>(
      `${this.baseUrl}/getAllFactorToCreate`,
      { headers }
    );
  }

  setInvoiceNumber(orderIds: number[], invoiceNumber: string): Observable<string> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { orderIds, invoiceNumber };
    
    return this.http.post(`${this.baseUrl}/createInvoice`, body, {
      headers,
      responseType: 'text'   // <-- کلید حل مشکل
    });
  }







}