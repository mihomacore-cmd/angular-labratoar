import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KanbanService, OrderDetailResponse } from '../../servicies/kenbanService/kenban.service';
import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';
import { Jalali } from '../../components/persianCalender/jalali';

interface Attachment {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  viewUrl?: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-bill-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bill.html',
  styleUrls: ['./bill.scss']
})
export class BillPreviewComponent implements OnInit {
  private kanbanService = inject(KanbanService);
  private invoiceService = inject(InvoiceService);

  @Input() invoiceId!: number;          // شناسه فاکتور (که همان orderId است)
  @Output() closed = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  // داده‌های اصلی (همان ساختار orderInfo)
  orderInfo = {
    clinicName: '',
    doctorName: '',
    patientName: '',
    status: '',
    invoiceType: '',
    phoneNumber: '',
    entryDate: '',
    exitDate: '',
    attachments: [] as Attachment[]
  };

  items: any[] = [];
  discountAmount = 0;
  totalAmount = 0;
  finalAmount = 0;

  ngOnInit(): void {
    if (this.invoiceId) {
      this.loadOrderDetail(this.invoiceId);
    } else {
      this.errorMessage = 'شناسه فاکتور معتبر نیست.';
    }
  }

  loadOrderDetail(orderId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.kanbanService.getOrderById(orderId).subscribe({
      next: (data: OrderDetailResponse) => {
        // تبدیل تاریخ‌ها به شمسی
        const entryDate = data.entryDate ? this.convertToJalali(data.entryDate) : '';
        const exitDate = data.exitDate ? this.convertToJalali(data.exitDate) : '';

        // نگاشت invoiceType به فارسی (برای نمایش)
        let invoiceTypeDisplay = '';
        switch (data.invoiceType) {
          case 'daily': invoiceTypeDisplay = 'روزانه'; break;
          case 'monthly': invoiceTypeDisplay = 'ماهانه'; break;
          case 'final': invoiceTypeDisplay = 'نهایی'; break;
          default: invoiceTypeDisplay = data.invoiceType || '';
        }

        this.orderInfo = {
          clinicName: data.clinicName || '',
          doctorName: data.doctorName || '',
          patientName: data.patientName || '',
          status: data.status || '',
          invoiceType: invoiceTypeDisplay,
          phoneNumber: data.phoneNumber || '',
          entryDate: entryDate,
          exitDate: exitDate,
          attachments: (data.attachments || []).map((att: any) => ({
            id: att.id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            viewUrl: att.viewUrl,
            downloadUrl: att.downloadUrl
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
        this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        this.finalAmount = Math.max(this.totalAmount - this.discountAmount, 0);

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ خطا در دریافت جزئیات فاکتور:', error);
        this.errorMessage = 'خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.';
        this.loading = false;
      }
    });
  }

  // تبدیل تاریخ میلادی به شمسی (همان متد موجود)
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
      return dateStr;
    }
  }

  // بستن دیالوگ
  close(): void {
    this.closed.emit();
  }

  // فرمت پول
  formatMoney(value: number): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '۰ ریال';
    }
    return value.toLocaleString('fa-IR') + ' ریال';
  }

  // کلاس وضعیت برای نمایش رنگ‌ها
  getStatusClass(status: string): string {
    switch (status) {
      case 'در انتظار پرداخت': return 'status-pending-payment';
      case 'انتظار ارسال فاکتور': return 'status-waiting-invoice';
      case 'پرداخت شده': return 'status-paid';
      case 'در حال ساخت': return 'status-building';
      case 'تحویل داده شده': return 'status-delivered';
      default: return '';
    }
  }


            sendSms(): void {
            if (!this.invoiceId) return;

            this.invoiceService.sendSms(this.invoiceId).subscribe({
                next: (response) => {
                alert(`✅ پیامک برای فاکتور شماره ${this.invoiceId} با موفقیت ارسال شد.`);
                this.close(); // بستن دیالوگ پس از ارسال موفق
                },
                error: (err) => {
                console.error('❌ خطا در ارسال پیامک:', err);
                alert('❌ خطا در ارسال پیامک. لطفاً مجدداً تلاش کنید.');
                }
            });
            }
}