import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Share, Platform } from 'react-native';

export async function shareViewAsImage(viewRef, fallbackMessage) {
  try {
    const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
    if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
      return true;
    }
  } catch (e) {
    // fall through to text share below
  }
  if (fallbackMessage) {
    await Share.share({ message: fallbackMessage });
  }
  return false;
}
