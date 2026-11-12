export const RECITERS = [
  {
    id: 'alafasy',
    nameAr: 'مشاري راشد العفاسي',
    nameEn: 'Mishary Alafasy',
    everyAyahSlug: 'Alafasy_128kbps',
    qdcId: 7,
  },
  {
    id: 'husary',
    nameAr: 'محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    everyAyahSlug: 'Husary_128kbps',
    qdcId: 6,
  },
  {
    id: 'husary_mujawwad',
    nameAr: 'محمود خليل الحصري (مجود)',
    nameEn: 'Al-Husary (Mujawwad)',
    everyAyahSlug: 'Husary_Mujawwad_64kbps',
  },
  {
    id: 'abdulbasit',
    nameAr: 'عبد الباسط عبد الصمد',
    nameEn: 'Abdul-Basit Abdul-Samad',
    everyAyahSlug: 'Abdul_Basit_Murattal_64kbps',
    qdcId: 2,
  },
  {
    id: 'abdulbasit_mujawwad',
    nameAr: 'عبد الباسط عبد الصمد (مجود)',
    nameEn: 'Abdul-Basit (Mujawwad)',
    everyAyahSlug: 'Abdul_Basit_Mujawwad_128kbps',
    qdcId: 1,
  },
  {
    id: 'maher',
    nameAr: 'ماهر المعيقلي',
    nameEn: 'Maher Al-Muaiqly',
    everyAyahSlug: 'Maher_AlMuaiqly_64kbps',
  },
  {
    id: 'sudais',
    nameAr: 'عبد الرحمن السديس',
    nameEn: 'Abdurrahmaan As-Sudais',
    everyAyahSlug: 'Abdurrahmaan_As-Sudais_192kbps',
    qdcId: 3,
  },
  {
    id: 'shuraym',
    nameAr: 'سعود الشريم',
    nameEn: 'Saood Ash-Shuraym',
    everyAyahSlug: 'Saood_ash-Shuraym_128kbps',
    qdcId: 10,
  },
  {
    id: 'ghamdi',
    nameAr: 'سعد الغامدي',
    nameEn: 'Saad Al-Ghamdi',
    everyAyahSlug: 'Ghamadi_40kbps',
  },
  {
    id: 'hudhaify',
    nameAr: 'علي الحذيفي',
    nameEn: 'Ali Al-Hudhaify',
    everyAyahSlug: 'Hudhaify_128kbps',
  },
  {
    id: 'minshawi',
    nameAr: 'محمد صديق المنشاوي',
    nameEn: 'Mohamed Siddiq Al-Minshawi',
    everyAyahSlug: 'Minshawy_Murattal_128kbps',
    qdcId: 9,
  },
  {
    id: 'minshawi_mujawwad',
    nameAr: 'المنشاوي (مجود)',
    nameEn: 'Al-Minshawi (Mujawwad)',
    everyAyahSlug: 'Minshawy_Mujawwad_192kbps',
    qdcId: 8,
  },
  {
    id: 'ajamy',
    nameAr: 'أحمد بن علي العجمي',
    nameEn: 'Ahmed ibn Ali Al-Ajamy',
    everyAyahSlug: 'Ahmed_ibn_Ali_al-Ajamy_128kbps',
  },
  {
    id: 'dussary',
    nameAr: 'ياسر الدوسري',
    nameEn: 'Yasser Ad-Dussary',
    everyAyahSlug: 'Yasser_Ad-Dussary_128kbps',
    qdcId: 97,
  },
  {
    id: 'basfar',
    nameAr: 'عبد الله بصفر',
    nameEn: 'Abdullah Basfar',
    everyAyahSlug: 'Abdullah_Basfar_192kbps',
  },
  {
    id: 'hani_rifai',
    nameAr: 'هاني الرفاعي',
    nameEn: 'Hani Ar-Rifai',
    everyAyahSlug: 'Hani_Rifai_192kbps',
    qdcId: 5,
  },
  {
    id: 'shaatree',
    nameAr: 'أبو بكر الشاطري',
    nameEn: 'Abu Bakr Ash-Shaatree',
    everyAyahSlug: 'Abu_Bakr_Ash-Shaatree_128kbps',
    qdcId: 4,
  },
  {
    id: 'mohammad_ayyoub',
    nameAr: 'محمد أيوب',
    nameEn: 'Mohammad Ayyoub',
    everyAyahSlug: 'Mohammad_Ayyoub_128kbps',
  },
];

export const DEFAULT_RECITER_ID = 'alafasy';

export function getReciter(id) {
  return RECITERS.find((r) => r.id === id) || RECITERS[0];
}

export function reciterHasSurahAudio(id) {
  return !!getReciter(id).qdcId;
}

export function buildAyahAudioUrl(reciterId, surah, ayah) {
  const r = getReciter(reciterId);
  const fileName = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `https://everyayah.com/data/${r.everyAyahSlug}/${fileName}`;
}
