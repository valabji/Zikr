import { useAudioPlayer } from 'expo-audio';

const audioSource = require('../assets/sound/kikhires.mp3');

export function useAudio() {
    player = useAudioPlayer(audioSource);
    player.volume = 0.9; // Set volume to a reasonable level
    return {
        playClick: () => {
            player.seekTo(0);
            player.play();
        }
    }
}