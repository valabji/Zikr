import * as React from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { t, isRTL, arabicContentStyle } from '../locales/i18n';
import { searchBook } from '../utils/BooksLibrary';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export default function BooksSearchModal({ visible, onClose, bookId, onSelectEntry }) {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);

  React.useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  React.useEffect(() => {
    if (!visible || !bookId) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      setResults(searchBook(bookId, q).slice(0, 200));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, bookId, visible]);

  const renderResult = ({ item }) => {
    const showEn = lang === 'en' && !!item.textEn;
    return (
      <TouchableOpacity
        onPress={() => onSelectEntry(item.n)}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '22',
        }}
      >
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 13, marginBottom: 6 }]}>
          {t('books.hadithNumber', { n: lang === 'ar' ? toArabicDigits(item.n) : item.n })}
        </Text>
        <Text
          numberOfLines={3}
          style={arabicContentStyle({
            fontFamily: FONT_FAMILY,
            fontSize: 18,
            lineHeight: 32,
            color: colors.text,
          })}
        >
          {item.textAr}
        </Text>
        {showEn ? (
          <Text numberOfLines={2} style={[textStyles.base, { color: colors.textSecondary, fontSize: 14, marginTop: 6 }]}>
            {item.textEn}
          </Text>
        ) : null}
      </TouchableOpacity>
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
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 10,
            marginHorizontal: 6,
          }}>
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.placeholder')}
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 8,
                color: colors.text,
                fontSize: 16,
                textAlign: isRTL() ? 'right' : 'left',
              }}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Feather name="x-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.n)}
          renderItem={renderResult}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={[textStyles.base, { color: colors.textSecondary }]}>{t('books.noResults')}</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
