import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Invoice {
  clinic: string;
  doctor: string;
  header: string;
  number: string;
  patient: string;
  amount: number;
  dateIn: string;
  dateOut: string;
  status: 'pending_payment' | 'pending_sms' | 'paid';
  isSelected?: boolean;
}

@Component({
  selector: 'forget-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factorList.html',
  styleUrls: ['./factorList.scss']
})
export class ForgetPasswordComponent {
  invoices: Invoice[] = [
    {
      clinic: 'کلینیک نور',
      doctor: 'دکتر رضایی',
      header: 'اورژانس',
      number: 'F-1001',
      patient: 'علی محمدی',
      amount: 1250000,
      dateIn: '1405-02-10',
      dateOut: '1405-02-12',
      status: 'pending_payment'
    },
    {
      clinic: 'کلینیک مهر',
      doctor: 'دکتر کریمی',
      header: 'ویزیت',
      number: 'F-1002',
      patient: 'سارا احمدی',
      amount: 850000,
      dateIn: '1405-02-11',
      dateOut: '1405-02-11',
      status: 'pending_sms'
    },
    {
      clinic: 'کلینیک نور',
      doctor: 'دکتر سلطانی',
      header: 'تصویربرداری',
      number: 'F-1003',
      patient: 'رضا حسینی',
      amount: 2100000,
      dateIn: '1405-02-12',
      dateOut: '1405-02-14',
      status: 'paid'  // این ردیف قابل انتخاب نیست
    },
    {
      clinic: 'کلینیک سلامت',
      doctor: 'دکتر رضایی',
      header: 'آزمایشگاه',
      number: 'F-1004',
      patient: 'مریم نوری',
      amount: 430000,
      dateIn: '1405-02-13',
      dateOut: '1405-02-13',
      status: 'pending_payment'
    },
    {
      clinic: 'کلینیک مهر',
      doctor: 'دکتر کریمی',
      header: 'ویزیت',
      number: 'F-1005',
      patient: 'حسن کریمی',
      amount: 920000,
      dateIn: '1405-02-14',
      dateOut: '1405-02-15',
      status: 'pending_sms'
    }
  ];

  quickSearch: string = '';
  advancedPatient: string = '';
  advancedDoctor: string = '';
  advancedClinic: string = '';
  advancedStatus: string = '';

  get filteredInvoices(): Invoice[] {
    let result = this.invoices;

    if (this.quickSearch.trim()) {
      const q = this.quickSearch.trim().toLowerCase();
      result = result.filter(inv =>
        inv.clinic.toLowerCase().includes(q) ||
        inv.doctor.toLowerCase().includes(q) ||
        inv.header.toLowerCase().includes(q)
      );
    }

    if (this.advancedPatient.trim()) {
      const p = this.advancedPatient.trim().toLowerCase();
      result = result.filter(inv => inv.patient.toLowerCase().includes(p));
    }
    if (this.advancedDoctor.trim()) {
      const d = this.advancedDoctor.trim().toLowerCase();
      result = result.filter(inv => inv.doctor.toLowerCase().includes(d));
    }
    if (this.advancedClinic.trim()) {
      const c = this.advancedClinic.trim().toLowerCase();
      result = result.filter(inv => inv.clinic.toLowerCase().includes(c));
    }
    if (this.advancedStatus) {
      result = result.filter(inv => inv.status === this.advancedStatus);
    }

    return result;
  }

  // فقط مواردی که وضعیت paid ندارند و isSelected دارند
  get selectedInvoices(): Invoice[] {
    return this.filteredInvoices.filter(inv => inv.status !== 'paid' && inv.isSelected);
  }

  get totalCount(): number {
    return this.selectedInvoices.length;
  }

  get totalAmount(): number {
    return this.selectedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }

  onSearch(): void { }

  onReset(): void {
    this.quickSearch = '';
    this.advancedPatient = '';
    this.advancedDoctor = '';
    this.advancedClinic = '';
    this.advancedStatus = '';
  }

  sendSms(): void {
    if (this.totalCount === 0) return;
    alert(`پیامک برای ${this.totalCount} فاکتور با مجموع مبلغ ${this.totalAmount.toLocaleString()} ریال ارسال شد.`);
  }

  getStatusText(status: string): string {
    const map: { [key: string]: string } = {
      'pending_payment': 'در انتظار پرداخت',
      'pending_sms': 'در انتظار ارسال پیامک جهت پرداخت',
      'paid': 'پرداخت شده'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  trackByIndex(index: number): number {
    return index;
  }
}