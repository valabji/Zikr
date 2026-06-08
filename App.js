import * as React from 'react';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import { loadResourcesAndDataAsync } from './utils/load';
import { AppContainer } from './navigation/Main';
import { ThemeProvider } from './constants/ThemeProvider';
import { useTheme } from './constants/Colors';
import RTLStyleLoader from './components/RTLStyleLoader';
import PrayerNotificationScheduler from './utils/PrayerNotificationScheduler';
import NotificationService from './utils/NotificationService';

// Inner component that has access to theme context
function AppContent() {
  const { isThemeLoaded } = useTheme();
  const [isResourcesLoaded, setResourcesLoaded] = React.useState(false);

  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
  });
  
  React.useEffect(() => {
    loadResourcesAndDataAsync().then(() => {
      setResourcesLoaded(true);
    });
  }, []);

  // Refresh the prayer notification schedule when the app comes back to
  // foreground so the rolling horizon (today + next 2 days) stays ahead.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        PrayerNotificationScheduler.refresh().catch((e) =>
          console.error('Scheduler foreground refresh failed:', e)
        );
        NotificationService.consolidatePrayerAlarms().catch((e) =>
          console.error('Alarm consolidation failed:', e)
        );
      }
    });
    return () => sub.remove();
  }, []);

  // Hide splash screen when both theme and resources are loaded
  React.useEffect(() => {
    const hideSplashScreen = async () => {
      if (isResourcesLoaded && isThemeLoaded && fontsLoaded) {
        // Add a small delay to ensure theme is fully applied
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.warn('Error hiding splash screen:', error);
          }
        }, 100); // Small delay to ensure theme is applied
      }
    };

    hideSplashScreen();
  }, [isResourcesLoaded, isThemeLoaded, fontsLoaded]);
  
  if (!isResourcesLoaded || !isThemeLoaded || !fontsLoaded) {
    return null;
  }

  return (
    <>
      <RTLStyleLoader />
      <AppContainer />
    </>
  );
}

export default function App(props) {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
