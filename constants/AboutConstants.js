// Static data for the About and Credits screens

export const ABOUT_LINKS = {
  WEBSITE: 'https://zikr.valabji.com',
  GITHUB: 'https://github.com/valabji/Zikr',
  PLAY_STORE: 'https://play.google.com/store/apps/details?id=com.valabji.zikr',
  DEVELOPER: 'https://valabji.com',
};

// Content providers and datasets the app builds on. `roleKey` maps to credits.sources.* (role) and credits.sourceNames.* (localized name) in the locale files.
export const DATA_SOURCES = [
  { roleKey: 'quranText', url: 'https://qurancomplex.gov.sa' },
  { roleKey: 'quranTranslation', url: 'https://tanzil.net' },
  { roleKey: 'tafsir', url: null },
  { roleKey: 'quranApi', url: 'https://quran.com' },
  { roleKey: 'recitations', url: 'https://everyayah.com' },
  { roleKey: 'radio', url: 'https://mp3quran.net' },
  { roleKey: 'adhanAudio', url: 'https://aladhan.com' },
  { roleKey: 'hadith', url: 'https://github.com/AhmedBaset/hadith-json' },
  { roleKey: 'azkar', url: null },
  { roleKey: 'prayerTimes', url: 'https://github.com/batoulapps/adhan-js' },
  { roleKey: 'location', url: 'https://ipinfo.io' },
  { roleKey: 'artwork', url: 'https://en.wikipedia.org/wiki/File:Sura_border.svg' },
];

// Bundled open-source software and fonts. Licenses verified against each project at time of writing.
export const LICENSES = [
  { name: 'React & React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo SDK & modules', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'React Navigation', license: 'MIT', url: 'https://github.com/react-navigation/react-navigation' },
  { name: 'Redux Toolkit & React Redux', license: 'MIT', url: 'https://github.com/reduxjs/redux-toolkit' },
  { name: 'Adhan (adhan-js)', license: 'MIT', url: 'https://github.com/batoulapps/adhan-js' },
  { name: 'Moment.js · Hijri · Timezone', license: 'MIT', url: 'https://github.com/moment/moment' },
  { name: 'Software Mansion: svg · reanimated · gesture-handler · screens · worklets', license: 'MIT', url: 'https://github.com/software-mansion' },
  { name: 'react-native-safe-area-context', license: 'MIT', url: 'https://github.com/AppAndFlow/react-native-safe-area-context' },
  { name: 'React Native Async Storage', license: 'MIT', url: 'https://github.com/react-native-async-storage/async-storage' },
  { name: '@react-native-community/slider', license: 'MIT', url: 'https://github.com/callstack/react-native-slider' },
  { name: 'React Native Firebase', license: 'Apache-2.0', url: 'https://github.com/invertase/react-native-firebase' },
  { name: 'react-native-android-widget', license: 'MIT', url: 'https://github.com/sAleksovski/react-native-android-widget' },
  { name: 'react-native-shared-group-preferences', license: 'MIT', url: 'https://github.com/KjellConnelly/react-native-shared-group-preferences' },
  { name: 'react-native-view-shot', license: 'MIT', url: 'https://github.com/gre/react-native-view-shot' },
  { name: 'react-native-swiper · react-native-web-swiper', license: 'MIT', url: 'https://github.com/leecade/react-native-swiper' },
  { name: 'react-native-web', license: 'MIT', url: 'https://github.com/necolas/react-native-web' },
  { name: 'expo-speech-recognition', license: 'MIT', url: 'https://github.com/jamsch/expo-speech-recognition' },
  { name: 'Feather & Ionicons (@expo/vector-icons)', license: 'MIT', url: 'https://github.com/expo/vector-icons' },
  { name: 'Cairo Font', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Cairo' },
  { name: 'KFGQPC Uthmanic Hafs & QCF Mushaf Fonts', license: 'KFGQPC', url: 'https://qurancomplex.gov.sa' },
];
