import * as React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { t, isRTL, arabicContentStyle } from '../locales/i18n';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const TABS = ['entries', 'bookmarks'];

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const snippet = (text, len = 60) => {
  const flat = (text || '').replace(/\s+/g, ' ').trim();
  return flat.length > len ? flat.slice(0, len) + '…' : flat;
};

function TabButton({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: active ? colors.accent : 'transparent',
      }}
    >
      <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EntryRow({ number, preview, onPress, onRemove, bookmarked, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.accent + '22',
        direction: 'rtl',
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.accent + '22',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{number}</Text>
      </View>
      <Text
        numberOfLines={1}
        style={arabicContentStyle({
          flex: 1,
          marginHorizontal: 14,
          fontFamily: FONT_FAMILY,
          fontSize: 16,
          color: colors.text,
        })}
      >
        {preview}
      </Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : bookmarked ? (
        <Ionicons name="bookmark" size={18} color={colors.accent} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function BooksIndexModal({ visible, onClose, book, bookmarks, onSelectEntry, onRemoveBookmark, onOpenSearch, onOpenSettings }) {
  const colors = useColors();
  const [tab, setTab] = React.useState('entries');
  const lang = isRTL() ? 'ar' : 'en';
  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);

  const entries = book?.entries || [];
  const bookmarkSet = React.useMemo(() => new Set(bookmarks || []), [bookmarks]);

  const renderEntry = ({ item, index }) => (
    <EntryRow
      colors={colors}
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
        number={fmtNum(entry.n)}
        preview={snippet(entry.textAr)}
        onPress={() => onSelectEntry(idx)}
        onRemove={() => onRemoveBookmark(idx)}
      />
    );
  };

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
            {book ? (lang === 'ar' ? book.nameAr : book.nameEn) : t('books.entries')}
          </Text>
          {onOpenSearch ? (
            <TouchableOpacity onPress={onOpenSearch} style={{ padding: 8 }} testID="books-index-search">
              <Feather name="search" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          {onOpenSettings ? (
            <TouchableOpacity onPress={onOpenSettings} style={{ padding: 8 }} testID="books-index-settings">
              <Feather name="settings" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map((key) => (
            <TabButton
              key={key}
              colors={colors}
              label={t(`books.${key}`)}
              active={tab === key}
              onPress={() => setTab(key)}
            />
          ))}
        </View>
        {tab === 'entries' && (
          <FlatList
            data={entries}
            keyExtractor={(item, index) => String(index)}
            renderItem={renderEntry}
            getItemLayout={(_, i) => ({ length: 65, offset: 65 * i, index: i })}
          />
        )}
        {tab === 'bookmarks' && (
          sortedBookmarks.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Feather name="bookmark" size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
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
      </SafeAreaView>
    </Modal>
  );
}
