import * as React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import surahsData from '../assets/quran/data/surahs.json';
import juzData from '../assets/quran/data/juz.json';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const TABS = ['surahs', 'juzs', 'bookmarks'];

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

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

function Row({ left, right, sub, onPress, onRemove, colors }) {
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
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.accent + '22',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{left}</Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: 14 }}>
        <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>{right}</Text>
        {sub ? <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

export default function QuranIndexModal({ visible, onClose, currentPage, bookmarks, onSelectPage, onRemoveBookmark }) {
  const colors = useColors();
  const [tab, setTab] = React.useState('surahs');
  const lang = isRTL() ? 'ar' : 'en';

  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : n);
  const pageLabel = (n) => t('quran.pageNumber', { n: fmtNum(n) });

  const renderSurah = ({ item }) => {
    const typeLabel = item.type === 'meccan' ? t('quran.meccan') : t('quran.medinan');
    const ayahCountLabel = t('quran.ayahCount', { count: fmtNum(item.ayahCount) });
    return (
      <Row
        colors={colors}
        left={fmtNum(item.id)}
        right={lang === 'ar' ? item.nameAr : item.nameEn}
        sub={`${typeLabel} · ${ayahCountLabel}`}
        onPress={() => onSelectPage(item.startPage)}
      />
    );
  };

  const renderJuz = ({ item }) => (
    <Row
      colors={colors}
      left={fmtNum(item.id)}
      right={`${t('quran.juz')} ${fmtNum(item.id)}`}
      sub={pageLabel(item.startPage)}
      onPress={() => onSelectPage(item.startPage)}
    />
  );

  const renderBookmark = ({ item }) => {
    const surah = surahsData[item.surah - 1];
    return (
      <Row
        colors={colors}
        left={fmtNum(item.page)}
        right={lang === 'ar' ? surah.nameAr : surah.nameEn}
        sub={pageLabel(item.page)}
        onPress={() => onSelectPage(item.page)}
        onRemove={() => onRemoveBookmark(item.page)}
      />
    );
  };

  const sortedBookmarks = React.useMemo(
    () => [...bookmarks].sort((a, b) => a.page - b.page),
    [bookmarks]
  );

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
            {t('quran.title')}
          </Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map((key) => (
            <TabButton
              key={key}
              colors={colors}
              label={t(`quran.${key}`)}
              active={tab === key}
              onPress={() => setTab(key)}
            />
          ))}
        </View>
        {tab === 'surahs' && (
          <FlatList
            data={surahsData}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSurah}
            initialScrollIndex={(() => {
              const nextIdx = surahsData.findIndex((s) => s.startPage > currentPage);
              return Math.max(0, (nextIdx === -1 ? surahsData.length : nextIdx) - 1);
            })()}
            getItemLayout={(_, i) => ({ length: 70, offset: 70 * i, index: i })}
          />
        )}
        {tab === 'juzs' && (
          <FlatList
            data={juzData}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderJuz}
          />
        )}
        {tab === 'bookmarks' && (
          sortedBookmarks.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Feather name="bookmark" size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
              <Text style={[textStyles.base, { color: colors.textSecondary, textAlign: 'center' }]}>
                {t('quran.noBookmarks')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedBookmarks}
              keyExtractor={(item) => String(item.page)}
              renderItem={renderBookmark}
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
}
