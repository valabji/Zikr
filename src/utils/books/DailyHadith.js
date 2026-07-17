import { getBooksCatalog, loadBook } from '@/utils/books/BooksLibrary';
import { BOOK_CATEGORIES } from '@/constants/BooksConstants';

const MS_PER_DAY = 86400000;

let pool = null;

function buildPool() {
  if (pool) return pool;
  const flat = [];
  getBooksCatalog()
    .filter((b) => b.category === BOOK_CATEGORIES.HADITH && b.bundled)
    .forEach((meta) => {
      const book = loadBook(meta.id);
      (book?.entries || []).forEach((entry) => {
        if (!entry.textAr) return;
        flat.push({
          bookId: meta.id,
          bookNameAr: meta.nameAr,
          bookNameEn: meta.nameEn,
          n: entry.n,
          textAr: entry.textAr,
          textEn: entry.textEn || '',
        });
      });
    });
  pool = flat;
  return pool;
}

export function getDailyHadith(date = new Date()) {
  const items = buildPool();
  if (!items.length) return null;
  const epochDay = Math.floor(date.getTime() / MS_PER_DAY);
  const index = ((epochDay % items.length) + items.length) % items.length;
  return items[index];
}

export function _resetForTests() {
  pool = null;
}
