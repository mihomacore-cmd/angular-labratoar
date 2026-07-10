import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

// اعتبارسنج سفارشی برای تطابق رمزها
function passwordMatchValidator(group: FormGroup) {
  const newPass = group.get('newPassword')?.value;
  const confirmPass = group.get('confirmPassword')?.value;
  return newPass === confirmPass ? null : { mismatch: true };
}

@Component({
  selector: 'changePassword',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './changPassword.html',
  styleUrls: ['./changPassword.scss']
})
export class ChangePasswordComponent {
  changeForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // private authService: AuthService
  ) {
    this.changeForm = this.fb.group(
      {
        code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  // دستیابی به خطاهای هر فیلد
  getError(controlName: string, errorName: string): boolean {
    const control = this.changeForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  onSubmit(): void {
    if (this.changeForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { code, newPassword } = this.changeForm.value;

    // مثال ارسال به سرویس
    // this.authService.changePassword(code, newPassword).subscribe({
    //   next: (res) => {
    //     this.isLoading.set(false);
    //     this.successMessage.set('رمز عبور با موفقیت تغییر یافت.');
    //     setTimeout(() => this.router.navigate(['/login']), 3000);
    //   },
    //   error: (err) => {
    //     this.isLoading.set(false);
    //     this.errorMessage.set(err.error?.message || 'تغییر رمز ناموفق بود، دوباره تلاش کنید.');
    //   }
    // });

    // شبیه‌سازی (موقت)
    console.log('کد تأیید:', code);
    console.log('رمز جدید:', newPassword);
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('رمز عبور با موفقیت تغییر یافت.');
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }, 1500);
  }
}