import * as React from 'react';
import CustomHeader from '@/components/CHeader'
import { Text, View, SafeAreaView, Dimensions, ScrollView, I18nManager, Alert, BackHandler, Image, ImageBackground, TouchableOpacity, Platform } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, useIsBrightTheme } from "@/constants/Colors";
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, getRTLTextAlign, getDirectionalSpacing } from '@/locales/i18n';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getAzkar } from '@/utils/AzkarStore';
import AzkarSortSheet from '@/components/AzkarSortSheet';
import { loadAzkarItemOrder, saveAzkarItemOrder, orderAzkarItems } from '@/utils/AzkarOrder';
import AzkarSwiper from '@/components/AzkarSwiper';
import AzkarOnePageScroll from '@/components/AzkarOnePageScroll';
import AzkarOnePageScrollCompact from '@/components/AzkarOnePageScrollCompact';
import { useAudio } from '@/utils/Sounds.js';
import { BackgroundSvg1 } from '@/components/BackgroundSvg1';
import { getFontSize } from '@/utils/FontSize';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_KEYS } from '@/constants/StorageKeys';

// import {
//   AdMobBanner,
//   AdMobInterstitial,
//   PublisherBanner,
//   AdMobRewarded,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

const Banner = "ca-app-pub-1740754568229700/6853520443"
const Interstatel = "ca-app-pub-1740754568229700/7975030420"


export default function Screen2({ route, navigation }) {
  const colors = useColors();
  const name = route?.params?.name || "Azkar";
  const player = useAudio();
  const reverse = isRTL();
  const [zikrFontSize, setZikrFontSize] = React.useState(18);
  const [viewMode, setViewMode] = React.useState('swiper');

  // Load font size and view mode when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadSettings = async () => {
        const [fontSize, savedViewMode] = await Promise.all([
          getFontSize(),
          AsyncStorage.getItem(APP_KEYS.VIEW_MODE)
        ]);
        setZikrFontSize(fontSize);
        setViewMode(savedViewMode || 'swiper');
      };
      loadSettings();
    }, [])
  );

  const [itemOrder, setItemOrder] = React.useState({ mode: 'default', manual: [] });
  const [sortVisible, setSortVisible] = React.useState(false);
  const [orderVersion, setOrderVersion] = React.useState(0);

  React.useEffect(() => { loadAzkarItemOrder(name).then(setItemOrder) }, [name]);

  const orderedItems = React.useMemo(
    () => orderAzkarItems(getAzkar().filter(i => i.category == name), itemOrder),
    [name, itemOrder]
  );
  const azkarList = orderedItems.map(p => p.item);
  const sheetItems = orderedItems.map(p => ({ key: p.key, label: p.item.zekr }));

  const changeItemOrder = (next) => {
    setItemOrder(next);
    setOrderVersion(v => v + 1);
    saveAzkarItemOrder(name, next);
  };

  const HeaderButtons = () => (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
      <TouchableOpacity testID="item-sort-toggle" onPress={() => setSortVisible(true)} style={{ padding: 6 }}>
        <Ionicons name="swap-vertical" size={22} color={colors.BYellow} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Contribute')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          ...getDirectionalSpacing(0, 20),
        }}
      >
        <Feather
          name="edit"
          size={20}
          color={colors.BYellow}
          style={{ marginRight: isRTL() ? 0 : 5, marginLeft: isRTL() ? 5 : 0 }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, flexGrow: 1, backgroundColor: colors.BGreen }} testID="screen2-container">
      <BackgroundSvg1 color={colors.BYellow} />
      <CustomHeader title={name} isHome={false} navigation={navigation} Left={HeaderButtons} />
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && {
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh'
        })
      }}>
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err => {
            console.warn(err)
          }} /> */}
        {viewMode === 'swiper' ? (
          <AzkarSwiper key={`swiper-${zikrFontSize}-${orderVersion}`} azkarList={azkarList} zikrFontSize={zikrFontSize} />
        ) : viewMode === 'onePageScrollCompact' ? (
          <AzkarOnePageScrollCompact key={`scroll-compact-${zikrFontSize}-${orderVersion}`} azkarList={azkarList} zikrFontSize={zikrFontSize} />
        ) : (
          <AzkarOnePageScroll key={`scroll-${zikrFontSize}-${orderVersion}`} azkarList={azkarList} zikrFontSize={zikrFontSize} />
        )}
      </View>
      <AzkarSortSheet
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        order={itemOrder}
        items={sheetItems}
        onChange={changeItemOrder}
        modes={['default', 'manual']}
      />
    </View>
  );
}
