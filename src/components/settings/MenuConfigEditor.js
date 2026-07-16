import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/constants/Colors';
import { useRTL } from '@/hooks/useRTL';
import { textStyles } from '@/constants/Fonts';
import { SPACING, webCursor } from '@/constants/settingsTokens';
import { t } from '@/locales/i18n';
import { DEFAULT_MENU_CONFIG, ITEM_DEFS, splitMenuForTabs } from '@/constants/MenuConfig';
import { useNavMode } from '@/utils/NavMode';
import { useAudio } from '@/utils/Sounds';
import { APP_KEYS } from '@/constants/StorageKeys';
import SettingsSection from './SettingsSection';
import SettingsField from './SettingsField';
import SettingsRow from './SettingsRow';
import SettingsSegmented from './SettingsSegmented';
import SettingsToggle from './SettingsToggle';

export default function MenuConfigEditor() {
  const colors = useColors();
  const { getTextAlign, getDirectionalMixedSpacing } = useRTL();
  const { playClick } = useAudio();
  const { navMode, setNavMode } = useNavMode();
  const [menuConfig, setMenuConfig] = useState(DEFAULT_MENU_CONFIG);
  const [showDate, setShowDate] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const storedMenuConfig = await AsyncStorage.getItem(APP_KEYS.MENU_CONFIG);
        let parsedMenuConfig = null;
        try { parsedMenuConfig = storedMenuConfig ? JSON.parse(storedMenuConfig) : null; } catch {}
        setMenuConfig(Array.isArray(parsedMenuConfig) ? parsedMenuConfig : DEFAULT_MENU_CONFIG);
        const storedShowDate = await AsyncStorage.getItem(APP_KEYS.MENU_SHOW_DATE);
        setShowDate(storedShowDate !== 'false');
      } catch (error) {
        console.warn('Failed to load menu config:', error);
      }
    };
    load();
  }, []);

  const handleMenuItemToggle = async (idx) => {
    const updated = menuConfig.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item);
    setMenuConfig(updated);
    await AsyncStorage.setItem(APP_KEYS.MENU_CONFIG, JSON.stringify(updated));
  };

  const handleMenuItemMove = async (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= menuConfig.length) return;
    const updated = [...menuConfig];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setMenuConfig(updated);
    await AsyncStorage.setItem(APP_KEYS.MENU_CONFIG, JSON.stringify(updated));
  };

  const handleDateToggle = async () => {
    const newVal = !showDate;
    setShowDate(newVal);
    await AsyncStorage.setItem(APP_KEYS.MENU_SHOW_DATE, newVal ? 'true' : 'false');
  };

  const handleNavStyleChange = async (mode) => {
    if (mode === navMode) return;
    playClick();
    await AsyncStorage.setItem(APP_KEYS.NAV_MODE, mode);
    setNavMode(mode);
  };

  return (
    <SettingsSection title={t('settings.menu')}>
      <SettingsField label={t('settings.navStyle')}>
        <SettingsSegmented
          value={navMode}
          options={[
            { id: 'drawer', label: t('settings.navStyleDrawer'), icon: 'menu' },
            { id: 'cards', label: t('settings.navStyleCards'), icon: 'grid' },
          ]}
          onChange={handleNavStyleChange}
          getTestID={(opt) => `nav-style-${opt.id}`}
        />
      </SettingsField>
      <SettingsRow
        label={t('settings.menuShowDate')}
        trailing={(
          <SettingsToggle value={showDate} onValueChange={() => handleDateToggle()} />
        )}
      />
      {menuConfig.map((item, idx) => {
        const def = ITEM_DEFS[item.id];
        if (!def) return null;
        const inBar = navMode === 'cards' && splitMenuForTabs(menuConfig).tabItems.some(i => i.id === item.id);
        return (
          <View key={item.id} style={[{ flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm + 2,
            opacity: item.visible ? 1 : 0.5,
          }]}>
            <View style={getDirectionalMixedSpacing({ marginRight: SPACING.sm })}>
              <Pressable
                onPress={() => handleMenuItemMove(idx, -1)}
                disabled={idx === 0}
                style={[{ padding: 2, opacity: idx === 0 ? 0.3 : 1 }, webCursor]}
              >
                <Feather name="chevron-up" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => handleMenuItemMove(idx, 1)}
                disabled={idx === menuConfig.length - 1}
                style={[{ padding: 2, opacity: idx === menuConfig.length - 1 ? 0.3 : 1 }, webCursor]}
              >
                <Feather name="chevron-down" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Feather name={def.icon} size={18} color={colors.accent} style={getDirectionalMixedSpacing({ marginRight: SPACING.md })} />
            <Text style={[textStyles.body, { color: colors.text, flex: 1, textAlign: getTextAlign('left') }]}>
              {t(def.labelKey)}
            </Text>
            {inBar && (
              <View style={[{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.accent + '22',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }, getDirectionalMixedSpacing({ marginRight: SPACING.sm })]}>
                <Feather name="grid" size={11} color={colors.accent} style={getDirectionalMixedSpacing({ marginRight: 4 })} />
                <Text style={[textStyles.caption, { color: colors.accent }]}>{t('settings.menuBarBadge')}</Text>
              </View>
            )}
            <Pressable onPress={() => handleMenuItemToggle(idx)} style={[{ padding: 4 }, webCursor]}>
              <Feather name={item.visible ? 'eye' : 'eye-off'} size={20} color={item.visible ? colors.accent : colors.textSecondary} />
            </Pressable>
          </View>
        );
      })}
    </SettingsSection>
  );
}
