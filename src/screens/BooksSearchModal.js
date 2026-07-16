import * as React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles, FONT_FAMILY } from '@/constants/Fonts';
import { t, isRTL, arabicContentStyle, toArabicDigits } from '@/locales/i18n';
import { useRTL } from '@/hooks/useRTL';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, webCursor } from '@/constants/settingsTokens';
import { SettingsModalShell } from '@/components/settings';
import { searchBook } from '@/utils/BooksLibrary';

const isWeb = Platform.OS === 'web';

export default function BooksSearchModal({ visible, onClose, bookId, onSelectEntry }) {
  const colors = useColors();
  const { isRTL: isRTLLayout, getTextAlign } = useRTL();
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
        style={[{
          paddingVertical: SPACING.md + 2,
          paddingHorizontal: SPACING.lg,
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.accent, 'hairline'),
        }, webCursor]}
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
    <SettingsModalShell visible={visible} onClose={onClose} title={t('search.placeholder')}>
      <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }}>
        <View style={[{ flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: RADIUS.control,
          paddingHorizontal: SPACING.md,
          marginHorizontal: SPACING.md,
          marginVertical: SPACING.sm,
        }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.sm,
              color: colors.text,
              fontSize: 16,
              textAlign: getTextAlign('left'),
            }}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={webCursor}>
              <Feather name="x-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.n)}
          renderItem={renderResult}
          keyboardShouldPersistTaps="handled"
          style={isWeb ? { maxHeight: 460 } : undefined}
          ListEmptyComponent={
            query.trim().length >= 2 ? (
              <View style={{ padding: SPACING.xxl + SPACING.sm, alignItems: 'center' }}>
                <Text style={[textStyles.base, { color: colors.textSecondary }]}>{t('books.noResults')}</Text>
              </View>
            ) : null
          }
        />
      </View>
    </SettingsModalShell>
  );
}
