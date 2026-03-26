import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../servicies/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // فرم واکنشی
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // حالت بارگذاری
  isLoading = signal(false);

  // متد ارسال فرم
  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);

    const { username, password } = this.loginForm.value;

    // فراخوانی سرویس احراز هویت
    const success = this.auth.login(username ?? '', password ?? '');

    this.isLoading.set(false);

    if (success) {
      console.log('success');
      // هدایت به داشبورد یا صفحه‌ی اصلی
    //  this.router.navigate(['/dashboard']).then(r =>r );
      this.router.navigateByUrl('/dashboard');
    } else {
      // نمایش خطای ناموفق بودن ورود
      alert('نام کاربری یا رمز عبور اشتباه است.');
    }
  }

  // متد کمکی برای گرفتن خطا از کنترل
  getError(controlName: string, errorType: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control?.hasError(errorType) && (control?.dirty || control?.touched);
  }
}
