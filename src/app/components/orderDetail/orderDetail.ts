import { Component, OnInit, inject, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KanbanService, OrderDetailResponse } from '../../servicies/kenbanService/kenban.service';
import { Jalali, JalaliDate } from '../../components/persianCalender/jalali';
import { PersianCalendarComponent } from '../../components/persianCalender/persianCalender';

@Component({
  selector: 'order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PersianCalendarComponent],
  templateUrl: './orderDetail.html',
  styleUrls: ['./orderDetail.scss']
})
export class OrderDetailsComponent implements OnInit {
  private kanbanService = inject(KanbanService);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = false;

  @Input() orderId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  // داده‌های اصلی سفارش
  orderInfo = {
    clinicName: '',
    doctorName: '',
    patientName: '',
    status: '',
    invoiceType: '',
    entryDate: '', // شمسی
    exitDate: '', // شمسی
    attachments: [] as any[]
  };

  items: any[] = [];
  discountAmount = 0;

  // کنترل‌های تقویم
  showEntryDatePicker = false;
  showExitDatePicker = false;

  // اعتبارسنجی تاریخ خروج
  exitDateInvalid = false;

  // مودال خطا
  showValidationModal = false;
  validationErrorMessage = '';

  // مقدار minDate برای تقویم خروج (بر اساس تاریخ ورود)
  get entryDateValue(): JalaliDate | undefined {
    const val = this.orderInfo.entryDate;
    if (!val) return undefined;
    const parts = val.split('/').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return undefined;
  }

  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrderDetail(this.orderId);
    } else {
      this.errorMessage = 'شناسه سفارش معتبر نیست.';
      setTimeout(() => this.closeDialog(), 1500);
    }
  }

  toggleEditMode(): void {
    this.isEditMode = true;
  }

  loadOrderDetail(orderId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.kanbanService.getOrderById(orderId).subscribe({
      next: (data: OrderDetailResponse) => {
        console.log('📦 داده دریافتی از بک‌اند:', data);

          let invoiceTypeKey = '';
          if (data.invoiceType === 'روزانه') {
            invoiceTypeKey = 'daily';
          } else if (data.invoiceType === 'ماهانه') {
            invoiceTypeKey = 'monthly';
          } else if (data.invoiceType === 'نهایی') {
            invoiceTypeKey = 'final';
          } else {
            invoiceTypeKey = data.invoiceType || 'daily'; // مقدار پیش‌فرض
          }


        const entryDate = data.entryDate ? this.convertToJalali(data.entryDate) : '';
        const exitDate = data.exitDate ? this.convertToJalali(data.exitDate) : '';

        this.orderInfo = {
          clinicName: data.clinicName || '',
          doctorName: data.doctorName || '',
          patientName: data.patientName || '',
          status: data.status || '',
          invoiceType: data.invoiceType || '',
          entryDate: entryDate,
          exitDate: exitDate,
          attachments: data.attachments || []
        };

        this.items = (data.items || []).map(item => ({
          serviceType: item.serviceType || '',
          toothNumber: item.toothNumber || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0
        }));

        this.discountAmount = data.discountAmount || 0;

        // اعتبارسنجی اولیه
        this.validateExitDate();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ خطا در دریافت جزئیات:', error);
        this.errorMessage = 'خطا در دریافت اطلاعات سفارش. لطفاً مجدداً تلاش کنید.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // تبدیل تاریخ میلادی به شمسی
  private convertToJalali(dateStr: string): string {
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const gregorianDate = new Date(Date.UTC(year, month - 1, day));
      const jalali = Jalali.toJalali(gregorianDate);
      return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }

  // تبدیل تاریخ شمسی به میلادی
  private convertToGregorian(jalaliStr: string): string {
    try {
      const parts = jalaliStr.split('/');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const gregorianDate = Jalali.toGregorian(year, month, day);
      const y = gregorianDate.getUTCFullYear();
      const m = String(gregorianDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(gregorianDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  }

  // ============================================================
  // اعتبارسنجی تاریخ خروج
  // ============================================================
  private validateExitDate(): void {
    const entry = this.orderInfo.entryDate;
    const exit = this.orderInfo.exitDate;
    if (!entry || !exit) {
      this.exitDateInvalid = false;
      return;
    }

    const entryParts = entry.split('/').map(Number);
    const exitParts = exit.split('/').map(Number);
    if (entryParts.length !== 3 || exitParts.length !== 3) {
      this.exitDateInvalid = false;
      return;
    }

    const entryObj: JalaliDate = { year: entryParts[0], month: entryParts[1], day: entryParts[2] };
    const exitObj: JalaliDate = { year: exitParts[0], month: exitParts[1], day: exitParts[2] };
    const entryGreg = Jalali.toGregorian(entryObj.year, entryObj.month, entryObj.day);
    const exitGreg = Jalali.toGregorian(exitObj.year, exitObj.month, exitObj.day);

    this.exitDateInvalid = exitGreg < entryGreg;
  }

  // ============================================================
  // متدهای تقویم ورود
  // ============================================================
  toggleEntryDatePicker(): void {
    if (this.isEditMode) {
      this.showEntryDatePicker = !this.showEntryDatePicker;
      this.showExitDatePicker = false;
    }
  }

  closeEntryDatePicker(): void {
    this.showEntryDatePicker = false;
  }

  onEntryDateConfirm(date: string): void {
    this.orderInfo.entryDate = date;
    this.closeEntryDatePicker();

    // اگر تاریخ خروج قبلاً انتخاب شده بود، اعتبارسنجی مجدد
    if (this.orderInfo.exitDate) {
      this.validateExitDate();
      // اگر نامعتبر شد، تاریخ خروج را پاک می‌کنیم
      if (this.exitDateInvalid) {
        this.orderInfo.exitDate = '';
        this.exitDateInvalid = false;
        this.validationErrorMessage = 'تاریخ خروج با تغییر تاریخ ورود نامعتبر شد. لطفاً مجدداً انتخاب کنید.';
        this.showValidationModal = true;
      }
    }
  }

  // ============================================================
  // متدهای تقویم خروج
  // ============================================================
  toggleExitDatePicker(): void {
    if (this.isEditMode) {
      this.showExitDatePicker = !this.showExitDatePicker;
      this.showEntryDatePicker = false;
    }
  }

  closeExitDatePicker(): void {
    this.showExitDatePicker = false;
  }

  onExitDateConfirm(date: string): void {
    this.orderInfo.exitDate = date;
    this.closeExitDatePicker();
    this.validateExitDate();
    if (this.exitDateInvalid) {
      // اگر تاریخ خروج نامعتبر بود، آن را پاک می‌کنیم و پیام خطا نمایش می‌دهیم
      this.orderInfo.exitDate = '';
      this.validationErrorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
      this.showValidationModal = true;
    }
  }

  // رویداد invalidSelection از تقویم خروج
  onInvalidExitDate(): void {
    this.validationErrorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
    this.showValidationModal = true;
  }

  // ============================================================
  // مدیریت مودال خطا
  // ============================================================
  closeValidationModal(): void {
    this.showValidationModal = false;
    this.validationErrorMessage = '';
  }

  // ============================================================
  // سایر متدها
  // ============================================================
  addItem(): void {
    this.items.push({ serviceType: '', toothNumber: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      this.items[0] = { serviceType: '', toothNumber: '', quantity: 1, unitPrice: 0 };
    } else {
      this.items.splice(index, 1);
    }
  }

  rowTotal(index: number): number {
    const item = this.items[index];
    return (item.quantity || 0) * (item.unitPrice || 0);
  }

  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
  }

  get finalAmount(): number {
    return Math.max(this.totalAmount - (this.discountAmount || 0), 0);
  }

  formatMoney(value: number): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '۰ ریال';
    }
    return value.toLocaleString('fa-IR') + ' ریال';
  }

  submitOrder(): void {
    if (!this.isEditMode) {
      alert('برای ثبت تغییرات، ابتدا دکمه ویرایش را فعال کنید.');
      return;
    }

    // اعتبارسنجی نهایی قبل از ارسال
    this.validateExitDate();
    if (this.exitDateInvalid) {
      this.validationErrorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
      this.showValidationModal = true;
      return;
    }

    // تبدیل تاریخ‌ها به میلادی
    const entryDateGreg = this.convertToGregorian(this.orderInfo.entryDate);
    const exitDateGreg = this.convertToGregorian(this.orderInfo.exitDate);

    const payload = {
      ...this.orderInfo,
      entryDate: entryDateGreg,
      exitDate: exitDateGreg,
      items: this.items,
      discountAmount: this.discountAmount
    };

    console.log('ارسال تغییرات:', payload);
    alert('تغییرات با موفقیت ثبت شد!');

    this.isEditMode = false;
    this.closeDialog();
  }

  closeDialog(): void {
    this.closed.emit();
  }
}