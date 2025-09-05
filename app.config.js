export default {
  expo: {
    name: "Zikr",
    slug: "Zikr",
    privacy: "public",
    platforms: ["ios", "android", "web"],
    version: "1.1.3",
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
      versionCode: 6,
      permissions: [
        // Location permissions - needed for prayer times and Qibla direction
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        
        // Network permissions - needed for Firebase, updates, and web functionality
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        
        // Ad-related permissions - needed for AdMob functionality
        "com.google.android.gms.permission.AD_ID",
        "android.permission.ACCESS_ADSERVICES_AD_ID",
        "android.permission.ACCESS_ADSERVICES_ATTRIBUTION",
        "com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE",
        
        // Device permissions - useful for user feedback and background tasks
        "android.permission.VIBRATE",
        "android.permission.WAKE_LOCK",
        
        // App-specific permission
        "com.valabji.zikr.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
      ],
      blockedPermissions: [
        // Audio permissions - not needed (app only plays simple sounds)
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        
        // Storage permissions - not needed (app uses internal storage only)
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        
        // Development/debug permissions - not needed in production
        "android.permission.SYSTEM_ALERT_WINDOW",
        
        // Sensor permission - not needed (magnetometer works without this)
        "android.permission.ACTIVITY_RECOGNITION"
      ],
      config: {
        googleMobileAdsAppId: process.env.ADMOB_APPID
      }
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/icon.png",
      output: "single",
      config: {},
      meta: {
        viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
        themeColor: "#000000"
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
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#ffffff",
          "image": "./assets/images/splash.png",
          "dark": {
            "image": "./assets/images/splash.png",
            "backgroundColor": "#ffffff"
          },
          "resizeMode": "contain",
          "imageWidth": 200
        }]
    ]
  }
};