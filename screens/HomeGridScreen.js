import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors, getItemColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t } from '../locales/i18n';
import { LogoSvg } from '../components/LogoSvg';
import { DEFAULT_MENU_CONFIG, ITEM_DEFS, splitMenuForTabs } from '../constants/MenuConfig';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { formatHijriDate } from '../utils/HijriCalendar';
import { getItemAction } from '../utils/menuActions';

export default function HomeGridScreen({ navigation }) {
  const colors = useColors();
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [showDate, setShowDate] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const hijriDate = useMemo(() => formatHijriDate(), []);

  const loadConfig = useCallback(async () => {
    const stored = await AsyncStorage.getItem('@menuConfig');
    let parsed = null;
    try { parsed = stored ? JSON.parse(stored) : null; } catch {}
    setMenuConfig(Array.isArray(parsed) ? parsed : DEFAULT_MENU_CONFIG);
    const dateShown = await AsyncStorage.getItem('@menuShowDate');
    setShowDate(dateShown !== 'false');
    const loc = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
    setHasLocation(!!loc);
  }, []);

  useEffect(() => {
    loadConfig();
    return navigation.addListener('focus', loadConfig);
  }, [navigation, loadConfig]);

  const cards = splitMenuForTabs(menuConfig).gridItems.map(i => ({
    id: i.id,
    icon: ITEM_DEFS[i.id].icon,
    label: t(ITEM_DEFS[i.id].labelKey),
    testID: ITEM_DEFS[i.id].testID,
    onPress: getItemAction(i.id, navigation, hasLocation),
  }));

  return (
    <View testID="home-grid-screen" style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <LogoSvg color={colors.BYellow} spacing={80} width={128} height={148} />
          {showDate && (
            <Text style={{ color: colors.BYellow, fontSize: 11, opacity: 0.7, marginTop: 4 }}>
              {hijriDate}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 24 }}>
          {cards.map((card, idx) => {
            const g = getItemColors(colors, idx);
            const fg = g ? g.fg : colors.BYellow;
            return (
              <TouchableOpacity
                key={card.id}
                testID={card.testID}
                onPress={card.onPress}
                style={{
                  width: '48.5%',
                  paddingVertical: 24,
                  marginBottom: 10,
                  borderRadius: 12,
                  overflow: 'hidden',
                  alignItems: 'center',
                  backgroundColor: g ? 'transparent' : colors.DGreen,
                }}>
                {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
                <Feather name={card.icon} size={30} color={fg} />
                <Text numberOfLines={1} style={[textStyles.navigation, { color: fg, marginTop: 8, textAlign: 'center' }]}>
                  {card.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
