import * as React from 'react';
import { View, Text, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CHeader from '@/components/CHeader';
import { useColors } from '@/constants/Colors';
import { textStyles, FONT_FAMILY } from '@/constants/Fonts';
import { useRTL } from '@/hooks/useRTL';
import { t, isRTL, arabicContentStyle, toArabicDigits } from '@/locales/i18n';
import { getLastRead } from '@/utils/BooksLibrary';
import { SUNNAH_URL, DATA_REPO_URL, INCOMPLETE_SOURCE } from '@/constants/BooksConstants';
import { SettingsContainer, SettingsSection, SettingsRow, SettingsButton, SettingsCallout } from '@/components/settings';
import { SPACING, RADIUS, withAlpha } from '@/constants/settingsTokens';


export default function BookInfoScreen({ book, dlState, navigation, onBack, onRead, onDownload, onCancel, onRemove }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);
  const [lastIndex, setLastIndex] = React.useState(0);

  React.useEffect(() => {
    if (!book) return;
    getLastRead(book.id).then(setLastIndex);
  }, [book?.id]);

  if (!book) return null;

  const name = lang === 'ar' ? book.nameAr : book.nameEn;
  const author = lang === 'ar' ? book.authorAr : book.authorEn;
  const desc = lang === 'ar' ? book.descAr : book.descEn;
  const st = dlState || {};
  const ready = book.bundled || !!st.installed;
  const downloading = !!st.downloading;
  const failed = !!st.error;

  const openUrl = (url) => {
    Linking.openURL(url).catch(() => Alert.alert(t('about.error'), t('about.linkError')));
  };

  let primaryLabel, primaryIcon, primaryVariant, primaryOnPress;
  if (ready) {
    primaryLabel = lastIndex > 0 ? t('books.continue') : t('books.read');
    primaryIcon = 'book-open';
    primaryVariant = 'primary';
    primaryOnPress = onRead;
  } else if (downloading) {
    primaryLabel = `${t('books.cancel')} · ${fmtNum(Math.round((st.progress || 0) * 100))}%`;
    primaryIcon = 'x';
    primaryVariant = 'outline';
    primaryOnPress = onCancel;
  } else if (failed) {
    primaryLabel = t('books.downloadRetry');
    primaryIcon = 'rotate-ccw';
    primaryVariant = 'primary';
    primaryOnPress = onDownload;
  } else {
    primaryLabel = `${t('books.download')} · ${fmtNum(book.sizeMB)} MB`;
    primaryIcon = 'download';
    primaryVariant = 'primary';
    primaryOnPress = onDownload;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="book-info">
      <CHeader title={name} navigation={navigation} onBackPress={onBack} />
      <SettingsContainer>
        <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
          <View style={{
            width: 84, height: 84, borderRadius: RADIUS.card,
            backgroundColor: withAlpha(colors.accent, 'hairline'),
            justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
          }}>
            <Feather name="book" size={38} color={colors.accent} />
          </View>
          <Text style={[textStyles.header, { color: colors.text, textAlign: 'center' }, lang === 'ar' ? arabicContentStyle() : null]}>
            {name}
          </Text>
          {author ? (
            <Text style={[textStyles.bodySmall, { color: colors.textSecondary, marginTop: SPACING.xs, textAlign: 'center' }, lang === 'ar' ? arabicContentStyle() : null]}>
              {author}
            </Text>
          ) : null}
          <Text style={[textStyles.caption, { color: colors.accent, marginTop: SPACING.xs }]}>
            {t('books.entryCount', { count: fmtNum(book.count) })}
          </Text>
        </View>

        <SettingsButton
          testID="book-info-primary"
          label={primaryLabel}
          icon={primaryIcon}
          variant={primaryVariant}
          fullWidth
          onPress={primaryOnPress}
          style={{ marginBottom: SPACING.md }}
        />

        {downloading ? (
          <View style={{ height: 4, borderRadius: 2, backgroundColor: withAlpha(colors.accent, 'hairline'), marginBottom: SPACING.xl, overflow: 'hidden' }}>
            <View style={{ height: 4, width: `${Math.round((st.progress || 0) * 100)}%`, backgroundColor: colors.accent }} />
          </View>
        ) : null}

        {INCOMPLETE_SOURCE.has(book.id) ? (
          <View style={{ marginBottom: SPACING.xl }}>
            <SettingsCallout
              testID="book-info-incomplete"
              tone="warning"
              title={t('books.incompleteTitle')}
              body={t('books.incompleteBody', { count: fmtNum(book.count) })}
            />
          </View>
        ) : null}

        {desc ? (
          <SettingsSection title={t('books.about')}>
            <View style={{ padding: SPACING.lg }}>
              <Text style={[
                { color: colors.text, fontFamily: FONT_FAMILY, fontSize: 15, lineHeight: 26 },
                lang === 'ar' ? arabicContentStyle() : { textAlign: getTextAlign('left') },
              ]}>
                {desc}
              </Text>
            </View>
          </SettingsSection>
        ) : null}

        <SettingsSection title={t('books.details')}>
          {author ? <SettingsRow label={t('books.author')} value={author} /> : null}
          <SettingsRow label={t('books.entriesLabel')} value={fmtNum(book.count)} />
          {!book.bundled ? <SettingsRow label={t('books.size')} value={`${fmtNum(book.sizeMB)} MB`} /> : null}
        </SettingsSection>

        <SettingsSection title={t('books.source')}>
          <SettingsRow
            testID="book-info-sunnah"
            icon="book-open"
            label={t('books.readOnSunnah')}
            trailing={<Feather name="external-link" size={18} color={colors.accent} />}
            onPress={() => openUrl(SUNNAH_URL + book.sunnah)}
          />
          <SettingsRow
            testID="book-info-datasource"
            icon="database"
            label={t('books.dataSource')}
            description={t('books.dataSourceDesc')}
            trailing={<Feather name="external-link" size={18} color={colors.accent} />}
            onPress={() => openUrl(DATA_REPO_URL)}
          />
        </SettingsSection>

        {ready && !book.bundled ? (
          <SettingsButton
            testID="book-info-remove"
            label={t('books.remove')}
            icon="trash-2"
            variant="destructive"
            fullWidth
            onPress={onRemove}
          />
        ) : null}
      </SettingsContainer>
    </View>
  );
}
