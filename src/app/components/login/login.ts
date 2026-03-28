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

     this.auth.login(username ?? '', password ?? '').subscribe({
    next: (response) => {
      console.log("success");
      this.router.navigateByUrl('/dashboard');
    },
    error: () => {
      alert('نام کاربری یا رمز عبور اشتباه است.');
    },
    complete: () => this.isLoading.set(false)
  });;



    this.isLoading.set(false);


  }

  getError(controlName: string, errorType: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control?.hasError(errorType) && (control?.dirty || control?.touched);
  }
}
