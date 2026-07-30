import React from 'react';
import { View, Modal, Pressable, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useColors } from '../../constants/Colors';
import { RADIUS, shadow } from '../../constants/settingsTokens';
import SettingsModalHeader from './SettingsModalHeader';

const isWeb = Platform.OS === 'web';
const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

export default function SettingsModalShell({
  visible,
  onClose,
  title,
  children,
  footer,
  headerTestID,
  testID,
}) {
  const colors = useColors();

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: colors.overlayBackground,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Pressable
            onPress={() => {}}
            testID={testID}
            style={[{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90%',
              backgroundColor: colors.background,
              borderRadius: RADIUS.modal,
              overflow: 'hidden',
            }, shadow(colors.shadowColor)]}
          >
            <SettingsModalHeader title={title} onClose={onClose} testID={headerTestID} />
            <View style={{ flexShrink: 1 }}>{children}</View>
            {footer}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: ANDROID_STATUS_BAR }} testID={testID}>
        <SettingsModalHeader title={title} onClose={onClose} testID={headerTestID} />
        <View style={{ flex: 1 }}>{children}</View>
        {footer}
      </SafeAreaView>
    </Modal>
  );
}
