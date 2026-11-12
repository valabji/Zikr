import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import QuranAyahDetailSheet from '@/screens/quran/QuranAyahDetailSheet';
import QuranPageInfoSheet from '@/screens/quran/QuranPageInfoSheet';
import { loadBundledTafsir } from '@/utils/quran/tafsirLoader';

jest.mock('@/utils/quran/tafsirLoader', () => ({ loadBundledTafsir: jest.fn(), fetchApiTafsir: jest.fn() }));
jest.mock('@/utils/quran/QuranAudio', () => ({ playAyah: jest.fn() }));
jest.mock('@/locales/i18n', () => ({ t: key => key, isRTL: () => false, toArabicDigits: String }));
jest.mock('@/constants/Colors', () => ({ useColors: () => ({ accent: '#123456' }) }));
jest.mock('@/components/quran/TafsirDropdown', () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
  loadBundledTafsir.mockResolvedValue({ '1:1': 'Loaded tafsir' });
});

it('loads the ayah tafsir only when its tab is opened', async () => {
  const screen = render(<QuranAyahDetailSheet ayah={{ surah: 1, ayah: 1 }} tafsirId="muyassar_ar" />);
  expect(loadBundledTafsir).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('quran.tafsir'));
  expect(await screen.findByText('Loaded tafsir')).toBeTruthy();
  expect(loadBundledTafsir).toHaveBeenCalledWith('muyassar_ar');
});

it('ignores an old request after the tafsir selection changes', async () => {
  let finishOld;
  loadBundledTafsir.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  const props = { ayah: { surah: 1, ayah: 1 }, tafsirId: 'muyassar_ar' };
  const screen = render(<QuranAyahDetailSheet {...props} />);
  fireEvent.press(screen.getByText('quran.tafsir'));
  screen.rerender(<QuranAyahDetailSheet {...props} tafsirId="saadi_ar" />);
  await screen.findByText('Loaded tafsir');
  await act(async () => finishOld({ '1:1': 'Stale tafsir' }));
  expect(screen.queryByText('Stale tafsir')).toBeNull();
  expect(screen.getByText('Loaded tafsir')).toBeTruthy();
});

it('finishes loading when a chunk request fails and can retry on reopening the tab', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  loadBundledTafsir.mockRejectedValueOnce(new Error('offline'));
  const screen = render(<QuranAyahDetailSheet ayah={{ surah: 1, ayah: 1 }} tafsirId="muyassar_ar" />);
  fireEvent.press(screen.getByText('quran.tafsir'));
  expect(await screen.findByText('quran.tafsirEmpty')).toBeTruthy();
  fireEvent.press(screen.getByText('quran.translation'));
  fireEvent.press(screen.getByText('quran.tafsir'));
  expect(await screen.findByText('Loaded tafsir')).toBeTruthy();
  warn.mockRestore();
});

it('loads page tafsir on demand and does not request it while the sheet is hidden', async () => {
  const props = { currentPage: 1, layoutFile: 'pages_lines_v2', colors: { accent: '#123456' }, tafsirId: 'muyassar_ar' };
  const screen = render(<QuranPageInfoSheet {...props} visible />);
  expect(loadBundledTafsir).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('quran.tafsir'));
  expect(await screen.findByText('Loaded tafsir')).toBeTruthy();
  screen.rerender(<QuranPageInfoSheet {...props} visible={false} tafsirId="saadi_ar" />);
  expect(loadBundledTafsir).toHaveBeenCalledTimes(1);
});
