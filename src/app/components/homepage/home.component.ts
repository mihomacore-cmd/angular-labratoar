import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { CARDS_DATA } from './cards-data';
import { Card } from './card.model';
import { FormsModule } from '@angular/forms';

// ====== تعریف نوع برای هر تصویر ======
interface ProductImage {
  src: string;
  title: string;
  category: string; // مثلاً 'اطفال', 'بند لوگ', 'ارتودنسی', ...
}

// ====== تعریف نوع برای هر محصول ======
interface Product {
  image: string;          
  title: string;
  summary: string;
  tag: string;
  images: ProductImage[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  // ============================================================
  // ====== داده‌های محصولات (با پراپرتی image) ======
  // ============================================================
  products: Product[] = [
    {
      image: 'product/ortodenci1.PNG', // ← تصویر اصلی برای کارت
      title: 'پروتز ارتودنسی متحرک',
      summary: 'مناسب برای اصلاح نامرتبی‌های خفیف تا متوسط دندان‌ها',
      tag: 'پرفروش‌ترین',
      images: [
        { src: 'product/ortodenci1.PNG', title: 'ارتودنسی2', category: 'ارتودنسی1' },
        { src: 'product/ortodenci2.PNG', title: 'ارتودنسی2', category: 'ارتودنسی2' },
        { src: 'product/ortodenci3.PNG', title: 'ارتودنسی2', category: 'ارتودنسی3' },
        { src: 'product/ortodenci4.PNG', title: 'ارتودنسی2', category: 'ارتودنسی3' },
      ]
    },
    {
      image: 'product/zibaie1.PNG',
      title: 'پروتز زیبایی (ونیر)',
      summary: 'لمینت‌های سرامیکی نازک برای لبخندی درخشان',
      tag: 'زیبایی',
      images: [
        { src: 'product/zibaie1.PNG', title: 'زیبایی', category: 'زیبایی1' },
        { src: 'product/zibaie2.PNG', title: 'زیبایی', category: 'زیبایی1' },
        { src: 'product/zibaie3.PNG', title: 'زیبایی', category: 'زیبایی4' },
        { src: 'product/zibaie4.PNG', title: 'زیبایی', category: 'زیبایی4' },
      ]
    },
    {
      image: 'product/atfal1.PNG',
      title: 'پروتز پیشگیری (اطفال)',
      summary: 'فضانگهدار و رگولاتور برای سنین رشد',
      tag: 'کودکان',
      images: [
        { src: 'product/atfal1.PNG', title: 'اطفال', category: 'اطفال1' },
        { src: 'product/atfal2.PNG', title: 'اطفال', category: 'اطفال3' },
        { src: 'product/atfal3.PNG', title: 'اطفال', category: 'اطفال3' },
        { src: 'product/atfal4.png', title: 'بند', category: 'بند ' },
      ]
    }
  ];

  // ====== متغیرهای مربوط به دیالوگ محصول ======
  selectedProduct: Product | null = null;
  selectedCategory: string = 'همه';
  searchText: string = '';

  // ====== متغیرهای قبلی (اسلایدر، کارت‌ها، و ...) ======
  images: string[] = ['D1.PNG', 'D2.PNG', 'D3.PNG', 'D4.PNG'];
  selectedCard: Card | null = null;
  cards: Card[] = CARDS_DATA;
  currentIndex = 0;
  private slideInterval: any;
  selectedImage: string | null = null;
  private cdr = inject(ChangeDetectorRef);

  private R = 270;
  router = inject(Router);
  private heroElement: HTMLElement | null = null;
  private scrollListener: (() => void) | null = null;
  private navbarElement: HTMLElement | null = null;

  // ============================================================
  // ====== Getterها ======
  // ============================================================
  get categories(): string[] {
    if (!this.selectedProduct) return [];
    const cats = this.selectedProduct.images.map(img => img.category);
    return ['همه', ...new Set(cats)];
  }

  get filteredImages(): ProductImage[] {
    if (!this.selectedProduct) return [];
    return this.selectedProduct.images.filter(img => {
      const matchCategory = this.selectedCategory === 'همه' || img.category === this.selectedCategory;
      const matchSearch = img.title.includes(this.searchText) ||
                          img.category.includes(this.searchText);
      return matchCategory && matchSearch;
    });
  }

  // ============================================================
  // ====== متدهای چرخه‌ی حیات ======
  // ============================================================
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.startSlideShow(), 0);
    this.startSlideShow();

    const hero = document.getElementById('hero') as HTMLElement;
    const revealImg = document.getElementById('revealImg') as HTMLImageElement;
    const scanLines = document.getElementById('scanLines') as HTMLDivElement;
    const cursorRing = document.getElementById('cursorRing') as HTMLDivElement;
    const cursorDot = document.getElementById('cursorDot') as HTMLDivElement;
    this.navbarElement = document.getElementById('navbar') as HTMLElement;

    if (!hero || !revealImg || !scanLines || !cursorRing || !cursorDot) {
      console.warn('One or more elements not found!');
      return;
    }

    this.heroElement = hero;

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

    this.scrollListener = () => {
      if (!this.navbarElement) return;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY > 50) {
        this.navbarElement.classList.add('scrolled');
      } else {
        this.navbarElement.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', this.scrollListener);

    setTimeout(() => {
      const rect = hero.getBoundingClientRect();
      applyMask(rect.width / 2, rect.height / 2);
    }, 50);
  }

  // ============================================================
  // ====== متدهای اسلایدر ======
  // ============================================================
  startSlideShow(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
    this.slideInterval = setInterval(() => this.nextSlide(), 2000);
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.cdr.detectChanges();
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
    this.startSlideShow();
  }

  trackByFn(index: number, item: string): number {
    return index;
  }

  // ============================================================
  // ====== متدهای لایت‌باکس ======
  // ============================================================
  openLightbox(imageSrc: string): void {
    this.selectedImage = imageSrc;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.selectedImage = null;
    document.body.style.overflow = 'auto';
  }

  // ============================================================
  // ====== متدهای دیالوگ کارت‌های اطلاعاتی ======
  // ============================================================
  openDialog(index: number): void {
    this.selectedCard = this.cards[index];
    document.body.style.overflow = 'hidden';
  }

  closeDialog(): void {
    this.selectedCard = null;
    document.body.style.overflow = 'auto';
  }

  trackByCard(index: number, card: Card): number {
    return card.id;
  }

  // ============================================================
  // ====== متدهای دیالوگ محصولات ======
  // ============================================================
  openProductDialog(index: number): void {
    this.selectedProduct = this.products[index];
    this.selectedCategory = 'همه';
    this.searchText = '';
    document.body.style.overflow = 'hidden';
  }

  closeProductDialog(): void {
    this.selectedProduct = null;
    this.selectedCategory = 'همه';
    this.searchText = '';
    document.body.style.overflow = 'auto';
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  trackByProduct(index: number, product: Product): number {
    return index;
  }

  trackByProductImage(index: number, item: ProductImage): number {
    return index;
  }

  // ============================================================
  // ====== هنگام نابودی ======
  // ============================================================
  ngOnDestroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}