import * as React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import { loadResourcesAndDataAsync } from './utils/load';
import { AppContainer } from './navigation/Main';
import { ThemeProvider } from './constants/ThemeProvider';
import { useTheme } from './constants/Colors';
import RTLStyleLoader from './components/RTLStyleLoader';

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
