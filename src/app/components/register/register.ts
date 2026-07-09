import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModule را اضافه کنید
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true, // اگر true است
  imports: [
    CommonModule,
    ReactiveFormsModule, // 👈 این را حتماً اضافه کنید
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  registerError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    // private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      clinicName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^09[0-9]{9}$/)]],
      nationalCode: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]]
    });
  }

  getError(controlName: string, errorName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.registerError.set(null);

    const formData = this.registerForm.value;

    // مثال ارسال به سرویس
    // this.authService.register(formData).subscribe({
    //   next: (res) => {
    //     this.isLoading.set(false);
    //     // به صفحه لاگین بروید یا پیام موفقیت نشان دهید
    //     this.router.navigate(['/login']);
    //   },
    //   error: (err) => {
    //     this.isLoading.set(false);
    //     this.registerError.set(err.error?.message || 'ثبت‌نام ناموفق بود');
    //   }
    // });

    // فقط برای نمایش در کنسول (موقت)
    console.log('داده‌های ثبت‌نام:', formData);
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/login']);
    }, 1500);
  }
}