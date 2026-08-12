import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KanbanService, KanbanItemDto } from '../../servicies/kenbanService/kenban.service';

export interface KanbanItem {
  id: number;
  clinicName: string;
  doctorName: string;
  patientName: string;
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kenbanBoard.html',
  styleUrls: ['./kenbanBoard.scss']
})
export class KanbanBoardComponent implements OnInit {
  private kanbanService = inject(KanbanService);
  private cdr = inject(ChangeDetectorRef);

  deliveredItems: KanbanItem[] = [];
  buildingItems: KanbanItem[] = [];
  paymentItems: KanbanItem[] = [];

  loading = false;
  errorMessage = '';
  totalCount = 0;

  openDropdownId: number | null = null;

  ngOnInit(): void {
    this.loadKanbanData();
  }

  loadKanbanData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.kanbanService.getAllOrders().subscribe({
      next: (response) => {
        console.log('داده‌های دریافتی:', response);
        this.paymentItems = this.mapToKanbanItem(response['در انتظار پرداخت'] || []);
        this.buildingItems = this.mapToKanbanItem(response['در حال ساخت'] || []);
        this.deliveredItems = this.mapToKanbanItem(response['تحویل داده شده'] || []);
        this.totalCount = this.paymentItems.length + this.buildingItems.length + this.deliveredItems.length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('خطا:', error);
        this.errorMessage = 'خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapToKanbanItem(dtos: KanbanItemDto[]): KanbanItem[] {
    return dtos.map(dto => ({
      id: dto.orderId,
      clinicName: dto.clinicName,
      doctorName: dto.doctorName,
      patientName: dto.patientName
    }));
  }

  toggleDropdown(id: number): void {
    this.openDropdownId = (this.openDropdownId === id) ? null : id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.openDropdownId = null;
    }
  }

  viewOrder(id: number): void {
    console.log('نمایش سفارش با ID:', id);
    this.openDropdownId = null;
  }

  moveOrder(id: number): void {
    console.log('انتقال سفارش با ID:', id);
    this.openDropdownId = null;
  }
}