import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // HttpHeaders را هم اضافه کنید

import { CookieService } from 'ngx-cookie-service';

import { OrderPayload } from '../components/addOrder/add-order.component';

import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AddOrderService { 

  constructor(private http: HttpClient) {} 
 cookieService=inject(CookieService)
 submitOrder(orderPayload: OrderPayload , filesToUpload: File[] ): Observable<any> {
  const token = localStorage.getItem('access_token'); // از localStorage بخوان
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  const formData = new FormData();
  formData.append(
    'orderData',
    new Blob([JSON.stringify(orderPayload)], { type: 'application/json' })
  );

    if (filesToUpload && filesToUpload.length > 0) {
      debugger;
      filesToUpload.forEach((file) => {
        formData.append('files', file, file.name); 
      });
    }

  return this.http.post(
    'http://localhost:8080/api/orders/create',
    formData,
    { headers }
  );
}
}
