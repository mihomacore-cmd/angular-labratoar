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
// اینترفیس‌های جزئیات سفارش
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
  phoneNumber:string;
  entryDate: string;
  exitDate: string;
  items: OrderItemDetail[];
  discountAmount: number;
  grossTotal: number;
  netTotal: number;
  attachments?: AttachmentInfo[];
}

// =====================================================
// سرویس
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/orders';

  // =====================================================
  // دریافت تمام سفارش‌ها (کانبان)
  // =====================================================
  getAllOrders(): Observable<KanbanBoardResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<KanbanBoardResponse>(`${this.baseUrl}/getAll`, { headers });
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
      `${this.baseUrl}/updateStatus/${orderId}`,
      null,
      { headers, responseType: 'text' }
    ) as Observable<string>;
  }

  // =====================================================
  // دریافت جزئیات یک سفارش
  // =====================================================
  getOrderById(orderId: number): Observable<OrderDetailResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<OrderDetailResponse>(
      `${this.baseUrl}/getOrderById/${orderId}`,
      { headers }
    );
  }

  // =====================================================
  // ✅ به‌روزرسانی کامل سفارش + فایل‌های پیوست (با FormData)
  // =====================================================
  updateOrderWithFiles(orderId: number, formData: FormData): Observable<any> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
      // 🔥 Content-Type را تنظیم نکنید – Angular خودکار multipart/form-data می‌سازد
    });

    return this.http.put(
      `${this.baseUrl}/updateOrder/${orderId}`,   // مسیر به‌روزرسانی سفارش
      formData,
      { headers }
    );
  }
}