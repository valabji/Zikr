import * as React from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, toArabicDigits } from '@/locales/i18n';
import surahsData from '@assets/quran/data/surahs.json';
import { RECITERS, getReciter, reciterHasSurahAudio, DEFAULT_RECITER_ID } from '@/constants/QuranReciters';
import { loadQuranSettings, setQuranSettings, subscribeQuranSettings } from '@/utils/QuranSettings';
import QuranSurahDownloader from '@/utils/QuranSurahDownloader';
import { webCursor } from '@/constants/settingsTokens';

const TOTAL = surahsData.length;
const OFFLINE_RECITERS = RECITERS.filter((r) => r.qdcId);
const fmtMb = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

function DownloadControl({ entry, colors, onDownload, onCancel, onRemove }) {
  if (entry.downloading) {
    const pct = Math.round((entry.progress || 0) * 100);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[textStyles.base, { color: colors.accent, fontSize: 13, marginEnd: 10 }]}>{pct}%</Text>
        <TouchableOpacity onPress={onCancel} accessibilityRole="button" accessibilityLabel={t('common.cancel')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={webCursor}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }
  if (entry.downloaded) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name="check-circle" size={18} color={colors.accent} />
        <TouchableOpacity onPress={onRemove} accessibilityRole="button" accessibilityLabel={t('quran.remove')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={[{ marginStart: 14 }, webCursor]}>
          <Feather name="trash-2" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity onPress={onDownload} accessibilityRole="button" accessibilityLabel={t('quran.download')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={webCursor}>
      <Feather name="download" size={20} color={colors.accent} />
    </TouchableOpacity>
  );
}

export default function QuranDownloadsList() {
  const colors = useColors();
  const lang = isRTL() ? 'ar' : 'en';
  const [reciterId, setReciterId] = React.useState(DEFAULT_RECITER_ID);
  const [states, setStates] = React.useState({});
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    loadQuranSettings().then((s) => { if (!cancelled) setReciterId(s.reciterId || DEFAULT_RECITER_ID); });
    const unsubSettings = subscribeQuranSettings((s) => setReciterId(s.reciterId || DEFAULT_RECITER_ID));
    const unsubDl = QuranSurahDownloader.subscribe(setStates);
    OFFLINE_RECITERS.forEach((r) => QuranSurahDownloader.checkInstalled(r.id));
    return () => { cancelled = true; unsubSettings(); unsubDl(); };
  }, []);

  const fmtNum = (n) => (lang === 'ar' ? toArabicDigits(n) : String(n));
  const entryFor = (surah) => states[`${reciterId}:${surah}`] || { downloaded: false, downloading: false, progress: 0, size: 0 };

  const countFor = React.useCallback((rid) => {
    const prefix = `${rid}:`;
    let n = 0;
    Object.keys(states).forEach((k) => { if (k.startsWith(prefix) && states[k].downloaded) n += 1; });
    return n;
  }, [states]);

  const pctFor = (rid) => Math.round((countFor(rid) / TOTAL) * 100);

  const reciter = getReciter(reciterId);
  const supported = reciterHasSurahAudio(reciterId) && Platform.OS !== 'web';
  const selectReciter = (id) => { setReciterId(id); setQuranSettings({ reciterId: id }); setPickerOpen(false); };

  const reciterTrigger = (
    <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }}>
      <TouchableOpacity
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('quran.reciter')}
        accessibilityState={{ expanded: pickerOpen }}
        style={[{
          flexDirection: 'row', alignItems: 'center',
          paddingVertical: 10, paddingHorizontal: 12,
          borderRadius: 8, borderWidth: 1,
          borderColor: colors.accent + '44', backgroundColor: colors.accent + '0a',
        }, webCursor]}
      >
        <Text style={[textStyles.subtitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {lang === 'ar' ? reciter.nameAr : reciter.nameEn}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.text} style={{ marginStart: 6 }} />
      </TouchableOpacity>
    </View>
  );

  const picker = (
    <Modal visible={pickerOpen} animationType="fade" transparent onRequestClose={() => setPickerOpen(false)} statusBarTranslucent>
      <Pressable onPress={() => setPickerOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ flex: 1, backgroundColor: colors.overlayBackground, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Pressable onPress={() => {}} style={{ maxHeight: '80%', backgroundColor: colors.background, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.accent + '33' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.accent + '22' }}>
            <Text style={[textStyles.header, { color: colors.text, flex: 1, fontSize: 16 }]}>{t('quran.reciter')}</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={webCursor}>
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={OFFLINE_RECITERS}
            keyExtractor={(r) => r.id}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const active = item.id === reciterId;
              return (
                <TouchableOpacity
                  onPress={() => selectReciter(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14, paddingHorizontal: 18,
                    borderBottomWidth: 1, borderBottomColor: colors.accent + '15',
                    backgroundColor: active ? colors.accent + '12' : 'transparent',
                  }, webCursor]}
                >
                  <Text style={[textStyles.subtitle, { color: active ? colors.accent : colors.text, flex: 1 }]} numberOfLines={1}>
                    {lang === 'ar' ? item.nameAr : item.nameEn}
                  </Text>
                  <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginStart: 10 }]}>
                    {fmtNum(pctFor(item.id))}%
                  </Text>
                  {active ? <Feather name="check" size={18} color={colors.accent} style={{ marginStart: 10 }} /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (!supported) {
    return (
      <View style={{ flex: 1 }}>
        {reciterTrigger}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Feather name="cloud-off" size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={[textStyles.base, { color: colors.textSecondary, textAlign: 'center' }]}>
            {Platform.OS === 'web' ? t('quran.offlineWebUnsupported') : t('quran.offlineReciterUnsupported')}
          </Text>
        </View>
        {picker}
      </View>
    );
  }

  const count = countFor(reciterId);
  const totalSize = surahsData.reduce((sum, s) => sum + (entryFor(s.id).downloaded ? (entryFor(s.id).size || 0) : 0), 0);
  const bulkActive = QuranSurahDownloader.isBulkActive(reciterId);
  const allDone = count >= TOTAL;

  const downloadAllButton = (
    <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14 }}>
      <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginBottom: 10 }]}>
        {t('quran.offlineDownloadedCount', { count: fmtNum(count), total: fmtNum(TOTAL) })}
        {totalSize ? ` · ${fmtMb(totalSize)}` : ''}
      </Text>
      {bulkActive ? (
        <TouchableOpacity
          onPress={() => QuranSurahDownloader.cancelAll(reciterId)}
          style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '55' }, webCursor]}
        >
          <Feather name="x" size={16} color={colors.accent} style={{ marginEnd: 8 }} />
          <Text style={[textStyles.subtitle, { color: colors.accent, fontSize: 14 }]}>
            {t('common.cancel')} · {fmtNum(pctFor(reciterId))}%
          </Text>
        </TouchableOpacity>
      ) : allDone ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
          <Feather name="check-circle" size={16} color={colors.accent} style={{ marginEnd: 8 }} />
          <Text style={[textStyles.subtitle, { color: colors.accent, fontSize: 14 }]}>{t('quran.offlineAllDownloaded')}</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => QuranSurahDownloader.downloadAll(reciterId)}
          style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent }, webCursor]}
        >
          <Feather name="download" size={16} color={colors.primaryDark} style={{ marginEnd: 8 }} />
          <Text style={[textStyles.subtitle, { color: colors.primaryDark, fontSize: 14 }]}>{t('quran.offlineDownloadAll')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderItem = ({ item }) => {
    const entry = entryFor(item.id);
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: 18,
        borderBottomWidth: 1, borderBottomColor: colors.accent + '22',
      }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent + '22', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>{fmtNum(item.id)}</Text>
        </View>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>
            {lang === 'ar' ? item.nameAr : item.nameEn}
          </Text>
          {entry.downloaded && entry.size ? (
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>
              {fmtMb(entry.size)}
            </Text>
          ) : null}
        </View>
        <DownloadControl
          entry={entry}
          colors={colors}
          onDownload={() => QuranSurahDownloader.start(reciterId, item.id)}
          onCancel={() => QuranSurahDownloader.cancel(reciterId, item.id)}
          onRemove={() => QuranSurahDownloader.remove(reciterId, item.id)}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={surahsData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={<View>{reciterTrigger}{downloadAllButton}</View>}
      />
      {picker}
    </View>
  );
}
