import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t } from '../locales/i18n';
import { FONT_SCALE_RANGE } from '../constants/BooksConstants';
import { loadBooksSettings, setBooksSettings, subscribeBooksSettings } from '../utils/BooksSettings';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

function Row({ label, children, colors }) {
  return (
    <View style={{
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent + '22',
    }}>
      <Text style={[textStyles.subtitle, { color: colors.text, marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function BooksSettingsModal({ visible, onClose }) {
  const colors = useColors();
  const [settings, setLocal] = React.useState(null);
  const [fontScaleDraft, setFontScaleDraft] = React.useState(null);

  React.useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    loadBooksSettings().then((s) => {
      if (!cancelled) setLocal(s);
    });
    const unsub = subscribeBooksSettings((s) => setLocal(s));
    return () => { cancelled = true; unsub(); };
  }, [visible]);

  const update = (partial) => {
    setBooksSettings(partial);
  };

  if (!settings) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: ANDROID_STATUS_BAR }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '22',
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Feather name="x" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[textStyles.header, { color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: 8 }]} numberOfLines={1}>
            {t('books.settingsTitle')}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView>
          <Row label={t('books.fontSize')} colors={colors}>
            {(() => {
              const persisted = settings.fontScale ?? FONT_SCALE_RANGE.default;
              const value = fontScaleDraft ?? persisted;
              return (
                <View>
                  <Slider
                    style={{ width: '100%', height: 36 }}
                    minimumValue={FONT_SCALE_RANGE.min}
                    maximumValue={FONT_SCALE_RANGE.max}
                    step={FONT_SCALE_RANGE.step}
                    value={value}
                    onValueChange={setFontScaleDraft}
                    onSlidingComplete={(v) => {
                      setFontScaleDraft(null);
                      update({ fontScale: Number(v.toFixed(2)) });
                    }}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={colors.accent + '44'}
                    thumbTintColor={colors.accent}
                  />
                  <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, textAlign: 'center' }]}>
                    {value.toFixed(2)}×
                  </Text>
                </View>
              );
            })()}
          </Row>

          <Row label={t('books.showTranslation')} colors={colors}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, flex: 1 }]}>
                {t('books.showTranslationDesc')}
              </Text>
              <Switch
                value={!!settings.showTranslation}
                onValueChange={(v) => update({ showTranslation: v })}
                trackColor={{ true: colors.accent, false: colors.accent + '44' }}
                thumbColor={settings.showTranslation ? colors.accent : '#f4f3f4'}
              />
            </View>
          </Row>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
