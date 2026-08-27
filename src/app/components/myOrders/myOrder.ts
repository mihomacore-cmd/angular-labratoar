import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ❌ حذف KanbanService و جایگزینی با MyOrderService
import { MyOrderService } from '../../servicies/myOrderService/myOrderService';
import { OrderDetailsComponent } from '../orderDetail/orderDetail';

export interface OrderItem {
  id: number;
  clinicName: string;
  doctorName: string;
  patientName: string;
  statusCode?: string; // 'در انتظار پرداخت' | 'در حال ساخت' | 'تحویل داده شده'
}

@Component({
  selector: 'myOrder',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderDetailsComponent],
  templateUrl: './myOrder.html',
  styleUrls: ['./myOrder.scss']
})
export class MyOrder implements OnInit {

  // ✅ استفاده از سرویس جدید
  private myOrderService = inject(MyOrderService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private router = inject(Router);

  // ==============================================================
  // داده‌های اصلی (همه سفارشات)
  // ==============================================================
  allOrders: OrderItem[] = [];

  // ==============================================================
  // سه ستون
  // ==============================================================
  pendingItems: OrderItem[] = [];
  buildingItems: OrderItem[] = [];
  deliveredItems: OrderItem[] = [];

  // ==============================================================
  // وضعیت بارگذاری
  // ==============================================================
  loading = false;
  errorMessage = '';
  totalFilteredCount = 0;

  // ==============================================================
  // فیلدهای جستجو
  // ==============================================================
  searchDoctor = '';
  searchClinic = '';
  searchStatus = ''; // 'pending_payment' | 'building' | 'delivered' | ''

  // ==============================================================
  // دیالوگ جزئیات
  // ==============================================================
  isOrderDialogOpen = false;
  selectedOrderId: number | null = null;

  // ==============================================================
  // مودال (برای خطاها)
  // ==============================================================
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' = 'success';

  // ==============================================================
  // Lifecycle
  // ==============================================================
  ngOnInit(): void {
    this.loadOrders();
  }

  // ==============================================================
  // دریافت سفارشات از سرور (با استفاده از MyOrderService)
  // ==============================================================
  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    // ✅ کال کردن سرویس مخصوص کاربر جاری
    this.myOrderService.getMyOrders().subscribe({
      next: (response) => {
        console.log('داده‌های سفارشات من:', response);

        // تبدیل پاسخ به آرایه‌ای از OrderItem
        this.allOrders = this.mapResponseToItems(response);

        // اعمال جستجو و تفکیک به ستون‌ها
        this.applyFiltersAndSplit();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('خطا در دریافت سفارشات:', error);
        this.loading = false;
        this.errorMessage = 'خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.';
        this.openModal('خطا', this.errorMessage, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ==============================================================
  // تبدیل پاسخ سرور به آرایه‌ای از OrderItem
  // ==============================================================
  private mapResponseToItems(response: any): OrderItem[] {
    let items: OrderItem[] = [];

    // اگر پاسخ به شکل { "در انتظار پرداخت": [...], "در حال ساخت": [...], "تحویل داده شده": [...] } است
    if (typeof response === 'object' && !Array.isArray(response)) {
      for (const [statusKey, orders] of Object.entries(response)) {
        if (Array.isArray(orders)) {
          const mapped = orders.map((dto: any) => ({
            id: dto.id || dto.orderId,
            clinicName: dto.clinicName || '',
            doctorName: dto.doctorName || '',
            patientName: dto.patientName || '',
            statusCode: statusKey // 'در انتظار پرداخت' یا ...
          }));
          items = [...items, ...mapped];
        }
      }
    } else if (Array.isArray(response)) {
      // اگر پاسخ مستقیم آرایه باشد
      items = response.map((item: any) => ({
        id: item.id || item.orderId,
        clinicName: item.clinicName || '',
        doctorName: item.doctorName || '',
        patientName: item.patientName || '',
        statusCode: item.statusCode || item.status || ''
      }));
    }
    return items;
  }

  // ==============================================================
  // اعمال فیلترهای جستجو و تفکیک به سه ستون
  // ==============================================================
  private applyFiltersAndSplit(): void {
    let filtered = this.allOrders;

    // فیلتر بر اساس پزشک
    if (this.searchDoctor.trim()) {
      const d = this.searchDoctor.trim().toLowerCase();
      filtered = filtered.filter(item => item.doctorName.toLowerCase().includes(d));
    }

    // فیلتر بر اساس کلینیک
    if (this.searchClinic.trim()) {
      const c = this.searchClinic.trim().toLowerCase();
      filtered = filtered.filter(item => item.clinicName.toLowerCase().includes(c));
    }

    // فیلتر بر اساس وضعیت
    if (this.searchStatus) {
      const statusMap: { [key: string]: string } = {
        'pending_payment': 'در انتظار پرداخت',
        'building': 'در حال ساخت',
        'delivered': 'تحویل داده شده'
      };
      const targetStatus = statusMap[this.searchStatus] || this.searchStatus;
      filtered = filtered.filter(item => item.statusCode === targetStatus);
    }

    // تفکیک به سه ستون
    this.pendingItems = filtered.filter(item => item.statusCode === 'در انتظار پرداخت');
    this.buildingItems = filtered.filter(item => item.statusCode === 'در حال ساخت');
    this.deliveredItems = filtered.filter(item => item.statusCode === 'تحویل داده شده');

    this.totalFilteredCount = this.pendingItems.length + this.buildingItems.length + this.deliveredItems.length;
  }

  // ==============================================================
  // متدهای جستجو
  // ==============================================================
  onSearch(): void {
    this.applyFiltersAndSplit();
  }

  onReset(): void {
    this.searchDoctor = '';
    this.searchClinic = '';
    this.searchStatus = '';
    this.applyFiltersAndSplit();
  }

  // ==============================================================
  // نمایش جزئیات سفارش
  // ==============================================================
  viewOrder(id: number): void {
    this.selectedOrderId = id;
    this.isOrderDialogOpen = true;
  }

  closeOrderDialog(): void {
    this.isOrderDialogOpen = false;
    this.selectedOrderId = null;
  }

  // ==============================================================
  // مودال
  // ==============================================================
  openModal(title: string, message: string, type: 'success' | 'error' = 'success'): void {
    this.ngZone.run(() => {
      this.modalTitle = title;
      this.modalMessage = message;
      this.modalType = type;
      this.isModalOpen = true;
      this.cdr.detectChanges();
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.detectChanges();
  }

  // ==============================================================
  // trackBy
  // ==============================================================
  trackById(index: number, item: OrderItem): number {
    return item.id;
  }
}