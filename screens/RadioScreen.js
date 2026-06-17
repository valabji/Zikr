import * as React from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CHeader';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getRTLTextAlign } from '../locales/i18n';
import { getStations, getStationSubtitle } from '../utils/RadioStations';
import RadioService from '../utils/RadioService';
import {
  loadRadioFavorites, toggleRadioFavorite, subscribeRadioFavorites,
} from '../utils/RadioFavorites';

export default function RadioScreen({ navigation }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const lang = isRTL() ? 'ar' : 'en';

  const [stations, setStations] = React.useState(null);
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [favorites, setFavorites] = React.useState([]);
  const [radio, setRadio] = React.useState(RadioService._state());

  React.useEffect(() => {
    let cancelled = false;
    getStations(lang).then((list) => { if (!cancelled) setStations(list); });
    loadRadioFavorites().then((f) => { if (!cancelled) setFavorites(f); });
    const unsubFav = subscribeRadioFavorites((f) => setFavorites([...f]));
    const unsubRadio = RadioService.subscribe(setRadio);
    return () => { cancelled = true; unsubFav(); unsubRadio(); };
  }, [lang]);

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

  const renderStation = ({ item }) => {
    const active = radio.activeStation && radio.activeStation.id === item.id;
    const isFav = favorites.includes(item.id);
    const subtitle = getStationSubtitle(item.streamUrl, lang);
    return (
      <TouchableOpacity
        testID={`station-${item.id}`}
        onPress={() => onPressStation(item)}
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
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: active ? colors.accent : colors.accent + '22',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Feather
            name={active && radio.isPlaying ? 'volume-2' : 'radio'}
            size={22}
            color={active ? colors.primaryDark : colors.accent}
          />
        </View>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={[textStyles.subtitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          {subtitle ? (
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 1 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {active ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginRight: 6 }} />
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
          style={{ paddingHorizontal: 4 }}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? colors.accent : colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const Tab = ({ id, label }) => {
    const active = tab === id;
    return (
      <TouchableOpacity
        testID={`radio-tab-${id}`}
        onPress={() => setTab(id)}
        style={{
          flex: 1, paddingVertical: 10, alignItems: 'center',
          borderBottomWidth: 2,
          borderBottomColor: active ? colors.accent : 'transparent',
        }}
      >
        <Text style={[textStyles.base, { color: active ? colors.accent : colors.textSecondary, fontSize: 15 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} testID="radio-screen">
      <CustomHeader title={t('navigation.radio')} isHome={true} navigation={navigation} />

      <View style={{ flexDirection: 'row', backgroundColor: colors.surface }}>
        <Tab id="all" label={t('radio.all')} />
        <Tab id="favorites" label={t('radio.favorites')} />
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12,
        }}>
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
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        />
      )}
    </View>
  );
}
