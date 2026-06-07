import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { RECITERS } from '../constants/QuranReciters';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import QcfDownloader from '../utils/QcfDownloader';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const FONT_SCALES = [
  { id: 0.85, labelAr: 'صغير', labelEn: 'Small' },
  { id: 1.0, labelAr: 'متوسط', labelEn: 'Medium' },
  { id: 1.2, labelAr: 'كبير', labelEn: 'Large' },
  { id: 1.5, labelAr: 'كبير جداً', labelEn: 'X-Large' },
];

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

function Choice({ active, label, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        marginTop: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.accent + '44',
        backgroundColor: active ? colors.accent + '22' : 'transparent',
      }}
    >
      <Text style={[textStyles.base, { color: active ? colors.accent : colors.text, fontSize: 14 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function QuranSettingsModal({ visible, onClose }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [settings, setLocal] = React.useState(null);
  const [qcfStatus, setQcfStatus] = React.useState({ installed: false, downloading: false, progress: 0 });

  React.useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    loadQuranSettings().then((s) => {
      if (!cancelled) setLocal(s);
    });
    const unsub = subscribeQuranSettings((s) => setLocal(s));
    const unsubQcf = QcfDownloader.subscribe((st) => setQcfStatus(st));
    return () => { cancelled = true; unsub(); unsubQcf(); };
  }, [visible]);

  const update = (partial) => {
    setQuranSettings(partial);
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
            {t('quran.settingsTitle')}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView>
          <Row label={t('quran.showTranslation')} colors={colors}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, flex: 1 }]}>
                {t('quran.showTranslationDesc')}
              </Text>
              <Switch
                value={settings.showTranslation}
                onValueChange={(v) => update({ showTranslation: v })}
                trackColor={{ true: colors.accent, false: colors.accent + '44' }}
                thumbColor={settings.showTranslation ? colors.accent : '#f4f3f4'}
              />
            </View>
          </Row>

          <Row label={t('quran.fontSize')} colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {FONT_SCALES.map((f) => (
                <Choice
                  key={f.id}
                  colors={colors}
                  label={lang === 'ar' ? f.labelAr : f.labelEn}
                  active={settings.fontScale === f.id}
                  onPress={() => update({ fontScale: f.id })}
                />
              ))}
            </View>
          </Row>

          <Row label={t('quran.reciter')} colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {RECITERS.map((r) => (
                <Choice
                  key={r.id}
                  colors={colors}
                  label={lang === 'ar' ? r.nameAr : r.nameEn}
                  active={(settings.reciterId || RECITERS[0].id) === r.id}
                  onPress={() => update({ reciterId: r.id })}
                />
              ))}
            </View>
          </Row>

          <Row label={t('quran.highFidelity')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 10 }]}>
              {t('quran.highFidelityDesc')}
            </Text>
            {qcfStatus.installed ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="check-circle" size={18} color={colors.accent} />
                <Text style={[textStyles.base, { color: colors.accent, marginLeft: 8 }]}>
                  {t('quran.highFidelityInstalled')}
                </Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={async () => { await QcfDownloader.uninstall(); update({ useQcf: false }); }}
                  style={{
                    paddingVertical: 6, paddingHorizontal: 10,
                    borderRadius: 6, borderWidth: 1, borderColor: colors.accent + '44',
                  }}
                >
                  <Text style={[textStyles.base, { color: colors.text, fontSize: 13 }]}>{t('quran.remove')}</Text>
                </TouchableOpacity>
              </View>
            ) : qcfStatus.downloading ? (
              <View>
                <Text style={[textStyles.base, { color: colors.text }]}>
                  {Math.round(qcfStatus.progress * 100)}%
                </Text>
                <View style={{ height: 6, marginTop: 6, backgroundColor: colors.accent + '22', borderRadius: 3 }}>
                  <View style={{
                    height: 6, width: `${Math.round(qcfStatus.progress * 100)}%`,
                    backgroundColor: colors.accent, borderRadius: 3,
                  }} />
                </View>
                <TouchableOpacity onPress={() => QcfDownloader.cancel()} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                  <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => QcfDownloader.start().then(() => update({ useQcf: true })).catch(() => {})}
                style={{
                  paddingVertical: 10, paddingHorizontal: 16,
                  borderRadius: 8, backgroundColor: colors.accent,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={[textStyles.subtitle, { color: colors.primaryDark }]}>
                  {t('quran.download')}
                </Text>
              </TouchableOpacity>
            )}
          </Row>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
