// myFactorList.ts
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { MyFactorService } from '../../servicies/myFactor/myFactorService'; // مسیر را مطابق پروژه خودت تنظیم کن
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
  dateIn: string;
  dateOut: string;
  status: string;
  phone: string;
  statusId: number;
  isSelected?: boolean;
}

@Component({
  selector: 'app-my-factor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderDetailsComponent,
    BillPreviewComponent
  ],
  templateUrl: './myFactorList.html',
  styleUrls: ['./myFactorList.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyFactorListComponent implements OnInit, OnDestroy {

  // Cache
  private dateCache = new Map<string, string>();
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<void>();

  // Data
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];

  // Filters
  quickSearch = '';
  advancedPatient = '';
  advancedDoctor = '';
  advancedClinic = '';
  advancedStatus = '';

  // Dropdown
  openDropdownId: number | string | null = null;

  // Order Dialog
  isOrderDialogOpen = false;
  selectedOrderId: number | null = null;

  // Bill Dialog
  showBillDialog = false;
  selectedInvoiceId: number | null = null;

  constructor(
    private myFactorService: MyFactorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInvoices();

    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInvoices(): void {
    this.myFactorService.getInvoices().subscribe({
      next: (data: Invoice[]) => {
        this.invoices = (data || []).map((item: Invoice) => ({
          ...item,
          isSelected: false,
          dateIn: this.convertToJalali(item.dateIn),
          dateOut: this.convertToJalali(item.dateOut)
        }));
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('خطا در دریافت اطلاعات فاکتورها:', error);
        this.invoices = [];
        this.filteredInvoices = [];
        this.cdr.markForCheck();
      }
    });
  }

  public convertToJalali(dateStr: string): string {
    if (!dateStr) return '';
    if (this.dateCache.has(dateStr)) return this.dateCache.get(dateStr)!;

    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

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
    let result = [...this.invoices];

    const quick = this.normalizeSearch(this.quickSearch);
    if (quick) {
      result = result.filter(inv =>
        this.normalizeSearch(inv.clinic).includes(quick) ||
        this.normalizeSearch(inv.doctor).includes(quick) ||
        this.normalizeSearch(inv.header).includes(quick) ||
        this.normalizeSearch(inv.patient).includes(quick) ||
        this.normalizeSearch(inv.number).includes(quick)
      );
    }

    const patient = this.normalizeSearch(this.advancedPatient);
    if (patient) {
      result = result.filter(inv => this.normalizeSearch(inv.patient).includes(patient));
    }

    const doctor = this.normalizeSearch(this.advancedDoctor);
    if (doctor) {
      result = result.filter(inv => this.normalizeSearch(inv.doctor).includes(doctor));
    }

    const clinic = this.normalizeSearch(this.advancedClinic);
    if (clinic) {
      result = result.filter(inv => this.normalizeSearch(inv.clinic).includes(clinic));
    }

    if (this.advancedStatus) {
      result = result.filter(inv => inv.status === this.advancedStatus);
    }

    this.filteredInvoices = result;
  }

  private normalizeSearch(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک');
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

  get selectedInvoices(): Invoice[] {
    return this.invoices.filter(invoice =>
      invoice.statusId === 4 && invoice.isSelected === true
    );
  }

  get totalCount(): number {
    return this.selectedInvoices.length;
  }

  get totalAmount(): number {
    return this.selectedInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  }

  get selectedInvoice(): Invoice | undefined {
    return this.selectedInvoices.length === 1 ? this.selectedInvoices[0] : undefined;
  }

  get selectedInvoiceIds(): number[] {
    return this.selectedInvoices.map(invoice => invoice.id);
  }

  get selectedPhoneNumber(): string | null {
    const selected = this.selectedInvoices;
    if (selected.length === 0) return null;
    return this.getInvoicePhone(selected[0]);
  }

  isInvoiceSelectable(invoice: Invoice): boolean {
    if (invoice.statusId !== 4) return false;
    if (invoice.isSelected) return true;

    const selected = this.selectedInvoices;
    if (selected.length === 0) return true;

    const selectedPhone = this.getInvoicePhone(selected[0]);
    const invoicePhone = this.getInvoicePhone(invoice);
    return selectedPhone === invoicePhone;
  }

  toggleInvoiceSelection(invoice: Invoice): void {
    if (invoice.statusId !== 4) return;

    if (invoice.isSelected) {
      invoice.isSelected = false;
      this.cdr.markForCheck();
      return;
    }

    if (!this.isInvoiceSelectable(invoice)) return;

    invoice.isSelected = true;
    this.cdr.markForCheck();
  }

  private getInvoicePhone(invoice: Invoice): string {
    return String(invoice.phone || '').trim();
  }

  getStatusText(status: string): string {
    return status || '';
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

  toggleDropdown(id: number | string): void {
    this.openDropdownId = this.openDropdownId === id ? null : id;
    this.cdr.markForCheck();
  }

  viewOrder(id: number): void {
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

  sendSms(): void {
    const selected = this.selectedInvoices;
    if (selected.length === 0) return;

    this.selectedInvoiceId = selected[0].id;
    this.showBillDialog = true;
    this.cdr.markForCheck();
  }

  closeBillDialog(): void {
    this.showBillDialog = false;
    this.selectedInvoiceId = null;

    this.invoices.forEach(invoice => {
      invoice.isSelected = false;
    });
    this.cdr.markForCheck();
  }
}