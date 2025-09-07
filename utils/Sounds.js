import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const audioSource = require('../assets/sound/kikhires.mp3');
const VOLUME_KEY = '@zikr/click_volume';

export function useAudio() {
    const [volume, setVolume] = useState(0.9);
    const player = useAudioPlayer(audioSource);

    useEffect(() => {
        loadVolume();
    }, []);

    useEffect(() => {
        player.volume = volume;
    }, [volume]);

    const loadVolume = async () => {
        try {
            const savedVolume = await AsyncStorage.getItem(VOLUME_KEY);
            if (savedVolume !== null) {
                setVolume(parseFloat(savedVolume));
            }
        } catch (e) {
            console.warn('Failed to load volume setting:', e);
        }
    };

    const setClickVolume = async (newVolume) => {
        try {
            await AsyncStorage.setItem(VOLUME_KEY, newVolume.toString());
            setVolume(newVolume);
        } catch (e) {
            console.warn('Failed to save volume setting:', e);
        }
    };

    return {
        playClick: async (volume=false) => {
            if (volume) {
                player.volume = volume;
            } else {
                await loadVolume(); // Ensure volume is loaded
            }
            player.seekTo(0);
            player.play();
        },
        volume,
        setClickVolume
    }
}