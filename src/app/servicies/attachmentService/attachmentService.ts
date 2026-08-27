import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {

  private readonly baseUrl =
    'http://localhost:8080/api/attachment';

  constructor(
    private http: HttpClient
  ) {}

  viewAttachment(id: number): Observable<Blob> {

    const token =
      localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get(
      `${this.baseUrl}/${id}/view`,
      {
        headers,
        responseType: 'blob'
      }
    );
  }
}