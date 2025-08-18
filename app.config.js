export default {
  expo: {
    name: "Zikr",
    slug: "Zikr",
    privacy: "public",
    platforms: ["ios", "android", "web"],
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.valabji.zikr",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST,
      supportsTablet: true,
      config: {
        googleMobileAdsAppId: process.env.ADMOB_APPID
      }
    },
    android: {
      package: "com.valabji.zikr",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      versionCode: 5,
      permissions: ["com.google.android.gms.permission.AD_ID"],
      config: {
        googleMobileAdsAppId: process.env.ADMOB_APPID
      }
    },
    description: "",
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    },
    plugins: [
      "expo-audio",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ]
    ]
  }
};