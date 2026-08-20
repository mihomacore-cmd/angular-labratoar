import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';
import { OrderDetailsComponent } from '../orderDetail/orderDetail'; // مسیر صحیح را وارد کنید
import { Jalali, JalaliDate } from '../../components/persianCalender/jalali';

interface Invoice {
  id: number;
  clinic: string;
  doctor: string;
  header: string;
  number: string;
  patient: string;
  amount: number;
  dateIn: string;
  dateOut: string;
  status: string;
  isSelected?: boolean;
}

@Component({
  selector: 'forget-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderDetailsComponent // 🔥 اضافه کردن کامپوننت جزئیات
  ],
  templateUrl: './factorList.html',
  styleUrls: ['./factorList.scss']
})
export class ForgetPasswordComponent implements OnInit {

  constructor(
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef  // 🔥 تزریق ChangeDetectorRef
  ) { }

  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = []; // 🔥 تغییر از getter به متغیر معمولی برای جلوگیری از خطای NG0100

  quickSearch = '';
  advancedPatient = '';
  advancedDoctor = '';
  advancedClinic = '';
  advancedStatus = '';

  openDropdownId: number | string | null = null;

  // ============================================================
  // 🔹 متغیرهای مربوط به دیالوگ نمایش جزئیات سفارش
  // ============================================================
  isOrderDialogOpen = false;
  selectedOrderId: number | null = null;

  ngOnInit(): void {
    this.loadInvoices();
  }

loadInvoices(): void {
  this.invoiceService.getInvoices().subscribe({
    next: (data) => {
      this.invoices = data.map(item => ({
        ...item,
        isSelected: false,
        // 🔥 تبدیل تاریخ در اینجا (یک بار)
        dateIn: this.convertToJalali(item.dateIn),
        dateOut: this.convertToJalali(item.dateOut)
      }));
      this.applyFilters();
    },
    error: (error) => {
      console.error('خطا در دریافت اطلاعات:', error);
      this.invoices = [];
      this.filteredInvoices = [];
    }
  });
}
  // ============================================================
  // 🔹 متد اعمال فیلترها (جایگزین getter)
  // ============================================================
  private applyFilters(): void {
    let result = this.invoices;

    if (this.quickSearch.trim()) {
      const q = this.quickSearch.trim().toLowerCase();
      result = result.filter(inv =>
        inv.clinic.toLowerCase().includes(q) ||
        inv.doctor.toLowerCase().includes(q) ||
        inv.header.toLowerCase().includes(q) ||
        inv.patient.toLowerCase().includes(q)
      );
    }

    if (this.advancedPatient.trim()) {
      const p = this.advancedPatient.trim().toLowerCase();
      result = result.filter(inv => inv.patient.toLowerCase().includes(p));
    }

    if (this.advancedDoctor.trim()) {
      const d = this.advancedDoctor.trim().toLowerCase();
      result = result.filter(inv => inv.doctor.toLowerCase().includes(d));
    }

    if (this.advancedClinic.trim()) {
      const c = this.advancedClinic.trim().toLowerCase();
      result = result.filter(inv => inv.clinic.toLowerCase().includes(c));
    }

    if (this.advancedStatus) {
      result = result.filter(inv => inv.status === this.advancedStatus);
    }

    this.filteredInvoices = result;
  }

  // ============================================================
  // 🔹 متدهای جستجو و بازنشانی
  // ============================================================
  onSearch(): void {
    this.applyFilters();
  }

  onReset(): void {
    this.quickSearch = '';
    this.advancedPatient = '';
    this.advancedDoctor = '';
    this.advancedClinic = '';
    this.advancedStatus = '';
    this.applyFilters();
  }

  // ============================================================
  // 🔹 محاسبات برای انتخاب‌ها
  // ============================================================
  get selectedInvoices(): Invoice[] {
    return this.filteredInvoices.filter(inv =>
      inv.status !== 'پرداخت شده' && inv.isSelected
    );
  }

  get totalCount(): number {
    return this.selectedInvoices.length;
  }

  get totalAmount(): number {
    return this.selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }

  // ============================================================
  // 🔹 توابع کمکی برای وضعیت
  // ============================================================
  getStatusText(status: string): string {
    return status;
  }

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

  // ============================================================
  // 🔹 trackBy
  // ============================================================
 trackById(index: number, item: any): number {
  return item.id; // یا item.id
}

  // ============================================================
  // 🔹 کنترل منوی کشویی
  // ============================================================
  toggleDropdown(id: number | string): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
  }

  // ============================================================
  // 🔹 نمایش جزئیات سفارش (مشابه نمونه kenban)
  // ============================================================
  viewOrder(id: number): void {
    console.log('نمایش جزئیات سفارش با ID:', id);
    this.openDropdownId = null;
    this.selectedOrderId = id;
    this.isOrderDialogOpen = true;
    this.cdr.detectChanges(); // به‌روزرسانی view
  }

  // ============================================================
  // 🔹 بستن دیالوگ جزئیات
  // ============================================================
  closeOrderDialog(): void {
    this.isOrderDialogOpen = false;
    this.selectedOrderId = null;
    this.cdr.detectChanges();
  }

  // ============================================================
  // 🔹 ارسال پیامک
  // ============================================================
  sendSms(): void {
    if (this.totalCount === 0) {
      return;
    }
    alert(
      `پیامک برای ${this.totalCount} فاکتور با مجموع مبلغ ${this.totalAmount.toLocaleString()} ریال ارسال شد.`
    );
  }

 public convertToJalali(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const gregorianDate = new Date(Date.UTC(year, month - 1, day));
      const jalali = Jalali.toJalali(gregorianDate);
      return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;
    } catch {
      return dateStr; // در صورت خطا، مقدار اصلی را برگردان
    }

  }

}