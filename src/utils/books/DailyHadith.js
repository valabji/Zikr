import { getBooksCatalog, loadBookAsync } from '@/utils/books/BooksLibrary';
import { BOOK_CATEGORIES } from '@/constants/BooksConstants';

const MS_PER_DAY = 86400000;

export async function getDailyHadith(date = new Date()) {
  const books = getBooksCatalog().filter((b) => b.category === BOOK_CATEGORIES.HADITH && b.bundled);
  const count = books.reduce((sum, b) => sum + b.count, 0);
  if (!count) return null;
  const epochDay = Math.floor(date.getTime() / MS_PER_DAY);
  let index = ((epochDay % count) + count) % count;
  // Catalog counts select the book without downloading the entire hadith library.
  for (const meta of books) {
    if (index >= meta.count) { index -= meta.count; continue; }
    const book = await loadBookAsync(meta.id);
    const entry = book?.entries[index];
    if (!entry?.textAr) return null;
    return {
      bookId: meta.id,
      bookNameAr: meta.nameAr,
      bookNameEn: meta.nameEn,
      n: entry.n,
      textAr: entry.textAr,
      textEn: entry.textEn || '',
    };
  }
  return null;
}
