import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import QuranAudio from './QuranAudio';
import RadioService from './RadioService';
import surahsData from '../assets/quran/data/surahs.json';
import { getReciter } from '../constants/QuranReciters';
import { getStationSubtitle } from './RadioStations';
import { isRTL } from '../locales/i18n';
import { toArabicDigits } from './mushafLayout';
import * as MediaSession from '../modules/expo-media-session';

const surahById = surahsData.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});

let initialized = false;
let activeSource = null;
let lastKey = null;
let notifPermissionRequested = false;

async function ensureAndroidNotificationPermission() {
  if (notifPermissionRequested || Platform.OS !== 'android') return;
  notifPermissionRequested = true;
  try {
    // Android 13+ hides the media notification without POST_NOTIFICATIONS
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {}
}

function quranMeta() {
  const a = QuranAudio.activeAyah;
  if (!a) return null;
  const ar = isRTL();
  const surah = surahById[a.surah];
  const surahName = surah ? (ar ? surah.nameAr : surah.nameEn) : '';
  const ayahNum = ar ? toArabicDigits(a.ayah) : String(a.ayah);
  const reciter = getReciter(QuranAudio.reciterId);
  return {
    source: 'quran',
    title: `${surahName} · ${ayahNum}`,
    artist: ar ? reciter.nameAr : reciter.nameEn,
    album: ar ? 'القرآن الكريم' : 'Holy Quran',
    isPlaying: QuranAudio.isPlaying,
    canNext: true,
    canPrevious: true,
  };
}

function radioMeta() {
  const s = RadioService.activeStation;
  if (!s) return null;
  const ar = isRTL();
  const subtitle = getStationSubtitle(s.streamUrl, ar ? 'ar' : 'en');
  const channel = ar ? 'إذاعة القرآن الكريم' : 'Quran Radio';
  return {
    source: 'radio',
    title: s.name || channel,
    artist: subtitle || channel,
    album: channel,
    isPlaying: RadioService.isPlaying,
    canNext: false,
    canPrevious: false,
  };
}

function applyWeb(meta) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  try {
    ms.metadata = new window.MediaMetadata({ title: meta.title, artist: meta.artist, album: meta.album });
  } catch {}
  ms.playbackState = meta.isPlaying ? 'playing' : 'paused';
  ms.setActionHandler('play', () => handleCommand('togglePlayPause'));
  ms.setActionHandler('pause', () => handleCommand('togglePlayPause'));
  ms.setActionHandler('stop', () => handleCommand('stop'));
  ms.setActionHandler('previoustrack', meta.canPrevious ? () => handleCommand('previous') : null);
  ms.setActionHandler('nexttrack', meta.canNext ? () => handleCommand('next') : null);
}

function clearWeb() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  ms.metadata = null;
  ms.playbackState = 'none';
  ['play', 'pause', 'stop', 'previoustrack', 'nexttrack'].forEach((a) => {
    try { ms.setActionHandler(a, null); } catch {}
  });
}

function apply(meta) {
  if (!meta) { clear(); return; }
  const key = JSON.stringify(meta);
  if (key === lastKey) return;
  lastKey = key;
  activeSource = meta.source;
  if (Platform.OS === 'web') {
    applyWeb(meta);
  } else {
    ensureAndroidNotificationPermission();
    MediaSession.updateMetadata({
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      isPlaying: meta.isPlaying,
      canNext: meta.canNext,
      canPrevious: meta.canPrevious,
    });
  }
}

function clear() {
  if (activeSource == null && lastKey == null) return;
  activeSource = null;
  lastKey = null;
  if (Platform.OS === 'web') clearWeb();
  else MediaSession.clear();
}

function recompute() {
  if (QuranAudio.activeAyah) apply(quranMeta());
  else if (RadioService.activeStation) apply(radioMeta());
  else clear();
}

function handleCommand(command, positionMs) {
  if (activeSource === 'radio') {
    if (command === 'stop') RadioService.stop();
    else if (command === 'pause') RadioService.toggle();
    else if (command === 'play') RadioService.toggle();
    else RadioService.toggle();
    return;
  }
  switch (command) {
    case 'next': QuranAudio.next(); break;
    case 'previous': QuranAudio.previous(); break;
    case 'stop': QuranAudio.stop(); break;
    case 'pause': QuranAudio.pause(); break;
    case 'play': QuranAudio.play(); break;
    case 'seek': if (positionMs != null) QuranAudio.seekToMs(positionMs); break;
    default: QuranAudio.toggle();
  }
}

function initialize() {
  if (initialized) return;
  initialized = true;
  QuranAudio.subscribe(() => recompute());
  RadioService.subscribe(() => recompute());
  if (Platform.OS !== 'web') {
    MediaSession.addCommandListener(({ command, positionMs }) => handleCommand(command, positionMs));
  }
}

export default { initialize };
