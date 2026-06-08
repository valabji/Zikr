import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;

const layoutCache = {};
export function getLayout(layoutFile) {
  if (!layoutCache[layoutFile]) {
    if (layoutFile === 'pages_lines_v2') {
      layoutCache[layoutFile] = require('../assets/quran/data/pages_lines_v2.json');
    } else {
      layoutCache[layoutFile] = require('../assets/quran/data/pages_lines_v1.json');
    }
  }
  return layoutCache[layoutFile];
}

const PAGE_CHROME_PX = 12 /* top padding */ + 1 /* border */ + 18 /* footer */;

// Count only base Arabic letter shapes — combining marks (tashkeel, shadda,
// tanwin, madda, sukun, superscript alef, etc.) sit above/below and don't
// take horizontal space.
const ARABIC_BASE_LETTER_RE = /[ؠ-يٱ-ۓ]/g;
const ARABIC_BASE_W_FACTOR = 0.45;  // empirical UthmanicHafs base-letter advance / em
// The empirical factor leaves visible slack on most devices because real
// letter widths in UthmanicHafs are narrower than the worst-case ratio
// implies. Multiply the raw fit-size to actually use the full page width.
const MUSHAF_STRETCH_FACTOR = 1.5;

function visibleArabicLen(s) {
  if (!s) return 0;
  const m = s.match(ARABIC_BASE_LETTER_RE);
  return m ? m.length : 0;
}

const GLOBAL_MAX_LINE_VISIBLE = (() => {
  let max = 0;
  for (const file of ['pages_lines_v1', 'pages_lines_v2']) {
    const pages = getLayout(file);
    for (const page of pages) {
      for (const line of page.lines) {
        if (line.type !== 'text') continue;
        let total = 0;
        for (const w of line.words) total += visibleArabicLen(w.ar) + 1;
        if (total > max) max = total;
      }
    }
  }
  return max;
})();

// Compute the Mushaf font size that lets the densest line fit a given window
// width. Called at every render so the layout stretches with rotation, split
// screen, foldables, and web window resize.
export function mushafFontSizeForWidth(width) {
  const avail = width - 16;
  const raw = (avail / (GLOBAL_MAX_LINE_VISIBLE * ARABIC_BASE_W_FACTOR)) * MUSHAF_STRETCH_FACTOR;
  return Math.max(12, Math.min(48, Math.floor(raw)));
}

export function mushafLineHeightFor(fontSize) {
  return Math.round(fontSize * 1.25) + 2;
}

// Module-load defaults used by LINE_PX (continuous-scroll height estimate).
const MUSHAF_LINE_FONT_SIZE = mushafFontSizeForWidth(SCREEN_WIDTH);
const MUSHAF_LINE_HEIGHT_PX = mushafLineHeightFor(MUSHAF_LINE_FONT_SIZE);

// Per-line and per-chrome height contributions matching the actual styles
// rendered by SurahCartouche / BismillahLine / MushafLine / PageFooter.
const LINE_PX = {
  surah_header: 56,   // ornate SVG banner (width/8.16) + 8+8 margins → ~54-60
  bismillah: 60,      // paddingV 4*2 + lineHeight 52
  text: MUSHAF_LINE_HEIGHT_PX,  // derived from MUSHAF_LINE_FONT_SIZE
};

const layoutOffsetCache = {};
export function getLayoutOffsets(layoutFile) {
  if (layoutOffsetCache[layoutFile]) return layoutOffsetCache[layoutFile];
  const pages = getLayout(layoutFile);
  const heights = new Array(pages.length);
  const offsets = new Array(pages.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < pages.length; i++) {
    let h = PAGE_CHROME_PX;
    for (const line of pages[i].lines) {
      h += LINE_PX[line.type] || LINE_PX.text;
    }
    heights[i] = h;
    offsets[i + 1] = offsets[i] + h;
  }
  layoutOffsetCache[layoutFile] = { heights, offsets };
  return layoutOffsetCache[layoutFile];
}

export const toArabicDigits = (n) =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
