import * as React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles, FONT_FAMILY } from '@/constants/Fonts';
import { t, isRTL, arabicContentStyle, toArabicDigits } from '@/locales/i18n';
import { useRTL } from '@/hooks/useRTL';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, webCursor } from '@/constants/settingsTokens';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;


const snippet = (text, len = 60) => {
  const flat = (text || '').replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
};

function TabButton({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.accent : 'transparent',
      }, webCursor]}
    >
      <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EntryRow({ number, preview, onPress, onRemove, bookmarked, colors, isRTLLayout }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.lg + 2,
        borderBottomWidth: 1,
        borderBottomColor: withAlpha(colors.accent, 'hairline'),
      }, webCursor]}
    >
      <View style={{
        width: 36, height: 36, borderRadius: RADIUS.pill,
        backgroundColor: withAlpha(colors.accent, 'hairline'),
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{number}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={arabicContentStyle({
          flex: 1,
          marginHorizontal: SPACING.md + 2,
          fontFamily: FONT_FAMILY,
          fontSize: 16,
          color: colors.text,
        })}
      >
        {preview}
      </Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={webCursor}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : bookmarked ? (
        <Ionicons name="bookmark" size={18} color={colors.accent} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function BooksIndexModal({ visible, onClose, book, bookmarks, onSelectEntry, onSelectChapter, onRemoveBookmark, onOpenSearch, onOpenSettings }) {
  const colors = useColors();
  const { isRTL: isRTLLayout } = useRTL();
  const [tab, setTab] = React.useState('entries');
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);

  const entries = book?.entries || [];
  const chapters = book?.chapters || [];
  const hasChapters = !!onSelectChapter && chapters.length > 1;
  const tabs = hasChapters ? ['chapters', 'entries', 'bookmarks'] : ['entries', 'bookmarks'];
  const activeTab = tab === 'chapters' && !hasChapters ? 'entries' : tab;
  const bookmarkSet = React.useMemo(() => new Set(bookmarks || []), [bookmarks]);

  const renderEntry = ({ item, index }) => (
    <EntryRow
      colors={colors}
      isRTLLayout={isRTLLayout}
      number={fmtNum(item.n)}
      preview={snippet(item.textAr)}
      onPress={() => onSelectEntry(index)}
      bookmarked={bookmarkSet.has(index)}
    />
  );

  const sortedBookmarks = React.useMemo(
    () => [...(bookmarks || [])].sort((a, b) => a - b),
    [bookmarks]
  );

  const renderBookmark = ({ item: idx }) => {
    const entry = entries[idx];
    if (!entry) return null;
    return (
      <EntryRow
        colors={colors}
        isRTLLayout={isRTLLayout}
        number={fmtNum(entry.n)}
        preview={snippet(entry.textAr)}
        onPress={() => onSelectEntry(idx)}
        onRemove={() => onRemoveBookmark(idx)}
      />
    );
  };

  const renderChapter = ({ item, index }) => {
    const name = lang === 'ar' ? item.ar : (item.en || item.ar);
    return (
      <TouchableOpacity
        onPress={() => onSelectChapter(item.id)}
        style={[{ flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md + 2,
          paddingHorizontal: SPACING.lg + 2,
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.accent, 'hairline'),
        }, webCursor]}
      >
        <View style={{
          minWidth: 36, height: 36, borderRadius: RADIUS.pill, paddingHorizontal: 8,
          backgroundColor: withAlpha(colors.accent, 'hairline'),
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{fmtNum(index + 1)}</Text>
        </View>
        <Text
          numberOfLines={2}
          style={arabicContentStyle({
            flex: 1,
            marginHorizontal: SPACING.md + 2,
            fontFamily: FONT_FAMILY,
            fontSize: 16,
            color: colors.text,
          })}
        >
          {name}
        </Text>
        <Feather name={isRTLLayout ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: ANDROID_STATUS_BAR }}>
        <View style={{ flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
          <View style={[{ flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm + 2,
            borderBottomWidth: 1,
            borderBottomColor: withAlpha(colors.accent, 'hairline'),
          }]}>
            <TouchableOpacity onPress={onClose} style={[{ padding: SPACING.sm }, webCursor]}>
              <Feather name="x" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={[textStyles.header, { color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: SPACING.sm }]} numberOfLines={1}>
              {book ? (lang === 'ar' ? book.nameAr : book.nameEn) : t('books.entries')}
            </Text>
            {onOpenSearch ? (
              <TouchableOpacity onPress={onOpenSearch} style={[{ padding: SPACING.sm }, webCursor]} testID="books-index-search">
                <Feather name="search" size={22} color={colors.text} />
              </TouchableOpacity>
            ) : null}
            {onOpenSettings ? (
              <TouchableOpacity onPress={onOpenSettings} style={[{ padding: SPACING.sm }, webCursor]} testID="books-index-settings">
                <Feather name="settings" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {tabs.map((key) => (
              <TabButton
                key={key}
                colors={colors}
                label={t(`books.${key}`)}
                active={activeTab === key}
                onPress={() => setTab(key)}
              />
            ))}
          </View>
          {activeTab === 'chapters' && (
            <FlatList
              data={chapters}
              keyExtractor={(item, index) => String(item.id ?? index)}
              renderItem={renderChapter}
            />
          )}
          {activeTab === 'entries' && (
            <FlatList
              data={entries}
              keyExtractor={(item, index) => String(index)}
              renderItem={renderEntry}
              getItemLayout={(_, i) => ({ length: 65, offset: 65 * i, index: i })}
            />
          )}
          {activeTab === 'bookmarks' && (
            sortedBookmarks.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl + SPACING.sm }}>
                <Feather name="bookmark" size={48} color={colors.textSecondary} style={{ marginBottom: SPACING.lg, opacity: 0.5 }} />
                <Text style={[textStyles.base, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {t('books.noBookmarks')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={sortedBookmarks}
                keyExtractor={(idx) => String(idx)}
                renderItem={renderBookmark}
              />
            )
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
