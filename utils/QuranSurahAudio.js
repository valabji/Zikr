import * as FileSystem from 'expo-file-system/legacy';
import { getReciter } from '../constants/QuranReciters';

const QDC_BASE = 'https://api.qurancdn.com/api/qdc/audio/reciters';
const CACHE_DIR = FileSystem.documentDirectory + 'quran/surah-audio/';
const memCache = {};
const inflight = {};

function cacheFile(qdcId, surah) {
  return `${CACHE_DIR}${qdcId}_${surah}.json`;
}

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  } catch {}
}

function normalize(json, surah) {
  const f = json && json.audio_files && json.audio_files[0];
  if (!f || !f.audio_url) return null;
  const verseTimings = (f.verse_timings || [])
    .map((v) => {
      const ayah = parseInt(String(v.verse_key).split(':')[1], 10);
      const segments = (v.segments || [])
        .filter((s) => Array.isArray(s) && s.length >= 3)
        .map((s) => [s[0], s[1], s[2]]);
      return { ayah, from: v.timestamp_from, to: v.timestamp_to, segments };
    })
    .filter((v) => Number.isFinite(v.ayah) && Number.isFinite(v.from));
  if (!verseTimings.length) return null;
  return { surah, audioUrl: f.audio_url, duration: f.duration || 0, verseTimings };
}

async function fetchManifest(qdcId, surah) {
  try {
    const res = await fetch(`${QDC_BASE}/${qdcId}/audio_files?chapter=${surah}&segments=true`);
    if (!res.ok) return null;
    return normalize(await res.json(), surah);
  } catch {
    return null;
  }
}

export function getReciterQdcId(reciterId) {
  return getReciter(reciterId).qdcId || null;
}

export async function getSurahAudioManifest(reciterId, surah) {
  const qdcId = getReciterQdcId(reciterId);
  if (!qdcId) return null;
  const key = `${qdcId}:${surah}`;
  if (memCache[key]) return memCache[key];
  if (inflight[key]) return inflight[key];

  inflight[key] = (async () => {
    await ensureDir();
    const file = cacheFile(qdcId, surah);
    try {
      const info = await FileSystem.getInfoAsync(file);
      if (info.exists) {
        const parsed = JSON.parse(await FileSystem.readAsStringAsync(file));
        if (parsed && parsed.audioUrl) {
          memCache[key] = parsed;
          return parsed;
        }
      }
    } catch {}
    const manifest = await fetchManifest(qdcId, surah);
    if (manifest) {
      memCache[key] = manifest;
      try { await FileSystem.writeAsStringAsync(file, JSON.stringify(manifest)); } catch {}
    }
    return manifest;
  })();

  try {
    return await inflight[key];
  } finally {
    delete inflight[key];
  }
}
