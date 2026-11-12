import { loadBundledTafsir } from '@/utils/quran/tafsirLoader';
import { getLayout, loadLayouts } from '@/utils/quran/layoutData.web';

it('loads both web layouts before allowing synchronous access', async () => {
  expect(() => getLayout('pages_lines_v1')).toThrow('not loaded yet');
  await loadLayouts();
  expect(getLayout('pages_lines_v1')).toEqual(require('@assets/quran/data/pages_lines_v1.json'));
  expect(getLayout('pages_lines_v2')).toEqual(require('@assets/quran/data/pages_lines_v2.json'));
  expect(getLayout('unknown')).toBe(getLayout('pages_lines_v1'));
});

it.each([
  ['muyassar_ar', () => require('@assets/quran/data/tafsir_ar.json')],
  ['saadi_ar', () => require('@assets/quran/data/tafsir_saadi_ar.json')],
  ['baghawi_ar', () => require('@assets/quran/data/tafsir_baghawi_ar.json')],
  ['wahiduddin_en', () => require('@assets/quran/data/tafsir_wahiduddin_en.json')],
])('loads the complete %s tafsir and reuses its module', async (id, expected) => {
  const data = await loadBundledTafsir(id);
  expect(data).toEqual(expected());
  expect(await loadBundledTafsir(id)).toBe(data);
  expect(Object.keys(data).length).toBeGreaterThan(0);
});

it.each(['unknown', 'toString'])('falls back to Muyassar for %s', async id => {
  expect(await loadBundledTafsir(id)).toBe(await loadBundledTafsir('muyassar_ar'));
});
