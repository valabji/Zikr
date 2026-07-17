import wordsData from '@assets/quran/data/words.json';

export const DEBUG = typeof __DEV__ !== 'undefined' && __DEV__ && !process.env.JEST_WORKER_ID;
export function dlog(...args) {
  if (DEBUG) console.log('[QuranAudio]', ...args);
}

// During the silence between two words, keep the finished word highlighted rather than pre-lighting the next one.
export function segWordIdx(segs, pos) {
  let idx = segs[segs.length - 1][0] - 1;
  for (let i = 0; i < segs.length; i++) {
    const [w, s, e] = segs[i];
    if (pos < s) { idx = i > 0 ? segs[i - 1][0] - 1 : w - 1; break; }
    if (pos < e) { idx = w - 1; break; }
  }
  return idx;
}

export function ayahWordCount(key) {
  return (wordsData[key] || []).length || 1;
}

export function fileWordIdx(key, currentTime, duration, segs) {
  const wordCount = ayahWordCount(key);
  const dur = duration || 1;
  let wordIdx;
  if (segs && segs.length) {
    const t0 = segs[0][1];
    const span = segs[segs.length - 1][2] - t0;
    wordIdx = segWordIdx(segs, t0 + (currentTime / dur) * span);
  } else {
    wordIdx = Math.floor((currentTime / dur) * wordCount);
  }
  return Math.max(0, Math.min(wordCount - 1, wordIdx));
}

export function gaplessWordIdx(key, segs, pos) {
  if (!segs || !segs.length) return null;
  const count = ayahWordCount(key);
  return Math.max(0, Math.min(count - 1, segWordIdx(segs, pos)));
}
