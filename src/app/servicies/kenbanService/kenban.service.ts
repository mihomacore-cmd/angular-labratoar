import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// =====================================================
// اینترفیس‌های موجود
// =====================================================

export interface KanbanItemDto {
  orderId: number;
  clinicName: string;
  doctorName: string;
  orderStatusName: string;
  patientName: string;
}

export interface KanbanBoardResponse {
  [status: string]: KanbanItemDto[];
}

// =====================================================
// ✅ اینترفیس‌های جدید برای جزئیات سفارش
// =====================================================
export interface AttachmentInfo {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  viewUrl: string;
  downloadUrl: string;
}




export interface OrderItemDetail {
  serviceType: string;
  toothNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetailResponse {
  clinicName: string;
  doctorName: string;
  patientName: string;
  status: string;
  invoiceType: string;
  entryDate: string;
  exitDate: string;
  items: OrderItemDetail[];
  discountAmount: number;
  grossTotal: number;
  netTotal: number;
  attachments?: AttachmentInfo[]; // اختیاری

}

// =====================================================
// سرویس
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private http = inject(HttpClient);

  // =====================================================
  // دریافت تمام سفارش‌ها (کانبان)
  // =====================================================

  getAllOrders(): Observable<KanbanBoardResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<KanbanBoardResponse>(
      'http://localhost:8080/api/orders/getAll',
      { headers }
    );
  }

  // =====================================================
  // تغییر وضعیت سفارش (انتقال)
  // =====================================================

  updateOrderStatus(orderId: number): Observable<string> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(
      `http://localhost:8080/api/orders/updateStatus/${orderId}`,
      null,
      {
        headers: headers,
        responseType: 'text'
      }
    ) as Observable<string>;
  }

  // =====================================================
  // ✅ دریافت جزئیات یک سفارش
  // =====================================================

  getOrderById(orderId: number): Observable<OrderDetailResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<OrderDetailResponse>(
      `http://localhost:8080/api/orders/getOrderById/${orderId}`,
      { headers }
    );
  }
}