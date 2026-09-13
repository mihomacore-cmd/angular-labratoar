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

import { BillService } from '../../servicies/billService/BillService';

import { OrderDetailsComponent } from '../orderDetail/orderDetail';

import { Jalali } from '../persianCalender/jalali';

import { BillPreviewComponent } from '../bill/bill';


// =========================================================
// Invoice Interface
// =========================================================

interface Invoice {

  id: number;

  clinic: string;

  doctor: string;

  clinicDoctorId: number | string;

  header: string;

  number: string | null;

  patient: string;

  amount: number;

  dateIn: string;

  dateOut: string;

  status: string;

  phone: string;

  /**
   * API جدید statusId ارسال نمی‌کند.
   *
   * برای سازگاری با منطق قبلی،
   * در Angular از روی status ساخته می‌شود.
   */
  statusId: number;

  isSelected?: boolean;
}


// =========================================================
// Component
// =========================================================

@Component({

  selector: 'app-factor-list',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    OrderDetailsComponent,
    BillPreviewComponent
  ],

  templateUrl: './createBill.html',

  styleUrls: ['./createBill.scss'],

  changeDetection: ChangeDetectionStrategy.OnPush

})
export class CreateBillComponent
  implements OnInit, OnDestroy {


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

    private billService: BillService,

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

    this.billService
      .getFactorsToCreateBill()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({

        next: (data: any[]) => {

          /*
           * API جدید اطلاعات فاکتورها را برمی‌گرداند.
           *
           * statusId در API وجود ندارد،
           * بنابراین برای سازگاری با منطق انتخاب قبلی،
           * آن را از status محاسبه می‌کنیم.
           */

          this.invoices = (data || []).map(
            (item: any): Invoice => ({

              id: Number(item.id),

              clinic: item.clinic ?? '',

              doctor: item.doctor ?? '',

              clinicDoctorId:
                item.clinicDoctorId ?? '',

              header: item.header ?? '',

              number:
                item.number ?? null,

              patient:
                item.patient ?? '',

              amount:
                Number(item.amount ?? 0),

              dateIn:
                this.convertToJalali(
                  item.dateIn
                ),

              dateOut:
                this.convertToJalali(
                  item.dateOut
                ),

              status:
                item.status ?? '',

              phone:
                String(item.phone ?? '').trim(),

              /*
               * وضعیت API:
               *
               * WAITING_INVOICE_SEND
               *
               * معادل statusId = 4
               * در منطق قبلی برنامه است.
               */

              statusId:
                this.getStatusId(
                  item.status
                ),

              isSelected: false

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
  // Convert Status -> StatusId
  // =========================================================

  private getStatusId(
    status: string | null | undefined
  ): number {

    switch (status) {

      case 'WAITING_INVOICE_SEND':

        return 4;

      case 'انتظار ارسال فاکتور':

        return 4;

      default:

        return 0;

    }

  }


  // =========================================================
  // Convert Gregorian -> Jalali
  // =========================================================

  public convertToJalali(
    dateStr: string | null | undefined
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
    // Quick Search
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
    // Patient
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
    // Doctor
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
    // Clinic
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
    // Status
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

        sum +
        Number(invoice.amount || 0),

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

    if (invoice.statusId !== 4) {

      return false;

    }


    if (invoice.isSelected) {

      return true;

    }


    const selected =
      this.selectedInvoices;


    if (selected.length === 0) {

      return true;

    }


    const selectedClinicDoctorId =
      selected[0].clinicDoctorId;


    const invoiceClinicDoctorId =
      invoice.clinicDoctorId;


    return (
      selectedClinicDoctorId ===
      invoiceClinicDoctorId
    );

  }


  // =========================================================
  // Toggle Invoice Selection
  // =========================================================

  toggleInvoiceSelection(
    invoice: Invoice
  ): void {

    /*
     * فقط فاکتورهای statusId = 4
     * قابل انتخاب هستند.
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
     * اگر clinicDoctorId متفاوت باشد،
     * اجازه انتخاب نداریم.
     */

    if (
      !this.isInvoiceSelectable(invoice)
    ) {

      return;

    }


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

    switch (status) {

      case 'WAITING_INVOICE_SEND':

        return 'انتظار ارسال فاکتور';

      default:

        return status || '';

    }

  }


  // =========================================================
  // Status Class
  // =========================================================

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'WAITING_INVOICE_SEND':

        return 'status-waiting-invoice';


      case 'انتظار ارسال فاکتور':

        return 'status-waiting-invoice';


      case 'پرداخت شده':

        return 'status-paid';


      case 'در حال ساخت':

        return 'status-building';


      case 'تحویل داده شده':

        return 'status-delivered';


      case 'در انتظار پرداخت':

        return 'status-pending-payment';


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


    if (selected.length === 0) {

      return;

    }


    /*
     * BillPreview قابلیت دریافت
     * چند invoiceId را دارد.
     */

    this.selectedInvoiceId =
      selected[0].id;


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
     * پاک کردن انتخاب‌ها
     */

    this.invoices.forEach(
      invoice => {

        invoice.isSelected = false;

      }
    );


    /*
     * دریافت مجدد اطلاعات
     */

    this.loadInvoices();


    this.cdr.markForCheck();

  }

}
