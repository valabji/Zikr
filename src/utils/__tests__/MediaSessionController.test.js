jest.mock('@/utils/quran/QuranAudio', () => ({
  __esModule: true, default: { activeAyah: null, subscribe: jest.fn(), play: jest.fn(), pause: jest.fn(), toggle: jest.fn() },
}));
jest.mock('@/utils/radio/RadioService', () => ({
  __esModule: true, default: { activeStation: { name: 'Radio', streamUrl: 'https://example.com' }, isPlaying: false, subscribe: jest.fn(), toggle: jest.fn(), stop: jest.fn() },
}));
jest.mock('@/utils/radio/RadioStations', () => ({ getStationSubtitle: () => '' }));

import { Platform } from 'react-native';
import QuranAudio from '@/utils/quran/QuranAudio';
import RadioService from '@/utils/radio/RadioService';
import * as MediaSession from '@modules/expo-media-session';
import MediaSessionController from '@/utils/audio/MediaSessionController';

it('handles radio play/pause idempotently and ignores unsupported commands', () => {
  const previous = Platform.OS;
  Platform.OS = 'android';
  RadioService.subscribe.mockImplementation((fn) => { fn(); });
  MediaSessionController.initialize();
  const handler = MediaSession.addCommandListener.mock.calls[0][0];
  handler({ command: 'pause' });
  handler({ command: 'next' });
  handler({ command: 'seek', positionMs: 100 });
  expect(RadioService.toggle).not.toHaveBeenCalled();
  handler({ command: 'play' });
  expect(RadioService.toggle).toHaveBeenCalledTimes(1);
  RadioService.isPlaying = true;
  handler({ command: 'play' });
  expect(RadioService.toggle).toHaveBeenCalledTimes(1);
  handler({ command: 'pause' });
  expect(RadioService.toggle).toHaveBeenCalledTimes(2);
  expect(QuranAudio.toggle).not.toHaveBeenCalled();
  Platform.OS = previous;
});
