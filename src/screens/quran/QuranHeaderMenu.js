import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t } from '@/locales/i18n';
import { useTestedMode } from '@/utils/TestedMode';
import { runMicTest } from '@/utils/quran/MicTest';

const MIC_TEST_LABELS = {
  idle: 'Test mic (3s)',
  recording: 'Recording… speak now',
  playing: 'Playing back…',
  denied: 'Mic permission denied',
  error: 'Mic test failed',
};

function MenuRow({ icon, label, onPress, colors, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: active ? colors.accent : colors.accent + '22',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Feather name={icon} size={18} color={active ? colors.primaryDark : colors.accent} />
      </View>
      <Text style={[textStyles.subtitle, { color: colors.text, marginHorizontal: 14, flex: 1, fontSize: 15 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuranHeaderMenu({ visible, onClose, voiceActive, isBookmarked, onVoiceToggle, onPageInfo, onBookmark, onIndex, onSearch, onSettings }) {
  const colors = useColors();
  const testedMode = useTestedMode();
  const [micTestState, setMicTestState] = React.useState('idle');
  const micBusy = micTestState === 'recording' || micTestState === 'playing';
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
          <SafeAreaView>
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.textSecondary + '88' }} />
            </View>
            <MenuRow
              colors={colors}
              icon={voiceActive ? 'mic-off' : 'mic'}
              label={voiceActive ? t('quran.voiceFollowActive') : t('quran.voiceFollow')}
              active={voiceActive}
              onPress={() => { onVoiceToggle(); onClose(); }}
            />
            <MenuRow
              colors={colors}
              icon="list"
              label={t('quran.pageInfo')}
              onPress={() => { onPageInfo(); onClose(); }}
            />
            <MenuRow
              colors={colors}
              icon="bookmark"
              label={isBookmarked ? t('quran.removeBookmark') : t('quran.bookmark')}
              active={isBookmarked}
              onPress={() => { onBookmark(); onClose(); }}
            />
            <MenuRow
              colors={colors}
              icon="book-open"
              label={t('quran.index')}
              onPress={() => { onIndex(); onClose(); }}
            />
            <MenuRow
              colors={colors}
              icon="search"
              label={t('quran.search')}
              onPress={() => { onSearch(); onClose(); }}
            />
            <MenuRow
              colors={colors}
              icon="settings"
              label={t('quran.settingsTitle')}
              onPress={() => { onSettings(); onClose(); }}
            />
            {testedMode && (
              <MenuRow
                colors={colors}
                icon="radio"
                label={MIC_TEST_LABELS[micTestState] || MIC_TEST_LABELS.idle}
                active={micBusy}
                onPress={() => { if (!micBusy) runMicTest(setMicTestState); }}
              />
            )}
            <TouchableOpacity
              onPress={onClose}
              style={{ paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.accent + '22', marginTop: 4 }}
            >
              <Text style={[textStyles.subtitle, { color: colors.textSecondary, fontSize: 14 }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
