import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';
import { OrderDetailsComponent } from '../orderDetail/orderDetail';
import { Jalali } from '../../components/persianCalender/jalali';
import { BillPreviewComponent } from '../bill/bill';

interface Invoice {
  id: number;
  clinic: string;
  doctor: string;
  header: string;
  number: string;
  patient: string;
  amount: number;
  dateIn: string;    // شمسی
  dateOut: string;   // شمسی
  status: string;
  isSelected?: boolean;
}

@Component({
  selector: 'app-factor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderDetailsComponent,
    BillPreviewComponent   
  ],
  templateUrl: './factorList.html',
  styleUrls: ['./factorList.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FactorListComponent implements OnInit, OnDestroy {
  private dateCache = new Map<string, string>();
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<void>();

  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];

  quickSearch = '';
  advancedPatient = '';
  advancedDoctor = '';
  advancedClinic = '';
  advancedStatus = '';

  openDropdownId: number | string | null = null;

  // دیالوگ جزئیات سفارش
  isOrderDialogOpen = false;
  selectedOrderId: number | null = null;

  // دیالوگ ارسال پیامک (اضافه شده)
  showSendDialog = false;

  constructor(
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadInvoices();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInvoices(): void {
    this.invoiceService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data.map(item => ({
          ...item,
          isSelected: false,
          dateIn: this.convertToJalali(item.dateIn),
          dateOut: this.convertToJalali(item.dateOut)
        }));
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('خطا در دریافت اطلاعات:', error);
        this.invoices = [];
        this.filteredInvoices = [];
        this.cdr.markForCheck();
      }
    });
  }

  public convertToJalali(dateStr: string): string {
    if (!dateStr) return '';
    if (this.dateCache.has(dateStr)) {
      return this.dateCache.get(dateStr)!;
    }
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const gregorianDate = new Date(Date.UTC(year, month - 1, day));
      const jalali = Jalali.toJalali(gregorianDate);
      const result = `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;
      this.dateCache.set(dateStr, result);
      return result;
    } catch {
      return dateStr;
    }
  }

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

  onSearch(): void {
    this.searchSubject.next();
  }

  onReset(): void {
    this.quickSearch = '';
    this.advancedPatient = '';
    this.advancedDoctor = '';
    this.advancedClinic = '';
    this.advancedStatus = '';
    this.applyFilters();
    this.cdr.markForCheck();
  }

  // ----- محاسبات انتخاب‌ها -----
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

  // فاکتور انتخاب‌شده (چون فقط یک مورد قابل انتخاب است)
  get selectedInvoice(): Invoice | undefined {
    return this.selectedInvoices.length === 1 ? this.selectedInvoices[0] : undefined;
  }

  // ----- متدهای وضعیت -----
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

  trackById(index: number, item: Invoice): number {
    return item.id;
  }

  // ----- منوی کشویی -----
  toggleDropdown(id: number | string): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
    this.cdr.markForCheck();
  }

  // ----- دیالوگ جزئیات سفارش -----
  viewOrder(id: number): void {
    console.log('نمایش جزئیات سفارش با ID:', id);
    this.openDropdownId = null;
    this.selectedOrderId = id;
    this.isOrderDialogOpen = true;
    this.cdr.markForCheck();
  }

  closeOrderDialog(): void {
    this.isOrderDialogOpen = false;
    this.selectedOrderId = null;
    this.cdr.markForCheck();
  }


  showBillDialog = false;
selectedInvoiceId: number | null = null;



  // ----- انتخاب تکی با رادیو -----
  selectOnlyThis(selectedInvoice: Invoice): void {
    this.filteredInvoices.forEach(inv => {
      inv.isSelected = (inv.id === selectedInvoice.id);
    });
    // پس از تغییر انتخاب، وضعیت دیالوگ ارسال به‌روز می‌شود (در صورت باز بودن)
    this.cdr.markForCheck();
  }

  // ========== دیالوگ ارسال پیامک (اضافه شده) ==========
      sendSms(): void {
        if (this.totalCount !== 1) return;
        const invoice = this.selectedInvoices[0];
        if (invoice) {
          this.selectedInvoiceId = invoice.id;
          this.showBillDialog = true;
        }
      } 

  closeSendDialog(): void {
    this.showSendDialog = false;
    this.cdr.markForCheck();
  }

  confirmSend(): void {
    // اینجا عملیات واقعی ارسال پیامک را انجام دهید (فعلاً فقط یک پیام نمایش داده می‌شود)
    const invoice = this.selectedInvoice;
    if (invoice) {
      alert(`پیامک برای فاکتور شماره ${invoice.number} با مبلغ ${invoice.amount.toLocaleString()} ریال ارسال شد.`);
    } else {
      alert('هیچ فاکتوری انتخاب نشده است.');
    }

    // پس از ارسال، انتخاب را پاک کرده و دیالوگ را ببندیم
    this.filteredInvoices.forEach(inv => inv.isSelected = false);
    this.showSendDialog = false;
    this.cdr.markForCheck();
  }

closeBillDialog(): void {
  this.showBillDialog = false;
  this.selectedInvoiceId = null;
  this.loadInvoices();
  this.cdr.markForCheck();
}




}