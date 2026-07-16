# Zikr - Islamic Prayer & Dhikr App
> A comprehensive Islamic mobile application for daily prayers, dhikr (remembrance), and spiritual guidance

[![Status](https://img.shields.io/badge/build-passing-green.svg)](https://github.com/valabji/Zikr)
[![React Native](https://img.shields.io/badge/React%20Native-v0.81-blue.svg?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK54-black.svg?logo=expo)](https://expo.dev/)
[![React Navigation](https://img.shields.io/badge/React%20Navigation-v7-blue.svg?logo=react)](https://reactnavigation.org/)
[![License](https://img.shields.io/badge/License-MIT-yellowgreen.svg)](http://mit-license.org/)
[![Google Play](https://img.shields.io/badge/Google%20Play-Download-green.svg?logo=googleplay)](https://play.google.com/store/apps/details?id=com.valabji.zikr)

## 🕌 About Zikr

**Zikr** is a beautifully designed Islamic mobile application that helps Muslims perform their daily dhikr (remembrance of Allah) and maintain their spiritual connection. The app provides a comprehensive collection of authentic Islamic prayers, supplications, and a digital tasbih counter, all in a user-friendly interface supporting both Arabic and English languages with full RTL (Right-to-Left) support.

### ✨ Key Features

- **📖 Complete Azkar Collection**: Over 100 authentic Islamic supplications categorized by:
  - Morning prayers (أذكار الصباح)
  - Evening prayers (أذكار المساء)
  - Post-prayer supplications
  - Bedtime prayers
  - And many more categories

- **📿 Digital Tasbih**: Interactive digital prayer beads counter with:
  - Touch-responsive counter interface
  - Audio feedback with customizable volume
  - Reset confirmation dialog
  - Elegant star-themed design

- **⭐ Favorites System**: Mark frequently used prayers as favorites for quick access

- **🌍 Bilingual Support**: 
  - Complete Arabic and English translations
  - Automatic RTL/LTR layout switching
  - Native font support (Cairo font for Arabic)

- **🔍 Search Functionality**: Quickly find specific prayers or categories

- **⚙️ Customizable Settings**:
  - Language selection (Arabic/English)
  - Initial screen preference
  - Audio click volume control
  - First-time setup wizard

- **📱 Share Feature**: Share the app with others to spread Islamic knowledge

## 🛠️ Tech Stack

- **Framework**: React Native 0.81 with Expo SDK 54
- **Navigation**: React Navigation 7 (Stack, Drawer, Bottom Tabs)
- **State Management**: Lightweight custom stores backed by AsyncStorage
- **Audio**: expo-audio for adhan, Quran recitation, and click sounds
- **Internationalization**: Custom i18n implementation with JSON translations
- **Storage**: AsyncStorage for user preferences and favorites
- **UI Components**: Custom components with Linear Gradients
- **Fonts**: Cairo (Arabic), System fonts (English)
- **Testing**: Jest with React Native Testing Library

## 📁 Project Structure

```
zikr/
├── src/
│   ├── App.js              # Root component and boot sequence
│   ├── components/         # Reusable UI components
│   ├── constants/          # Themes, colors, Azkar data, prayer constants
│   ├── hooks/              # Shared React hooks
│   ├── locales/            # Custom i18n (ar/en JSON + utilities)
│   ├── navigation/         # Stack + drawer navigation
│   ├── screens/            # App screens (Azkar, Tasbih, Quran, Prayer, ...)
│   ├── utils/              # Services: audio, notifications, prayer times, stores
│   ├── widgets/            # Home-screen widget code
│   └── __tests__/          # Component/screen/hook tests
├── assets/                 # Images, fonts, sounds, Quran data
├── modules/                # Local Expo native modules
├── plugins/                # Expo config plugins
├── targets/                # iOS widget target
├── __mocks__/              # Jest mocks for native deps
└── app.config.js           # Expo app config (permissions, plugins, version)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- Yarn 3.6.4 (Berry) — committed in `.yarn/`; do not use npm
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/valabji/Zikr.git
   cd Zikr
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

3. **Start the development server:**
   ```bash
   yarn start
   ```

4. **Run on specific platforms:**
   ```bash
   # iOS (requires macOS and Xcode)
   yarn ios
   
   # Android (requires Android Studio/SDK — deletes and regenerates android/)
   yarn android
   
   # Web browser
   yarn web
   ```

### Building for Production

1. **Configure EAS Build:**

> [!TIP]
> incase you don't have different values for production and testing environments when asked just press a for all then Enter

   ```bash
   yarn eas login
   yarn eas:secret --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
   yarn eas:secret --name GOOGLE_SERVICES_PLIST --type file --value ./GoogleService-Info.plist
   yarn eas:secret --name ADMOB_APPID --type string --value ca-app-pub-EXAMPLEADMOBID~00999
   # Note: Replace the above with your actual AdMob App ID
   ```

2. **Build for Android:**
   ```bash
   yarn eas build --profile production --platform android
   ```

3. **Build for iOS:**
   ```bash
   yarn eas build --profile production --platform ios
   ```

## 📱 App Screens

### 🏠 Main Navigation
- **Drawer Navigation**: Easy access to all app sections
- **Favorites**: Quick access to marked prayers
- **All Azkar**: Browse all prayer categories
- **Tasbih**: Digital prayer beads counter
- **Settings**: Customize app preferences

### 🔧 Features Overview

1. **Prayer Categories**: Browse organized Islamic supplications
2. **Individual Prayer View**: Read prayers with references and descriptions
3. **Counter System**: Track prayer repetitions with audio feedback
4. **Bilingual Interface**: Seamless Arabic/English switching
5. **Persistence**: Favorites and settings saved locally

## 🧪 Testing

The app includes comprehensive test coverage:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate coverage report
yarn test:coverage

# Update snapshots
yarn test:update
```

## 🌐 Localization

The app supports full localization with:
- Arabic (العربية) - Default, RTL layout
- English - LTR layout
- Automatic layout direction switching
- Context-aware translations

## 📦 Build Configuration

- **Bundle ID**: `com.valabji.zikr`
- **Version**: 1.1.2
- **Target Platforms**: iOS 11+, Android 21+
- **Google Services**: Firebase Analytics integration
- **AdMob**: Monetization ready (currently disabled)

## 🤝 Contributing

We welcome contributions to make Zikr better for the Muslim community:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📋 Contribution Guidelines

- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure Arabic/English translations are included
- Test on both iOS and Android platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Islamic Content**: All prayers and supplications are sourced from authentic Islamic texts
- **Community**: Thanks to the Muslim developer community for feedback and support
- **Open Source**: Built with love using React Native and Expo

## 📞 Contact & Support

**Developer**: Valabji  
**Email**: valabji@gmail.com  
**Twitter**: [@valabji](https://twitter.com/valabji)  
**GitHub**: [https://github.com/valabji/Zikr](https://github.com/valabji/Zikr)

For support, feature requests, or bug reports, please open an issue on GitHub.

---

<div align="center">

**Made with ❤️ for the Muslim Ummah**

*"And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose."* - Quran 65:3

[📱 Download on Google Play](https://play.google.com/store/apps/details?id=com.valabji.zikr)

</div>
