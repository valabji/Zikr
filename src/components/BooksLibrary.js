import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import CustomHeader from '@/components/CustomHeader';
import { useColors, getItemColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, arabicContentStyle, toArabicDigits } from '@/locales/i18n';
import BooksDownloader from '@/utils/BooksDownloader';
import { BOOK_GROUPS } from '@/constants/BooksConstants';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, shadow, webCursor } from '@/constants/settingsTokens';

export default function BooksLibrary({ navigation, catalog, dlState, isReady, continueBook, onOpenBook, onOpenInfo }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);

  const renderContinueCard = () => {
    if (!continueBook) return null;
    const name = lang === 'ar' ? continueBook.nameAr : continueBook.nameEn;
    return (
      <TouchableOpacity
        testID="books-continue"
        onPress={() => onOpenBook(continueBook.id)}
        style={[{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: RADIUS.card,
          padding: SPACING.lg,
          marginBottom: SPACING.xl,
        }, shadow(colors.shadowColor), webCursor]}
      >
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: withAlpha(colors.primary, 'hairline'),
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Feather name="book-open" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginHorizontal: SPACING.md, ...(lang === 'ar' ? { direction: 'rtl' } : null) }}>
          <Text style={[textStyles.caption, { color: colors.primary, opacity: 0.8 }]}>{t('books.continueReading')}</Text>
          <Text numberOfLines={1} style={[textStyles.subtitle, { color: colors.primary, marginTop: 2 }, lang === 'ar' ? arabicContentStyle() : null]}>{name}</Text>
        </View>
        <Feather name={isRTL() ? 'chevron-left' : 'chevron-right'} size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderDownloadAllBanner = () => {
    const downloadable = catalog.filter((b) => !b.bundled);
    if (!downloadable.length) return null;
    const pending = downloadable.filter((b) => !(dlState[b.id] && dlState[b.id].installed));
    if (!pending.length) return null;
    const busy = downloadable.some((b) => dlState[b.id] && dlState[b.id].downloading);
    const installed = downloadable.length - pending.length;
    const totalMB = pending.reduce((sum, b) => sum + (b.sizeMB || 0), 0);
    return (
      <TouchableOpacity
        testID="books-download-all"
        disabled={busy}
        onPress={() => BooksDownloader.startAll(pending)}
        style={[{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          marginBottom: SPACING.xl, paddingVertical: SPACING.md,
          borderRadius: RADIUS.card, backgroundColor: withAlpha(colors.accent, busy ? 'subtle' : 'hairline'),
        }, webCursor]}
      >
        {busy
          ? <ActivityIndicator size="small" color={colors.accent} />
          : <Feather name="download-cloud" size={20} color={colors.accent} />}
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 15, marginHorizontal: SPACING.sm }]}>
          {busy
            ? t('books.downloadingAll', { done: fmtNum(installed), total: fmtNum(downloadable.length) })
            : `${t('books.downloadAll')} · ${fmtNum(Math.round(totalMB))} MB`}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCardBadge = (item, st, ready) => {
    if (st && st.downloading) {
      return <Text style={[textStyles.caption, { color: colors.accent }]}>{fmtNum(Math.round((st.progress || 0) * 100))}%</Text>;
    }
    if (st && st.error) {
      return <Feather name="rotate-ccw" size={16} color={colors.DYellow} />;
    }
    if (!ready) {
      return <Feather name="download" size={16} color={colors.textSecondary} />;
    }
    if (!item.bundled) {
      return <Feather name="check-circle" size={16} color={colors.accent} />;
    }
    return null;
  };

  const renderBookCard = (item, index) => {
    const name = lang === 'ar' ? item.nameAr : item.nameEn;
    const author = lang === 'ar' ? item.authorAr : item.authorEn;
    const st = dlState[item.id];
    const ready = isReady(item);
    const g = getItemColors(colors, index);
    return (
      <TouchableOpacity
        key={item.id}
        testID={`book-${item.id}`}
        onPress={() => onOpenInfo(item)}
        style={[{
          width: '48%',
          backgroundColor: g ? 'transparent' : colors.surface,
          borderRadius: RADIUS.card,
          padding: SPACING.md,
          marginBottom: SPACING.md,
          overflow: 'hidden',
        }, shadow(colors.shadowColor), webCursor]}
      >
        {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: g ? 'rgba(255,255,255,0.18)' : withAlpha(colors.accent, 'hairline'),
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Feather name="book" size={20} color={g ? g.fg : colors.accent} />
          </View>
          {renderCardBadge(item, st, ready)}
        </View>
        <Text numberOfLines={2} style={[textStyles.subtitle, { color: g ? g.fg : colors.text, fontSize: 15, marginTop: SPACING.sm, minHeight: 40 }, lang === 'ar' ? arabicContentStyle() : null]}>{name}</Text>
        {author ? (
          <Text numberOfLines={1} style={[textStyles.caption, { color: g ? g.fg : colors.textSecondary, marginTop: 2, opacity: g ? 0.85 : 1 }, lang === 'ar' ? arabicContentStyle() : null]}>{author}</Text>
        ) : null}
        <Text style={[textStyles.caption, { color: g ? g.fg : colors.accent, marginTop: SPACING.xs }]}>{t('books.entryCount', { count: fmtNum(item.count) })}</Text>
      </TouchableOpacity>
    );
  };

  const renderGroup = (group, filter) => {
    const books = group.ids
      .map((id) => catalog.find((b) => b.id === id))
      .filter(Boolean)
      .filter(filter);
    if (!books.length) return null;
    return (
      <View key={group.id} style={{ marginBottom: SPACING.lg }}>
        <Text style={[textStyles.bodySmall, {
          color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5,
          marginBottom: SPACING.sm, marginHorizontal: SPACING.xs,
          textAlign: lang === 'ar' ? 'right' : 'left',
        }]}>
          {t(`books.groups.${group.id}`)}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', ...(lang === 'ar' ? { direction: 'rtl' } : null) }}>
          {books.map(renderBookCard)}
        </View>
      </View>
    );
  };

  const renderStatusSection = (ready) => {
    const filter = (b) => isReady(b) === ready;
    const count = catalog.filter(filter).length;
    if (!count) return null;
    return (
      <View key={ready ? 'downloaded' : 'notDownloaded'} style={{ marginBottom: SPACING.xl }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginBottom: SPACING.md, marginHorizontal: SPACING.xs,
          ...(lang === 'ar' ? { direction: 'rtl' } : null),
        }}>
          <Feather name={ready ? 'check-circle' : 'download-cloud'} size={18} color={ready ? colors.accent : colors.textSecondary} />
          <Text style={[textStyles.subtitle, { color: colors.text, marginHorizontal: SPACING.sm }]}>
            {t(ready ? 'books.downloadedSection' : 'books.notDownloadedSection')}
          </Text>
          <Text style={[textStyles.caption, { color: colors.textSecondary }]}>{fmtNum(count)}</Text>
        </View>
        {BOOK_GROUPS.map((g) => renderGroup(g, filter))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="books-screen">
      <CustomHeader title={t('navigation.books')} isHome={true} navigation={navigation} />
      <ScrollView
        contentContainerStyle={{
          width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center',
          paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {renderContinueCard()}
        {renderDownloadAllBanner()}
        {renderStatusSection(true)}
        {renderStatusSection(false)}
      </ScrollView>
    </View>
  );
}
