import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeLanguage, } from '@/locales/i18n';

import { loadAzkar } from '@/utils/azkar/AzkarStore';
import loadFirebaseAnalytics from '@/utils/firebase/load';
import PrayerCountdownService from '@/utils/prayer/PrayerCountdownService';
import { syncWidgetData } from '@/utils/prayer/PrayerWidgetService';
import NotificationService from '@/utils/notifications/NotificationService';
import PrayerNotificationScheduler from '@/utils/prayer/PrayerNotificationScheduler';
import QcfDownloader from '@/utils/quran/QcfDownloader';
import { loadTasbih } from '@/utils/TasbihStore';
import RadioService from '@/utils/radio/RadioService';
import MediaSessionController from '@/utils/audio/MediaSessionController';

function loadFonts() {
    return Font.loadAsync({
        ...Ionicons.font,
        'space-mono': require('@assets/fonts/SpaceMono-Regular.ttf'),
        'Hafs': require('@assets/fonts/Hafs.otf'),
        'UthmanicHafs': require('@assets/quran/fonts/UthmanicHafs1Ver18.ttf'),
        'KFGQPC_SurahNames': require('@assets/quran/fonts/sura_names.ttf'),
        'KFGQPC_Bismillah': require('@assets/quran/fonts/bismillah.ttf'),
    });
}

async function initNotificationServices() {
    // Countdown and scheduler post to Android channels created by NotificationService.
    try {
        await NotificationService.initialize();
    } catch (error) {
        console.error('Failed to initialize NotificationService:', error);
    }
    await Promise.all([
        PrayerCountdownService.initialize().catch((error) =>
            console.error('Failed to initialize prayer countdown service:', error)),
        PrayerNotificationScheduler.initialize().catch((error) =>
            console.error('Failed to initialize prayer notification scheduler:', error)),
    ]);
}

export async function loadResourcesAndDataAsync() {
    // Language must be set before any service that reads t() or moment.locale,
    // otherwise notifications can be built with default-language text while the
    // user has chosen the other language.
    await initializeLanguage();

    SplashScreen.preventAutoHideAsync();

    await Promise.all([
        loadFonts().catch((error) => console.warn('Failed to load fonts:', error)),
        loadFirebaseAnalytics().catch((error) =>
            console.error('Failed to initialize Firebase Analytics:', error)),
        initNotificationServices(),
        loadTasbih().catch((error) =>
            console.error('Failed to load tasbih counters:', error)),
        loadAzkar().catch((error) =>
            console.error('Failed to load azkar:', error)),
        Platform.OS !== 'web'
            ? RadioService.initialize().catch((error) =>
                console.error('Failed to initialize radio service:', error))
            : Promise.resolve(),
    ]);

    try {
        MediaSessionController.initialize();
    } catch (error) {
        console.error('Failed to initialize media session controller:', error);
    }

    syncWidgetData();

    QcfDownloader.checkInstalled()
        .then(() => QcfDownloader.autoInstall('v2'))
        .catch((error) => {
            console.warn('QCF downloader check failed:', error);
        });

    return true;
}
