import { VIBRATION_TYPES, VIBRATION_INTENSITY } from '@/utils/Vibration';

export const SCREENS = [
  { id: 'All', labelEn: 'All Azkar', labelAr: 'كل الاذكار' },
  { id: 'Fav', labelEn: 'Favorites', labelAr: 'الاذكار المفضلة' },
  { id: 'Tasbih', labelEn: 'Tasbih Counter', labelAr: 'المسبحة' },
  { id: 'PrayerTimes', labelEn: 'Prayer Times', labelAr: 'مواقيت الصلاة' },
  { id: 'Qibla', labelEn: 'Qibla Direction', labelAr: 'اتجاه القبلة' },
  { id: 'Quran', labelEn: 'Holy Quran', labelAr: 'القرآن الكريم' },
  { id: 'Books', labelEn: 'Islamic Library', labelAr: 'المكتبة الإسلامية' },
  { id: 'Radio', labelEn: 'Radio', labelAr: 'الراديو' },
];

export const VIEW_MODES = [
  { id: 'swiper', labelEn: 'Swiper (Page by Page)', labelAr: 'التمرير (صفحة بصفحة)' },
  { id: 'onePageScroll', labelEn: 'One Page Scroll', labelAr: 'التمرير المستمر' },
  { id: 'onePageScrollCompact', labelEn: 'One Page Scroll Compact', labelAr: 'التمرير المستمر المضغوط' },
];

export const VIBRATION_OPTIONS = [
  { id: VIBRATION_TYPES.OFF, labelEn: 'Off', labelAr: 'إيقاف' },
  { id: VIBRATION_TYPES.ON_NEXT, labelEn: 'Only when moving to next zikr', labelAr: 'فقط عند الانتقال للذكر التالي' },
  { id: VIBRATION_TYPES.ON_EVERY, labelEn: 'On every zikr count', labelAr: 'عند كل عدة ذكر' },
];

export const INTENSITY_OPTIONS = [
  { id: VIBRATION_INTENSITY.LIGHT, labelEn: 'Light', labelAr: 'خفيف' },
  { id: VIBRATION_INTENSITY.MEDIUM, labelEn: 'Medium', labelAr: 'متوسط' },
  { id: VIBRATION_INTENSITY.HEAVY, labelEn: 'Heavy', labelAr: 'قوي' },
];

export const ROUTE_MAP = {
  All: { route: 'Home', params: { showFavorites: false } },
  Fav: { route: 'Home', params: { showFavorites: true } },
  Tasbih: { route: 'Tasbih' },
  PrayerTimes: { route: 'PrayerTimes' },
  Qibla: { route: 'Qibla' },
  Quran: { route: 'Quran' },
  Books: { route: 'Books' },
  Radio: { route: 'Radio' },
};

export const localizeOptions = (options, lang) =>
  options.map((o) => ({ id: o.id, label: lang === 'ar' ? o.labelAr : o.labelEn }));
