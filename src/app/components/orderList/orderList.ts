import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent {
  // داده‌های نمونه بر اساس تصویر ارسالی
  orders = [
    { clinic: 'تخصصی قلب', section: 'قلب', doctor: 'دکتر احمدی', patient: 'علی محمدی', entryDate: '۱۴۰۲/۰۲/۱۰', exitDate: '۱۴۰۲/۰۲/۱۵', product: 'دارو', quantity: '۱۵۰۰۰', unitPrice: 50000, total: 60000, discount: 0, status: 'پرداخت شده' },
    { clinic: 'شکی امید', section: 'ارتودنسی', doctor: 'دکتر کیانی', patient: 'فاطمه رضایی', entryDate: '۱۴۰۲/۰۲/۱۲', exitDate: '۱۴۰۲/۰۲/۱۸', product: 'تجهیزات', quantity: '۲', unitPrice: 80000, total: 100000, discount: 10000, status: 'در انتظار' },
    { clinic: 'آرامش', section: 'گوارش', doctor: 'مهندس حسینی', patient: 'سارا قاسمی', entryDate: '۱۴۰۲/۰۲/۱۴', exitDate: '۱۴۰۲/۰۲/۲۰', product: 'آزمایش', quantity: '۵', unitPrice: 80000, total: 100000, discount: 0, status: 'تاخیر شده' },
    { clinic: 'پوست', section: 'پوست', doctor: 'دکتر رضایی', patient: 'نازنین احمدی', entryDate: '۱۴۰۲/۰۲/۱۶', exitDate: '۱۴۰۲/۰۲/۲۲', product: 'دارو', quantity: '۵', unitPrice: 80000, total: 100000, discount: 5000, status: 'پرداخت شده' },
    { clinic: 'دهان', section: 'دندانپزشکی', doctor: 'دکتر حسینی', patient: 'رضا محمدی', entryDate: '۱۴۰۲/۰۲/۱۸', exitDate: '۱۴۰۲/۰۲/۲۵', product: 'تجهیزات', quantity: '۳', unitPrice: 80000, total: 100000, discount: 0, status: 'در انتظار' },
    { clinic: 'قلب', section: 'قلب', doctor: 'دکتر احمدی', patient: 'فاطمه حسینی', entryDate: '۱۴۰۲/۰۲/۲۰', exitDate: '۱۴۰۲/۰۲/۲۸', product: 'آزمایش', quantity: '۳', unitPrice: 80000, total: 100000, discount: 20000, status: 'تاخیر شده' },
    { clinic: 'دهان', section: 'دندانپزشکی', doctor: 'دکتر جعفری', patient: 'علی رضایی', entryDate: '۱۴۰۲/۰۲/۲۲', exitDate: '۱۴۰۲/۰۲/۳۰', product: 'دارو', quantity: '۳', unitPrice: 75000, total: 75000, discount: 0, status: 'پرداخت شده' },
    { clinic: 'گوارش', section: 'گوارش', doctor: 'دکتر امیری', patient: 'زهرا کیانی', entryDate: '۱۴۰۲/۰۲/۲۴', exitDate: '۱۴۰۲/۰۳/۰۵', product: 'تجهیزات', quantity: '۳', unitPrice: 75000, total: 75000, discount: 7500, status: 'در انتظار' }
  ];

  // توابع کمکی
  formatMoney(value: number): string {
    return value.toLocaleString();
  }

  // صرفاً جهت نمایش (بدون سرویس)
  searchOrders() {
    console.log('جستجو انجام شد');
  }

  resetSearch() {
    console.log('بازنشانی فیلترها');
  }
}
