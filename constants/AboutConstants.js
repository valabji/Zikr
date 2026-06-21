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
  { roleKey: 'recitations', url: 'https://everyayah.com' },
  { roleKey: 'radio', url: 'https://qurango.net' },
  { roleKey: 'hadith', url: null },
  { roleKey: 'azkar', url: null },
  { roleKey: 'prayerTimes', url: 'https://github.com/batoulapps/adhan-js' },
];

// Bundled open-source software and fonts. Licenses verified against each project at time of writing.
export const LICENSES = [
  { name: 'React & React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo SDK', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'React Navigation', license: 'MIT', url: 'https://github.com/react-navigation/react-navigation' },
  { name: 'Redux Toolkit & React Redux', license: 'MIT', url: 'https://github.com/reduxjs/redux-toolkit' },
  { name: 'Adhan', license: 'MIT', url: 'https://github.com/batoulapps/adhan-js' },
  { name: 'Moment.js · Hijri · Timezone', license: 'MIT', url: 'https://github.com/moment/moment' },
  { name: 'react-native-svg', license: 'MIT', url: 'https://github.com/software-mansion/react-native-svg' },
  { name: 'react-native-reanimated', license: 'MIT', url: 'https://github.com/software-mansion/react-native-reanimated' },
  { name: 'react-native-gesture-handler', license: 'MIT', url: 'https://github.com/software-mansion/react-native-gesture-handler' },
  { name: 'React Native Firebase', license: 'Apache-2.0', url: 'https://github.com/invertase/react-native-firebase' },
  { name: 'Feather & Ionicons (@expo/vector-icons)', license: 'MIT', url: 'https://github.com/expo/vector-icons' },
  { name: 'Cairo Font', license: 'SIL OFL 1.1', url: 'https://fonts.google.com/specimen/Cairo' },
  { name: 'KFGQPC Uthmanic Script Hafs', license: 'KFGQPC License', url: 'https://qurancomplex.gov.sa' },
];
