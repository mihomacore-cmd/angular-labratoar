import {
  Component,
  EventEmitter,
  Output,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  Renderer2
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Jalali } from './jalali';

interface CalendarDay {
  day: number;
  empty: boolean;
  selected: boolean;
  today: boolean;
}

@Component({
  selector: 'app-persian-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './persianCalender.html',
  styleUrls: ['./persianCalender.scss']
})
export class PersianCalendarComponent implements OnInit, OnDestroy {
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  months = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
    'مرداد', 'شهریور', 'مهر', 'آبان',
    'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  today = Jalali.toJalali(new Date());

  year = signal(this.today.year);
  month = signal(this.today.month);
  selectedDay = signal<number | null>(this.today.day);

  years = computed(() => {
    const currentYear = this.year();
    return Array.from({ length: 4 }, (_, i) => currentYear + i);
  });

  private documentClickUnlisten: (() => void) | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {
    console.log('Today in constructor:', this.today);
  }

  ngOnInit() {
    const freshToday = Jalali.toJalali(new Date());
    console.log('Today in ngOnInit:', freshToday);
    this.year.set(freshToday.year);
    this.month.set(freshToday.month);
    this.selectedDay.set(freshToday.day);
    this.cdr.detectChanges();

    // اضافه کردن شنونده کلیک روی document
    this.documentClickUnlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // اگر کلیک خارج از عنصر اصلی کامپوننت باشد، بسته شود
      if (!this.elementRef.nativeElement.contains(target)) {
        this.close();
      }
    });
  }

  ngOnDestroy() {
    // حذف شنونده در زمان تخریب کامپوننت
    if (this.documentClickUnlisten) {
      this.documentClickUnlisten();
      this.documentClickUnlisten = null;
    }
  }

  calendarDays = computed(() => {
    const days: CalendarDay[] = [];
    const firstDay = Jalali.firstDayOfMonth(this.year(), this.month());
    const length = Jalali.monthLength(this.year(), this.month());

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, empty: true, selected: false, today: false });
    }

    for (let i = 1; i <= length; i++) {
      days.push({
        day: i,
        empty: false,
        selected: i === this.selectedDay(),
        today: this.today.year === this.year() &&
               this.today.month === this.month() &&
               this.today.day === i
      });
    }
    return days;
  });

  previousMonth() {
    if (this.month() === 1) {
      this.month.set(12);
      this.year.update(y => y - 1);
      return;
    }
    this.month.update(m => m - 1);
  }

  nextMonth() {
    if (this.month() === 12) {
      this.month.set(1);
      this.year.update(y => y + 1);
      return;
    }
    this.month.update(m => m + 1);
  }

  changeMonth(value: number) {
    this.month.set(Number(value));
  }

  changeYear(value: number) {
    this.year.set(Number(value));
  }

  selectDay(item: CalendarDay) {
    if (item.empty) return;
    this.selectedDay.set(item.day);
  }

  submit() {
    const day = this.selectedDay();
    if (!day) return;
    const value = `${this.year()}/${String(this.month()).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    this.confirm.emit(value);
  }

  close() {
    this.cancel.emit();
  }
}