const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;
const NON_ARABIC = /[^؀-ۿ\s]/g;

export function normalizeArabic(s) {
  if (!s) return '';
  return s
    .replace(DIACRITICS, '')
    .replace(/[آأإٱٲٳ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(NON_ARABIC, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(transcript) {
  const norm = normalizeArabic(transcript);
  return norm ? norm.split(' ').filter(Boolean) : [];
}

// Uthmani script omits some alefs that recognizers transcribe in full (e.g.
// العلمين vs العالمين). Dropping every alef gives a skeleton that matches across
// both orthographies; used only as a fallback when the exact forms differ.
function skeleton(norm) {
  return norm.replace(/ا/g, '');
}

function wordsEqual(wordNorm, tokenNorm) {
  if (wordNorm === tokenNorm) return true;
  const ws = skeleton(wordNorm);
  return ws.length > 0 && ws === skeleton(tokenNorm);
}

// Aligns the tail of recognized tokens against the flat word list, scanning a
// short window ahead of fromPos. Score = how many trailing tokens match in a
// row ending at p; higher score wins, ties favor the furthest-forward position
// so a steady reciter keeps advancing. Returns the matched word position, or
// fromPos when nothing in the window matches.
export function matchPosition(flatWords, fromPos, tokens, lookahead = 12, depth = 3) {
  if (!tokens.length || !flatWords.length) return fromPos;
  const start = Math.max(0, fromPos);
  const end = Math.min(flatWords.length - 1, start + lookahead);
  let bestPos = start;
  let bestScore = 0;
  for (let p = start; p <= end; p += 1) {
    let score = 0;
    for (let d = 0; d < depth; d += 1) {
      const wi = p - d;
      const ti = tokens.length - 1 - d;
      if (wi < 0 || ti < 0) break;
      if (!wordsEqual(flatWords[wi].norm, tokens[ti])) break;
      score += 1;
    }
    if (score > 0 && (score > bestScore || (score === bestScore && p > bestPos))) {
      bestScore = score;
      bestPos = p;
    }
  }
  return bestScore > 0 ? bestPos : fromPos;
}

// Relocates the cursor when the near window fails because the reciter is far
// from fromPos (e.g. started on a different ayah). Scans a wide range forward
// and returns the closest position where a run of at least minRun trailing
// tokens aligns; the run requirement avoids false jumps on common single words.
// Returns -1 when no confident match is found.
export function findResync(flatWords, fromPos, tokens, range = 3000, minRun = 2) {
  if (tokens.length < minRun || !flatWords.length) return -1;
  const start = Math.max(0, fromPos);
  const end = Math.min(flatWords.length - 1, start + range);
  let bestPos = -1;
  let bestScore = 0;
  for (let p = start; p <= end; p += 1) {
    let score = 0;
    for (let d = 0; d < tokens.length; d += 1) {
      const wi = p - d;
      const ti = tokens.length - 1 - d;
      if (wi < 0 || ti < 0) break;
      if (!wordsEqual(flatWords[wi].norm, tokens[ti])) break;
      score += 1;
    }
    if (score >= minRun && score > bestScore) {
      bestScore = score;
      bestPos = p;
    }
  }
  return bestPos;
}
