import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { transformRawBook } from '../utils/booksTransform.js';

const SHA = '70b83d6d21995bb32f8d7271cd75501be5a922a7';
const RAW_BASE = `https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@${SHA}/db/by_book`;

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'books', 'data');

const BOOKS = [
  { id: 'nawawi40', dir: 'forties', bundled: true, nameAr: 'الأربعون النووية', nameEn: "An-Nawawi's 40 Hadith", authorAr: 'الإمام النووي', authorEn: 'Imam an-Nawawi' },
  { id: 'qudsi40', dir: 'forties', bundled: true, nameAr: 'الأربعون القدسية', nameEn: 'Forty Hadith Qudsi', authorAr: '', authorEn: '' },
  { id: 'shahwaliullah40', dir: 'forties', bundled: true, nameAr: 'الأربعون لولي الله الدهلوي', nameEn: "Shah Waliullah's 40 Hadith", authorAr: 'الشاه ولي الله الدهلوي', authorEn: 'Shah Waliullah ad-Dahlawi' },
  { id: 'riyad_assalihin', dir: 'other_books', bundled: true, nameAr: 'رياض الصالحين', nameEn: 'Riyad as-Salihin', authorAr: 'الإمام النووي', authorEn: 'Imam an-Nawawi' },
  { id: 'aladab_almufrad', dir: 'other_books', bundled: true, nameAr: 'الأدب المفرد', nameEn: 'Al-Adab Al-Mufrad', authorAr: 'الإمام البخاري', authorEn: 'Imam al-Bukhari' },
  { id: 'shamail_muhammadiyah', dir: 'other_books', bundled: true, nameAr: 'الشمائل المحمدية', nameEn: "Shama'il Muhammadiyah", authorAr: 'الإمام الترمذي', authorEn: 'Imam at-Tirmidhi' },

  { id: 'bukhari', dir: 'the_9_books', bundled: false, sizeMB: 12.8, nameAr: 'صحيح البخاري', nameEn: 'Sahih al-Bukhari', authorAr: 'الإمام البخاري', authorEn: 'Imam al-Bukhari' },
  { id: 'muslim', dir: 'the_9_books', bundled: false, sizeMB: 11.5, nameAr: 'صحيح مسلم', nameEn: 'Sahih Muslim', authorAr: 'الإمام مسلم', authorEn: 'Imam Muslim' },
  { id: 'abudawud', dir: 'the_9_books', bundled: false, sizeMB: 7.9, nameAr: 'سنن أبي داود', nameEn: 'Sunan Abu Dawud', authorAr: 'الإمام أبو داود', authorEn: 'Imam Abu Dawud' },
  { id: 'tirmidhi', dir: 'the_9_books', bundled: false, sizeMB: 7.7, nameAr: 'جامع الترمذي', nameEn: "Jami' at-Tirmidhi", authorAr: 'الإمام الترمذي', authorEn: 'Imam at-Tirmidhi' },
  { id: 'nasai', dir: 'the_9_books', bundled: false, sizeMB: 7.9, nameAr: 'سنن النسائي', nameEn: "Sunan an-Nasa'i", authorAr: 'الإمام النسائي', authorEn: 'Imam an-Nasa\'i' },
  { id: 'ibnmajah', dir: 'the_9_books', bundled: false, sizeMB: 5.7, nameAr: 'سنن ابن ماجه', nameEn: 'Sunan Ibn Majah', authorAr: 'الإمام ابن ماجه', authorEn: 'Imam Ibn Majah' },
  { id: 'malik', dir: 'the_9_books', bundled: false, sizeMB: 3.3, nameAr: 'موطأ مالك', nameEn: 'Muwatta Malik', authorAr: 'الإمام مالك', authorEn: 'Imam Malik' },
  { id: 'ahmed', dir: 'the_9_books', bundled: false, sizeMB: 2.4, nameAr: 'مسند الإمام أحمد', nameEn: 'Musnad Ahmad', authorAr: 'الإمام أحمد بن حنبل', authorEn: 'Imam Ahmad ibn Hanbal' },
  { id: 'darimi', dir: 'the_9_books', bundled: false, sizeMB: 3.1, nameAr: 'سنن الدارمي', nameEn: 'Sunan ad-Darimi', authorAr: 'الإمام الدارمي', authorEn: 'Imam ad-Darimi' },
  { id: 'bulugh_almaram', dir: 'other_books', bundled: false, sizeMB: 2.0, nameAr: 'بلوغ المرام', nameEn: 'Bulugh al-Maram', authorAr: 'الحافظ ابن حجر العسقلاني', authorEn: 'Ibn Hajar al-Asqalani' },
  { id: 'mishkat_almasabih', dir: 'other_books', bundled: false, sizeMB: 5.2, nameAr: 'مشكاة المصابيح', nameEn: 'Mishkat al-Masabih', authorAr: 'الخطيب التبريزي', authorEn: 'Al-Khatib at-Tabrizi' },
];

async function fetchJson(dir, id) {
  const res = await fetch(`${RAW_BASE}/${dir}/${id}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
  return res.json();
}

async function fetchCount(dir, id) {
  const res = await fetch(`${RAW_BASE}/${dir}/${id}.json`, { headers: { Range: 'bytes=0-4096' } });
  const text = await res.text();
  const m = text.match(/"length"\s*:\s*(\d+)/);
  if (!m) throw new Error(`no length for ${id}`);
  return Number(m[1]);
}

async function main() {
  const catalog = [];
  for (const b of BOOKS) {
    const entry = {
      id: b.id,
      nameAr: b.nameAr,
      nameEn: b.nameEn,
      authorAr: b.authorAr,
      authorEn: b.authorEn,
      category: 'hadith',
      count: 0,
      bundled: b.bundled,
    };
    if (b.bundled) {
      const raw = await fetchJson(b.dir, b.id);
      const { entries } = transformRawBook(raw);
      writeFileSync(join(DATA_DIR, `${b.id}.json`), JSON.stringify({ id: b.id, entries }));
      entry.count = entries.length;
      entry.file = `${b.id}.json`;
      console.log(`bundled ${b.id}: ${entries.length} entries`);
    } else {
      entry.count = await fetchCount(b.dir, b.id);
      entry.src = `${b.dir}/${b.id}.json`;
      entry.sizeMB = b.sizeMB;
      console.log(`downloadable ${b.id}: ${entry.count} entries, ${b.sizeMB}MB`);
    }
    catalog.push(entry);
  }
  writeFileSync(join(DATA_DIR, 'books.json'), JSON.stringify(catalog, null, 1) + '\n');
  console.log(`\nwrote books.json with ${catalog.length} books`);
}

main().catch((e) => { console.error(e); process.exit(1); });
