import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModule را اضافه کنید
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'forget-password',
  standalone: true, // اگر true است
  imports: [
    CommonModule,
    ReactiveFormsModule, // 👈 این را حتماً اضافه کنید
    RouterLink
  ],
  templateUrl: './forgetPassword.html',
  styleUrls: ['./forgetPassword.scss']
})
export class ForgetPasswordComponent {
  forgetForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // private authService: AuthService
  ) {
    this.forgetForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^09[0-9]{9}$/)]]
    });
  }

  getError(controlName: string, errorName: string): boolean {
    const control = this.forgetForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  onSubmit(): void {
    if (this.forgetForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const phone = this.forgetForm.value.phone;

    // مثال ارسال به سرویس
    // this.authService.forgetPassword(phone).subscribe({
    //   next: (res) => {
    //     this.isLoading.set(false);
    //     this.successMessage.set('لینک بازیابی به شماره شما ارسال شد.');
    //     // می‌توانید بعد از چند ثانیه به صفحه ورود بروید
    //     setTimeout(() => this.router.navigate(['/login']), 3000);
    //   },
    //   error: (err) => {
    //     this.isLoading.set(false);
    //     this.errorMessage.set(err.error?.message || 'ارسال ناموفق بود، لطفاً دوباره تلاش کنید.');
    //   }
    // });

    // شبیه‌سازی (موقت)
    console.log('درخواست بازیابی برای شماره:', phone);
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('لینک بازیابی به شماره شما ارسال شد.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }, 1500);
  }
}