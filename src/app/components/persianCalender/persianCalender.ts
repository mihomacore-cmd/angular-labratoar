import {
  Component,
  EventEmitter,
  Output,
  computed,
  signal
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
  imports: [
    CommonModule
  ],
  templateUrl:
    './persianCalender.html',
  styleUrls: [
    './persianCalender.scss'
  ]
})
export class PersianCalendarComponent {


  @Output()
  confirm =
    new EventEmitter<string>();


  @Output()
  cancel =
    new EventEmitter<void>();



  months = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند'
  ];



  years = Array.from(
    {
      length: 101
    },
    (_, i) =>
      1350 + i
  );



  weekDays = [
    'ش',
    'ی',
    'د',
    'س',
    'چ',
    'پ',
    'ج'
  ];



  year =
    signal(1405);



  month =
    signal(5);



  selectedDay =
    signal<number | null>(null);



  today =
    Jalali.toJalali(
      new Date()
    );



  calendarDays =
    computed(() => {


      const days:
        CalendarDay[] = [];



      const firstDay =
        Jalali.firstDayOfMonth(
          this.year(),
          this.month()
        );



      const length =
        Jalali.monthLength(
          this.year(),
          this.month()
        );



      for (
        let i = 0;
        i < firstDay;
        i++
      ) {

        days.push({
          day: 0,
          empty: true,
          selected: false,
          today: false
        });

      }



      for (
        let i = 1;
        i <= length;
        i++
      ) {


        days.push({

          day: i,

          empty: false,

          selected:
            i === this.selectedDay(),

          today:
            this.today.year === this.year()
            &&
            this.today.month === this.month()
            &&
            this.today.day === i

        });


      }


      return days;


    });





  previousMonth() {


    if (
      this.month() === 1
    ) {

      this.month.set(12);

      this.year.update(
        y => y - 1
      );

      return;

    }


    this.month.update(
      m => m - 1
    );


  }





  nextMonth() {


    if (
      this.month() === 12
    ) {


      this.month.set(1);


      this.year.update(
        y => y + 1
      );


      return;

    }


    this.month.update(
      m => m + 1
    );


  }





  changeMonth(
    value: number
  ) {

    this.month.set(
      Number(value)
    );

  }





  changeYear(
    value: number
  ) {

    this.year.set(
      Number(value)
    );

  }





  selectDay(
    item: CalendarDay
  ) {


    if (
      item.empty
    ) {
      return;
    }


    this.selectedDay.set(
      item.day
    );


  }






  submit() {


    const day =
      this.selectedDay();


    if (
      !day
    ) {
      return;
    }



    const value =

      `${this.year()}/` +

      `${String(
        this.month()
      ).padStart(2,'0')}/` +

      `${String(
        day
      ).padStart(2,'0')}`;



    this.confirm.emit(
      value
    );


  }





  close() {

    this.cancel.emit();

  }



}