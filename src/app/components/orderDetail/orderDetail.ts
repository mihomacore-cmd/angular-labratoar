import { Component, OnInit, inject, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KanbanService, OrderDetailResponse } from '../../servicies/kenbanService/kenban.service';
import { Jalali, JalaliDate } from '../../components/persianCalender/jalali';
import { PersianCalendarComponent } from '../../components/persianCalender/persianCalender';

// ============================================================
// 🔹 تعریف نوع Attachment برای فایل‌های پیوست
// ============================================================
interface Attachment {
  id?: number;               // در صورت وجود = فایل قبلاً در سرور ذخیره شده
  fileName: string;
  fileType: string;
  fileSize: number;
  fileObject?: File;         // فقط برای فایل‌های جدید (هنوز آپلود نشده)
  viewUrl?: string;          // لینک نمایش (از سرور)
  downloadUrl?: string;      // لینک دانلود (از سرور)
}

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

  private originalOrderInfo: any = null;
  private originalItems: any[] = [];
  private originalDiscountAmount = 0;

  isEditMode = false;

  @Input() orderId: number | null = null;
  @Output() closed = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  // ============================================================
  // 🔹 داده‌های اصلی سفارش (با نوع Attachment)
  // ============================================================
  orderInfo = {
    clinicName: '',
    doctorName: '',
    patientName: '',
    status: '',
    invoiceType: '',
    entryDate: '',          // شمسی
    exitDate: '',           // شمسی
    attachments: [] as Attachment[]
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

  // ============================================================
  // 🔹 لیست شناسه‌های فایل‌های حذف‌شده (قبلی)
  // ============================================================
  private deletedAttachmentIds: number[] = [];

  // ============================================================
  // مقدار minDate برای تقویم خروج
  // ============================================================
  get entryDateValue(): JalaliDate | undefined {
    const val = this.orderInfo.entryDate;
    if (!val) return undefined;
    const parts = val.split('/').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return undefined;
  }

  // ============================================================
  // چرخه حیات
  // ============================================================
  ngOnInit(): void {
    if (this.orderId) {
      this.loadOrderDetail(this.orderId);
    } else {
      this.errorMessage = 'شناسه سفارش معتبر نیست.';
      setTimeout(() => this.closeDialog(), 1500);
    }
  }

  // ============================================================
  // ویرایش / لغو ویرایش
  // ============================================================
  toggleEditMode(): void {
    if (!this.isEditMode) {
      this.isEditMode = true;
      return;
    }

    // لغو ویرایش
    this.isEditMode = false;
    this.deletedAttachmentIds = [];   // 🔥 ریست لیست حذف

    this.showEntryDatePicker = false;
    this.showExitDatePicker = false;
    this.exitDateInvalid = false;
    this.showValidationModal = false;
    this.validationErrorMessage = '';

    if (this.orderId) {
      this.loadOrderDetail(this.orderId);
    }
  }

  // ============================================================
  // بارگذاری جزئیات سفارش از بک‌اند
  // ============================================================
  loadOrderDetail(orderId: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.deletedAttachmentIds = [];   // 🔥 ریست لیست حذف هنگام بارگذاری مجدد

    this.kanbanService.getOrderById(orderId).subscribe({
      next: (data: OrderDetailResponse) => {
        console.log('📦 داده دریافتی از بک‌اند:', data);

        let invoiceTypeKey = '';
        if (data.invoiceType === 'روزانه') {
          invoiceTypeKey = 'daily';
        } else if (data.invoiceType === 'ماهانه') {
          invoiceTypeKey = 'monthly';
        } else {
          invoiceTypeKey = data.invoiceType || 'daily';
        }

        const entryDate = data.entryDate ? this.convertToJalali(data.entryDate) : '';
        const exitDate = data.exitDate ? this.convertToJalali(data.exitDate) : '';

        // 🔥 نگاشت attachments با type Attachment
        this.orderInfo = {
          clinicName: data.clinicName || '',
          doctorName: data.doctorName || '',
          patientName: data.patientName || '',
          status: data.status || '',
          invoiceType: invoiceTypeKey,
          entryDate: entryDate,
          exitDate: exitDate,
          attachments: (data.attachments || []).map((att: any) => ({
            id: att.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            viewUrl: att.viewUrl,
            downloadUrl: att.downloadUrl
            // 🔥 توجه: fileObject ندارد چون فایل قبلاً آپلود شده
          }))
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

  // ============================================================
  // تبدیل تاریخ میلادی ↔ شمسی
  // ============================================================
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

    if (this.orderInfo.exitDate) {
      this.validateExitDate();
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
      this.orderInfo.exitDate = '';
      this.validationErrorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
      this.showValidationModal = true;
    }
  }

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
  // مدیریت آیتم‌های سفارش
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

  // ============================================================
  // مدیریت فایل‌های پیوست
  // ============================================================
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.orderInfo.attachments.push({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileObject: file   // 🔥 فایل جدید
      });
    }
    // ریست input تا امکان انتخاب مجدد فایل‌های تکراری وجود داشته باشد
    event.target.value = '';
  }

  removeAttachment(index: number): void {
    const attachment = this.orderInfo.attachments[index];
    
    // اگر فایل دارای ID باشد یعنی قبلاً در سرور ذخیره شده، آن را به لیست حذف اضافه می‌کنیم
    if (attachment.id) {
      this.deletedAttachmentIds.push(attachment.id);
    }
    // حذف از آرایه نمایشی
    this.orderInfo.attachments.splice(index, 1);
  }

  // ============================================================
  // ثبت نهایی تغییرات (ارسال با FormData)
  // ============================================================
  submitOrder(): void {
    if (!this.isEditMode) {
      alert('برای ثبت تغییرات، ابتدا دکمه ویرایش را فعال کنید.');
      return;
    }

    // اعتبارسنجی نهایی
    this.validateExitDate();
    if (this.exitDateInvalid) {
      this.validationErrorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
      this.showValidationModal = true;
      return;
    }

    // ۱. ساخت payload متنی (بدون فایل‌ها)
    const entryDateGreg = this.convertToGregorian(this.orderInfo.entryDate);
    const exitDateGreg = this.convertToGregorian(this.orderInfo.exitDate);

    const payload = {
      clinicName: this.orderInfo.clinicName,
      doctorName: this.orderInfo.doctorName,
      patientName: this.orderInfo.patientName,
      status: this.orderInfo.status,
      invoiceType: this.orderInfo.invoiceType,
      entryDate: entryDateGreg,
      exitDate: exitDateGreg,
      items: this.items,
      discountAmount: this.discountAmount,
      deletedAttachmentIds: this.deletedAttachmentIds   // 🔑 لیست فایل‌های حذف‌شده
    };

    // ۲. ساخت FormData
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));

    // ۳. اضافه کردن فایل‌های جدید (آنهایی که fileObject دارند)
    this.orderInfo.attachments.forEach((att) => {
      if (att.fileObject) {
        formData.append('files', att.fileObject, att.fileName);
      }
    });

    // ۴. ارسال به سرویس (نیاز به پیاده‌سازی در KanbanService)
    this.kanbanService.updateOrderWithFiles(this.orderId!, formData).subscribe({
      next: (res) => {
        console.log('✅ سفارش با موفقیت به‌روزرسانی شد', res);
        alert('تغییرات با موفقیت ثبت شد!');
        this.isEditMode = false;
        this.deletedAttachmentIds = [];   // خالی کردن لیست حذف
        this.closeDialog();
      },
      error: (err) => {
        console.error('❌ خطا در ارسال:', err);
        this.errorMessage = 'خطا در ثبت تغییرات. لطفاً مجدداً تلاش کنید.';
      }
    });
  }

  // ============================================================
  // بستن دیالوگ
  // ============================================================
  closeDialog(): void {
    this.closed.emit();
  }
}