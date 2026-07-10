import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orderDetail.html',
  styleUrls: ['./orderDetail.scss']
})
export class OrderDetailsComponent {
  // اطلاعات کلی سفارش
  orderInfo = {
    clinicName: 'کلینیک المپیک',
    doctorName: 'دکتر شریفی',
    patientName: 'محمد ابراهیمی',
    status: 'در حال ساخت',
    invoiceType: 'نقدی',
    entryDate: '۱۴۰۵/۰۴/۲۰',
    exitDate: '۱۴۰۵/۰۵/۱۰'
  };

  // آیتم‌های سفارش
  items = [
    { serviceType: 'ایمپلنت', toothNumber: '۱۲', quantity: 1, unitPrice: 15000000 },
    { serviceType: 'روکش سرامیک', toothNumber: '۱۴', quantity: 2, unitPrice: 7000000 },
    { serviceType: 'عصب کشی', toothNumber: '۲۲', quantity: 1, unitPrice: 3500000 }
  ];

  discountAmount = 2500000;

  // افزودن یک ردیف خالی به جدول
  addItem() {
    this.items.push({ serviceType: '', toothNumber: '', quantity: 1, unitPrice: 0 });
  }

  // حذف یک ردیف از جدول
  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  // محاسبه مبلغ هر ردیف
  rowTotal(index: number): number {
    const item = this.items[index];
    return (item.quantity || 0) * (item.unitPrice || 0);
  }

  // محاسبه مبلغ کل (Getters باعث می‌شود به محض تغییر، آپدیت شود)
  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  get finalAmount(): number {
    return this.totalAmount - this.discountAmount;
  }

  // فرمت کردن اعداد به ریال
  formatMoney(value: number): string {
    return value.toLocaleString() + ' ریال';
  }

  // دکمه تایید نهایی
  submitOrder() {
    alert('تغییرات با موفقیت ثبت شد! \n' + JSON.stringify(this.items, null, 2));
    // در آینده اینجا سرویس ارسال دیتا به بک‌اند قرار می‌گیرد
  }
}