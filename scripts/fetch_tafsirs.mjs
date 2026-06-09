// Downloads tafsir data from api.quran.com and saves flat {"surah:ayah": "text"} JSON files.
// Usage: node scripts/fetch_tafsirs.mjs
// Requires Node 18+ (native fetch).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../assets/quran/data');

const TAFSIRS = [
  { id: 'wasit_ar',      apiId: 93,  lang: 'ar' },
  { id: 'ibn_kathir_ar', apiId: 14,  lang: 'ar' },
  { id: 'tabari_ar',     apiId: 15,  lang: 'ar' },
  { id: 'qurtubi_ar',    apiId: 90,  lang: 'ar' },
  { id: 'saadi_ar',      apiId: 91,  lang: 'ar' },
  { id: 'baghawi_ar',    apiId: 94,  lang: 'ar' },
  { id: 'ibn_kathir_en', apiId: 169, lang: 'en' },
  { id: 'maariful_en',   apiId: 168, lang: 'en' },
  { id: 'wahiduddin_en', apiId: 817, lang: 'en' },
];

const BASE = 'https://api.quran.com/api/v4';
const CONCURRENCY = 15;
const RETRY = 3;
const RETRY_DELAY_MS = 1000;

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    if (attempt < RETRY) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw e;
  }
}

// Run tasks with limited concurrency.
async function pool(fns, limit) {
  const results = new Array(fns.length);
  let next = 0;
  async function worker() {
    while (next < fns.length) {
      const i = next++;
      results[i] = await fns[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, fns.length) }, worker));
  return results;
}

async function fetchPage(apiId, surah, page) {
  const url = `${BASE}/tafsirs/${apiId}/by_chapter/${surah}?page=${page}`;
  return fetchJson(url);
}

async function fetchTafsir({ id, apiId }) {
  const outPath = path.join(OUT_DIR, `tafsir_${id}.json`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${id} already exists`);
    return;
  }

  console.log(`\nFetching ${id} (api id ${apiId})…`);
  const map = {};

  // Phase 1: fetch page 1 of all 114 surahs to discover total pages.
  const surahs = Array.from({ length: 114 }, (_, i) => i + 1);
  const phase1 = await pool(
    surahs.map(s => () => fetchPage(apiId, s, 1)),
    CONCURRENCY
  );

  // Phase 2: collect all additional pages needed.
  const extraFns = [];
  for (let si = 0; si < 114; si++) {
    const data = phase1[si];
    for (const t of data?.tafsirs ?? []) {
      map[t.verse_key] = stripHtml(t.text);
    }
    const total = data?.pagination?.total_pages ?? 1;
    for (let p = 2; p <= total; p++) {
      const surah = si + 1;
      extraFns.push(() => fetchPage(apiId, surah, p));
    }
  }

  if (extraFns.length > 0) {
    process.stdout.write(`  fetching ${extraFns.length} extra pages…\r`);
    const extraResults = await pool(extraFns, CONCURRENCY);
    for (const data of extraResults) {
      for (const t of data?.tafsirs ?? []) {
        map[t.verse_key] = stripHtml(t.text);
      }
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(map));
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  saved tafsir_${id}.json  ${Object.keys(map).length} entries  ${kb} KB`);
}

async function main() {
  for (const tafsir of TAFSIRS) {
    await fetchTafsir(tafsir);
  }
  console.log('\nAll done.');
}

main().catch(e => { console.error(e); process.exit(1); });
