import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Clinic {
  id: number;
  name: string;
}

export interface Doctor {
  id: number;
  name: string;
}

export interface AddClinicRequest {
  name: string;
}

export interface AddDoctorRequest {
  name: string;
}

export interface AddClinicResponse {
  id: number;
  name: string;
  message: string;
}

export interface AddDoctorResponse {
  id: number;
  name: string;
  message: string;
}

export interface RegisterClinicDoctorRequest {
  clinicId: number;
  doctorId: number;
  registrationNumber: string;
  username: string;
  password?: string;
  email?: string;
}

export interface RegisterClinicDoctorResponse {
  message: string;
  clinicName: string;
  doctorName: string;
  registrationNumber: string;
  username: string;
  generatedPassword: string;
  clinicDoctorId: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterClinicDoctorService {

  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ------------------------------------------------
  // دریافت کلینیک‌ها (JSON معمولی)
  // ------------------------------------------------
  getClinics(): Observable<Clinic[]> {
    return this.http
      .get<Clinic[]>(
        `${this.baseUrl}/clinic/getAll`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // ------------------------------------------------
  // دریافت پزشکان (JSON معمولی)
  // ------------------------------------------------
  getDoctors(): Observable<Doctor[]> {
    return this.http
      .get<Doctor[]>(
        `${this.baseUrl}/doctor/getAll`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // ------------------------------------------------
  // افزودن کلینیک (پاسخ ممکن است متن ساده باشد)
  // ------------------------------------------------
  addClinic(request: AddClinicRequest): Observable<AddClinicResponse> {
    return this.http.post(
      `${this.baseUrl}/clinic/addClinic`,
      request,
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'  // ← کلید حل مشکل
      }
    ).pipe(
      map((response: string) => {
        // تلاش برای parse به JSON
        try {
          return JSON.parse(response) as AddClinicResponse;
        } catch {
          // اگر JSON نبود، یک پاسخ ساختگی با پیام متن
          return {
            id: 0,  // مقدار پیش‌فرض (چون سرور id را در متن برنمی‌گرداند)
            name: request.name,
            message: response  // متن دریافتی به عنوان پیام موفقیت
          } as AddClinicResponse;
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  // ------------------------------------------------
  // افزودن پزشک (پاسخ ممکن است متن ساده باشد)
  // ------------------------------------------------
  addDoctor(request: AddDoctorRequest): Observable<AddDoctorResponse> {
    return this.http.post(
      `${this.baseUrl}/doctor/addDoctor`,
      request,
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'  // ← کلید حل مشکل
      }
    ).pipe(
      map((response: string) => {
        try {
          return JSON.parse(response) as AddDoctorResponse;
        } catch {
          return {
            id: 0,
            name: request.name,
            message: response
          } as AddDoctorResponse;
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  // ------------------------------------------------
  // ثبت ارتباط پزشک-کلینیک (JSON معمولی)
  // ------------------------------------------------
  registerClinicDoctor(
    request: RegisterClinicDoctorRequest
  ): Observable<RegisterClinicDoctorResponse> {
    return this.http
      .post<RegisterClinicDoctorResponse>(
        `${this.baseUrl}/clinic-doctor/connect`,
        request,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  // ------------------------------------------------
  // مدیریت خطاها
  // ------------------------------------------------
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'خطایی در ارتباط با سرور رخ داده است.';

    if (error.error) {
      if (typeof error.error === 'string') {
        // اگر خطا یک رشته است، مستقیماً استفاده کن
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    }

    if (error.status === 0) {
      errorMessage = 'ارتباط با سرور برقرار نشد. لطفاً از روشن بودن Backend اطمینان حاصل کنید.';
    } else if (error.status === 401) {
      errorMessage = 'احراز هویت نامعتبر یا منقضی شده است.';
    } else if (error.status === 403) {
      errorMessage = 'شما اجازه انجام این عملیات را ندارید.';
    }

    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  }
}