import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;

const layoutCache = {};
export function getLayout(layoutFile) {
  if (!layoutCache[layoutFile]) {
    if (layoutFile === 'pages_lines_v2') {
      layoutCache[layoutFile] = require('@assets/quran/data/pages_lines_v2.json');
    } else {
      layoutCache[layoutFile] = require('@assets/quran/data/pages_lines_v1.json');
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

// Per-page line metrics for the heuristic first-paint estimate and scroll offsets; rendered sizes come from probe measurement in MushafPage.
const PAGE_DATA = (() => {
  const out = {};
  for (const file of ['pages_lines_v1', 'pages_lines_v2']) {
    const pages = getLayout(file);
    const pageMetrics = new Array(pages.length);
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
          const code = w.code || '';
          for (let ci = 0; ci < code.length; ci++) if (code[ci] === ' ') codeSpaces += 1;
        }
        lineLens[li] = total;
        lineSpaces[li] = Math.max(0, line.words.length - 1);
        lineCodeSpaces[li] = codeSpaces;
        if (total > bestLen) bestLen = total;
      }
      pageMetrics[p] = { visibleLen: bestLen, lineLens, lineSpaces, lineCodeSpaces };
    }
    out[file] = pageMetrics;
  }
  return out;
})();

export function getPageProbeLen(layoutFile, pageIndex) {
  const pageMetrics = PAGE_DATA[layoutFile];
  const entry = pageMetrics && pageMetrics[pageIndex];
  return entry ? entry.visibleLen : 0;
}

// Natural fit of line i = pageFitSize × (densestLen / lineLen_i), capped at the page average so short surah-ending lines don't balloon; non-text lines get pageFitSize as a placeholder.
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

// Reference size for the hidden measurement probe; measured widths scale from it to the fit-to-width size.
export const PROBE_FONT_SIZE = 24;

// Lines filling less than this stay centered like a printed Mushaf's stub lines.
const JUSTIFY_MIN_FILL = 0.8;

// Print-style justification: per-line extra px added to each inter-word space so full lines reach the page width.
export function justifiedSpaceExtrasForPage(layoutFile, pageIndex, availWidth, sizes, qcfTable, measuredEmPx) {
  const tables = getLineWidths(layoutFile);
  const table = qcfTable ? tables[qcfTable] : tables.hafs;
  const row = table && table[pageIndex];
  const entry = PAGE_DATA[layoutFile] && PAGE_DATA[layoutFile][pageIndex];
  if (!row || !entry) return null;
  // Extra 7px: per-gap letterSpacing pixel-snapping widens the drawn line, and in RTL the excess clips the final glyph.
  const target = availWidth - FIT_GUARD_PX - 7;
  const out = new Array(row.length).fill(0);
  for (let i = 0; i < row.length; i++) {
    const nsp = entry.lineSpaces[i];
    if (!(row[i] > 0) || nsp <= 0) continue;
    const size = sizes[i] || sizes[0];
    const em = row[i] / 1000
      + (qcfTable === 'qcf' ? (nsp + entry.lineCodeSpaces[i]) * QCF_SPACE_EM : 0);
    // Probe-measured widths trump the table: they include system-fallback glyphs the bundled font lacks.
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
      ? require('@assets/quran/data/line_widths_v2.json')
      : require('@assets/quran/data/line_widths_v1.json');
  }
  return lineWidthsCache[layoutFile];
}

// QCF v1/v2 fonts have no U+0020 glyph so spaces fall back to the system font; 0.27em approximates that advance (qcf4 tables already include real space glyphs).
export const QCF_SPACE_EM = 0.27;

// Initial sizes from the build-time width tables (scripts/build_line_widths.py), accurate within ~2%; the live probe only refines these.
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

// Cap growth past the densest line's fit at 20% so short lines center instead of ballooning.
const MAX_LINE_GROWTH = 1.2;

const floorHalfPoint = (x) => Math.max(8, Math.floor(x * 2) / 2);

// Slack against per-gap letterSpacing rounding and shaper drift so the widest justified line never overflows.
const FIT_GUARD_PX = 6;

// Exact per-line sizes from probe measurements; `uniform` (QCF mode) uses one size per page since QCF glyphs already justify each line.
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

// Shrink-only second pass from re-measured widths (1px guard against pixel-grid rounding), so it cannot oscillate.
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

// Conservative estimate for the very first paint, before the probe's onLayout fires.
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

// Cache of `{ sizes, emPx }` keyed by `${width}|${fontFamily}|${layoutFile}|${pageIndex}`.
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

function pageHeightAtWidth(layoutFile, pageIndex, width) {
  const lines = getLayout(layoutFile)[pageIndex].lines;
  const pageFit = mushafFontSizeForWidth(width, getPageProbeLen(layoutFile, pageIndex));
  const perLine = perLineFontSizesForPage(layoutFile, pageIndex, pageFit);
  let h = PAGE_CHROME_PX;
  for (let li = 0; li < lines.length; li++) {
    const fixed = LINE_PX_FIXED[lines[li].type];
    h += fixed != null ? fixed : mushafLineHeightFor(perLine[li]);
  }
  return h;
}

const layoutOffsetCache = {};
export function getLayoutOffsets(layoutFile) {
  if (layoutOffsetCache[layoutFile]) return layoutOffsetCache[layoutFile];
  const pages = getLayout(layoutFile);
  const heights = new Array(pages.length);
  const offsets = new Array(pages.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < pages.length; i++) {
    heights[i] = pageHeightAtWidth(layoutFile, i, SCREEN_WIDTH);
    offsets[i + 1] = offsets[i] + heights[i];
  }
  layoutOffsetCache[layoutFile] = { heights, offsets };
  return layoutOffsetCache[layoutFile];
}

export function maxPageHeightForWidth(layoutFile, width) {
  const pages = getLayout(layoutFile);
  let max = 0;
  for (let i = 0; i < pages.length; i++) {
    const h = pageHeightAtWidth(layoutFile, i, width);
    if (h > max) max = h;
  }
  return max;
}

export function fitWidthForHeight(layoutFile, baseWidth, availHeight) {
  if (maxPageHeightForWidth(layoutFile, baseWidth) <= availHeight) return baseWidth;
  let lo = 50, hi = baseWidth;
  for (let i = 0; i < 15; i++) {
    const mid = Math.floor((lo + hi) / 2);
    if (maxPageHeightForWidth(layoutFile, mid) <= availHeight) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(50, lo);
}
