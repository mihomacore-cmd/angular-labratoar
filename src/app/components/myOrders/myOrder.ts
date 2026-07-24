import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface OrderItem {
  id: number;
  clinicName: string;
  doctorName: string;
  patientName: string;
  status: 'pending_payment' | 'building' | 'delivered';
}

@Component({
  selector: 'myOrder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './myOrder.html',
  styleUrls: ['./myOrder.scss']
})
export class MyOrder {

    router = inject(Router);


  // داده‌های نمونه با وضعیت‌های مختلف
  allItems: OrderItem[] = [
    // در انتظار پرداخت
    { id: 1, clinicName: 'کلینیک آفتاب', doctorName: 'دکتر کریمی', patientName: 'علی محمدی', status: 'pending_payment' },
    { id: 2, clinicName: 'کلینیک مهتاب', doctorName: 'دکتر رضایی', patientName: 'فاطمه احمدی', status: 'pending_payment' },
    // در حال ساخت
    { id: 3, clinicName: 'کلینیک سلامت', doctorName: 'دکتر حسینی', patientName: 'سارا قاسمی', status: 'building' },
    { id: 4, clinicName: 'کلینیک بهار', doctorName: 'دکتر محمودی', patientName: 'زهرا علی‌زاده', status: 'building' },
    { id: 5, clinicName: 'کلینیک تابستان', doctorName: 'دکتر رحیمی', patientName: 'مهدی صالحی', status: 'building' },
    { id: 6, clinicName: 'کلینیک پاییز', doctorName: 'دکتر جعفری', patientName: 'حمیدرضا کرمی', status: 'building' },
    // تحویل داده شده
    { id: 7, clinicName: 'کلینیک المپیک', doctorName: 'دکتر شریفی', patientName: 'محمد ابراهیمی', status: 'delivered' }
  ];

  // فیلدهای جستجوی پیشرفته (بدون نام بیمار)
  searchDoctor: string = '';
  searchClinic: string = '';
  searchStatus: string = ''; // مقدار می‌تواند '' یا 'pending_payment' یا 'building' یا 'delivered' باشد

  // ----- متدهای فیلتر کردن برای هر ستون -----
  get pendingItems(): OrderItem[] {
    return this.filterItems('pending_payment');
  }

  get buildingItems(): OrderItem[] {
    return this.filterItems('building');
  }

  get deliveredItems(): OrderItem[] {
    return this.filterItems('delivered');
  }

  // تابع کمکی برای فیلتر بر اساس وضعیت و جستجو
  private filterItems(status: OrderItem['status']): OrderItem[] {
    let result = this.allItems.filter(item => item.status === status);

    // فیلتر بر اساس نام پزشک
    if (this.searchDoctor.trim()) {
      const d = this.searchDoctor.trim().toLowerCase();
      result = result.filter(item => item.doctorName.toLowerCase().includes(d));
    }

    // فیلتر بر اساس نام کلینیک
    if (this.searchClinic.trim()) {
      const c = this.searchClinic.trim().toLowerCase();
      result = result.filter(item => item.clinicName.toLowerCase().includes(c));
    }

    // فیلتر بر اساس وضعیت (اگر انتخاب شده باشد)
    if (this.searchStatus) {
      result = result.filter(item => item.status === this.searchStatus);
    }

    return result;
  }

  // تعداد کل آیتم‌های فیلتر شده (برای نمایش در footer)
  get totalFilteredCount(): number {
    return this.pendingItems.length + this.buildingItems.length + this.deliveredItems.length;
  }

  // متدهای دکمه‌ها
  onSearch(): void {
    // فیلتر به‌صورت خودکار با تغییر فیلدها انجام می‌شود
  }

  onReset(): void {
    this.searchDoctor = '';
    this.searchClinic = '';
    this.searchStatus = '';
  }

  // متد نمایش (فعلاً فقط یک alert برای نمونه)
  showItem(item: OrderItem): void {
    alert(`نمایش جزئیات:\nکلینیک: ${item.clinicName}\nپزشک: ${item.doctorName}\nبیمار: ${item.patientName}`);
  }




  goToOrderDetail(): void {
    this.router.navigate(['/orderDetail']);
  }


  // تابع trackBy برای بهینه‌سازی
  trackById(index: number, item: OrderItem): number {
    return item.id;
  }
}