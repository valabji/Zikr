import { toArabicDigits } from '@/locales/i18n';

// UthmanicHafs quirks: waqf-mark spaces need an NBSP base, and three Tanzil codepoints must map to the QPC-hafs marks this font attaches.
const HAFS_CHAR_FIXES = { ' ': ' ', '۟': 'ْ', 'ۣ': 'ۜ', '۫': '۬' };
const HAFS_CHAR_RE = / |۟|ۣ|۫/g;
export const arForHafs = (s) => (s ? s.replace(HAFS_CHAR_RE, (c) => HAFS_CHAR_FIXES[c]) : s);

// Hafs.otf lacks ASCII parens: turn "(n)" ayah markers into Arabic-Indic digits and drop leftover parens.
export const cleanForHafs = (s) => (s
  ? s.replace(/\((\d+)\)/g, (_, n) => toArabicDigits(n)).replace(/[()]/g, '')
  : s);
