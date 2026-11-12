import { getLayout } from '@/utils/quran/mushafLayout';

// QCF fonts are per-page private-use glyph sets, so HD rendering needs each word's page font.
const ayahPagesCache = {};
function getAyahPages(layoutFile) {
  if (!ayahPagesCache[layoutFile]) {
    const pages = getLayout(layoutFile);
    const vkToPage = {};
    const pageAyahs = new Array(pages.length);
    for (let pi = 0; pi < pages.length; pi += 1) {
      const list = [];
      for (const ln of pages[pi].lines) {
        if (ln.type !== 'text') continue;
        for (const w of ln.words) {
          if (vkToPage[w.vk] === undefined) {
            vkToPage[w.vk] = pi + 1;
            const [s, a] = w.vk.split(':').map(Number);
            list.push({ surah: s, ayah: a });
          }
        }
      }
      pageAyahs[pi] = list;
    }
    ayahPagesCache[layoutFile] = { vkToPage, pageAyahs };
  }
  return ayahPagesCache[layoutFile];
}

export function ayahPageForLayout(layoutFile, vk) {
  return getAyahPages(layoutFile).vkToPage[vk] || null;
}

export function pageAyahsForLayout(layoutFile, page) {
  return getAyahPages(layoutFile).pageAyahs[page - 1] || [];
}

export const flatVerses = [];
export const verseIndex = {};
for (const pg of require('@assets/quran/data/pages.json')) {
  for (const a of pg.ayahs) {
    verseIndex[`${a.surah}:${a.ayah}`] = flatVerses.length;
    flatVerses.push({ surah: a.surah, ayah: a.ayah, page: pg.page });
  }
}

export function ayahLayoutWords(layoutFile, vk) {
  const pages = getLayout(layoutFile);
  const out = [];
  let started = false;
  for (let pi = 0; pi < pages.length; pi += 1) {
    const lines = pages[pi].lines || [];
    let onPage = false;
    for (const ln of lines) {
      for (const w of (ln.words || [])) {
        if (w.vk === vk) { out.push({ page: pi + 1, code: w.code, ar: w.ar, type: w.type }); onPage = true; }
      }
    }
    if (started && !onPage) break;
    if (onPage) started = true;
  }
  return out;
}
