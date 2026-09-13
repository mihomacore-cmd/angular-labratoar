import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';
import {Jalali} from '../../components/persianCalender/jalali';
import { OrderDetailsComponent } from '../orderDetail/orderDetail';
// اگر مسیر orderDetail متفاوت است، مسیر بالا را مطابق پروژه خودت تغییر بده.

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    OrderDetailsComponent
  ],
  templateUrl: './orderList.html',
  styleUrls: ['./orderList.scss']
})
export class OrderListComponent implements OnInit {

  private invoiceService = inject(InvoiceService);

  orders: any[] = [];

  // ============================================================
  // Order Detail Dialog
  // ============================================================

  isOrderDialogOpen = false;

  selectedOrderId: number | null = null;


  // ============================================================
  // Init
  // ============================================================

  ngOnInit(): void {
    this.loadOrders();
  }


  // ============================================================
  // Load Orders
  // ============================================================

  loadOrders(): void {

    this.invoiceService.getInvoices().subscribe({

      next: (data) => {

        console.log('Invoices:', data);

        this.orders = data;

      },

      error: (error) => {

        console.error(
          'خطا در دریافت لیست فاکتورها:',
          error
        );

      }

    });

  }


  // ============================================================
  // Open Order Detail
  // ============================================================

  openOrderDialog(orderId: number): void {

    console.log('Opening order:', orderId);

    this.selectedOrderId = orderId;

    this.isOrderDialogOpen = true;

  }


  // ============================================================
  // Close Order Detail
  // ============================================================

  closeOrderDialog(): void {

    this.isOrderDialogOpen = false;

    this.selectedOrderId = null;

  }


  // ============================================================
  // Money
  // ============================================================

  formatMoney(value: number | null): string {

    if (value == null) {
      return '0';
    }

    return value.toLocaleString('fa-IR');

  }


  // ============================================================
  // Status Text
  // ============================================================

  getStatusText(status: string): string {

    switch (status) {
      case 'WAITING_INVOICE_SEND':
        return 'در انتظار ارسال فاکتور';

      case 'IN_PRODUCTION':
        return 'در حال ساخت';

      case 'WAITING_FINAL_PAYMENT':
        return 'در انتظار پرداخت نهایی';

      case 'WAITING_PAYMENT':
        return 'در انتظار پرداخت';

      case 'DELIVERED':
        return 'تحویل داده شده';

      case 'PAID':
        return 'پرداخت شده';

      default:
        return 'نامشخص';

    }

  }


  // ============================================================
  // Status Class
  // ============================================================

  getStatusClass(status: string): string {

    switch (status) {

      case 'WAITING_INVOICE_SEND':
      case 'WAITING_FINAL_PAYMENT':
      case 'WAITING_PAYMENT':
        return 'badge-orange';

      case 'IN_PRODUCTION':
        return 'badge-blue';

      case 'DELIVERED':
      case 'PAID':
        return 'badge-green';

      default:
        return 'badge-blue';

    }

  }


  // ============================================================
  // Date
  // ============================================================

formatDate(date: string | null): string {

  if (!date) {
    return '-';
  }

  try {

    const parts = date.split('-');

    if (parts.length !== 3) {
      return '-';
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return '-';
    }

    const gregorianDate = new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

    const jalali = Jalali.toJalali(
      gregorianDate
    );

    return `${jalali.year}/${String(jalali.month).padStart(2, '0')}/${String(jalali.day).padStart(2, '0')}`;

  } catch (error) {

    console.error(
      'خطا در تبدیل تاریخ:',
      date,
      error
    );

    return '-';
  }
}

  // ============================================================
  // Search
  // ============================================================

  searchOrders(): void {

    console.log('جستجو انجام شد');

  }


  resetSearch(): void {

    console.log('بازنشانی فیلترها');

  }

}