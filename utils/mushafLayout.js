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

const ARABIC_BASE_LETTER_RE = /[ؠ-يٱ-ۓ]/g;

function visibleArabicLen(s) {
  if (!s) return 0;
  const m = s.match(ARABIC_BASE_LETTER_RE);
  return m ? m.length : 0;
}

// Per-page line metrics: visible-letter count for every line on every page
// (0 for non-text lines) plus the densest line's length. Only used for the
// heuristic first-paint estimate and scroll-offset precomputation — actual
// rendered sizes come from probe measurement in MushafPage.
const PAGE_DATA = (() => {
  const out = {};
  for (const file of ['pages_lines_v1', 'pages_lines_v2']) {
    const pages = getLayout(file);
    const arr = new Array(pages.length);
    for (let p = 0; p < pages.length; p++) {
      const lineLens = new Array(pages[p].lines.length);
      const lineSpaces = new Array(pages[p].lines.length).fill(0);
      const lineCodeSpaces = new Array(pages[p].lines.length).fill(0);
      let bestLen = 0;
      for (let li = 0; li < pages[p].lines.length; li++) {
        const line = pages[p].lines[li];
        if (line.type !== 'text') { lineLens[li] = 0; continue; }
        let total = 0;
        let codeSpaces = 0;
        for (const w of line.words) {
          total += visibleArabicLen(w.ar) + 1;
          // Rub-el-hizb words carry a space inside their QCF code ("ﱨ ﱩ").
          const c = w.code || '';
          for (let ci = 0; ci < c.length; ci++) if (c[ci] === ' ') codeSpaces += 1;
        }
        lineLens[li] = total;
        lineSpaces[li] = Math.max(0, line.words.length - 1);
        lineCodeSpaces[li] = codeSpaces;
        if (total > bestLen) bestLen = total;
      }
      arr[p] = { visibleLen: bestLen, lineLens, lineSpaces, lineCodeSpaces };
    }
    out[file] = arr;
  }
  return out;
})();

export function getPageProbeLen(layoutFile, pageIndex) {
  const arr = PAGE_DATA[layoutFile];
  const entry = arr && arr[pageIndex];
  return entry ? entry.visibleLen : 0;
}

// Per-line natural-fit sizes for a page, capped at the average so that a
// 2-word line doesn't render at 4× the densest line's size.
//
// Natural fit of line i: pageFitSize × (densestLen / lineLen_i). The
// densest line stays at pageFitSize; shorter lines grow inversely with
// their letter count. Then cap at the average across all text lines so
// the very shortest lines don't dominate the page.
//
// Non-text lines get the page fit size as a placeholder (their actual
// height is governed by `LINE_PX_FIXED`, not this).
export function perLineFontSizesForPage(layoutFile, pageIndex, pageFitSize) {
  const entry = PAGE_DATA[layoutFile] && PAGE_DATA[layoutFile][pageIndex];
  if (!entry || !entry.visibleLen) {
    const len = entry ? entry.lineLens.length : 0;
    return new Array(len).fill(pageFitSize);
  }
  const { visibleLen: densestLen, lineLens } = entry;
  const natural = new Array(lineLens.length);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < lineLens.length; i++) {
    const len = lineLens[i];
    if (len > 0) {
      natural[i] = pageFitSize * (densestLen / len);
      sum += natural[i];
      count += 1;
    } else {
      natural[i] = pageFitSize;
    }
  }
  if (!count) return natural;
  const avg = sum / count;
  for (let i = 0; i < natural.length; i++) {
    if (lineLens[i] > 0 && natural[i] > avg) natural[i] = avg;
  }
  return natural;
}

// Reference font size used for the hidden measurement probe. The measured
// width at this size is scaled to compute the actual fit-to-width size.
export const PROBE_FONT_SIZE = 24;

// Lines filling less than this stay centered (short surah-ending lines),
// mirroring how a printed Mushaf centers stub lines instead of stretching them.
const JUSTIFY_MIN_FILL = 0.8;

// Print-style justification: per-line extra px to add to each inter-word
// space so full lines reach the page width exactly.
export function justifiedSpaceExtrasForPage(layoutFile, pageIndex, availWidth, sizes, qcfTable, measuredEmPx) {
  const tables = getLineWidths(layoutFile);
  const table = qcfTable ? tables[qcfTable] : tables.hafs;
  const row = table && table[pageIndex];
  const entry = PAGE_DATA[layoutFile] && PAGE_DATA[layoutFile][pageIndex];
  if (!row || !entry) return null;
  // Justified lines stop shorter than the fit target: per-gap letterSpacing
  // pixel-snapping makes the drawn line a few px wider than its measured
  // width, and in RTL all of that excess clips the line's final glyph.
  const target = availWidth - FIT_GUARD_PX - 7;
  const out = new Array(row.length).fill(0);
  for (let i = 0; i < row.length; i++) {
    const nsp = entry.lineSpaces[i];
    if (!(row[i] > 0) || nsp <= 0) continue;
    const size = sizes[i] || sizes[0];
    const em = row[i] / 1000
      + (qcfTable === 'qcf' ? (nsp + entry.lineCodeSpaces[i]) * QCF_SPACE_EM : 0);
    // Probe-measured widths trump the table: they include glyphs the bundled
    // font lacks (e.g. ornate ayah brackets) that render via system fallback.
    const width = measuredEmPx && measuredEmPx[i] > 0 ? measuredEmPx[i] * size : em * size;
    const deficit = target - width;
    if (deficit > 0 && width / target >= JUSTIFY_MIN_FILL) out[i] = deficit / nsp;
  }
  return out;
}

const lineWidthsCache = {};
export function getLineWidths(layoutFile) {
  if (!lineWidthsCache[layoutFile]) {
    lineWidthsCache[layoutFile] = layoutFile === 'pages_lines_v2'
      ? require('../assets/quran/data/line_widths_v2.json')
      : require('../assets/quran/data/line_widths_v1.json');
  }
  return lineWidthsCache[layoutFile];
}

// QCF v1/v2 fonts have no U+0020 glyph, so spaces render from the system font;
// 0.27em approximates that fallback advance. The qcf4 table already includes
// v4's real space glyph advances, so it needs no adjustment.
export const QCF_SPACE_EM = 0.27;

// Initial sizes from the build-time width tables (scripts/build_line_widths.py),
// accurate within ~2% — the live probe only refines these.
export function estimatedLineSizesForPage(layoutFile, pageIndex, availWidth, qcfTable) {
  const tables = getLineWidths(layoutFile);
  const table = qcfTable ? tables[qcfTable] : tables.hafs;
  const row = table && table[pageIndex];
  if (!row || !row.length) return null;
  const { lineSpaces, lineCodeSpaces } = PAGE_DATA[layoutFile][pageIndex];
  const widths = {};
  for (let i = 0; i < row.length; i++) {
    if (row[i] > 0) {
      const em = row[i] / 1000
        + (qcfTable === 'qcf' ? (lineSpaces[i] + lineCodeSpaces[i]) * QCF_SPACE_EM : 0);
      widths[i] = em * PROBE_FONT_SIZE;
    }
  }
  return computeMushafLineSizes(widths, row.length, availWidth, !!qcfTable);
}

// Available width = window width minus MushafLine's horizontal padding.
export const MUSHAF_HORIZONTAL_PADDING = 16;

// Lines wider than this cannot grow past the densest line's fit by more than
// 20%, so a 2-word surah-ending line stays near uniform size and centers
// instead of ballooning — mirroring how a printed Mushaf leaves stub lines.
const MAX_LINE_GROWTH = 1.2;

const floorHalfPoint = (x) => Math.max(8, Math.floor(x * 2) / 2);

// Slack against per-gap letterSpacing rounding and shaper drift across a full
// line, so the widest justified line never overflows into the tail ellipsis.
const FIT_GUARD_PX = 6;

// Exact per-line font sizes from probe measurements. `lineWidths` maps line
// index → intrinsic text width at PROBE_FONT_SIZE; `uniform` (QCF mode) uses
// one size for the whole page since QCF glyphs already justify each line.
export function computeMushafLineSizes(lineWidths, lineCount, availWidth, uniform) {
  const fits = {};
  let minFit = Infinity;
  let measured = 0;
  for (const k in lineWidths) {
    const w = lineWidths[k];
    if (!(w > 0)) continue;
    const fit = (PROBE_FONT_SIZE * (availWidth - FIT_GUARD_PX)) / w;
    fits[k] = fit;
    measured += 1;
    if (fit < minFit) minFit = fit;
  }
  if (!measured) return null;
  const base = floorHalfPoint(minFit);
  const sizes = new Array(lineCount).fill(base);
  if (uniform) return sizes;
  const cap = minFit * MAX_LINE_GROWTH;
  for (let i = 0; i < lineCount; i++) {
    if (fits[i] != null) sizes[i] = floorHalfPoint(Math.min(fits[i], cap));
  }
  return sizes;
}

// Second-pass correction: lines are re-measured at their chosen sizes and any
// still wider than availWidth - 1 (1px guard against pixel-grid rounding) get
// shrunk by the measured ratio. Shrink-only, so it cannot oscillate; it fixes
// the residual nonlinearity of extrapolating widths from PROBE_FONT_SIZE.
export function refineMushafLineSizes(sizes, lineWidths, availWidth, uniform) {
  const target = availWidth - 1;
  const out = sizes.slice();
  if (uniform) {
    let worst = 1;
    for (const k in lineWidths) {
      const w = lineWidths[k];
      if (w > 0) worst = Math.min(worst, target / w);
    }
    if (worst < 1) out.fill(floorHalfPoint(out[0] * worst));
    return out;
  }
  for (const k in lineWidths) {
    const w = lineWidths[k];
    if (w > target) out[k] = floorHalfPoint(out[k] * (target / w));
  }
  return out;
}

// Conservative initial estimate, used only for the very first paint before
// the probe's onLayout fires (typically same frame on iOS, next on Android).
export function mushafFontSizeForWidth(width, visibleLen) {
  const avail = width - MUSHAF_HORIZONTAL_PADDING;
  if (!visibleLen || visibleLen <= 0) {
    return Math.max(12, Math.floor(avail / 30));
  }
  return Math.max(12, Math.floor(avail / (visibleLen * 0.5)));
}

export function mushafLineHeightFor(fontSize) {
  return Math.round(fontSize * 1.55) + 2;
}

// Module-level cache keyed by `${width}|${fontFamily}|${layoutFile}|${pageIndex}`,
// holding `{ sizes, emPx }` — measured per-line sizes plus width-per-px-of-font.
const measuredLineSizesCache = {};

const cacheKeyFor = (width, fontFamily, layoutFile, pageIndex) =>
  `${width}|${fontFamily}|${layoutFile || 'default'}|${pageIndex}`;

export function getCachedMushafLineSizes(width, fontFamily, layoutFile, pageIndex) {
  return measuredLineSizesCache[cacheKeyFor(width, fontFamily, layoutFile, pageIndex)];
}

export function setCachedMushafLineSizes(width, fontFamily, layoutFile, pageIndex, sizes, emPx) {
  measuredLineSizesCache[cacheKeyFor(width, fontFamily, layoutFile, pageIndex)] = { sizes, emPx };
}

const LINE_PX_FIXED = {
  surah_header: 56,
  bismillah: 60,
};

const layoutOffsetCache = {};
export function getLayoutOffsets(layoutFile) {
  if (layoutOffsetCache[layoutFile]) return layoutOffsetCache[layoutFile];
  const pages = getLayout(layoutFile);
  const heights = new Array(pages.length);
  const offsets = new Array(pages.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < pages.length; i++) {
    const pageFit = mushafFontSizeForWidth(SCREEN_WIDTH, getPageProbeLen(layoutFile, i));
    const perLine = perLineFontSizesForPage(layoutFile, i, pageFit);
    let h = PAGE_CHROME_PX;
    for (let li = 0; li < pages[i].lines.length; li++) {
      const line = pages[i].lines[li];
      if (LINE_PX_FIXED[line.type] != null) {
        h += LINE_PX_FIXED[line.type];
      } else {
        h += mushafLineHeightFor(perLine[li]);
      }
    }
    heights[i] = h;
    offsets[i + 1] = offsets[i] + h;
  }
  layoutOffsetCache[layoutFile] = { heights, offsets };
  return layoutOffsetCache[layoutFile];
}

export function maxPageHeightForWidth(layoutFile, width) {
  const pages = getLayout(layoutFile);
  let max = 0;
  for (let i = 0; i < pages.length; i++) {
    const pageFit = mushafFontSizeForWidth(width, getPageProbeLen(layoutFile, i));
    const perLine = perLineFontSizesForPage(layoutFile, i, pageFit);
    let h = PAGE_CHROME_PX;
    for (let li = 0; li < pages[i].lines.length; li++) {
      const line = pages[i].lines[li];
      if (LINE_PX_FIXED[line.type] != null) {
        h += LINE_PX_FIXED[line.type];
      } else {
        h += mushafLineHeightFor(perLine[li]);
      }
    }
    if (h > max) max = h;
  }
  return max;
}

export const toArabicDigits = (n) =>
  String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

// UthmanicHafs quirks: spaces before waqf marks need an NBSP base (else the
// shaper draws a dotted circle), and three Tanzil-style codepoints are wide
// base glyphs in this font — map them to the QPC-hafs marks it attaches.
const HAFS_CHAR_FIXES = { ' ': ' ', '۟': 'ْ', 'ۣ': 'ۜ', '۫': '۬' };
const HAFS_CHAR_RE = / |۟|ۣ|۫/g;
export const arForHafs = (s) => (s ? s.replace(HAFS_CHAR_RE, (c) => HAFS_CHAR_FIXES[c]) : s);

// Hafs.otf lacks ASCII parentheses; the only unrenderable glyphs in the
// embedded-Azkar verse text are the "(n)" ayah markers. Turn them into the
// Arabic-Indic digits the reader uses for end-of-ayah numbers and drop any
// leftover parens so nothing falls back to a mismatched system glyph.
export const cleanForHafs = (s) => (s
  ? s.replace(/\((\d+)\)/g, (_, n) => toArabicDigits(n)).replace(/[()]/g, '')
  : s);

// QCF fonts are per-page private-use glyph sets, so a verse can only be drawn
// in HD by emitting each word's `code` with that word's page font. Collects an
// ayah's words in reading order with their page so the caller can group them.
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
