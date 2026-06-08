import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, Platform, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { RECITERS } from '../constants/QuranReciters';
import { MUSHAF_EDITIONS, DEFAULT_MUSHAF_EDITION, AYAH_INTERACTION_MODES, AUDIO_PLAYBACK_SCOPES, VIEW_MODES, FONT_SCALE_RANGE } from '../constants/QuranConstants';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import QcfDownloader from '../utils/QcfDownloader';

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

function HdRow({ version, sizeLabel, labelKey, status, colors }) {
  const installed = !!(status && status.installed);
  const downloading = !!(status && status.downloading);
  const pct = Math.round(((status && status.progress) || 0) * 100);

  return (
    <View style={{
      borderWidth: 1,
      borderColor: colors.accent + '33',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={[textStyles.subtitle, { color: colors.text, fontSize: 14, flex: 1 }]}>
          {t(labelKey)}
        </Text>
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12 }]}>{sizeLabel}</Text>
      </View>
      {installed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="check-circle" size={16} color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.accent, marginLeft: 6, fontSize: 13 }]}>
            {t('quran.highFidelityInstalled')}
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => QcfDownloader.uninstall(version)}
            style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: colors.accent + '44' }}
          >
            <Text style={[textStyles.base, { color: colors.text, fontSize: 12 }]}>{t('quran.remove')}</Text>
          </TouchableOpacity>
        </View>
      ) : downloading ? (
        <View>
          <Text style={[textStyles.base, { color: colors.text, fontSize: 13 }]}>{pct}%</Text>
          <View style={{ height: 5, marginTop: 4, backgroundColor: colors.accent + '22', borderRadius: 3 }}>
            <View style={{ height: 5, width: `${pct}%`, backgroundColor: colors.accent, borderRadius: 3 }} />
          </View>
          <TouchableOpacity onPress={() => QcfDownloader.cancel(version)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={[textStyles.base, { color: colors.accent, fontSize: 13 }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => QcfDownloader.start(version).catch(() => {})}
          style={{
            paddingVertical: 8, paddingHorizontal: 14,
            borderRadius: 6, backgroundColor: colors.accent,
            alignSelf: 'flex-start',
          }}
        >
          <Text style={[textStyles.subtitle, { color: colors.primaryDark, fontSize: 13 }]}>
            {t('quran.download')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function QuranSettingsModal({ visible, onClose }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [settings, setLocal] = React.useState(null);
  const [fontScaleDraft, setFontScaleDraft] = React.useState(null);
  const [qcfStatus, setQcfStatus] = React.useState({
    v1: { installed: false, downloading: false, progress: 0 },
    v2: { installed: false, downloading: false, progress: 0 },
  });

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
          <Row label={t('quran.viewMode')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
              {t('quran.viewModeDesc')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Choice
                colors={colors}
                label={t('quran.viewModePaged')}
                active={(settings.viewMode || 'paged') === VIEW_MODES.PAGED}
                onPress={() => update({ viewMode: VIEW_MODES.PAGED })}
              />
              <Choice
                colors={colors}
                label={t('quran.viewModeContinuous')}
                active={(settings.viewMode || 'paged') === VIEW_MODES.CONTINUOUS}
                onPress={() => update({ viewMode: VIEW_MODES.CONTINUOUS })}
              />
            </View>
          </Row>

          <Row label={t('quran.mushafEdition')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
              {t('quran.mushafEditionDesc')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {MUSHAF_EDITIONS.map((m) => (
                <Choice
                  key={m.id}
                  colors={colors}
                  label={`${m.year} ${lang === 'ar' ? 'هـ' : 'H'}`}
                  active={(settings.mushafEdition || DEFAULT_MUSHAF_EDITION) === m.id}
                  onPress={() => update({ mushafEdition: m.id })}
                />
              ))}
            </View>
            {(settings.mushafEdition || DEFAULT_MUSHAF_EDITION) === 'v2-1441' ? (
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 8, fontStyle: 'italic' }]}>
                {t('quran.mushaf1441Note')}
              </Text>
            ) : null}
          </Row>

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
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: colors.accent + '22',
            }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[textStyles.subtitle, { color: colors.text, fontSize: 14 }]}>
                  {t('quran.customLineSize')}
                </Text>
                <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>
                  {t('quran.customLineSizeDesc')}
                </Text>
              </View>
              <Switch
                value={!!settings.customLineSize}
                onValueChange={(v) => update({ customLineSize: v })}
                trackColor={{ true: colors.accent, false: colors.accent + '44' }}
                thumbColor={settings.customLineSize ? colors.accent : '#f4f3f4'}
              />
            </View>
          </Row>

          <Row label={t('quran.ayahInteraction')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
              {t('quran.ayahInteractionDesc')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Choice
                colors={colors}
                label={t('quran.ayahInteractionMenu')}
                active={(settings.ayahInteractionMode || 'menu') === AYAH_INTERACTION_MODES.MENU}
                onPress={() => update({ ayahInteractionMode: AYAH_INTERACTION_MODES.MENU })}
              />
              <Choice
                colors={colors}
                label={t('quran.ayahInteractionDirect')}
                active={(settings.ayahInteractionMode || 'menu') === AYAH_INTERACTION_MODES.DIRECT}
                onPress={() => update({ ayahInteractionMode: AYAH_INTERACTION_MODES.DIRECT })}
              />
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

          <Row label={t('quran.audioScope')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 8 }]}>
              {t('quran.audioScopeDesc')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Choice
                colors={colors}
                label={t('quran.audioScopeAyah')}
                active={(settings.audioPlaybackScope || 'ayah') === AUDIO_PLAYBACK_SCOPES.AYAH}
                onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.AYAH })}
              />
              <Choice
                colors={colors}
                label={t('quran.audioScopePage')}
                active={(settings.audioPlaybackScope || 'ayah') === AUDIO_PLAYBACK_SCOPES.PAGE}
                onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.PAGE })}
              />
              <Choice
                colors={colors}
                label={t('quran.audioScopeSurah')}
                active={(settings.audioPlaybackScope || 'ayah') === AUDIO_PLAYBACK_SCOPES.SURAH}
                onPress={() => update({ audioPlaybackScope: AUDIO_PLAYBACK_SCOPES.SURAH })}
              />
            </View>
          </Row>

          <Row label={t('quran.highFidelity')} colors={colors}>
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 10 }]}>
              {t('quran.highFidelityDesc')}
            </Text>
            <HdRow version="v1" sizeLabel="~95 MB" labelKey="quran.hd1405" status={qcfStatus.v1} colors={colors} />
            <View style={{ height: 10 }} />
            <HdRow version="v2" sizeLabel="~208 MB" labelKey="quran.hd1421" status={qcfStatus.v2} colors={colors} />
          </Row>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
