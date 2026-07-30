import * as React from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CHeader';
import { useColors, getItemColors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getRTLTextAlign } from '../locales/i18n';
import {
  getStations, getStationSubtitle, getOfflineStations, markStationOffline, markStationOnline,
} from '../utils/RadioStations';
import RadioService from '../utils/RadioService';
import {
  loadRadioFavorites, toggleRadioFavorite, subscribeRadioFavorites,
} from '../utils/RadioFavorites';
import { SettingsSegmented } from '../components/settings';
import {
  SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, webCursor,
} from '../constants/settingsTokens';
import { useRTL } from '../hooks/useRTL';

export default function RadioScreen({ navigation }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isRTL: isRTLLayout, getDirectionalMixedSpacing } = useRTL();
  const lang = isRTL() ? 'ar' : 'en';

  const [stations, setStations] = React.useState(null);
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [favorites, setFavorites] = React.useState([]);
  const [offline, setOffline] = React.useState(() => new Set());
  const [radio, setRadio] = React.useState(RadioService._state());

  React.useEffect(() => {
    let cancelled = false;
    setOffline(new Set());
    getStations(lang).then((list) => {
      if (cancelled) return;
      setStations(list);
      if (Platform.OS === 'web') return;
      getOfflineStations(lang, list, {
        onOffline: (id) => { if (!cancelled) setOffline((prev) => new Set(prev).add(id)); },
      }).then((set) => { if (!cancelled) setOffline(new Set(set)); });
    });
    loadRadioFavorites().then((f) => { if (!cancelled) setFavorites(f); });
    const unsubFav = subscribeRadioFavorites((f) => setFavorites([...f]));
    const unsubRadio = RadioService.subscribe(setRadio);
    return () => { cancelled = true; unsubFav(); unsubRadio(); };
  }, [lang]);

  React.useEffect(() => {
    if (radio.failedStationId == null) return;
    setOffline((prev) => new Set(prev).add(radio.failedStationId));
    markStationOffline(lang, radio.failedStationId);
  }, [radio.failedStationId, lang]);

  React.useEffect(() => {
    if (!radio.isPlaying || !radio.activeStation) return;
    const id = radio.activeStation.id;
    setOffline((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    markStationOnline(lang, id);
  }, [radio.isPlaying, radio.activeStation, lang]);

  const filtered = React.useMemo(() => {
    if (!stations) return null;
    const q = query.trim().toLowerCase();
    return stations.filter((s) => {
      if (tab === 'favorites' && !favorites.includes(s.id)) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stations, tab, query, favorites]);

  const onPressStation = React.useCallback((station) => {
    if (radio.activeStation && radio.activeStation.id === station.id) {
      RadioService.toggle();
    } else {
      RadioService.playStation(station);
    }
  }, [radio.activeStation]);

  const renderStation = ({ item, index }) => {
    const active = radio.activeStation && radio.activeStation.id === item.id;
    const isOffline = offline.has(item.id) && !(active && (radio.isPlaying || radio.isBuffering));
    const isFav = favorites.includes(item.id);
    const subtitle = getStationSubtitle(item.streamUrl, lang);
    const g = (!active && !isOffline) ? getItemColors(colors, index) : null;
    return (
      <TouchableOpacity
        testID={`station-${item.id}`}
        onPress={() => onPressStation(item)}
        style={[{ flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.md + 2,
          paddingHorizontal: SPACING.lg + 2,
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.accent, 'hairline'),
          opacity: isOffline ? 0.55 : 1,
        }, webCursor]}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: active ? colors.accent : g ? 'transparent' : withAlpha(colors.accent, 'hairline'),
          justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        }}>
          {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
          <Feather
            name={isOffline ? 'wifi-off' : (active && radio.isPlaying ? 'volume-2' : 'radio')}
            size={22}
            color={active ? colors.primaryDark : (isOffline ? colors.textSecondary : g ? g.fg : colors.accent)}
          />
        </View>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {isOffline ? (
            <View style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.control, backgroundColor: withAlpha(colors.textSecondary, 'hairline') }}>
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 11 }]}>{t('radio.offline')}</Text>
            </View>
          ) : subtitle ? (
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 1 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {active ? (
            <View style={[{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, ...getDirectionalMixedSpacing({ marginRight: 6 }) }} />
              <Text style={[textStyles.base, { color: colors.accent, fontSize: 12 }]}>
                {radio.isBuffering ? t('radio.loading') : t('radio.nowPlaying')}
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          testID={`fav-${item.id}`}
          onPress={() => toggleRadioFavorite(item.id)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[{ paddingHorizontal: SPACING.xs }, webCursor]}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.accent : colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const headerControls = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="radio-screen">
      <CustomHeader title={t('navigation.radio')} isHome={true} navigation={navigation} />

      <View style={[headerControls, { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm }]}>
        <SettingsSegmented
          value={tab}
          onChange={setTab}
          options={[
            { id: 'all', label: t('radio.all') },
            { id: 'favorites', label: t('radio.favorites') },
          ]}
          getTestID={(opt) => `radio-tab-${opt.id}`}
        />
      </View>

      <View style={[headerControls, { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2 }]}>
        <View style={[{ flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface, borderRadius: RADIUS.control, paddingHorizontal: SPACING.md,
        }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            testID="radio-search"
            value={query}
            onChangeText={setQuery}
            placeholder={t('radio.search')}
            placeholderTextColor={colors.textSecondary}
            style={[textStyles.base, {
              flex: 1, color: colors.text, paddingVertical: 8, marginHorizontal: 8,
              textAlign: getRTLTextAlign(),
            }]}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {filtered === null ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 12 }]}>{t('radio.loading')}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
          <Feather name="radio" size={48} color={colors.textSecondary} />
          <Text style={[textStyles.base, { color: colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
            {t('radio.noStations')}
          </Text>
        </View>
      ) : (
        <FlatList
          testID="radio-list"
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderStation}
          contentContainerStyle={{ ...headerControls, paddingBottom: insets.bottom + 90 }}
        />
      )}
    </View>
  );
}
