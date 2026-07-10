import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- ایمپورت CommonModule

export interface KanbanItem {
  id: number;
  clinicName: string;
  doctorName: string;
  patientName: string;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule], // <--- اضافه کردن CommonModule به ایمپورت‌ها
  templateUrl: './kenbanBoard.html',
  styleUrls: ['./kenbanBoard.scss']
})
export class KanbanBoardComponent {
  deliveredItems: KanbanItem[] = [
    { id: 1, clinicName: 'کلینیک المپیک', doctorName: 'دکتر شریفی', patientName: 'محمد ابراهیمی' }
  ];

  buildingItems: KanbanItem[] = [
    { id: 1, clinicName: 'کلینیک سلامت', doctorName: 'دکتر حسینی', patientName: 'سارا قاسمی' },
    { id: 2, clinicName: 'کلینیک بهار', doctorName: 'دکتر محمودی', patientName: 'زهرا علی‌زاده' },
    { id: 3, clinicName: 'کلینیک تابستان', doctorName: 'دکتر رحیمی', patientName: 'مهدی صالحی' },
    { id: 4, clinicName: 'کلینیک پاییز', doctorName: 'دکتر جعفری', patientName: 'حمیدرضا کرمی' }
  ];

  paymentItems: KanbanItem[] = [
    { id: 1, clinicName: 'کلینیک آفتاب', doctorName: 'دکتر کریمی', patientName: 'علی محمدی' },
    { id: 2, clinicName: 'کلینیک مهتاب', doctorName: 'دکتر رضایی', patientName: 'فاطمه احمدی' }
  ];
}