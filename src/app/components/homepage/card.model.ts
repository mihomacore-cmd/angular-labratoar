// card.model.ts
export interface TimeItem {
  label: string;
  sub: string;
  highlight: boolean;
}

export interface Card {
  id: number;
  icon: string;
  title: string;
  summary: string | null;
  badge: string | null;
  detail: string;          // محتوای HTML به صورت string
  isOpen: boolean;
  extraClass: string;      // کلاس اضافی برای رنگ‌بندی
  customList?: string[];   // اختیاری (فقط برای کارت سوم)
  timeItems?: TimeItem[];  // اختیاری (فقط برای کارت چهارم)
  note?: string;           // اختیاری
}