export const RECITERS = [
  {
    id: 'alafasy',
    nameAr: 'مشاري راشد العفاسي',
    nameEn: 'Mishary Alafasy',
    everyAyahSlug: 'Alafasy_128kbps',
  },
  {
    id: 'husary',
    nameAr: 'محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    everyAyahSlug: 'Husary_128kbps',
  },
  {
    id: 'abdulbasit',
    nameAr: 'عبد الباسط عبد الصمد',
    nameEn: 'Abdul-Basit Abdul-Samad',
    everyAyahSlug: 'Abdul_Basit_Murattal_64kbps',
  },
  {
    id: 'maher',
    nameAr: 'ماهر المعيقلي',
    nameEn: 'Maher Al-Muaiqly',
    everyAyahSlug: 'Maher_AlMuaiqly_64kbps',
  },
];

export const DEFAULT_RECITER_ID = 'alafasy';

export function getReciter(id) {
  return RECITERS.find((r) => r.id === id) || RECITERS[0];
}

export function buildAyahAudioUrl(reciterId, surah, ayah) {
  const r = getReciter(reciterId);
  const fileName = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `https://everyayah.com/data/${r.everyAyahSlug}/${fileName}`;
}
