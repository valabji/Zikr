import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t } from '../locales/i18n';
import { shareViewAsImage } from '../utils/ShareImage';
import ShareCard from './ShareCard';

export default function ShareCardModal({ visible, content, onClose }) {
  const colors = useColors();
  const cardRef = React.useRef(null);
  const [sharing, setSharing] = React.useState(false);

  if (!visible) return null;

  const handleShare = async () => {
    setSharing(true);
    const fallback = [content?.arabic, content?.quran, content?.translation, content?.reference]
      .filter(Boolean).join('\n\n');
    await shareViewAsImage(cardRef, fallback);
    setSharing(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: colors.overlayBackground, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation && e.stopPropagation()}
          style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        >
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textSecondary + '88' }} />
          </View>
          <Text style={[textStyles.subtitle, { color: colors.text, textAlign: 'center', marginTop: 12, marginBottom: 16 }]}>
            {t('share.preview')}
          </Text>
          <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}>
            <ShareCard ref={cardRef} content={content} />
          </ScrollView>
          <View style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 18, gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.accent + '55' }}
            >
              <Text style={[textStyles.subtitle, { color: colors.textSecondary, fontSize: 15 }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', backgroundColor: colors.accent, opacity: sharing ? 0.7 : 1,
              }}
            >
              {sharing ? (
                <ActivityIndicator color={colors.primaryDark} />
              ) : (
                <>
                  <Feather name="share-2" size={16} color={colors.primaryDark} style={{ marginRight: 8 }} />
                  <Text style={[textStyles.subtitle, { color: colors.primaryDark, fontSize: 15 }]}>
                    {t('share.shareImage')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
