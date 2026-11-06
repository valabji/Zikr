import { getDailyHadith } from '@/utils/books/DailyHadith';
import * as library from '@/utils/books/BooksLibrary';
import { BOOK_CATEGORIES } from '@/constants/BooksConstants';

const books = library.getBooksCatalog().filter(b => b.bundled && b.category === BOOK_CATEGORIES.HADITH);
const day = 86400000;
let pool;

beforeAll(async () => {
  pool = (await Promise.all(books.map(async meta => {
    const book = await library.loadBookAsync(meta.id);
    expect(book.entries).toHaveLength(meta.count);
    expect(book.entries.every(entry => !!entry.textAr)).toBe(true);
    return book.entries.map(entry => ({
      bookId: meta.id, bookNameAr: meta.nameAr, bookNameEn: meta.nameEn,
      n: entry.n, textAr: entry.textAr, textEn: entry.textEn || '',
    }));
  }))).flat();
});

afterEach(() => jest.restoreAllMocks());

it('preserves the original daily selection, including book boundaries and negative dates', async () => {
  let offset = 0;
  const indices = [-1, 0, 20622];
  for (const book of books) {
    indices.push(offset, offset + book.count - 1);
    offset += book.count;
  }
  for (const index of indices) {
    expect(await getDailyHadith(new Date(index * day)))
      .toEqual(pool[((index % pool.length) + pool.length) % pool.length]);
  }
});

it('loads only the book containing today\'s hadith', async () => {
  const load = jest.spyOn(library, 'loadBookAsync');
  const hadith = await getDailyHadith(new Date(books[0].count * day));
  expect(hadith.bookId).toBe(books[1].id);
  expect(load).toHaveBeenCalledTimes(1);
  expect(load).toHaveBeenCalledWith(books[1].id);
});

it('stays stable within a UTC day and cycles after the full library', async () => {
  const start = new Date('2026-06-18T00:00:00.000Z');
  const first = await getDailyHadith(start);
  expect(await getDailyHadith(new Date(start.getTime() + day - 1))).toEqual(first);
  expect(await getDailyHadith(new Date(start.getTime() + day))).not.toEqual(first);
  expect(await getDailyHadith(new Date(start.getTime() + pool.length * day))).toEqual(first);
});

it('returns null if the selected book cannot be loaded', async () => {
  jest.spyOn(library, 'loadBookAsync').mockResolvedValue(null);
  expect(await getDailyHadith()).toBeNull();
});
