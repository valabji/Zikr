import { Platform } from 'react-native';
import { AudioModule, RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { VOICE_FOLLOW_DEBUG as DEBUG } from '@/utils/quran/quranDebug';

const log = (...args) => { if (DEBUG) console.log('[MicTest]', ...args); };
const RECORD_MS = 3000;
let running = false;

export async function runMicTest(onState) {
  if (running) return;
  running = true;
  const notify = (state) => { log('state', state); onState?.(state); };
  let recorder;
  let player;
  let subscription;
  let recordingMode = false;
  try {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) { notify('denied'); return; }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    recordingMode = true;
    const options = RecordingPresets.HIGH_QUALITY;
    const Recorder = Platform.OS === 'web' ? AudioModule.AudioRecorderWeb : AudioModule.AudioRecorder;
    recorder = new Recorder({ ...options, ...options[Platform.OS] });
    await recorder.prepareToRecordAsync();
    recorder.record();
    notify('recording');
    await new Promise((resolve) => setTimeout(resolve, RECORD_MS));
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) throw new Error('Recording did not produce an audio file');

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    recordingMode = false;
    notify('playing');
    player = createAudioPlayer({ uri });
    await new Promise((resolve, reject) => {
      subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.error) reject(new Error(status.error));
        else if (status.didJustFinish) resolve();
      });
      player.play();
    });
    notify('idle');
  } catch (error) {
    log('error', error);
    notify('error');
  } finally {
    subscription?.remove();
    player?.remove();
    try { if (recorder?.isRecording) await recorder.stop(); } catch {}
    recorder?.release();
    if (recordingMode) {
      try { await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }); } catch {}
    }
    running = false;
  }
}
