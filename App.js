import * as React from 'react';
import { useFonts, Cairo_400Regular } from '@expo-google-fonts/cairo';
import { loadResourcesAndDataAsync } from './utils/load';
import { AppContainer } from './navigation/Main';


export default function App(props) {
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  let [fontsLoaded] = useFonts({
    Cairo_400Regular,
  });
  React.useEffect(() => {
    loadResourcesAndDataAsync().then(() => {
      setLoadingComplete(true);
    })
  }, []);
  if (!isLoadingComplete && !props.skipLoadingScreen) {
    return null;
  } else {
    return (
      <AppContainer />
    );
  }
}
