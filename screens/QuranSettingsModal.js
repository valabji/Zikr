import * as React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { useRTL } from '../hooks/useRTL';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import { DEFAULT_RECITER_ID } from '../constants/QuranReciters';
import { MUSHAF_EDITIONS, DEFAULT_MUSHAF_EDITION, AYAH_INTERACTION_MODES, AUDIO_PLAYBACK_SCOPES, VIEW_MODES, FONT_SCALE_RANGE, DEFAULT_TAFSIR_ID, PLAYBACK_RATES } from '../constants/QuranConstants';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '../utils/QuranSettings';
import QcfDownloader from '../utils/QcfDownloader';
import QuranReciterPicker from '../components/QuranReciterPicker';
import TafsirDropdown from '../components/TafsirDropdown';
import {
  SettingsModalShell,
  SettingsSection,
  SettingsField,
  SettingsRow,
  SettingsSegmented,
  SettingsSelect,
  SettingsToggle,
  SettingsSlider,
  SettingsButton,
} from '../components/settings';
import { SPACING, RADIUS, withAlpha } from '../constants/settingsTokens';

function HdRow({ version, sizeLabel, labelKey, status, colors }) {
  const { getDirectionalMixedSpacing } = useRTL();
  const installed = !!(status && status.installed);
  const downloading = !!(status && status.downloading);
  const pct = Math.round(((status && status.progress) || 0) * 100);

  return (
    <View style={{
      borderWidth: 1,
      borderColor: withAlpha(colors.accent, 'border'),
      borderRadius: RADIUS.control,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
    }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm }]}>
        <Text style={[textStyles.subtitle, { color: colors.text, flex: 1 }]}>
          {t(labelKey)}
        </Text>
        <Text style={[textStyles.base, { color: colors.textSecondary }]}>{sizeLabel}</Text>
      </View>
      {installed ? (
        <View style={[{ flexDirection: 'row', alignItems: 'center' }]}>
          <Feather name="check-circle" size={16} color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.accent }, getDirectionalMixedSpacing({ marginLeft: SPACING.sm })]}>
            {t('quran.highFidelityInstalled')}
          </Text>
          <View style={{ flex: 1 }} />
          <SettingsButton
            variant="outline"
            label={t('quran.remove')}
            onPress={() => QcfDownloader.uninstall(version)}
          />
        </View>
      ) : downloading ? (
        <View>
          <Text style={[textStyles.base, { color: colors.text }]}>{pct}%</Text>
          <View style={{ height: 5, marginTop: SPACING.xs, backgroundColor: withAlpha(colors.accent, 'activeRow'), borderRadius: RADIUS.pill }}>
            <View style={{ height: 5, width: `${pct}%`, backgroundColor: colors.accent, borderRadius: RADIUS.pill }} />
          </View>
          <SettingsButton
            variant="text"
            label={t('common.cancel')}
            onPress={() => QcfDownloader.cancel(version)}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      ) : (
        <SettingsButton
          variant="primary"
          label={t('quran.download')}
          onPress={() => QcfDownloader.start(version).catch(() => {})}
        />
      )}
    </View>
  );
}

export default function QuranSettingsModal({ visible, onClose }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [settings, setLocal] = React.useState(null);
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

  const viewMode = settings.viewMode || 'paged';
  const editionLabel = lang === 'ar' ? 'هـ' : 'H';

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title={t('quran.settingsTitle')}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <SettingsSection title={t('quran.viewMode')} description={t('quran.viewModeDesc')}>
          <SettingsField>
            <SettingsSegmented
              value={viewMode}
              options={[
                { id: VIEW_MODES.PAGED, label: t('quran.viewModePaged') },
                { id: VIEW_MODES.CONTINUOUS, label: t('quran.viewModeContinuous') },
              ]}
              onChange={(id) => update({ viewMode: id })}
            />
          </SettingsField>
          {viewMode === VIEW_MODES.PAGED ? (
            <SettingsRow
              label={t('quran.landscapeTwoPage')}
              description={t('quran.landscapeTwoPageDesc')}
              trailing={
                <SettingsToggle
                  value={settings.landscapeTwoPage !== false}
                  onValueChange={(v) => update({ landscapeTwoPage: v })}
                />
              }
            />
          ) : null}
          {viewMode === VIEW_MODES.PAGED ? (
            <SettingsRow
              label={t('quran.fitPageToHeight')}
              description={t('quran.fitPageToHeightDesc')}
              trailing={
                <SettingsToggle
                  value={settings.fitPageToHeight !== false}
                  onValueChange={(v) => update({ fitPageToHeight: v })}
                />
              }
            />
          ) : null}
        </SettingsSection>

        <SettingsSection
          title={t('quran.mushafEdition')}
          description={t('quran.mushafEditionDesc')}
          footnote={(settings.mushafEdition || DEFAULT_MUSHAF_EDITION) === 'v2-1441' ? t('quran.mushaf1441Note') : undefined}
        >
          <SettingsField>
            <SettingsSegmented
              value={settings.mushafEdition || DEFAULT_MUSHAF_EDITION}
              options={MUSHAF_EDITIONS.map((m) => ({ id: m.id, label: `${m.year} ${editionLabel}` }))}
              onChange={(id) => update({ mushafEdition: id })}
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection title={t('quran.tafsirSelection')}>
          <SettingsRow
            label={t('quran.showTranslation')}
            description={t('quran.showTranslationDesc')}
            trailing={
              <SettingsToggle
                value={settings.showTranslation}
                onValueChange={(v) => update({ showTranslation: v })}
              />
            }
          />
          <SettingsRow
            label={t('quran.wordTooltip')}
            description={t('quran.wordTooltipDesc')}
            trailing={
              <SettingsToggle
                value={!!settings.showWBW}
                onValueChange={(v) => update({ showWBW: v })}
              />
            }
          />
          <SettingsField label={t('quran.tafsirSelection')} description={t('quran.tafsirSelectionDesc')}>
            <TafsirDropdown
              tafsirId={settings.tafsirId || DEFAULT_TAFSIR_ID}
              onChange={(id) => update({ tafsirId: id })}
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection title={t('quran.fontSize')}>
          <SettingsField>
            <SettingsSlider
              value={settings.fontScale ?? FONT_SCALE_RANGE.default}
              min={FONT_SCALE_RANGE.min}
              max={FONT_SCALE_RANGE.max}
              step={FONT_SCALE_RANGE.step}
              onSlidingComplete={(v) => update({ fontScale: Number(v.toFixed(2)) })}
              format={(v) => `${v.toFixed(2)}×`}
            />
          </SettingsField>
          <SettingsRow
            label={t('quran.customLineSize')}
            description={t('quran.customLineSizeDesc')}
            trailing={
              <SettingsToggle
                value={!!settings.customLineSize}
                onValueChange={(v) => update({ customLineSize: v })}
              />
            }
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsSelect
            value={settings.ayahInteractionMode || 'menu'}
            options={[
              { id: AYAH_INTERACTION_MODES.MENU, label: t('quran.ayahInteractionMenu') },
              { id: AYAH_INTERACTION_MODES.DIRECT, label: t('quran.ayahInteractionDirect') },
            ]}
            onChange={(id) => update({ ayahInteractionMode: id })}
            label={t('quran.ayahInteraction')}
            description={t('quran.ayahInteractionDesc')}
            title={t('quran.ayahInteraction')}
          />
        </SettingsSection>

        <SettingsSection title={t('quran.reciter')}>
          <SettingsField label={t('quran.reciter')}>
            <QuranReciterPicker
              colors={colors}
              reciterId={settings.reciterId || DEFAULT_RECITER_ID}
              onChange={(id) => update({ reciterId: id })}
            />
          </SettingsField>
          <SettingsSelect
            value={settings.audioPlaybackScope || 'ayah'}
            options={[
              { id: AUDIO_PLAYBACK_SCOPES.AYAH, label: t('quran.audioScopeAyah') },
              { id: AUDIO_PLAYBACK_SCOPES.PAGE, label: t('quran.audioScopePage') },
              { id: AUDIO_PLAYBACK_SCOPES.SURAH, label: t('quran.audioScopeSurah') },
              { id: AUDIO_PLAYBACK_SCOPES.MUSHAF, label: t('quran.audioScopeMushaf') },
            ]}
            onChange={(id) => update({ audioPlaybackScope: id })}
            label={t('quran.audioScope')}
            description={t('quran.audioScopeDesc')}
            title={t('quran.audioScope')}
          />
          <SettingsField label={t('quran.playbackSpeed')}>
            <SettingsSegmented
              value={settings.playbackRate || 1.0}
              options={PLAYBACK_RATES.map((rate) => ({ id: rate, label: `${rate}x` }))}
              onChange={(rate) => update({ playbackRate: rate })}
            />
          </SettingsField>
        </SettingsSection>

        <SettingsSection title={t('quran.highFidelity')} description={t('quran.highFidelityDesc')}>
          <SettingsField>
            <HdRow version="v1" sizeLabel="~95 MB" labelKey="quran.hd1405" status={qcfStatus.v1} colors={colors} />
            <View style={{ height: SPACING.md }} />
            <HdRow version="v2" sizeLabel="~208 MB" labelKey="quran.hd1421" status={qcfStatus.v2} colors={colors} />
          </SettingsField>
        </SettingsSection>
      </ScrollView>
    </SettingsModalShell>
  );
}
