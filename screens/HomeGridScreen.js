import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, Dimensions, Share, Platform, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import { Feather } from '@expo/vector-icons';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import CustomHeader from '../components/CHeader';

export default function HomeGridScreen() {
  const navigation = useNavigation();
  const colors = useColors();

  // Responsive column calculation
  const getNumColumns = (width) => {
    if (width < 600) return 2;      // Mobile phones
    if (width < 900) return 3;      // Tablets/small desktops
    return 4;                       // Large screens
  };

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [numColumns, setNumColumns] = useState(getNumColumns(Dimensions.get('window').width));

  // Listen for dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      setNumColumns(getNumColumns(window.width));
    });

    return () => subscription?.remove();
  }, []);

  const menuItems = [
    {
      id: 'tasbih',
      title: t('app.tasbih'),
      icon: 'target',
      onPress: () => navigation.navigate('Screen3'),
      testID: 'grid-tasbih'
    },
    {
      id: 'favorites',
      title: t('navigation.favorites'),
      icon: 'heart',
      onPress: () => navigation.navigate('Home', { showFavorites: true }),
      testID: 'grid-favorites'
    },
    {
      id: 'allAzkar',
      title: t('navigation.allAzkar'),
      icon: 'list',
      onPress: () => navigation.navigate('Home', { showFavorites: false }),
      testID: 'grid-all-azkar'
    },
    {
      id: 'prayerTimes',
      title: t('navigation.prayerTimes'),
      icon: 'clock',
      onPress: async () => {
        const hasLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
        if (!hasLocation) {
          navigation.navigate('UnifiedPrayerSettings');
        } else {
          navigation.navigate('PrayerTimes');
        }
      },
      testID: 'grid-prayer-times'
    },
    {
      id: 'qibla',
      title: t('navigation.qibla'),
      icon: 'compass',
      onPress: async () => {
        const hasLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
        if (!hasLocation) {
          navigation.navigate('UnifiedPrayerSettings');
        } else {
          navigation.navigate('Qibla');
        }
      },
      testID: 'grid-qibla'
    },
    {
      id: 'share',
      title: t('navigation.shareApp'),
      icon: 'share-2',
      onPress: () => {
        Share.share({
          message: t('share.message'),
        });
      },
      testID: 'grid-share'
    },
    {
      id: 'contribute',
      title: t('navigation.contribute'),
      icon: 'help-circle',
      onPress: () => navigation.navigate('Contribute'),
      testID: 'grid-contribute'
    },
    {
      id: 'settings',
      title: t('navigation.settings'),
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
      testID: 'grid-settings'
    }
  ];

  // Calculate item dimensions responsively
  const itemWidth = Math.max(120, Math.min(180, (screenDimensions.width - 40) / numColumns - 10));
  const itemHeight = itemWidth;

  // Responsive icon and text sizes
  const iconSize = Math.max(24, Math.min(40, itemWidth / 5));
  const textSize = Math.max(12, Math.min(16, itemWidth / 10));
  const itemPadding = Math.max(10, Math.min(20, itemWidth / 10));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      testID={item.testID}
      onPress={item.onPress}
      style={{
        width: itemWidth,
        height: itemHeight,
        backgroundColor: colors.DGreen,
        borderRadius: 12,
        margin: 5,
        padding: itemPadding,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: colors.BYellow + '33'
      }}
    >
      <View style={{ marginBottom: 8 }}>
        <Feather name={item.icon} size={iconSize} color={colors.BYellow} />
      </View>
      <Text
        style={[
          textStyles.body,
          {
            color: colors.BYellow,
            textAlign: 'center',
            fontSize: textSize,
            fontWeight: 'bold'
          }
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <CustomHeader
        title={t('app.name')}
        isHome={true}
        navigation={navigation}
      />

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns} // To re-render on numColumns change 
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 100,
            alignItems: 'center'
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}