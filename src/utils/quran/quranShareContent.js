import * as Font from 'expo-font';
import { getMushafEdition } from '@/constants/QuranConstants';
import { qcfFontFamilyForPage } from '@/utils/quran/QcfDownloader';
import { ayahLayoutWords } from '@/utils/quran/mushafIndex';
import { arForHafs } from '@/utils/quran/mushafText';
import { toArabicDigits } from '@/locales/i18n';
import pagesData from '@assets/quran/data/pages.json';
import surahsData from '@assets/quran/data/surahs.json';
import translationEn from '@assets/quran/data/translation_en.json';

const verseTextByKey = {};
for (const pg of pagesData) {
  for (const a of pg.ayahs) {
    verseTextByKey[`${a.surah}:${a.ayah}`] = a.text;
  }
}

// Draws from QCF glyph codes when the edition's HD bundle is installed and its page fonts are loaded; caller falls back to plain UthmanicHafs text
function ayahQcfSegments(surah, ayah, settings, qcfState, dark) {
  const edition = getMushafEdition(settings.mushafEdition);
  const version = edition.qcfVersion;
  if (!(qcfState[version] && qcfState[version].installed)) return null;
  const words = ayahLayoutWords(edition.layoutFile, `${surah}:${ayah}`).filter((w) => w.code);
  if (!words.length) return null;
  const pages = [...new Set(words.map((w) => w.page))];
  if (!pages.every((p) => Font.isLoaded(qcfFontFamilyForPage(version, p, dark)))) return null;
  const segments = [];
  words.forEach((w, i) => {
    const fontFamily = qcfFontFamilyForPage(version, w.page, dark);
    const piece = (i === 0 ? '' : ' ') + w.code;
    const last = segments[segments.length - 1];
    if (last && last.fontFamily === fontFamily) last.text += piece;
    else segments.push({ text: piece, fontFamily });
  });
  return segments;
}

export function buildAyahShareContent(a, lang, settings, qcfState, dark) {
  const key = `${a.surah}:${a.ayah}`;
  const surah = surahsData[a.surah - 1];
  const reference = lang === 'ar'
    ? `${surah.nameAr} ${toArabicDigits(a.surah)}:${toArabicDigits(a.ayah)}`
    : `${surah.nameEn} ${a.surah}:${a.ayah}`;
  const plain = arForHafs(verseTextByKey[key] || '');
  return {
    arabic: plain,
    arabicSegments: ayahQcfSegments(a.surah, a.ayah, settings, qcfState, dark)
      || [{ text: plain, fontFamily: 'UthmanicHafs' }],
    translation: translationEn[key],
    reference,
  };
}
