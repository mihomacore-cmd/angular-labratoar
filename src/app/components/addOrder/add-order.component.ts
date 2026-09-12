import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  OnInit,
} from '@angular/core';

import {
  ReactiveFormsModule,
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { AddOrderService } from '../../servicies/addOrder.service';
import { PersianCalendarComponent } from '../persianCalender/persianCalender';
import { Jalali, JalaliDate } from '../persianCalender/jalali';


export type InvoiceType = 'daily' | 'monthly';


export interface Clinic {
  id: number;
  name: string;
}


export interface ClinicDoctor {
  id: number;
  doctorId: number;
  doctorName: string;
  phone: string;
}


export interface OrderItemPayload {
  serviceType: string;
  toothNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}


export interface OrderPayload {
  clinicDoctorId: number;
  headerField: string;
  patientName: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  initialPaymentPercent: number | null;
  entryDate: string;
  exitDate: string;
  discountAmount: number;
  description: string;
  grossTotal: number;
  netTotal: number;
  items: OrderItemPayload[];
}


type OrderItemForm = {
  serviceType: FormControl<string>;
  toothNumber: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
};


type OrderFormControls = {
  clinicId: FormControl<number | null>;
  clinicDoctorId: FormControl<number | null>;
  headerField: FormControl<string>;
  patientName: FormControl<string>;
  invoiceNumber: FormControl<string>;
  invoiceType: FormControl<InvoiceType>;
  phone: FormControl<string>;
  entryDate: FormControl<string | null>;
  exitDate: FormControl<string | null>;
  initialPaymentPercent: FormControl<number | null>;
  discountAmount: FormControl<number>;
  description: FormControl<string>;
  items: FormArray<FormGroup<OrderItemForm>>;
};


@Component({
  selector: 'add-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PersianCalendarComponent,
  ],
  templateUrl: './add-order.component.html',
  styleUrl: './add-order.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddOrderComponent implements OnInit {

  clinics: Clinic[] = [];
  doctors: ClinicDoctor[] = [];


  showErrorModal = false;
  errorMessage = '';

  showSuccessModal = false;
  successMessage = '';


  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(AddOrderService);


  @Output()
  readonly orderSubmit = new EventEmitter<OrderPayload>();


  selectedFiles: File[] = [];

  showEntryCalendar = false;
  showExitCalendar = false;

 private readonly exitDateAfterEntry = (
    control: AbstractControl,
  ): ValidationErrors | null => {

    const entry =
      control.get('entryDate')?.value as string | null;

    const exit =
      control.get('exitDate')?.value as string | null;


    if (!entry || !exit) {
      return null;
    }


    const entryParts =
      entry.split('/').map(Number);

    const exitParts =
      exit.split('/').map(Number);


    if (
      entryParts.length !== 3 ||
      exitParts.length !== 3
    ) {
      return null;
    }


    const entryObj: JalaliDate = {
      year: entryParts[0],
      month: entryParts[1],
      day: entryParts[2],
    };


    const exitObj: JalaliDate = {
      year: exitParts[0],
      month: exitParts[1],
      day: exitParts[2],
    };


    const entryGreg =
      Jalali.toGregorian(
        entryObj.year,
        entryObj.month,
        entryObj.day
      );


    const exitGreg =
      Jalali.toGregorian(
        exitObj.year,
        exitObj.month,
        exitObj.day
      );


    return exitGreg < entryGreg
      ? { exitDateInvalid: true }
      : null;
  };

  readonly form = this.fb.group(
    {
      clinicId: this.fb.control<number | null>(
        null,
        Validators.required
      ),

      clinicDoctorId: this.fb.control<number | null>(
        null,
        Validators.required
      ),

      headerField: this.fb.nonNullable.control(
        '',
        [Validators.required]
      ),

      patientName: this.fb.nonNullable.control(
        '',
        [Validators.required]
      ),

      /*
       * شماره فاکتور در ابتدا خالی است.
       * Validator آن در onInvoiceTypeChange
       * بر اساس نوع فاکتور تنظیم می‌شود.
       */
      invoiceNumber: this.fb.nonNullable.control(''),

      /*
       * مقدار پیش‌فرض: روزانه
       */
      invoiceType: this.fb.nonNullable.control<InvoiceType>(
        'daily'
      ),


          initialPaymentPercent: this.fb.control<number | null>(
            60,
            [
              Validators.required,
              Validators.min(1),
              Validators.max(100),
            ]
          ),
      phone: this.fb.control<string>({
        value: '',
        disabled: true,
          }),

      entryDate: this.fb.control<string | null>(
        null,
        [Validators.required]
      ),

      exitDate: this.fb.control<string | null>(
        null
      ),

      discountAmount: this.fb.nonNullable.control(
        0,
        [Validators.min(0)]
      ),

      description: this.fb.nonNullable.control(''),

      items: this.fb.array<FormGroup<OrderItemForm>>([
        this.createItemGroup(),
      ]),
    },

    {
      validators: [
        this.exitDateAfterEntry,
      ],
    }

  ) as FormGroup<OrderFormControls>;


  ngOnInit(): void {

    /*
     * چون نوع فاکتور پیش‌فرض روزانه است،
     * شماره فاکتور باید از ابتدا فعال و اجباری باشد.
     */
    this.onInvoiceTypeChange();


    this.orderService.getClinics().subscribe({

      next: clinics => {
        this.clinics = clinics;
      },

      error: error => {
        console.error(error);
      },

    });

  }


  // ============================================================
  // تغییر نوع فاکتور
  // ============================================================

  onInvoiceTypeChange(): void {

  const invoiceType =
    this.form.controls.invoiceType.value;

  const invoiceNumberControl =
    this.form.controls.invoiceNumber;

  const initialPaymentPercentControl =
    this.form.controls.initialPaymentPercent;


  // ==========================================
  // MONTHLY
  // ==========================================

  if (invoiceType === 'monthly') {

    // Invoice Number
    invoiceNumberControl.setValue('');
    invoiceNumberControl.clearValidators();
    invoiceNumberControl.disable();
    invoiceNumberControl.updateValueAndValidity();


    // Initial Payment Percent
    initialPaymentPercentControl.setValue(null);
    initialPaymentPercentControl.clearValidators();
    initialPaymentPercentControl.disable();
    initialPaymentPercentControl.updateValueAndValidity();

    return;
  }


  // ==========================================
  // DAILY
  // ==========================================

  invoiceNumberControl.enable();

  invoiceNumberControl.setValidators([
    Validators.required,
  ]);

  invoiceNumberControl.updateValueAndValidity();


  initialPaymentPercentControl.enable();

  initialPaymentPercentControl.setValidators([
    Validators.required,
    Validators.min(1),
    Validators.max(100),
  ]);

  /*
   * اگر Daily شد و مقدار نداشت،
   * مقدار پیش‌فرض 60 قرار بده
   */
  if (
    initialPaymentPercentControl.value === null
  ) {
    initialPaymentPercentControl.setValue(60);
  }

  initialPaymentPercentControl.updateValueAndValidity();
}

  // ============================================================
  // تاریخ خروج باید بعد یا مساوی تاریخ ورود باشد
  // ============================================================

 


  // ============================================================
  // آیتم‌ها
  // ============================================================

  get items(): FormArray<FormGroup<OrderItemForm>> {
    return this.form.controls.items;
  }


  createItemGroup(): FormGroup<OrderItemForm> {

    return this.fb.nonNullable.group({

      serviceType: [
        '',
        [Validators.required],
      ],

      toothNumber: [
        '',
        [Validators.required],
      ],

      quantity: [
        1,
        [
          Validators.required,
          Validators.min(1),
        ],
      ],

      unitPrice: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

    });

  }


  addItem(): void {
    this.items.push(
      this.createItemGroup()
    );
  }


  removeItem(index: number): void {

    if (this.items.length === 1) {

      this.items.at(0).reset({
        serviceType: '',
        toothNumber: '',
        quantity: 1,
        unitPrice: 0,
      });

      return;
    }


    this.items.removeAt(index);

  }


  // ============================================================
  // پاک کردن فیلدهای بالای فرم
  // ============================================================
clearTopFields(): void {

  this.form.patchValue({

    clinicDoctorId: null,

    clinicId: null,

    headerField: '',

    patientName: '',

    invoiceNumber: '',

    invoiceType: 'daily',

    phone: '',

    entryDate: null,

    exitDate: null,

    initialPaymentPercent: 60,

    discountAmount: 0,

    description: '',

  });

  this.onInvoiceTypeChange();

  this.form.markAsPristine();
  this.form.markAsUntouched();
}


  // ============================================================
  // تاریخ ورود
  // ============================================================

  onEntryDateSelected(date: string): void {

    this.form.controls.entryDate.setValue(date);

    this.showEntryCalendar = false;


    /*
     * اگر تاریخ خروج قبلاً انتخاب شده باشد
     * و بعد از تغییر تاریخ ورود نامعتبر شده باشد،
     * تاریخ خروج پاک می‌شود.
     */

    const exitVal =
      this.form.controls.exitDate.value;


    if (
      exitVal &&
      this.entryDateValue
    ) {

      const exitParts =
        exitVal.split('/').map(Number);


      if (exitParts.length === 3) {

        const exitObj: JalaliDate = {
          year: exitParts[0],
          month: exitParts[1],
          day: exitParts[2],
        };


        const entryObj =
          this.entryDateValue;


        const entryGreg =
          Jalali.toGregorian(
            entryObj.year,
            entryObj.month,
            entryObj.day
          );


        const exitGreg =
          Jalali.toGregorian(
            exitObj.year,
            exitObj.month,
            exitObj.day
          );


        if (exitGreg < entryGreg) {

          this.form.controls.exitDate.setValue(null);

        }

      }

    }

  }


  // ============================================================
  // تاریخ خروج
  // ============================================================

  onExitDateSelected(date: string): void {

    this.form.controls.exitDate.setValue(date);

    this.showExitCalendar = false;

  }


  onInvalidExitDate(): void {

    this.errorMessage =
      'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';

    this.showErrorModal = true;

  }


  closeEntryCalendar(): void {
    this.showEntryCalendar = false;
  }


  closeExitCalendar(): void {
    this.showExitCalendar = false;
  }


  // ============================================================
  // تاریخ ورود برای minDate تقویم خروج
  // ============================================================

  get entryDateValue(): JalaliDate | undefined {

    const val =
      this.form.controls.entryDate.value;


    if (!val) {
      return undefined;
    }


    const parts =
      val.split('/').map(Number);


    if (
      parts.length === 3 &&
      parts.every(
        p => !isNaN(p)
      )
    ) {

      return {
        year: parts[0],
        month: parts[1],
        day: parts[2],
      };

    }


    return undefined;

  }


  // ============================================================
  // فایل‌ها
  // ============================================================

  onFilesSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    this.selectedFiles =
      input.files
        ? Array.from(input.files)
        : [];

  }


  // ============================================================
  // Track By
  // ============================================================

  trackByIndex(index: number): number {
    return index;
  }


  // ============================================================
  // محاسبه قیمت هر ردیف
  // ============================================================

  rowTotal(index: number): number {

    const row =
      this.items
        .at(index)
        .getRawValue();


    return (
      this.normalizeNumber(row.quantity) *
      this.normalizeNumber(row.unitPrice)
    );

  }


  // ============================================================
  // جمع کل
  // ============================================================

  get grossTotal(): number {

    return this.items.controls.reduce(
      (sum, row) => {

        const value =
          row.getRawValue();


        return (
          sum +
          this.normalizeNumber(value.quantity) *
          this.normalizeNumber(value.unitPrice)
        );

      },
      0
    );

  }


  // ============================================================
  // مبلغ قابل پرداخت
  // ============================================================

  get netTotal(): number {

    return Math.max(

      this.grossTotal -
      this.normalizeNumber(
        this.form.controls.discountAmount.value
      ),

      0

    );

  }


  // ============================================================
  // فرمت پول
  // ============================================================

  formatMoney(value: number): string {

    return new Intl.NumberFormat(
      'fa-IR'
    ).format(value || 0);

  }


  // ============================================================
  // تبدیل تاریخ شمسی به میلادی
  // ============================================================

  private convertPersianToGregorian(
    persianDate: string
  ): string {

    if (!persianDate) {
      return '';
    }


    const parts =
      persianDate
        .split('/')
        .map(Number);


    if (
      parts.length !== 3 ||
      parts.some(isNaN)
    ) {
      return '';
    }


    try {

      const gregorianDate =
        Jalali.toGregorian(
          parts[0],
          parts[1],
          parts[2]
        );


      const year =
        gregorianDate.getUTCFullYear();


      const month =
        gregorianDate.getUTCMonth() + 1;


      const day =
        gregorianDate.getUTCDate();


      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    } catch {

      return '';

    }

  }


  // ============================================================
  // ثبت سفارش
  // ============================================================

  onSubmit(): void {

    this.form.markAllAsTouched();


    if (this.form.invalid) {

      if (
        this.form.controls.invoiceNumber.hasError(
          'required'
        )
      ) {

        this.errorMessage =
          'برای فاکتور روزانه، شماره فاکتور الزامی است.';

        this.showErrorModal = true;

        return;
      }


      if (
        this.form.hasError(
          'exitDateInvalid'
        )
      ) {

        this.errorMessage =
          'تاریخ خروج نمی‌تواند از تاریخ ورود کوچک‌تر باشد.';

        this.showErrorModal = true;

        return;
      }


      return;
    }


    /*
     * getRawValue استفاده شده چون
     * invoiceNumber در حالت ماهیانه disable است.
     *
     * البته در حالت ماهیانه مقدار آن قبلاً
     * توسط onInvoiceTypeChange خالی شده است.
     */
    const raw =
      this.form.getRawValue();


    const items: OrderItemPayload[] =
      raw.items.map((item) => {

        const quantity =
          this.normalizeNumber(
            item.quantity
          );


        const unitPrice =
          this.normalizeNumber(
            item.unitPrice
          );


        return {

          serviceType:
            item.serviceType.trim(),

          toothNumber:
            item.toothNumber.trim(),

          quantity,

          unitPrice,

          totalPrice:
            quantity * unitPrice,

        };

      });


    const grossTotal =
      items.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0
      );


    const discountAmount =
      this.normalizeNumber(
        raw.discountAmount
      );


    const netTotal =
      Math.max(
        grossTotal - discountAmount,
        0
      );


    /*
     * اگر ماهیانه باشد،
     * شماره فاکتور را صراحتاً خالی ارسال می‌کنیم.
     */
    const invoiceNumber =
      raw.invoiceType === 'monthly'
        ? ''
        : raw.invoiceNumber.trim();


    const payload: OrderPayload = {

      clinicDoctorId:
        raw.clinicDoctorId!,

      headerField:
        raw.headerField.trim(),

      patientName:
        raw.patientName.trim(),

      invoiceNumber,

      invoiceType:
        raw.invoiceType,

      initialPaymentPercent:
        raw.invoiceType === 'daily'
          ? this.normalizeNumber(raw.initialPaymentPercent)
          : null,



      entryDate:
        this.convertPersianToGregorian(
          raw.entryDate ?? ''
        ),

      exitDate:
        this.convertPersianToGregorian(
          raw.exitDate ?? ''
        ),

      discountAmount,

      description:
        raw.description.trim(),

      grossTotal,

      netTotal,

      items,

    };


    this.orderSubmit.emit(payload);

    this.sendOrderToBackend(payload);

  }


  // ============================================================
  // ارسال به بک‌اند
  // ============================================================

  private sendOrderToBackend(
    payload: OrderPayload
  ): void {

    if (this.form.invalid) {

      alert('فرم نامعتبر است.');

      this.errorMessage =
        'لطفاً تمام فیلدهای الزامی را به درستی پر کنید.';

      this.showErrorModal = true;

      return;
    }


    this.orderService
      .submitOrder(
        payload,
        this.selectedFiles
      )
      .subscribe({

        next: response => {

          this.successMessage =
            'سفارش با موفقیت ثبت شد.';

          this.showSuccessModal = true;


          /*
           * فرم ریست می‌شود.
           *
           * چون invoiceNumber ممکن است قبل از ثبت
           * disabled بوده باشد، بعد از reset هم
           * وضعیتش را مجدداً تنظیم می‌کنیم.
           */
          this.form.reset();

          this.selectedFiles = [];


          /*
           * بعد از reset، نوع فاکتور دوباره
           * روزانه و شماره فاکتور فعال و اجباری است.
           */
          this.onInvoiceTypeChange();

        },


        error: error => {

          console.error(
            '❌ خطای ثبت سفارش:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            error?.error ||
            'خطایی در ثبت سفارش رخ داده است.';


          this.showErrorModal = true;

        },

      });

  }


  // ============================================================
  // بستن مودال خطا
  // ============================================================

  closeErrorModal(): void {

    this.showErrorModal = false;

    this.errorMessage = '';

  }


  // ============================================================
  // بستن مودال موفقیت
  // ============================================================

  closeSuccessModal(): void {

    this.showSuccessModal = false;

    this.successMessage = '';

  }


  // ============================================================
  // نرمال‌سازی اعداد فارسی / انگلیسی
  // ============================================================

  private normalizeNumber(
    value: number | string | null | undefined
  ): number {

    if (typeof value === 'number') {

      return Number.isFinite(value)
        ? value
        : 0;

    }


    const normalized =
      String(value ?? '')
        .trim()
        .replace(/[,\s]/g, '')
        .replace(
          /[۰-۹]/g,
          (digit) =>
            String(
              '۰۱۲۳۴۵۶۷۸۹'
                .indexOf(digit)
            )
        )
        .replace(
          /[٠-٩]/g,
          (digit) =>
            String(
              '٠١٢٣٤٥٦٧٨٩'
                .indexOf(digit)
            )
        );


    const parsed =
      Number(normalized);


    return Number.isFinite(parsed)
      ? parsed
      : 0;

  }


  // ============================================================
  // تغییر کلینیک
  // ============================================================

  onClinicChange(): void {

    const clinicId =
      this.form.controls.clinicId.value;


    /*
     * پزشک قبلی پاک می‌شود.
     */
    this.form.controls.clinicDoctorId
      .setValue(null);


    /*
     * شماره تلفن قبلی پاک می‌شود.
     */
    this.form.controls.phone
      .setValue('');


    this.doctors = [];


    if (!clinicId) {
      return;
    }


    this.orderService
      .getDoctorsByClinic(clinicId)
      .subscribe({

        next: doctors => {

          this.doctors = doctors;

        },


        error: error => {

          console.error(error);


          this.errorMessage =
            'دریافت پزشکان کلینیک با خطا مواجه شد.';


          this.showErrorModal = true;

        },

      });

  }


  // ============================================================
  // تغییر پزشک
  // ============================================================

  onDoctorChange(): void {

    const clinicDoctorId =
      this.form.controls.clinicDoctorId.value;


    if (!clinicDoctorId) {

      this.form.controls.phone
        .setValue('');

      return;
    }


    const selectedDoctor =
      this.doctors.find(
        doctor =>
          doctor.id === Number(
            clinicDoctorId
          )
      );


    if (!selectedDoctor) {

      this.form.controls.phone
        .setValue('');

      return;
    }


    this.form.controls.phone
      .setValue(
        selectedDoctor.phone
      );

  }
  onInvoiceNumberClick(): void {
  if (this.form.controls.invoiceType.value === 'monthly') {
    this.errorMessage =
      'برای نوع فاکتور ماهیانه شماره فاکتور نیاز نیست.';

    this.showErrorModal = true;
  }
}


get finalPaymentAmount(): number {

  if (
    this.form.controls.invoiceType.value !== 'daily'
  ) {
    return 0;
  }

  return Math.max(
    this.netTotal - this.initialPaymentAmount,
    0
  );
}

get initialPaymentAmount(): number {

  if (
    this.form.controls.invoiceType.value !== 'daily'
  ) {
    return 0;
  }

  const percent =
    this.normalizeNumber(
      this.form.controls.initialPaymentPercent.value
    );

  const total =
    this.netTotal;

  if (percent <= 0) {
    return 0;
  }

  return Math.round(
    total * percent / 100
  );
}



}