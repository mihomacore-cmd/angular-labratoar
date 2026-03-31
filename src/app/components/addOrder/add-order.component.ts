import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

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
  attachments: File[];
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
  entryDate: FormControl<string>;
  exitDate: FormControl<string>;
  discountAmount: FormControl<number>;
  description: FormControl<string>;
  items: FormArray<FormGroup<OrderItemForm>>;
};

@Component({
  selector: 'add-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-order.component.html',
  styleUrl: './add-order.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddOrderComponent {
  private readonly fb = inject(FormBuilder);

  @Output() readonly orderSubmit = new EventEmitter<OrderPayload>();

  selectedFiles: File[] = [];

  private readonly invoiceNumberRequiredIfDaily = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const invoiceType = control.get('invoiceType')?.value as InvoiceType | null;
    const invoiceNumber = String(control.get('invoiceNumber')?.value ?? '').trim();

    return invoiceType === 'daily' && !invoiceNumber
      ? { invoiceNumberRequired: true }
      : null;
  };

  readonly form = this.fb.group(
    {
      clinicName: this.fb.nonNullable.control('', [Validators.required]),
      doctorName: this.fb.nonNullable.control('', [Validators.required]),
      headerField: this.fb.nonNullable.control('', [Validators.required]),
      patientName: this.fb.nonNullable.control('', [Validators.required]),
      invoiceNumber: this.fb.nonNullable.control(''),
      invoiceType: this.fb.nonNullable.control<InvoiceType>('daily'),
      entryDate: this.fb.nonNullable.control('', [Validators.required]),
      exitDate: this.fb.nonNullable.control('', [Validators.required]),
      discountAmount: this.fb.nonNullable.control(0, [Validators.min(0)]),
      description: this.fb.nonNullable.control(''),
      items: this.fb.array<FormGroup<OrderItemForm>>([this.createItemGroup()]),
    },
    { validators: [this.invoiceNumberRequiredIfDaily] },
  ) as FormGroup<OrderFormControls>;

  get items(): FormArray<FormGroup<OrderItemForm>> {
    return this.form.controls.items;
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
      entryDate: '',
      exitDate: '',
      discountAmount: 0,
      description: '',
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
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
      entryDate: raw.entryDate.trim(),
      exitDate: raw.exitDate.trim(),
      discountAmount,
      description: raw.description.trim(),
      grossTotal,
      netTotal,
      items,
      attachments: [...this.selectedFiles],
    };

    this.orderSubmit.emit(payload);
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