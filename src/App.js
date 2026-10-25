import * as React from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import { loadResourcesAndDataAsync } from './utils/load';
import { AppContainer } from './navigation/Main';
import { ThemeProvider } from './constants/ThemeProvider';
import { useTheme } from './constants/Colors';
import RTLStyleLoader from './components/RTLStyleLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { recordAppError } from '@/utils/firebase/crashlytics';
import PrayerNotificationScheduler from '@/utils/prayer/PrayerNotificationScheduler';
import NotificationService from '@/utils/notifications/NotificationService';

// Inner component that has access to theme context
function AppContent() {
  const { isThemeLoaded } = useTheme();
  const [isResourcesLoaded, setResourcesLoaded] = React.useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
  });
  
  React.useEffect(() => {
    loadResourcesAndDataAsync()
      .catch((e) => { console.error('Resource load failed:', e); })
      .finally(() => { setResourcesLoaded(true); });
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

  // A failed font load must not leave the app behind the splash indefinitely.
  const fontsReady = fontsLoaded || !!fontError;
  React.useEffect(() => {
    if (fontError) console.warn('Failed to load Cairo font:', fontError);
  }, [fontError]);

  React.useEffect(() => {
    if (!isResourcesLoaded || !isThemeLoaded || !fontsReady) return;
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Error hiding splash screen:', error);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [isResourcesLoaded, isThemeLoaded, fontsReady]);

  if (!isResourcesLoaded || !isThemeLoaded || !fontsReady) {
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
    <ErrorBoundary onError={(error, info) => recordAppError(error, info?.componentStack)}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
