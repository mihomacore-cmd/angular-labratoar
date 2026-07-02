import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {

 images: string[] = [
    'assets/D1.PNG',
    'assets/D2.PNG',
    'assets/D3.PNG',
    'assets/D4.PNG'
  ];
  currentIndex = 0;
  private slideInterval: any;

  private R = 270; // شعاع دایره ماسک
  router = inject(Router);
  private heroElement: HTMLElement | null = null;
  private scrollListener: (() => void) | null = null;

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngAfterViewInit(): void {
    // تمام المان‌ها را با getElementById دریافت می‌کنیم (مشابه کد مستقل)
    const hero = document.getElementById('hero') as HTMLElement;
    const revealImg = document.getElementById('revealImg') as HTMLImageElement;
    const scanLines = document.getElementById('scanLines') as HTMLDivElement;
    const cursorRing = document.getElementById('cursorRing') as HTMLDivElement;
    const cursorDot = document.getElementById('cursorDot') as HTMLDivElement;

    // اگر هرکدام وجود نداشت، از ادامه کار خارج شو
    if (!hero || !revealImg || !scanLines || !cursorRing || !cursorDot) {
      console.warn('One or more elements not found!');
      return;
    }

    // ذخیره ارجاع hero برای استفاده در اسکرول
    this.heroElement = hero;

    // ---- توابع کمکی (دقیقاً همان کد مستقل) ----
    const buildMask = (xPx: number, yPx: number, containerW: number, containerH: number): string => {
      const xPct = (xPx / containerW) * 100;
      const yPct = (yPx / containerH) * 100;
      return `radial-gradient(circle ${this.R}px at ${xPct}% ${yPct}%,
        black       0%,
        black       25%,
        rgba(0,0,0,.75) 42%,
        rgba(0,0,0,.4)  58%,
        rgba(0,0,0,.12) 74%,
        transparent 100%)`;
    };

    const applyMask = (x: number, y: number) => {
      const rect = hero.getBoundingClientRect();
      const mask = buildMask(x, y, rect.width, rect.height);
      revealImg.style.webkitMaskImage = mask;
      revealImg.style.maskImage = mask;
      scanLines.style.webkitMaskImage = mask;
      scanLines.style.maskImage = mask;
    };

    // ---- رویدادها ----
    hero.addEventListener('mouseenter', () => {
      revealImg.style.opacity = '1';
      scanLines.style.opacity = '1';
      cursorRing.style.opacity = '1';
      cursorDot.style.opacity = '1';
      hero.style.cursor = 'none';
    });

    hero.addEventListener('mouseleave', () => {
      revealImg.style.opacity = '0';
      scanLines.style.opacity = '0';
      cursorRing.style.opacity = '0';
      cursorDot.style.opacity = '0';
    });

    hero.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cursorRing.style.left = x + 'px';
      cursorRing.style.top = y + 'px';
      cursorDot.style.left = x + 'px';
      cursorDot.style.top = y + 'px';

      revealImg.style.webkitMaskRepeat = 'no-repeat';
      revealImg.style.maskRepeat = 'no-repeat';
      scanLines.style.webkitMaskRepeat = 'no-repeat';
      scanLines.style.maskRepeat = 'no-repeat';
      applyMask(x, y);
    });

    // پشتیبانی از لمس
    hero.addEventListener('touchmove', (e: TouchEvent) => {
      const t = e.touches[0];
      const rect = hero.getBoundingClientRect();
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      applyMask(x, y);
      revealImg.style.opacity = '1';
      scanLines.style.opacity = '0.7';
    }, { passive: true });

    hero.addEventListener('touchend', () => {
      revealImg.style.transition = 'opacity .5s ease';
      scanLines.style.transition = 'opacity .5s ease';
      revealImg.style.opacity = '0';
      scanLines.style.opacity = '0';
    });

    // ---- listener اسکرول با تنظیم margin-top ----
this.scrollListener = () => {
  if (!this.heroElement) return;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const heroBody = document.querySelector('.hero-body') as HTMLElement;
  
  if (scrollY > 0) {
    this.heroElement.classList.add('scrolled');
    if (heroBody) {
      heroBody.style.marginTop = 'calc(70vh - 80px)';
    }
  } else {
    this.heroElement.classList.remove('scrolled');
    if (heroBody) {
      heroBody.style.marginTop = '0';
    }
  }
};


window.addEventListener('scroll', this.scrollListener);

    // مقداردهی اولیه: ماسک را در مرکز قرار بده
    setTimeout(() => {
      const rect = hero.getBoundingClientRect();
      applyMask(rect.width / 2, rect.height / 2);
    }, 50);


    this.startSlideShow();
  }

 

    startSlideShow(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 1500); // ۱.۵ ثانیه
  }
  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    // ریست تایمر با کلیک روی نقطه
    clearInterval(this.slideInterval);
    this.startSlideShow();
  }



   ngOnDestroy(): void {
    // حذف listener اسکرول هنگام نابودی کامپوننت
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }


}