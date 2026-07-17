import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import QuranAudio from '@/utils/quran/QuranAudio';
import RadioService from '@/utils/radio/RadioService';
import surahsData from '@assets/quran/data/surahs.json';
import { getReciter } from '@/constants/QuranReciters';
import { getStationSubtitle } from '@/utils/radio/RadioStations';
import { isRTL, toArabicDigits } from '@/locales/i18n';
import * as MediaSession from '@modules/expo-media-session';

const surahById = surahsData.reduce((acc, surah) => { acc[surah.id] = surah; return acc; }, {});

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
  const ayah = QuranAudio.activeAyah;
  if (!ayah) return null;
  const isArabic = isRTL();
  const surah = surahById[ayah.surah];
  const surahName = surah ? (isArabic ? surah.nameAr : surah.nameEn) : '';
  const ayahNum = isArabic ? toArabicDigits(ayah.ayah) : String(ayah.ayah);
  const reciter = getReciter(QuranAudio.reciterId);
  return {
    source: 'quran',
    title: `${surahName} · ${ayahNum}`,
    artist: isArabic ? reciter.nameAr : reciter.nameEn,
    album: isArabic ? 'القرآن الكريم' : 'Holy Quran',
    isPlaying: QuranAudio.isPlaying,
    canNext: true,
    canPrevious: true,
  };
}

function radioMeta() {
  const station = RadioService.activeStation;
  if (!station) return null;
  const isArabic = isRTL();
  const subtitle = getStationSubtitle(station.streamUrl, isArabic ? 'ar' : 'en');
  const channel = isArabic ? 'إذاعة القرآن الكريم' : 'Quran Radio';
  return {
    source: 'radio',
    title: station.name || channel,
    artist: subtitle || channel,
    album: channel,
    isPlaying: RadioService.isPlaying,
    canNext: false,
    canPrevious: false,
  };
}

function applyWeb(meta) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const mediaSession = navigator.mediaSession;
  try {
    mediaSession.metadata = new window.MediaMetadata({ title: meta.title, artist: meta.artist, album: meta.album });
  } catch {}
  mediaSession.playbackState = meta.isPlaying ? 'playing' : 'paused';
  mediaSession.setActionHandler('play', () => handleCommand('togglePlayPause'));
  mediaSession.setActionHandler('pause', () => handleCommand('togglePlayPause'));
  mediaSession.setActionHandler('stop', () => handleCommand('stop'));
  mediaSession.setActionHandler('previoustrack', meta.canPrevious ? () => handleCommand('previous') : null);
  mediaSession.setActionHandler('nexttrack', meta.canNext ? () => handleCommand('next') : null);
}

function clearWeb() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const mediaSession = navigator.mediaSession;
  mediaSession.metadata = null;
  mediaSession.playbackState = 'none';
  ['play', 'pause', 'stop', 'previoustrack', 'nexttrack'].forEach((action) => {
    try { mediaSession.setActionHandler(action, null); } catch {}
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
