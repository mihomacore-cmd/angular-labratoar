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
import {
  debounceTime,
  takeUntil
} from 'rxjs/operators';

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

  dateIn: string;
  dateOut: string;

  status: string;

  phone: string;

  statusId: number;

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

  // =========================================================
  // Cache
  // =========================================================

  private dateCache = new Map<string, string>();

  private destroy$ = new Subject<void>();

  private searchSubject = new Subject<void>();


  // =========================================================
  // Data
  // =========================================================

  invoices: Invoice[] = [];

  filteredInvoices: Invoice[] = [];


  // =========================================================
  // Filters
  // =========================================================

  quickSearch = '';

  advancedPatient = '';

  advancedDoctor = '';

  advancedClinic = '';

  advancedStatus = '';


  // =========================================================
  // Dropdown
  // =========================================================

  openDropdownId: number | string | null = null;


  // =========================================================
  // Order Dialog
  // =========================================================

  isOrderDialogOpen = false;

  selectedOrderId: number | null = null;


  // =========================================================
  // Bill Dialog
  // =========================================================

  showBillDialog = false;

  selectedInvoiceId: number | null = null;


  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // Init
  // =========================================================

  ngOnInit(): void {

    this.loadInvoices();

    this.searchSubject
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {

        this.applyFilters();

        this.cdr.markForCheck();

      });
  }


  // =========================================================
  // Destroy
  // =========================================================

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }


  // =========================================================
  // Load Invoices
  // =========================================================

  loadInvoices(): void {

    this.invoiceService.getInvoices().subscribe({

      next: (data: Invoice[]) => {

        /*
         * اطلاعات جدید از API دریافت شده.
         *
         * انتخاب‌های قبلی عمداً پاک می‌شوند،
         * چون اطلاعات جدول مجدداً بارگذاری شده است.
         */

        this.invoices = (data || []).map(
          (item: Invoice) => ({

            ...item,

            isSelected: false,

            dateIn: this.convertToJalali(
              item.dateIn
            ),

            dateOut: this.convertToJalali(
              item.dateOut
            )

          })
        );


        this.applyFilters();

        this.cdr.markForCheck();
      },


      error: (error) => {

        console.error(
          'خطا در دریافت اطلاعات فاکتورها:',
          error
        );

        this.invoices = [];

        this.filteredInvoices = [];

        this.cdr.markForCheck();
      }

    });
  }


  // =========================================================
  // Convert Gregorian -> Jalali
  // =========================================================

  public convertToJalali(
    dateStr: string
  ): string {

    if (!dateStr) {
      return '';
    }


    if (this.dateCache.has(dateStr)) {

      return this.dateCache.get(dateStr)!;
    }


    try {

      const parts = dateStr.split('-');

      if (parts.length < 3) {
        return dateStr;
      }


      const year = parseInt(
        parts[0],
        10
      );

      const month = parseInt(
        parts[1],
        10
      );

      const day = parseInt(
        parts[2],
        10
      );


      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day)
      ) {

        return dateStr;
      }


      const gregorianDate = new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );


      const jalali =
        Jalali.toJalali(
          gregorianDate
        );


      const result =
        `${jalali.year}/` +
        `${String(jalali.month).padStart(2, '0')}/` +
        `${String(jalali.day).padStart(2, '0')}`;


      this.dateCache.set(
        dateStr,
        result
      );


      return result;

    } catch {

      return dateStr;
    }
  }


  // =========================================================
  // Filters
  // =========================================================

  private applyFilters(): void {

    let result = [...this.invoices];


    // -------------------------------------------------------
    // جستجوی سریع
    // -------------------------------------------------------

    const quick =
      this.normalizeSearch(
        this.quickSearch
      );


    if (quick) {

      result = result.filter(inv =>

        this.normalizeSearch(
          inv.clinic
        ).includes(quick)

        ||

        this.normalizeSearch(
          inv.doctor
        ).includes(quick)

        ||

        this.normalizeSearch(
          inv.header
        ).includes(quick)

        ||

        this.normalizeSearch(
          inv.patient
        ).includes(quick)

        ||

        this.normalizeSearch(
          inv.number
        ).includes(quick)

      );
    }


    // -------------------------------------------------------
    // بیمار
    // -------------------------------------------------------

    const patient =
      this.normalizeSearch(
        this.advancedPatient
      );


    if (patient) {

      result = result.filter(inv =>

        this.normalizeSearch(
          inv.patient
        ).includes(patient)

      );
    }


    // -------------------------------------------------------
    // پزشک
    // -------------------------------------------------------

    const doctor =
      this.normalizeSearch(
        this.advancedDoctor
      );


    if (doctor) {

      result = result.filter(inv =>

        this.normalizeSearch(
          inv.doctor
        ).includes(doctor)

      );
    }


    // -------------------------------------------------------
    // کلینیک
    // -------------------------------------------------------

    const clinic =
      this.normalizeSearch(
        this.advancedClinic
      );


    if (clinic) {

      result = result.filter(inv =>

        this.normalizeSearch(
          inv.clinic
        ).includes(clinic)

      );
    }


    // -------------------------------------------------------
    // وضعیت
    // -------------------------------------------------------

    if (this.advancedStatus) {

      result = result.filter(inv =>

        inv.status === this.advancedStatus

      );
    }


    this.filteredInvoices = result;
  }


  // =========================================================
  // Normalize Search
  // =========================================================

  private normalizeSearch(
    value: string | null | undefined
  ): string {

    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک');
  }


  // =========================================================
  // Search
  // =========================================================

  onSearch(): void {

    this.searchSubject.next();
  }


  // =========================================================
  // Reset
  // =========================================================

  onReset(): void {

    this.quickSearch = '';

    this.advancedPatient = '';

    this.advancedDoctor = '';

    this.advancedClinic = '';

    this.advancedStatus = '';


    this.applyFilters();

    this.cdr.markForCheck();
  }


  // =========================================================
  // Selected Invoices
  // =========================================================

  get selectedInvoices(): Invoice[] {

    /*
     * از invoices استفاده می‌کنیم، نه filteredInvoices.
     *
     * بنابراین اگر کاربر بعد از انتخاب فاکتور
     * فیلتر را تغییر دهد، انتخاب قبلی حفظ می‌شود.
     */

    return this.invoices.filter(invoice =>

      invoice.statusId === 4 &&

      invoice.isSelected === true

    );
  }


  // =========================================================
  // Selected Count
  // =========================================================

  get totalCount(): number {

    return this.selectedInvoices.length;
  }


  // =========================================================
  // Total Amount
  // =========================================================

  get totalAmount(): number {

    return this.selectedInvoices.reduce(

      (sum, invoice) =>

        sum + Number(
          invoice.amount || 0
        ),

      0
    );
  }


  // =========================================================
  // Selected Invoice
  // =========================================================

  get selectedInvoice(): Invoice | undefined {

    return this.selectedInvoices.length === 1

      ? this.selectedInvoices[0]

      : undefined;
  }


  // =========================================================
  // Selected Invoice IDs
  // =========================================================

  /*
   * توجه:
   *
   * اینجا فقط getter داریم.
   *
   * بنابراین دیگر نباید این را داشته باشیم:
   *
   * selectedInvoiceIds: number[] = [];
   */

  get selectedInvoiceIds(): number[] {

    return this.selectedInvoices.map(
      invoice => invoice.id
    );
  }


  // =========================================================
  // Selected Phone
  // =========================================================

  get selectedPhoneNumber(): string | null {

    const selected =
      this.selectedInvoices;


    if (selected.length === 0) {

      return null;
    }


    return this.getInvoicePhone(
      selected[0]
    );
  }


  // =========================================================
  // Check Selectable Invoice
  // =========================================================

  isInvoiceSelectable(
    invoice: Invoice
  ): boolean {

    /*
     * فقط statusId = 4 قابل انتخاب است.
     */

    if (invoice.statusId !== 4) {

      return false;
    }


    /*
     * اگر خود فاکتور قبلاً انتخاب شده،
     * اجازه لغو انتخاب داشته باشد.
     */

    if (invoice.isSelected) {

      return true;
    }


    const selected =
      this.selectedInvoices;


    /*
     * اگر هیچ فاکتوری انتخاب نشده،
     * هر فاکتور statusId=4 قابل انتخاب است.
     */

    if (selected.length === 0) {

      return true;
    }


    const selectedPhone =
      this.getInvoicePhone(
        selected[0]
      );


    const invoicePhone =
      this.getInvoicePhone(
        invoice
      );


    /*
     * فقط فاکتورهای دارای شماره تلفن یکسان
     * قابل انتخاب هستند.
     */

    return selectedPhone === invoicePhone;
  }


  // =========================================================
  // Toggle Invoice Selection
  // =========================================================

  toggleInvoiceSelection(
    invoice: Invoice
  ): void {

    /*
     * فقط statusId = 4
     */

    if (invoice.statusId !== 4) {

      return;
    }


    /*
     * اگر قبلاً انتخاب شده،
     * انتخاب را لغو کن.
     */

    if (invoice.isSelected) {

      invoice.isSelected = false;

      this.cdr.markForCheck();

      return;
    }


    /*
     * اگر شماره تلفن متفاوت است،
     * انتخاب ممنوع است.
     */

    if (
      !this.isInvoiceSelectable(invoice)
    ) {

      return;
    }


    /*
     * انتخاب فاکتور
     */

    invoice.isSelected = true;

    this.cdr.markForCheck();
  }


  // =========================================================
  // Get Invoice Phone
  // =========================================================

  private getInvoicePhone(
    invoice: Invoice
  ): string {

    return String(
      invoice.phone || ''
    ).trim();
  }


  // =========================================================
  // Status Text
  // =========================================================

  getStatusText(
    status: string
  ): string {

    return status || '';
  }


  // =========================================================
  // Status Class
  // =========================================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'در انتظار پرداخت':
        return 'status-pending-payment';

      case 'انتظار ارسال فاکتور':
        return 'status-waiting-invoice';

      case 'پرداخت شده':
        return 'status-paid';

      case 'در حال ساخت':
        return 'status-building';

      case 'تحویل داده شده':
        return 'status-delivered';

      default:
        return '';
    }
  }


  // =========================================================
  // TrackBy
  // =========================================================

  trackById(
    index: number,
    item: Invoice
  ): number {

    return item.id;
  }


  // =========================================================
  // Dropdown
  // =========================================================

  toggleDropdown(
    id: number | string
  ): void {

    this.openDropdownId =
      this.openDropdownId === id

        ? null

        : id;


    this.cdr.markForCheck();
  }


  // =========================================================
  // View Order
  // =========================================================

  viewOrder(
    id: number
  ): void {

    this.openDropdownId = null;

    this.selectedOrderId = id;

    this.isOrderDialogOpen = true;


    this.cdr.markForCheck();
  }


  // =========================================================
  // Close Order Dialog
  // =========================================================

  closeOrderDialog(): void {

    this.isOrderDialogOpen = false;

    this.selectedOrderId = null;


    this.cdr.markForCheck();
  }


  // =========================================================
  // Open Bill Preview
  // =========================================================

  sendSms(): void {

    const selected =
      this.selectedInvoices;


    /*
     * حداقل یک فاکتور باید انتخاب شده باشد.
     */

    if (selected.length === 0) {

      return;
    }


    /*
     * BillPreview فعلاً فقط یک invoiceId
     * دریافت می‌کند.
     *
     * بنابراین اولین فاکتور انتخاب‌شده
     * برای نمایش صورتحساب ارسال می‌شود.
     */

    this.selectedInvoiceId =
      selected[0].id;


    /*
     * باز کردن دیالوگ
     */

    this.showBillDialog = true;


    this.cdr.markForCheck();
  }


  // =========================================================
  // Close Bill Dialog
  // =========================================================

  closeBillDialog(): void {

    this.showBillDialog = false;

    this.selectedInvoiceId = null;


    /*
     * بعد از بسته شدن صورتحساب،
     * انتخاب‌ها پاک می‌شوند.
     */

    this.invoices.forEach(
      invoice => {

        invoice.isSelected = false;

      }
    );


    this.cdr.markForCheck();
  }

}