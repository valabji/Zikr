import React from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/constants/Colors';
import { t, getRTLTextAlign } from '@/locales/i18n';
import { textStyles } from '@/constants/Fonts';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { SPACING, RADIUS, withAlpha } from '@/constants/settingsTokens';
import { SettingsSection, SettingsRow, SettingsField } from '@/components/settings';

const locationLabel = (loc) => loc.name || `${loc.city}, ${loc.country}`;

export default function PrayerLocationSection({ location, selectedLocation, onSelectLocation, search }) {
  const colors = useColors();
  const {
    searchQuery, searchResults, isSearching, isGettingLocation,
    handleSearch, getCurrentLocation, getIPLocation,
  } = search;

  return (
    <SettingsSection title={t('locationSettings.title')}>
      <SettingsRow
        icon="map-pin"
        label={t('locationSettings.currentLocation')}
        value={location ? locationLabel(location) : t('locationSettings.noLocationSet')}
      />
      {selectedLocation && selectedLocation !== location ? (
        <SettingsRow
          icon="navigation"
          label={t('locationSettings.newLocation')}
          value={locationLabel(selectedLocation)}
        />
      ) : null}
      <SettingsField label={t('locationSettings.searchLocation')}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: withAlpha(colors.accent, 'subtle'),
          borderRadius: RADIUS.control,
          paddingHorizontal: SPACING.md,
        }}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[textStyles.body, {
              flex: 1,
              color: colors.text,
              paddingVertical: SPACING.sm + 2,
              marginHorizontal: SPACING.sm,
              textAlign: getRTLTextAlign('left'),
            }]}
            placeholder={t('locationSettings.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {isSearching ? <ActivityIndicator size="small" color={colors.accent} /> : null}
        </View>
      </SettingsField>
      {searchResults.map((item, index) => (
        <SettingsRow
          key={`search-${index}`}
          label={item.name}
          description={item.country}
          onPress={() => onSelectLocation(item)}
          trailing={selectedLocation?.name === item.name
            ? <Feather name="check" size={20} color={colors.accent} />
            : null}
        />
      ))}
      {searchQuery.length >= PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH && !isSearching && searchResults.length === 0 ? (
        <SettingsField description={t('locationSettings.noResultsFound')} />
      ) : null}
      <SettingsRow
        icon="crosshair"
        label={t('locationSettings.useGPS')}
        onPress={getCurrentLocation}
        disabled={isGettingLocation}
        trailing={isGettingLocation ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      />
      <SettingsRow
        icon="wifi"
        label={t('locationSettings.useIP')}
        onPress={getIPLocation}
        disabled={isGettingLocation}
        trailing={isGettingLocation ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      />
    </SettingsSection>
  );
}
