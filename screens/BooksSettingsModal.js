import * as React from 'react';
import { ScrollView } from 'react-native';
import { t } from '../locales/i18n';
import { FONT_SCALE_RANGE } from '../constants/BooksConstants';
import { loadBooksSettings, setBooksSettings, subscribeBooksSettings } from '../utils/BooksSettings';
import {
  SettingsModalShell,
  SettingsSection,
  SettingsRow,
  SettingsSlider,
  SettingsToggle,
} from '../components/settings';
import { SPACING } from '../constants/settingsTokens';

export default function BooksSettingsModal({ visible, onClose }) {
  const [settings, setLocal] = React.useState(null);

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

  const fontScale = settings.fontScale ?? FONT_SCALE_RANGE.default;

  return (
    <SettingsModalShell visible={visible} onClose={onClose} title={t('books.settingsTitle')}>
      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
        <SettingsSection title={t('books.fontSize')}>
          <SettingsSlider
            value={fontScale}
            min={FONT_SCALE_RANGE.min}
            max={FONT_SCALE_RANGE.max}
            step={FONT_SCALE_RANGE.step}
            onSlidingComplete={(v) => update({ fontScale: Number(v.toFixed(2)) })}
            format={(v) => `${v.toFixed(2)}×`}
          />
        </SettingsSection>

        <SettingsSection title={t('books.showTranslation')} footnote={t('books.showTranslationDesc')}>
          <SettingsRow
            label={t('books.showTranslation')}
            trailing={
              <SettingsToggle
                value={!!settings.showTranslation}
                onValueChange={(v) => update({ showTranslation: v })}
              />
            }
          />
        </SettingsSection>
      </ScrollView>
    </SettingsModalShell>
  );
}
