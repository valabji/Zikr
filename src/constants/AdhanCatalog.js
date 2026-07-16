export const SELECTED_ADHAN_KEY = '@selected_adhan';

export const DEFAULT_ADHAN_ID = 'default';

export const ADHAN_CATALOG = [
  {
    id: 'default',
    nameEn: 'Default Adhan',
    nameAr: 'الأذان الافتراضي',
    reciterEn: 'Bundled with the app',
    reciterAr: 'مضمّن مع التطبيق',
    bundled: true,
  },
  {
    id: 'doha',
    nameEn: 'Adhan — Doha, Qatar',
    nameAr: 'أذان — الدوحة، قطر',
    reciterEn: 'Public Domain recording',
    reciterAr: 'تسجيل في الملك العام',
    url: 'https://archive.org/download/adhan.recordings.from.doha.qatar/Adhan_Doha_Qatar_02_Dhuhr_Adhan.mp3',
    bytes: 2419879,
    license: 'Public Domain Mark 1.0',
  },
  {
    id: 'alafasy',
    nameEn: 'Mishary Rashid Alafasy',
    nameAr: 'مشاري راشد العفاسي',
    reciterEn: 'Mishary Rashid Alafasy',
    reciterAr: 'مشاري راشد العفاسي',
    url: 'https://cdn.aladhan.com/audio/adhans/a9.mp3',
    bytes: 4114842,
    license: 'aladhan.com (Islamic Network)',
  },
  {
    id: 'nafees',
    nameEn: 'Ahmad Al-Nafees',
    nameAr: 'أحمد النفيس',
    reciterEn: 'Ahmad Al-Nafees',
    reciterAr: 'أحمد النفيس',
    url: 'https://cdn.aladhan.com/audio/adhans/a1.mp3',
    bytes: 3418938,
    license: 'aladhan.com (Islamic Network)',
  },
  {
    id: 'zahrani',
    nameEn: 'Mansour Al-Zahrani',
    nameAr: 'منصور الزهراني',
    reciterEn: 'Mansour Al-Zahrani',
    reciterAr: 'منصور الزهراني',
    url: 'https://cdn.aladhan.com/audio/adhans/a11-mansour-al-zahrani.mp3',
    bytes: 3358625,
    license: 'aladhan.com (Islamic Network)',
  },
];

export function getAdhanById(id) {
  return ADHAN_CATALOG.find((a) => a.id === id) || ADHAN_CATALOG[0];
}
