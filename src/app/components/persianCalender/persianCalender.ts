import {
  Component,
  EventEmitter,
  Output,
  Input,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  Renderer2
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Jalali, JalaliDate } from './jalali';

interface CalendarDay {
  day: number;
  empty: boolean;
  selected: boolean;
  today: boolean;
  disabled: boolean;
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
  @Output() invalidSelection = new EventEmitter<void>();
  @Input() minDate?: JalaliDate;

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
  ) {}

  ngOnInit() {
    const freshToday = Jalali.toJalali(new Date());
    this.year.set(freshToday.year);
    this.month.set(freshToday.month);
    this.selectedDay.set(freshToday.day);
    this.cdr.detectChanges();

    this.documentClickUnlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!this.elementRef.nativeElement.contains(target)) {
        this.close();
      }
    });
  }

  ngOnDestroy() {
    if (this.documentClickUnlisten) {
      this.documentClickUnlisten();
      this.documentClickUnlisten = null;
    }
  }

  calendarDays = computed(() => {
    const days: CalendarDay[] = [];
    const firstDay = Jalali.firstDayOfMonth(this.year(), this.month());
    const length = Jalali.monthLength(this.year(), this.month());

    const minYear = this.minDate?.year ?? 0;
    const minMonth = this.minDate?.month ?? 0;
    const minDay = this.minDate?.day ?? 0;

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, empty: true, selected: false, today: false, disabled: false });
    }

    for (let i = 1; i <= length; i++) {
      const currentYear = this.year();
      const currentMonth = this.month();
      const currentDay = i;

      let isDisabled = false;
      if (this.minDate) {
        if (currentYear < minYear ||
            (currentYear === minYear && currentMonth < minMonth) ||
            (currentYear === minYear && currentMonth === minMonth && currentDay < minDay)) {
          isDisabled = true;
        }
      }

      days.push({
        day: i,
        empty: false,
        selected: i === this.selectedDay(),
        today: this.today.year === currentYear &&
               this.today.month === currentMonth &&
               this.today.day === i,
        disabled: isDisabled
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
    if (item.disabled) {
      this.invalidSelection.emit();
      return;
    }
    this.selectedDay.set(item.day);
  }

  submit() {
    const day = this.selectedDay();
    if (!day) return;

    if (this.minDate) {
      const selectedDate = Jalali.toGregorian(this.year(), this.month(), day);
      const minDateObj = Jalali.toGregorian(this.minDate.year, this.minDate.month, this.minDate.day);
      if (selectedDate < minDateObj) {
        return;
      }
    }

    const value = `${this.year()}/${String(this.month()).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    this.confirm.emit(value);
  }

  close() {
    this.cancel.emit();
  }
}