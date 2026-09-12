import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../servicies/invoiceService/InvoiceService';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orderList.html',
  styleUrls: ['./orderList.scss']
})
export class OrderListComponent implements OnInit {

  private invoiceService = inject(InvoiceService);

  orders: any[] = [];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {

    this.invoiceService.getInvoices().subscribe({

      next: (data) => {
        console.log('Invoices:', data);

        this.orders = data;
      },

      error: (error) => {
        console.error('خطا در دریافت لیست فاکتورها:', error);
      }

    });
  }

  formatMoney(value: number | null): string {

    if (value == null) {
      return '0';
    }

    return value.toLocaleString('fa-IR');
  }

getStatusText(status: string): string {

  switch (status) {

    case 'WAITING_INVOICE_SEND':
      return 'در انتظار پرداخت';

    case 'IN_PRODUCTION':
      return 'در حال ساخت';

    case 'DELIVERED':
      return 'تحویل داده شده';

    case 'PAID':
      return 'پرداخت شده';

    default:
      return 'نامشخص';
  }
}

getStatusClass(status: string): string {

  switch (status) {

    case 'WAITING_INVOICE_SEND':
      return 'badge-orange';

    case 'IN_PRODUCTION':
      return 'badge-blue';

    case 'DELIVERED':
      return 'badge-green';

    case 'PAID':
      return 'badge-green';

    default:
      return 'badge-blue';
  }
}
  formatDate(date: string | null): string {

    if (!date) {
      return '-';
    }

    return date;
  }

  searchOrders(): void {
    console.log('جستجو انجام شد');
  }

  resetSearch(): void {
    console.log('بازنشانی فیلترها');
  }
}