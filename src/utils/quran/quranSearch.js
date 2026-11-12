const TASHKEEL_RE = /[ً-ٰۖ-ۭ۟-ۥؐ-ؚ]/g;
const TATWEEL_RE = /ـ/g;
const NONLETTER_RE = /[^ء-يٱ-ە\s]/g;
const ARABIC_RE = /[؀-ۿ]/;

const EN_STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'with', 'that', 'this',
  'who', 'whom', 'they', 'them', 'their', 'there', 'have', 'has', 'had', 'was', 'were',
  'will', 'shall', 'unto', 'thy', 'thou', 'thee', 'which', 'when', 'what', 'all', 'one',
  'his', 'him', 'her', 'she', 'from', 'into', 'upon', 'unto', 'than', 'then', 'over',
]);

// search_index.json keeps hamza characters as-is; this must match that normalization exactly.
export function normalizeArabicQuery(text) {
  let t = text.replace(TASHKEEL_RE, '').replace(TATWEEL_RE, '');
  t = t.replace(/[ٱآأإ]/g, 'ا');
  t = t.replace(/ى/g, 'ي');
  t = t.replace(/ة/g, 'ه');
  t = t.replace(NONLETTER_RE, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

export function isArabicQuery(text) {
  return ARABIC_RE.test(text);
}

// Tolerates a single insertion/deletion/substitution between two words of similar length.
export function editDistanceWithinOne(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, diff = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    diff++;
    if (diff > 1) return false;
    if (la === lb) { i++; j++; }
    else if (la > lb) { i++; }
    else { j++; }
  }
  if (i < la || j < lb) diff++;
  return diff <= 1;
}

// Fuzzy/partial Arabic search: substring match always; edit-distance-1 fuzz for terms of 4+ letters.
export function searchArabicIndex(query, index, limit = 200) {
  const q = normalizeArabicQuery(query);
  const terms = q.split(' ').filter((w) => w.length >= 2);
  if (!terms.length) return [];
  let candidate = null;
  for (const term of terms) {
    const fuzzy = term.length >= 4;
    const hits = new Set();
    for (const word in index) {
      if (word.includes(term) || (fuzzy && editDistanceWithinOne(word, term))) {
        for (const k of index[word]) hits.add(k);
      }
    }
    candidate = candidate ? new Set([...candidate].filter((x) => hits.has(x))) : hits;
    if (candidate.size === 0) break;
  }
  return [...(candidate || [])].slice(0, limit);
}

let englishIndexCache = null;

export function buildEnglishIndex(translations) {
  const index = {};
  for (const key in translations) {
    const words = translations[key]
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !EN_STOP_WORDS.has(w));
    for (const w of words) {
      if (!index[w]) index[w] = [];
      index[w].push(key);
    }
  }
  return index;
}

export function getEnglishIndex(translations) {
  if (!englishIndexCache) englishIndexCache = buildEnglishIndex(translations);
  return englishIndexCache;
}

// Search-by-meaning: matches whole words or prefixes (e.g. "mercy" finds "merciful").
export function searchEnglishIndex(query, index, limit = 200) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !EN_STOP_WORDS.has(w));
  if (!terms.length) return [];
  let candidate = null;
  for (const term of terms) {
    const hits = new Set();
    for (const word in index) {
      if (word.startsWith(term)) {
        for (const k of index[word]) hits.add(k);
      }
    }
    candidate = candidate ? new Set([...candidate].filter((x) => hits.has(x))) : hits;
    if (candidate.size === 0) break;
  }
  return [...(candidate || [])].slice(0, limit);
}

export function _resetEnglishIndexForTests() {
  englishIndexCache = null;
}
