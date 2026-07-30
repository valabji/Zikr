import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Share } from 'react-native';
import { shareViewAsImage } from '../ShareImage';

describe('shareViewAsImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures the view and shares it as an image when sharing is available', async () => {
    captureRef.mockResolvedValueOnce('file:///mock/card.png');
    Sharing.isAvailableAsync.mockResolvedValueOnce(true);

    const ref = { current: {} };
    const result = await shareViewAsImage(ref, 'fallback text');

    expect(captureRef).toHaveBeenCalledWith(ref, { format: 'png', quality: 1 });
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///mock/card.png', { mimeType: 'image/png', UTI: 'public.png' });
    expect(Share.share).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('falls back to text share when sharing is unavailable', async () => {
    captureRef.mockResolvedValueOnce('file:///mock/card.png');
    Sharing.isAvailableAsync.mockResolvedValueOnce(false);

    const ref = { current: {} };
    const result = await shareViewAsImage(ref, 'fallback text');

    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    expect(Share.share).toHaveBeenCalledWith({ message: 'fallback text' });
    expect(result).toBe(false);
  });

  it('falls back to text share when capture throws', async () => {
    captureRef.mockRejectedValueOnce(new Error('capture failed'));

    const ref = { current: {} };
    const result = await shareViewAsImage(ref, 'fallback text');

    expect(Share.share).toHaveBeenCalledWith({ message: 'fallback text' });
    expect(result).toBe(false);
  });

  it('does not call Share.share when no fallback message is given and capture fails', async () => {
    captureRef.mockRejectedValueOnce(new Error('capture failed'));

    const ref = { current: {} };
    const result = await shareViewAsImage(ref);

    expect(Share.share).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
