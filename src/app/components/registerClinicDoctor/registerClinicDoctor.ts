import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  RegisterClinicDoctorService,
  Clinic,
  Doctor,
  RegisterClinicDoctorRequest,
  RegisterClinicDoctorResponse
} from '../../servicies/registerClinicDoctorService/registerDoctorClinicService';

@Component({
  standalone: true,
  selector: 'app-register-clinic-doctor',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './registerClinicDoctor.html',
  styleUrls: ['./registerClinicDoctor.scss']
})
export class RegisterClinicDoctorComponent implements OnInit {

  registerForm!: FormGroup;

  clinics: Clinic[] = [];
  doctors: Doctor[] = [];

  loadingClinics = false;
  loadingDoctors = false;
  private clinicsLoaded = false;
  private doctorsLoaded = false;

  showClinicModal = false;
  showDoctorModal = false;
  newClinicName = '';
  newDoctorName = '';

  submitting = false;
  addingClinic = false;
  addingDoctor = false;

  // Alertهای قدیمی (اختیاری - می‌توانید حذف کنید)
  errorMessage = '';
  successMessage = '';

  // مودال‌های جدید
  showSuccessModal = false;
  successModalMessage = '';
  showErrorModal = false;
  errorModalMessage = '';

  // ذخیره اطلاعات ثبت‌شده برای نمایش در مودال موفقیت
  registrationDetails: {
    clinicName: string;
    doctorName: string;
    registrationNumber: string;
    username: string;
    generatedPassword?: string;
  } | null = null;

  // (اختیاری) اگر همچنان نیاز به registrationResult دارید، می‌توانید نگه دارید
  registrationResult: RegisterClinicDoctorResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterClinicDoctorService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      clinicId: ['', Validators.required],
      doctorId: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      username: ['', Validators.required],
      password: [''],
      email: ['', [Validators.email]]
    });
  }

  // =========================================================
  // Lazy Load Clinics
  // =========================================================
loadClinics(): void {
  if (this.clinicsLoaded || this.loadingClinics) return;
  this.loadingClinics = true;
  this.errorMessage = '';
  this.registerService.getClinics()
    .pipe(finalize(() => this.loadingClinics = false))
    .subscribe({
      next: (clinics) => {
        this.clinics = clinics || [];
        this.clinicsLoaded = true;
      },
      error: (error) => {
        this.errorMessage = this.getErrorMessage(error);
        // برای نمایش پیام در سلکت، می‌توانیم یک گزینه موقت اضافه کنیم
        // اما ترجیحاً همان errorMessage در بالا نمایش داده شود
      }
    });
}

  // =========================================================
  // Lazy Load Doctors
  // =========================================================
  loadDoctors(): void {
    if (this.doctorsLoaded || this.loadingDoctors) return;
    this.loadingDoctors = true;
    this.errorMessage = '';
    this.registerService.getDoctors()
      .pipe(finalize(() => this.loadingDoctors = false))
      .subscribe({
        next: (doctors) => {
          this.doctors = doctors || [];
          this.doctorsLoaded = true;
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
        }
      });
  }

  // =========================================================
  // Add Clinic Modal
  // =========================================================
  openAddClinicModal(): void {
    this.newClinicName = '';
    this.errorMessage = '';
    this.showClinicModal = true;
  }

  closeAddClinicModal(): void {
    if (this.addingClinic) return;
    this.showClinicModal = false;
    this.newClinicName = '';
  }

  addClinic(): void {
    const name = this.newClinicName.trim();
    if (!name) {
      this.showErrorModal = true;
      this.errorModalMessage = 'لطفاً نام کلینیک را وارد کنید.';
      return;
    }
    if (this.addingClinic) return;

    this.addingClinic = true;
    this.errorMessage = '';

    this.registerService.addClinic({ name })
      .pipe(finalize(() => this.addingClinic = false))
      .subscribe({
        next: (response) => {
          const newClinic: Clinic = {
            id: response.id,
            name: response.name
          };

          this.clinics.push(newClinic);
          this.clinicsLoaded = true;
          this.registerForm.patchValue({ clinicId: newClinic.id });

          this.showClinicModal = false;
          this.newClinicName = '';

          this.successModalMessage = response.message || 'کلینیک با موفقیت اضافه شد.';
          this.showSuccessModal = true;
        },
        error: (error) => {
          this.showErrorModal = true;
          this.errorModalMessage = this.getErrorMessage(error);
        }
      });
  }

  // =========================================================
  // Add Doctor Modal
  // =========================================================
  openAddDoctorModal(): void {
    this.newDoctorName = '';
    this.errorMessage = '';
    this.showDoctorModal = true;
  }

  closeAddDoctorModal(): void {
    if (this.addingDoctor) return;
    this.showDoctorModal = false;
    this.newDoctorName = '';
  }

  addDoctor(): void {
    const name = this.newDoctorName.trim();
    if (!name) {
      this.showErrorModal = true;
      this.errorModalMessage = 'لطفاً نام پزشک را وارد کنید.';
      return;
    }
    if (this.addingDoctor) return;

    this.addingDoctor = true;
    this.errorMessage = '';

    this.registerService.addDoctor({ name })
      .pipe(finalize(() => this.addingDoctor = false))
      .subscribe({
        next: (response) => {
          const newDoctor: Doctor = {
            id: response.id,
            name: response.name
          };

          this.doctors.push(newDoctor);
          this.doctorsLoaded = true;
          this.registerForm.patchValue({ doctorId: newDoctor.id });

          this.showDoctorModal = false;
          this.newDoctorName = '';

          this.successModalMessage = response.message || 'پزشک با موفقیت اضافه شد.';
          this.showSuccessModal = true;
        },
        error: (error) => {
          this.showErrorModal = true;
          this.errorModalMessage = this.getErrorMessage(error);
        }
      });
  }

  // =========================================================
  // بستن مودال موفقیت + رفرش کامل صفحه
  // =========================================================
  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successModalMessage = '';
    this.registrationDetails = null;

    // ✅ رفرش کامل صفحه (تمام فیلدها پاک می‌شوند و داده‌ها از نو بارگذاری می‌شوند)
    window.location.reload();
  }

  // =========================================================
  // بستن مودال خطا
  // =========================================================
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }

  // =========================================================
  // ثبت پزشک و کلینیک (ارسال فرم)
  // =========================================================
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.registrationResult = null;
    this.registrationDetails = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.showErrorModal = true;
      this.errorModalMessage = 'لطفاً تمام فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    if (this.submitting) return;

    const formValue = this.registerForm.getRawValue();
    const request: RegisterClinicDoctorRequest = {
      clinicId: Number(formValue.clinicId),
      doctorId: Number(formValue.doctorId),
      registrationNumber: formValue.registrationNumber.trim(),
      username: formValue.username.trim()
    };

    if (formValue.password?.trim()) {
      request.password = formValue.password.trim();
    }
    if (formValue.email?.trim()) {
      request.email = formValue.email.trim();
    }

    this.submitting = true;

    this.registerService.registerClinicDoctor(request)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (response) => {
          // ذخیره اطلاعات برای نمایش در مودال موفقیت
          this.registrationDetails = {
            clinicName: response.clinicName,
            doctorName: response.doctorName,
            registrationNumber: response.registrationNumber,
            username: response.username,
            generatedPassword: response.generatedPassword
          };

          this.successModalMessage = response.message || 'پزشک با موفقیت در کلینیک ثبت شد.';
          this.showSuccessModal = true;

          // (اختیاری) پاک کردن فیلدهای اطلاعات حساب - ولی با رفرش صفحه بعداً همه پاک می‌شوند
          this.registerForm.patchValue({
            registrationNumber: '',
            username: '',
            password: '',
            email: ''
          });
        },
        error: (error) => {
          this.showErrorModal = true;
          this.errorModalMessage = this.getErrorMessage(error);
        }
      });
  }

  // =========================================================
  // Validation Helper
  // =========================================================
  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // =========================================================
  // Copy Password (اگر در مودال هم نیاز باشد)
  // =========================================================
  copyGeneratedPassword(): void {
    const password = this.registrationDetails?.generatedPassword;
    if (!password) {
      this.showErrorModal = true;
      this.errorModalMessage = 'رمز عبوری برای کپی وجود ندارد.';
      return;
    }
    if (!navigator.clipboard) {
      this.showErrorModal = true;
      this.errorModalMessage = 'امکان کپی کردن رمز عبور در این مرورگر وجود ندارد.';
      return;
    }
    navigator.clipboard.writeText(password)
      .then(() => {
        this.successMessage = 'رمز عبور کپی شد.';
        this.clearSuccessMessage(2500);
      })
      .catch(() => {
        this.showErrorModal = true;
        this.errorModalMessage = 'کپی کردن رمز عبور انجام نشد.';
      });
  }

  // =========================================================
  // Error Message Parser
  // =========================================================
  private getErrorMessage(error: any): string {
    if (error?.userMessage) return error.userMessage;
    if (error?.error?.message) return error.error.message;
    if (typeof error?.error === 'string') return error.error;
    if (error?.message) return error.message;
    return 'خطایی در انجام عملیات رخ داده است.';
  }

  // =========================================================
  // Clear Success Alert (برای alert قدیمی)
  // =========================================================
  private clearSuccessMessage(delay: number): void {
    setTimeout(() => {
      this.successMessage = '';
    }, delay);
  }
}