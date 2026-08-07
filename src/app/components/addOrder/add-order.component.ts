import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { ReactiveFormsModule, AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AddOrderService } from '../../servicies/addOrder.service';
import { PersianCalendarComponent } from '../persianCalender/persianCalender';
import { Jalali, JalaliDate } from '../persianCalender/jalali';

export type InvoiceType = 'daily' | 'monthly';

export interface OrderItemPayload {
  serviceType: string;
  toothNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderPayload {
  clinicName: string;
  doctorName: string;
  headerField: string;
  patientName: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
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
  clinicName: FormControl<string>;
  doctorName: FormControl<string>;
  headerField: FormControl<string>;
  patientName: FormControl<string>;
  invoiceNumber: FormControl<string>;
  invoiceType: FormControl<InvoiceType>;
  entryDate: FormControl<string | null>;
  exitDate: FormControl<string | null>;
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
export class AddOrderComponent {
  showErrorModal = false;
  errorMessage = '';

  private readonly fb = inject(FormBuilder);
  private orderService = inject(AddOrderService);
  @Output() readonly orderSubmit = new EventEmitter<OrderPayload>();

  selectedFiles: File[] = [];
  showEntryCalendar = false;
  showExitCalendar = false;

  // اعتبارسنجی شماره فاکتور برای نوع روزانه
  private readonly invoiceNumberRequiredIfDaily = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const invoiceType = control.get('invoiceType')?.value as InvoiceType | null;
    const invoiceNumber = String(control.get('invoiceNumber')?.value ?? '').trim();
    return invoiceType === 'daily' && !invoiceNumber
      ? { invoiceNumberRequired: true }
      : null;
  };

  // اعتبارسنجی سفارشی برای تاریخ خروج
  private readonly exitDateAfterEntry = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const entry = control.get('entryDate')?.value as string | null;
    const exit = control.get('exitDate')?.value as string | null;
    if (!entry || !exit) return null;

    const entryParts = entry.split('/').map(Number);
    const exitParts = exit.split('/').map(Number);
    if (entryParts.length !== 3 || exitParts.length !== 3) return null;

    const entryObj: JalaliDate = { year: entryParts[0], month: entryParts[1], day: entryParts[2] };
    const exitObj: JalaliDate = { year: exitParts[0], month: exitParts[1], day: exitParts[2] };
    const entryGreg = Jalali.toGregorian(entryObj.year, entryObj.month, entryObj.day);
    const exitGreg = Jalali.toGregorian(exitObj.year, exitObj.month, exitObj.day);

    return exitGreg < entryGreg ? { exitDateInvalid: true } : null;
  };

  readonly form = this.fb.group(
    {
      clinicName: this.fb.nonNullable.control('', [Validators.required]),
      doctorName: this.fb.nonNullable.control('', [Validators.required]),
      headerField: this.fb.nonNullable.control('', [Validators.required]),
      patientName: this.fb.nonNullable.control('', [Validators.required]),
      invoiceNumber: this.fb.nonNullable.control(''),
      invoiceType: this.fb.nonNullable.control<InvoiceType>('daily'),
      entryDate: this.fb.control<string | null>(null, [Validators.required]),
      exitDate: this.fb.control<string | null>(null, [Validators.required]),
      discountAmount: this.fb.nonNullable.control(0, [Validators.min(0)]),
      description: this.fb.nonNullable.control(''),
      items: this.fb.array<FormGroup<OrderItemForm>>([this.createItemGroup()]),
    },
    { validators: [this.invoiceNumberRequiredIfDaily, this.exitDateAfterEntry] },
  ) as FormGroup<OrderFormControls>;

  get items(): FormArray<FormGroup<OrderItemForm>> {
    return this.form.controls.items;
  }

  // دریافت تاریخ ورود به صورت JalaliDate برای استفاده در minDate تقویم خروج
  get entryDateValue(): JalaliDate | undefined {
    const val = this.form.controls.entryDate.value;
    if (!val) return undefined;
    const parts = val.split('/').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    return undefined;
  }

  createItemGroup(): FormGroup<OrderItemForm> {
    return this.fb.nonNullable.group({
      serviceType: ['', [Validators.required]],
      toothNumber: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
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

  clearTopFields(): void {
    this.form.patchValue({
      clinicName: '',
      doctorName: '',
      headerField: '',
      patientName: '',
      invoiceNumber: '',
      invoiceType: 'daily',
      entryDate: null,
      exitDate: null,
      discountAmount: 0,
      description: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // متدهای تقویم
  onEntryDateSelected(date: string): void {
    this.form.controls.entryDate.setValue(date);
    this.showEntryCalendar = false;

    // اگر تاریخ خروج قبلاً انتخاب شده و از تاریخ ورود جدید کوچک‌تر است، پاک کن
    const exitVal = this.form.controls.exitDate.value;
    if (exitVal && this.entryDateValue) {
      const exitParts = exitVal.split('/').map(Number);
      if (exitParts.length === 3) {
        const exitObj: JalaliDate = { year: exitParts[0], month: exitParts[1], day: exitParts[2] };
        const entryObj = this.entryDateValue;
        const entryGreg = Jalali.toGregorian(entryObj.year, entryObj.month, entryObj.day);
        const exitGreg = Jalali.toGregorian(exitObj.year, exitObj.month, exitObj.day);
        if (exitGreg < entryGreg) {
          this.form.controls.exitDate.setValue(null);
        }
      }
    }
  }

  onExitDateSelected(date: string): void {
    this.form.controls.exitDate.setValue(date);
    this.showExitCalendar = false;
  }

  // متد جدید برای مدیریت انتخاب نامعتبر در تقویم خروج
  onInvalidExitDate(): void {
    this.errorMessage = 'تاریخ خروج نباید از تاریخ ورود کوچک‌تر باشد.';
    this.showErrorModal = true;
  }

  closeEntryCalendar(): void {
    this.showEntryCalendar = false;
  }

  closeExitCalendar(): void {
    this.showExitCalendar = false;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  trackByIndex(index: number): number {
    return index;
  }

  rowTotal(index: number): number {
    const row = this.items.at(index).getRawValue();
    return this.normalizeNumber(row.quantity) * this.normalizeNumber(row.unitPrice);
  }

  get grossTotal(): number {
    return this.items.controls.reduce((sum, row) => {
      const value = row.getRawValue();
      return sum + this.normalizeNumber(value.quantity) * this.normalizeNumber(value.unitPrice);
    }, 0);
  }

  get netTotal(): number {
    return Math.max(this.grossTotal - this.normalizeNumber(this.form.controls.discountAmount.value), 0);
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('fa-IR').format(value || 0);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (this.form.hasError('exitDateInvalid')) {
        this.errorMessage = 'تاریخ خروج نمی‌تواند از تاریخ ورود کوچک‌تر باشد.';
        this.showErrorModal = true;
      }
      return;
    }

    const raw = this.form.getRawValue();

    const items: OrderItemPayload[] = raw.items.map((item) => {
      const quantity = this.normalizeNumber(item.quantity);
      const unitPrice = this.normalizeNumber(item.unitPrice);
      return {
        serviceType: item.serviceType.trim(),
        toothNumber: item.toothNumber.trim(),
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      };
    });

    const grossTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = this.normalizeNumber(raw.discountAmount);
    const netTotal = Math.max(grossTotal - discountAmount, 0);

    const payload: OrderPayload = {
      clinicName: raw.clinicName.trim(),
      doctorName: raw.doctorName.trim(),
      headerField: raw.headerField.trim(),
      patientName: raw.patientName.trim(),
      invoiceNumber: raw.invoiceNumber.trim(),
      invoiceType: raw.invoiceType,
      entryDate: raw.entryDate ?? '',
      exitDate: raw.exitDate ?? '',
      discountAmount,
      description: raw.description.trim(),
      grossTotal,
      netTotal,
      items,
    };

    this.orderSubmit.emit(payload);
    this.sendOrderToBackend(payload);
  }

  private sendOrderToBackend(payload: OrderPayload): void {
    if (this.form.invalid) {
      alert('فرم نامعتبر است.');
      this.errorMessage = 'لطفاً تمام فیلدهای الزامی را به درستی پر کنید.';
      this.showErrorModal = true;
      return;
    }

    this.orderService.submitOrder(payload, this.selectedFiles).subscribe({
      next: response => {
        alert('سفارش با موفقیت ثبت شد!');
        this.form.reset();
        this.selectedFiles = [];
      },
      error: error => {
        this.errorMessage = 'خطایی رخ داده است مجددا تلاش کنید';
        this.showErrorModal = true;
      },
    });
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  private normalizeNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const normalized = String(value ?? '')
      .trim()
      .replace(/[,\s]/g, '')
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}