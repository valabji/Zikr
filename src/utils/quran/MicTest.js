import { Audio } from 'expo-av';
import { VOICE_FOLLOW_DEBUG as DEBUG } from '@/utils/quran/quranDebug';

const log = (...args) => { if (DEBUG) console.log('[MicTest]', ...args); };

const RECORD_MS = 3000;

let _recording = null;
let _sound = null;

export async function runMicTest(onState) {
  const notify = (s) => { log('state', s); if (onState) onState(s); };
  try {
    const perm = await Audio.requestPermissionsAsync();
    log('permission', perm);
    if (!perm.granted) { notify('denied'); return; }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    notify('recording');
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    _recording = recording;

    await new Promise((r) => setTimeout(r, RECORD_MS));

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    _recording = null;
    log('recorded', uri);

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    notify('playing');
    const { sound } = await Audio.Sound.createAsync({ uri });
    _sound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        if (_sound === sound) _sound = null;
        notify('idle');
      }
    });
    await sound.playAsync();
  } catch (err) {
    log('error', err);
    try { if (_recording) await _recording.stopAndUnloadAsync(); } catch {}
    _recording = null;
    notify('error');
  }
}
