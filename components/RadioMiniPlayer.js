import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t } from '../locales/i18n';
import RadioService from '../utils/RadioService';

export default function RadioMiniPlayer() {
  const colors = useColors();
  const insets = React.useContext(SafeAreaInsetsContext) ?? { bottom: 0 };
  const [state, setState] = React.useState(RadioService._state());

  React.useEffect(() => RadioService.subscribe(setState), []);

  if (!state.activeStation) return null;

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.primaryDark,
      borderTopWidth: 1, borderTopColor: colors.accent + '44',
    }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 + insets.bottom,
      }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.base, { color: colors.BYellow + 'aa', fontSize: 10, letterSpacing: 1 }]}>
            {t('radio.live').toUpperCase()}
          </Text>
          <Text style={[textStyles.subtitle, { color: colors.BYellow, fontSize: 14 }]} numberOfLines={1}>
            {state.activeStation.name}
          </Text>
        </View>
        <TouchableOpacity
          testID="radio-mini-toggle"
          onPress={() => RadioService.toggle()}
          style={{ paddingHorizontal: 10 }}
        >
          {state.isBuffering ? (
            <ActivityIndicator size="small" color={colors.BYellow} />
          ) : (
            <Feather name={state.isPlaying ? 'pause' : 'play'} size={26} color={colors.BYellow} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          testID="radio-mini-close"
          onPress={() => RadioService.stop()}
          style={{ paddingHorizontal: 8 }}
        >
          <Feather name="x" size={22} color={colors.BYellow} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
