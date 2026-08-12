import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class KanbanService {
  private http = inject(HttpClient);

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
}