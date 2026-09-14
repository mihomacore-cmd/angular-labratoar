import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderDetailsComponent } from '../orderDetail/orderDetail';
import { forkJoin, Observable } from 'rxjs';

import {
  KanbanService,
  OrderDetailResponse
} from '../../servicies/kenbanService/kenban.service';

import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';
import { BillService } from '../../servicies/billService/BillService';

import { Jalali } from '../../components/persianCalender/jalali';


// =========================================================
// Attachment
// =========================================================

interface Attachment {
  id?: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  viewUrl?: string;
  downloadUrl?: string;
}


// =========================================================
// Bill Item
// =========================================================

interface BillItem {
  serviceType: string;
  toothNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}


// =========================================================
// Bill Order
// =========================================================

interface BillOrder {
  invoiceId: number;
  invoiceNumber?: string; 
  clinicName: string;
  doctorName: string;
  patientName: string;
  statusCode: string;
  invoiceType: string;
  phoneNumber: string;
  entryDate: string;
  exitDate: string;
  attachments: Attachment[];
  items: BillItem[];
  discountAmount: number;
  totalAmount: number;
  finalAmount: number;
}


// =========================================================
// Component
// =========================================================

@Component({
  selector: 'app-bill-preview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrderDetailsComponent
  ],
  templateUrl: './bill.html',
  styleUrls: ['./bill.scss']
})
export class BillPreviewComponent implements OnInit {

  // =========================================================
  // Services
  // =========================================================
private successAction: 'setInvoice' | 'sendSms' = 'setInvoice';

  private kanbanService = inject(KanbanService);
  private invoiceService = inject(InvoiceService);
  private billService = inject(BillService);



  // =========================================================
  // Inputs
  // =========================================================

  @Input() invoiceIds: number[] = [];
  @Input() invoiceId: number | null = null;


  // =========================================================
  // Outputs
  // =========================================================

  @Output() closed = new EventEmitter<void>();


  // =========================================================
  // Bill State
  // =========================================================

  loading = false;
  sending = false;
  errorMessage = '';



  // =========================================================
  // Orders
  // =========================================================

  orders: BillOrder[] = [];


  // =========================================================
  // Order Detail Dialog State
  // =========================================================

  isOrderDialogOpen = false;
  selectedOrderId: number | null = null;


  // =========================================================
  // Modal State
  // =========================================================

  showSuccessModal = false;
  successMessage = '';

  showErrorModal = false;
  errorModalMessage = '';


  // =========================================================
  // State for setting invoice number
  // =========================================================

  invoiceNumberToSet = '';
  settingInvoiceNumber = false;
  setInvoiceError = '';
  selectedFiles: File[] = [];


  // =========================================================
  // Lifecycle
  // =========================================================

  ngOnInit(): void {
    this.prepareInvoiceIds();
    this.loadOrders();
  }


  // =========================================================
  // Prepare Invoice IDs
  // =========================================================

  private prepareInvoiceIds(): void {
    if ((!this.invoiceIds || this.invoiceIds.length === 0) && this.invoiceId) {
      this.invoiceIds = [this.invoiceId];
    }

    this.invoiceIds = [
      ...new Set(
        (this.invoiceIds || [])
          .map(id => Number(id))
          .filter(id => Number.isFinite(id) && id > 0)
      )
    ];

    if (!this.invoiceId && this.invoiceIds.length > 0) {
      this.invoiceId = this.invoiceIds[0];
    }
  }


  // =========================================================
  // Load Orders
  // =========================================================

  loadOrders(): void {
    if (!this.invoiceIds || this.invoiceIds.length === 0) {
      this.errorMessage = 'شناسه فاکتور معتبر نیست.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.orders = [];

    const requests: Observable<OrderDetailResponse>[] = this.invoiceIds.map(
      id => this.kanbanService.getOrderById(id)
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.orders = responses.map((data, index) =>
          this.mapOrder(data, this.invoiceIds[index])
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('خطا در دریافت جزئیات فاکتورها:', error);
        this.errorMessage = 'خطا در دریافت اطلاعات فاکتورها. لطفاً مجدداً تلاش کنید.';
        this.loading = false;
        this.showErrorModalMessage('خطا در دریافت اطلاعات فاکتورها. لطفاً مجدداً تلاش کنید.');
      }
    });
  }


  // =========================================================
  // View Order
  // =========================================================

  viewOrder(id: number): void {
    if (!id) return;
    this.selectedOrderId = id;
    this.isOrderDialogOpen = true;
  }


  // =========================================================
  // Close Order Detail Dialog
  // =========================================================

  closeOrderDialog(): void {
    this.isOrderDialogOpen = false;
    this.selectedOrderId = null;
  }


  // =========================================================
  // Map API Response
  // =========================================================

  private mapOrder(data: OrderDetailResponse, invoiceId: number): BillOrder {
    const entryDate = data.entryDate ? this.convertToJalali(data.entryDate) : '';
    const exitDate = data.exitDate ? this.convertToJalali(data.exitDate) : '';

    const items: BillItem[] = (data.items || []).map(item => ({
      serviceType: item.serviceType || '',
      toothNumber: item.toothNumber || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      totalPrice: Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.unitPrice || 0)))
    }));

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const discountAmount = Number(data.discountAmount || 0);
    const finalAmount = Math.max(totalAmount - discountAmount, 0);

    return {
      invoiceId,
      clinicName: data.clinicName || '',
      doctorName: data.doctorName || '',
      patientName: data.patientName || '',
      statusCode:  '',
      invoiceType: this.getInvoiceTypeDisplay(data.invoiceType),
      invoiceNumber: data.invoiceNumber || '',
      phoneNumber: data.phoneNumber || '',
      entryDate,
      exitDate,
      attachments: (data.attachments || []).map((att: any) => ({
        id: att.id,
        fileName: att.fileName || '',
        fileType: att.fileType || '',
        fileSize: Number(att.fileSize || 0),
        viewUrl: att.viewUrl,
        downloadUrl: att.downloadUrl
      })),
      items,
      discountAmount,
      totalAmount,
      finalAmount
    };
  }


  // =========================================================
  // Invoice Type
  // =========================================================

  private getInvoiceTypeDisplay(invoiceType: string): string {
    switch (invoiceType) {
      case 'daily': return 'روزانه';
      case 'monthly': return 'ماهانه';
      case 'final': return 'نهایی';
      default: return invoiceType || '';
    }
  }


  // =========================================================
  // Convert Date To Jalali
  // =========================================================

  private convertToJalali(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const gregorianDate = new Date(Date.UTC(year, month - 1, day));
      const jalali = Jalali.toJalali(gregorianDate);
      return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }


  // =========================================================
  // Grand Totals
  // =========================================================

  get grandTotalAmount(): number {
    return this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  get grandDiscountAmount(): number {
    return this.orders.reduce((sum, order) => sum + order.discountAmount, 0);
  }

  get grandFinalAmount(): number {
    return this.orders.reduce((sum, order) => sum + order.finalAmount, 0);
  }


  // =========================================================
  // Selected Phone
  // =========================================================

  get selectedPhoneNumber(): string {
    return this.orders.length > 0 ? this.orders[0].phoneNumber || '' : '';
  }


  // =========================================================
  // Close Bill
  // =========================================================

  close(): void {
    if (this.sending) return;
    if (this.isOrderDialogOpen) {
      this.closeOrderDialog();
      return;
    }
    this.closed.emit();
  }


  // =========================================================
  // Format Money
  // =========================================================

  formatMoney(value: number): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '۰ ریال';
    }
    return Number(value).toLocaleString('fa-IR') + ' ریال';
  }


  // =========================================================
  // Status Class
  // =========================================================

  getStatusClass(status: string): string {
    switch (status) {
      case 'در انتظار پرداخت': return 'status-pending-payment';
      case 'انتظار ارسال فاکتور': return 'status-waiting-invoice';
      case 'پرداخت شده': return 'status-paid';
      case 'در حال ساخت': return 'status-building';
      case 'تحویل داده شده': return 'status-delivered';
      default: return 'status-default';
    }
  }


  // =========================================================
  // Send SMS
  // =========================================================

  sendSms(): void {
    if (!this.invoiceIds || this.invoiceIds.length === 0 || this.sending) {
      return;
    }

    this.sending = true;

    const requests = this.invoiceIds.map(id => this.invoiceService.sendSms(id));

    forkJoin(requests).subscribe({
      next: () => {
        this.sending = false;
       this.showSuccessModalMessage(
              `پیامک برای ${this.invoiceIds.length} فاکتور با موفقیت ارسال شد.`,
              'sendSms'
            );
      },
      error: (error) => {
        console.error('خطا در ارسال پیامک:', error);
        this.sending = false;
        this.showErrorModalMessage('در ارسال پیامک خطایی رخ داد. لطفاً مجدداً تلاش کنید.');
      }
    });
  }


  // =========================================================
  // Set Invoice Number for current orders
  // =========================================================

  setInvoiceNumberForOrders(): void {
    const trimmed = this.invoiceNumberToSet.trim();
    if (!trimmed) {
      this.setInvoiceError = 'لطفاً شماره فاکتور را وارد کنید.';
      return;
    }

    if (!this.invoiceIds || this.invoiceIds.length === 0) {
      this.setInvoiceError = 'هیچ سفارشی برای ثبت شماره وجود ندارد.';
      return;
    }

    this.settingInvoiceNumber = true;
    this.setInvoiceError = '';

    this.billService.setInvoiceNumber(this.invoiceIds, trimmed).subscribe({
      next: (responseMessage: string) => {
        this.settingInvoiceNumber = false;
        // استفاده از پیام دریافتی از سرور
          this.showSuccessModalMessage(
            responseMessage || `شماره فاکتور "${trimmed}" برای ${this.invoiceIds.length} سفارش با موفقیت ثبت شد.`,
            'setInvoice'
          );        // بارگذاری مجدد برای نمایش شماره جدید
        this.loadOrders();
      },
      error: (err) => {
        console.error('خطا در ثبت شماره فاکتور:', err);
        this.settingInvoiceNumber = false;
        this.setInvoiceError = 'ثبت شماره فاکتور با خطا مواجه شد. لطفاً مجدداً تلاش کنید.';
        this.showErrorModalMessage(this.setInvoiceError);
      }
    });
  }


  // =========================================================
  // Modal Helpers
  // =========================================================

 private showSuccessModalMessage(message: string, action: 'setInvoice' | 'sendSms' = 'setInvoice'): void {
  this.successMessage = message;
  this.successAction = action;
  this.showSuccessModal = true;
}
  private showErrorModalMessage(message: string): void {
    this.errorModalMessage = message;
    this.showErrorModal = true;
  }


  // =========================================================
  // Close Modals
  // =========================================================

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
      if (this.successAction === 'sendSms') {
          this.closed.emit();
        }

  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }


  // =========================================================
  // Retry
  // =========================================================

  retry(): void {
    this.loadOrders();
  }


  get allOrdersHaveInvoiceNumber(): boolean {
    if (this.orders.length === 0) return false;
    return this.orders.every(order => order.invoiceNumber && order.invoiceNumber.trim() !== '');
  }

onFilesSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  this.selectedFiles = input.files
    ? Array.from(input.files)
    : [];
}

removeFile(index: number): void {
  this.selectedFiles.splice(index, 1);
}


}