export interface JalaliDate {
  year: number;
  month: number;
  day: number;
}


const breaks = [
  -61,
  9,
  38,
  199,
  426,
  686,
  756,
  818,
  1111,
  1181,
  1210,
  1635,
  2060,
  2097,
  2192,
  2262,
  2324,
  2394,
  2456,
  3178
];


export class Jalali {


  static toGregorian(
    jy: number,
    jm: number,
    jd: number
  ): Date {

    const g =
      this.jalaliToGregorian(
        jy,
        jm,
        jd
      );


    return new Date(
      Date.UTC(
        g.gy,
        g.gm - 1,
        g.gd
      )
    );

  }




  static toJalali(
    date: Date
  ): JalaliDate {


    const result =
      this.gregorianToJalali(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate()
      );


    return {

      year: result.jy,

      month: result.jm,

      day: result.jd

    };

  }





  static monthLength(
    year: number,
    month: number
  ): number {


    if (month <= 6) {

      return 31;

    }


    if (month <= 11) {

      return 30;

    }


    return this.isLeap(year)
      ? 30
      : 29;


  }






  static isLeap(
    year: number
  ): boolean {


    return this.jalCal(year).leap === 0;


  }






  static firstDayOfMonth(
    year: number,
    month: number
  ): number {


    const date =
      this.toGregorian(
        year,
        month,
        1
      );


    /**
     * خروجی برای تقویم:
     *
     * شنبه = 0
     * یکشنبه = 1
     * دوشنبه = 2
     * سه شنبه = 3
     * چهارشنبه = 4
     * پنجشنبه = 5
     * جمعه = 6
     */


    return (
      date.getUTCDay() + 1
    ) % 7;


  }







  private static jalCal(
    jy: number
  ): {
    leap: number;
    gy: number;
    march: number;
  } {


    const bl =
      breaks.length;


    const gy =
      jy + 621;


    let leapJ =
      -14;


    let jp =
      breaks[0];


    let jm = 0;

    let jump = 0;



    if (
      jy < jp ||
      jy >= breaks[bl - 1]
    ) {

      throw new Error(
        'Invalid Jalali year'
      );

    }




    for (
      let i = 1;
      i < bl;
      i++
    ) {


      jm =
        breaks[i];


      jump =
        jm - jp;



      if (
        jy < jm
      ) {

        break;

      }



      leapJ +=
        Math.floor(jump / 33) * 8 +
        Math.floor(
          (jump % 33) / 4
        );


      jp =
        jm;


    }






    let n =
      jy - jp;



    leapJ +=
      Math.floor(n / 33) * 8 +
      Math.floor(
        ((n % 33) + 3) / 4
      );




    if (
      jump % 33 === 4 &&
      jump - n === 4
    ) {

      leapJ++;

    }






    const leapG =
      Math.floor(gy / 4) -
      Math.floor(
        (Math.floor(gy / 100) + 1) * 3 / 4
      ) -
      150;




    const march =
      20 +
      leapJ -
      leapG;




    let leap =
      (
        (
          (n + 1) % 33
        ) - 1
      ) % 4;



    if (
      leap === -1
    ) {

      leap = 4;

    }




    return {

      leap,

      gy,

      march

    };


  }
  
  private static jalaliToGregorian(
    jy: number,
    jm: number,
    jd: number
  ): {
    gy: number;
    gm: number;
    gd: number;
  } {


    const r =
      this.jalCal(jy);



    const gy =
      r.gy;



    const march =
      r.march;




    let dayNumber =
      this.gregorianToDayNumber(
        gy,
        3,
        march
      );



    if (jm <= 6) {

      dayNumber +=
        (jm - 1) * 31 +
        jd - 1;

    }
    else {

      dayNumber +=
        186 +
        (jm - 7) * 30 +
        jd - 1;

    }



    return this.dayNumberToGregorian(
      dayNumber
    );

  }







  private static gregorianToJalali(
    gy: number,
    gm: number,
    gd: number
  ): {
    jy: number;
    jm: number;
    jd: number;
  } {


    const dayNumber =
      this.gregorianToDayNumber(
        gy,
        gm,
        gd
      );



    let jy =
      gy - 621;




    const r =
      this.jalCal(jy);



    const start =
      this.gregorianToDayNumber(
        r.gy,
        3,
        r.march
      );



    let k =
      dayNumber - start;



    if (k >= 0) {


      if (k <= 185) {


        return {

          jy,

          jm:
            1 +
            Math.floor(k / 31),

          jd:
            (k % 31) + 1

        };


      }
      else {


        k -= 186;



        return {

          jy,

          jm:
            7 +
            Math.floor(k / 30),


          jd:
            (k % 30) + 1

        };


      }


    }
    else {


      jy--;


      const lastYear =
        this.jalCal(jy);



      const prevStart =
        this.gregorianToDayNumber(
          lastYear.gy,
          3,
          lastYear.march
        );



      k =
        dayNumber - prevStart;



      if (k <= 185) {


        return {

          jy,

          jm:
            1 +
            Math.floor(k / 31),


          jd:
            (k % 31) + 1

        };


      }



      k -= 186;



      return {

        jy,

        jm:
          7 +
          Math.floor(k / 30),


        jd:
          (k % 30) + 1

      };


    }


  }








  private static gregorianToDayNumber(
    y: number,
    m: number,
    d: number
  ): number {


    const a =
      Math.floor(
        (14 - m) / 12
      );



    const yy =
      y + 4800 - a;



    const mm =
      m + 12 * a - 3;




    return (

      d +

      Math.floor(
        (153 * mm + 2) / 5
      ) +

      365 * yy +

      Math.floor(
        yy / 4
      ) -

      Math.floor(
        yy / 100
      ) +

      Math.floor(
        yy / 400
      ) -

      32045

    );


  }









  private static dayNumberToGregorian(
    jd: number
  ): {
    gy: number;
    gm: number;
    gd: number;
  } {



    let a =
      jd + 32044;



    let b =
      Math.floor(
        (4 * a + 3) / 146097
      );



    let c =
      a -
      Math.floor(
        (146097 * b) / 4
      );



    let d =
      Math.floor(
        (4 * c + 3) / 1461
      );



    let e =
      c -
      Math.floor(
        (1461 * d) / 4
      );



    let m =
      Math.floor(
        (5 * e + 2) / 153
      );



    const day =
      e -
      Math.floor(
        (153 * m + 2) / 5
      ) +
      1;



    const month =
      m +
      3 -
      12 *
      Math.floor(
        m / 10
      );



    const year =
      100 * b +
      d -
      4800 +
      Math.floor(
        m / 10
      );



    return {

      gy: year,

      gm: month,

      gd: day

    };


  }


}