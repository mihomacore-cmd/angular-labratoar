import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  HostListener,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  KanbanService,
  KanbanItemDto
} from '../../servicies/kenbanService/kenban.service';


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

  // =====================================================
  // Services
  // =====================================================

  private kanbanService = inject(KanbanService);

  private cdr = inject(ChangeDetectorRef);

  private ngZone = inject(NgZone);


  // =====================================================
  // Kanban Data
  // =====================================================

  deliveredItems: KanbanItem[] = [];

  buildingItems: KanbanItem[] = [];

  paymentItems: KanbanItem[] = [];


  // =====================================================
  // Loading / Error
  // =====================================================

  loading = false;

  errorMessage = '';

  totalCount = 0;


  // =====================================================
  // Dropdown
  // =====================================================

  openDropdownId: number | null = null;


  // =====================================================
  // Modal
  // =====================================================

  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' = 'success';


  // =====================================================
  // Init
  // =====================================================

  ngOnInit(): void {
    this.loadKanbanData();
  }


  // =====================================================
  // دریافت اطلاعات Kanban
  // =====================================================

  loadKanbanData(): void {

    this.loading = true;

    this.errorMessage = '';

    this.kanbanService.getAllOrders().subscribe({

      next: (response) => {

        console.log('داده‌های دریافتی:', response);

        this.paymentItems =
          this.mapToKanbanItem(
            response['در انتظار پرداخت'] || []
          );

        this.buildingItems =
          this.mapToKanbanItem(
            response['در حال ساخت'] || []
          );

        this.deliveredItems =
          this.mapToKanbanItem(
            response['تحویل داده شده'] || []
          );

        this.totalCount =
          this.paymentItems.length +
          this.buildingItems.length +
          this.deliveredItems.length;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('خطا در دریافت اطلاعات Kanban:', error);

        this.loading = false;

        this.errorMessage = 'خطا در دریافت اطلاعات. لطفاً مجدداً تلاش کنید.';

        this.openModal(
          'خطا',
          this.errorMessage,
          'error'
        );

        this.cdr.detectChanges();
      }
    });
  }


  // =====================================================
  // تبدیل DTO
  // =====================================================

  private mapToKanbanItem(
    dtos: KanbanItemDto[]
  ): KanbanItem[] {

    return dtos.map(dto => ({

      id: dto.orderId,

      clinicName: dto.clinicName,

      doctorName: dto.doctorName,

      patientName: dto.patientName

    }));
  }


  // =====================================================
  // Dropdown
  // =====================================================

  toggleDropdown(id: number): void {

    if (this.openDropdownId === id) {

      this.openDropdownId = null;

    } else {

      this.openDropdownId = id;

    }
  }


  // =====================================================
  // بستن Dropdown با کلیک بیرون
  // =====================================================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {

    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown')) {

      this.openDropdownId = null;

      this.cdr.detectChanges();
    }
  }


  // =====================================================
  // نمایش سفارش
  // =====================================================

  viewOrder(id: number): void {

    console.log('نمایش سفارش با ID:', id);

    this.openDropdownId = null;

    this.openModal(
      'نمایش سفارش',
      `سفارش شماره ${id} انتخاب شد`,
      'success'
    );
  }


  // =====================================================
  // انتقال سفارش (نسخه نهایی)
  // =====================================================

  moveOrder(id: number): void {
    console.log('درخواست انتقال سفارش:', id);

    this.openDropdownId = null;

    if (this.loading) return;

    this.loading = true;

    this.kanbanService.updateOrderStatus(id).subscribe({

      next: (response) => {
        console.log('پاسخ سرور:', response);

        this.loading = false;

        // ✅ نمایش مودال موفقیت
        this.openModal('موفقیت', response, 'success');

        // ✅ بارگذاری مجدد داده‌ها با تأخیر کوتاه
        setTimeout(() => {
          this.loadKanbanData();
        }, 200);
      },

      error: (error) => {
        console.error('خطا در انتقال:', error);

        this.loading = false;

        let errorMsg = 'خطا در انتقال سفارش. لطفاً مجدداً تلاش کنید.';

        if (error?.error) {
          if (typeof error.error === 'string') {
            errorMsg = error.error;
          } else if (error.error.message) {
            errorMsg = error.error.message;
          }
        }

        this.errorMessage = errorMsg;

        // ✅ نمایش مودال خطا
        this.openModal('خطا', errorMsg, 'error');

        this.cdr.detectChanges();
      }
    });
  }


  // =====================================================
  // باز کردن Modal (نسخه نهایی با NgZone و detectChanges)
  // =====================================================

  openModal(
    title: string,
    message: string,
    type: 'success' | 'error' = 'success'
  ): void {

    // اطمینان از اجرا در NgZone برای به‌روزرسانی view
    this.ngZone.run(() => {

      this.modalTitle = title;
      this.modalMessage = message;
      this.modalType = type;
      this.isModalOpen = true;

      // ✅ بلافاصله detectChanges برای نمایش مودال
      this.cdr.detectChanges();

      // ✅ اطمینان بیشتر با setTimeout
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    });
  }


  // =====================================================
  // بستن Modal
  // =====================================================

  closeModal(): void {

    this.isModalOpen = false;
    this.modalTitle = '';
    this.modalMessage = '';

    this.cdr.detectChanges();
  }
}