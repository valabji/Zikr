import * as React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL } from '../locales/i18n';
import surahsData from '../assets/quran/data/surahs.json';
import juzData from '../assets/quran/data/juz.json';
import { getStats, subscribeProgress } from '../utils/ReadingProgress';
import QuranDownloadsList from '../components/QuranDownloadsList';

const ANDROID_STATUS_BAR = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const TABS = ['surahs', 'juzs', 'bookmarks', 'downloads', 'progress'];

const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const WEEKDAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

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

function BookmarkRow({ item, colors, lang, fmtNum, pageLabel, onPress, onRemove, editing, noteDraft, onStartEdit, onChangeDraft, onSaveNote }) {
  const surah = surahsData[item.surah - 1];
  return (
    <View style={{
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent + '22',
    }}>
      <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: colors.accent + '22',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{fmtNum(item.page)}</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>
            {lang === 'ar' ? surah.nameAr : surah.nameEn}
          </Text>
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]} numberOfLines={1}>
            {pageLabel(item.page)}
          </Text>
        </View>
        <TouchableOpacity onPress={onStartEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginEnd: 14 }}>
          <Feather name="edit-2" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
      {editing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <TextInput
            value={noteDraft}
            onChangeText={onChangeDraft}
            placeholder={t('quran.bookmarkNotePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[textStyles.base, {
              flex: 1, color: colors.text, fontSize: 13,
              borderWidth: 1, borderColor: colors.accent + '44', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 6,
            }]}
            autoFocus
            onSubmitEditing={onSaveNote}
          />
          <TouchableOpacity onPress={onSaveNote} style={{ marginStart: 10 }}>
            <Feather name="check" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ) : item.note ? (
        <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]} numberOfLines={2}>
          {item.note}
        </Text>
      ) : null}
    </View>
  );
}

export default function QuranIndexModal({ visible, onClose, currentPage, bookmarks, onSelectPage, onRemoveBookmark, onUpdateBookmarkNote, onOpenSearch, onOpenSettings }) {
  const colors = useColors();
  const [tab, setTab] = React.useState('surahs');
  const [editingNotePage, setEditingNotePage] = React.useState(null);
  const [noteDraft, setNoteDraft] = React.useState('');
  const lang = isRTL() ? 'ar' : 'en';
  const [progressStats, setProgressStats] = React.useState({ todayCount: 0, streak: 0, totalUnique: 0, completionPct: 0, last7Days: [] });

  React.useEffect(() => {
    getStats().then(setProgressStats).catch(() => {});
    return subscribeProgress(setProgressStats);
  }, []);

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

  const renderBookmark = ({ item }) => (
    <BookmarkRow
      item={item}
      colors={colors}
      lang={lang}
      fmtNum={fmtNum}
      pageLabel={pageLabel}
      onPress={() => onSelectPage(item.page)}
      onRemove={() => onRemoveBookmark(item.page)}
      editing={editingNotePage === item.page}
      noteDraft={noteDraft}
      onStartEdit={() => { setEditingNotePage(item.page); setNoteDraft(item.note || ''); }}
      onChangeDraft={setNoteDraft}
      onSaveNote={() => {
        onUpdateBookmarkNote && onUpdateBookmarkNote(item.page, noteDraft.trim());
        setEditingNotePage(null);
      }}
    />
  );

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
          {onOpenSearch ? (
            <TouchableOpacity onPress={onOpenSearch} style={{ padding: 8 }} testID="quran-index-search">
              <Feather name="search" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          {onOpenSettings ? (
            <TouchableOpacity onPress={onOpenSettings} style={{ padding: 8 }} testID="quran-index-settings">
              <Feather name="settings" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
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
        {tab === 'downloads' && <QuranDownloadsList />}
        {tab === 'progress' && (
          <View style={{ flex: 1, padding: 20 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Feather name="zap" size={28} color={colors.accent} style={{ marginEnd: 16 }} />
              <View>
                <Text style={[textStyles.header, { color: colors.accent, fontSize: 28 }]}>
                  {progressStats.streak}
                </Text>
                <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13 }]}>
                  {t('quran.streakDays')}
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={[textStyles.subtitle, { color: colors.text }]}>{t('quran.todayPages')}</Text>
              <Text style={[textStyles.subtitle, { color: colors.accent, fontSize: 18 }]}>
                {fmtNum(progressStats.todayCount)}
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 14,
            }}>
              <Text style={[textStyles.subtitle, { color: colors.text, marginBottom: 12 }]}>
                {t('quran.weeklyChart')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
                {progressStats.last7Days.map((d) => {
                  const maxCount = Math.max(1, ...progressStats.last7Days.map((x) => x.count));
                  const barHeight = Math.max(4, Math.round((d.count / maxCount) * 64));
                  const weekday = new Date(d.date + 'T00:00:00').getDay();
                  const weekdayLabel = lang === 'ar' ? WEEKDAY_AR[weekday] : WEEKDAY_EN[weekday];
                  return (
                    <View key={d.date} style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={[textStyles.base, { color: colors.accent, fontSize: 11, marginBottom: 4 }]}>
                        {d.count > 0 ? fmtNum(d.count) : ''}
                      </Text>
                      <View style={{
                        width: 14,
                        height: barHeight,
                        borderRadius: 4,
                        backgroundColor: colors.accent + (d.count > 0 ? 'ff' : '33'),
                      }} />
                      <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 10, marginTop: 6 }]}>
                        {weekdayLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={[textStyles.subtitle, { color: colors.text }]}>{t('quran.completion')}</Text>
                <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13 }]}>
                  {fmtNum(progressStats.totalUnique)} / {fmtNum(604)} ({fmtNum(progressStats.completionPct)}%)
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.accent + '33', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  width: `${progressStats.completionPct}%`,
                  backgroundColor: colors.accent,
                  borderRadius: 4,
                }} />
              </View>
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                {t('quran.totalRead')}: {fmtNum(progressStats.totalUnique)}
              </Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
