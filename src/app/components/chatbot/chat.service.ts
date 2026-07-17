import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {environment} from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
private apiKey = environment.groqApiKey;
  private systemPrompt = `
    شما یک دستیار مجازی متخصص در حوزه **لابراتوار پروتزهای دندانی** هستید.
    وظیفه شما پاسخگویی به سوالات مرتبط با:
    - مراحل ساخت پروتزهای دندانی (قالب‌گیری، ریخته‌گری، پخت، پرداخت)
    - مواد مصرفی (زرکونیا، آکریل، فلزات، سرامیک، کامپوزیت)
    - استانداردهای کیفی (ISO، استانداردهای دندان‌پزشکی)
    - زمان‌بندی تحویل پروتزها و هزینه‌ها
    - مشکلات رایج (شکستگی، تغییر رنگ، عدم تطابق) و راه‌حل‌های آنها
    - پاسخ به سوالات مشتریان درباره فرآیند کار

    **قوانین مهم:**
    - اگر سوال کاربر **ربطی به دندان‌پزشکی و پروتزهای دندانی نداشت**، پاسخ دهید:
      "متأسفم، من فقط در مورد لابراتوار پروتزهای دندانی اطلاعات دارم و می‌توانم راهنمایی کنم. لطفاً سوال خود را در این زمینه مطرح کنید."
    - پاسخ‌ها باید مختصر، دقیق و مفید باشند.
    - از اصطلاحات تخصصی استفاده کنید اما توضیح ساده نیز ارائه دهید.
  `;

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'llama-3.3-70b-versatile', // مدل معتبر و پایدار
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      // max_tokens: 500, // در صورت نیاز می‌توانید فعال کنید
      // top_p: 1 // در صورت نیاز می‌توانید فعال کنید
    };

    return this.http.post(this.apiUrl, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'خطای ناشناخته رخ داد.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `خطای شبکه: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'اتصال به سرور برقرار نشد. اینترنت یا CORS را بررسی کنید.';
      } else if (error.status === 401) {
        errorMessage = 'کلید API نامعتبر است.';
      } else if (error.status === 429) {
        errorMessage = 'تعداد درخواست‌ها بیش از حد مجاز است. لحظاتی صبر کنید.';
      } else {
        errorMessage = `خطای سرور (کد ${error.status}): ${error.message}`;
      }
    }
    console.error('❌ خطای API:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}