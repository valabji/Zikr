import * as React from 'react';
import CustomHeader from '@/components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TextInput, I18nManager, Platform } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors, getItemColors } from "@/constants/Colors";
import { textStyles } from '@/constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign, getDirectionalSpacing } from '@/locales/i18n';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { getAzkar, setAzkar as saveAzkar, subscribeAzkar } from '@/utils/AzkarStore';
import { MuslimIconSvg } from '@/components/MuslimIconSvg';
import { MuslimIconEnSvg } from '@/components/MuslimIconEnSvg';
import { LinearGradient } from 'expo-linear-gradient';
import { Hbg } from '@/components/Hbg';
import { useAzkarHistory } from '@/utils/AzkarHistory';
import DailyHadithCard from '@/components/DailyHadithCard';
import AzkarSortSheet from '@/components/AzkarSortSheet';
import { loadAzkarOrder, saveAzkarOrder, orderCategories } from '@/utils/AzkarOrder';

const normalizeArabic = (v) => ("" + v).replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")

export default function HomeScreen({ navigation, route }) {
  const colors = useColors();
  const [s, setS] = React.useState(false)
  const [st, setSt] = React.useState("")
  const [Azkar, setAzkar] = React.useState(getAzkar())
  const [screenDimensions, setScreenDimensions] = React.useState(Dimensions.get('window'))

  const [showFavorites, setShowFavorites] = React.useState(route?.params?.showFavorites || false)
  const { stats: azkarStats } = useAzkarHistory()
  const [order, setOrder] = React.useState({ mode: 'default', manual: [] })
  const [sortVisible, setSortVisible] = React.useState(false)

  React.useEffect(() => {
    loadAzkarOrder().then(setOrder)
  }, [])

  const categories = React.useMemo(() => {
    const seen = new Set()
    const list = []
    Azkar.forEach((item, index) => {
      if (!seen.has(item.category)) {
        seen.add(item.category)
        list.push({ name: item.category, index, fav: item.fav == true })
      }
    })
    return orderCategories(list, order)
  }, [Azkar, order])

  const changeOrder = (next) => {
    setOrder(next)
    saveAzkarOrder(next)
  }

  React.useEffect(() => {
    if (route?.params?.showFavorites !== undefined) {
      setShowFavorites(route.params.showFavorites)
    }
  }, [route?.params?.showFavorites])

  // Listen for dimension changes
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window)
    })

    return () => subscription?.remove()
  }, [])

  const width = screenDimensions.width

  const Item = ({ name, onPress, fav, index, position }) => {
    let size = 32
    const [fv, setFv] = React.useState(fav)
    const g = getItemColors(colors, position)
    const fg = g ? g.fg : colors.BYellow
    return <TouchableOpacity
      testID="zikr-item"
      onPress={onPress}
      style={{
        width: width - 20,
        height: 48,
        ...getDirectionalMixedSpacing({ marginLeft: 10, marginRight: 10 }),
        marginTop: 5,
        backgroundColor: g ? 'transparent' : colors.DGreen,
        borderRadius: g ? 12 : 0,
        overflow: 'hidden',
        flexDirection: "row",
      }}>
      {g && <LinearGradient colors={g.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />}
      {isRTL() ? (
        <MuslimIconSvg color={fg} backgroundColor={g ? g.gradient[0] : colors.DGreen} width={48} height={48} />
      ) : (
        <MuslimIconEnSvg color={fg} backgroundColor={g ? g.gradient[0] : colors.DGreen} width={48} height={48} />
      )}
      <View style={{
        justifyContent: "center",
        flex: 1,
        paddingHorizontal: 2
      }}  >
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={[
          textStyles.body,
          {
            color: fg,
            textAlign: getRTLTextAlign('left'),
          }
        ]}>{name}</Text>
      </View>
      <TouchableOpacity
        testID="fav-toggle"
        onPress={() => {
          setFv(!fv)
          var Azkar2 = []
          for (let i = 0; i < Azkar.length; i++) {
            if (i == index) {
              let o = {}
              Object.keys(Azkar[i]).forEach(e => {
                o[e] = Azkar[i][e]
              });
              o["fav"] = !fv
              Azkar2.push(o)
            } else {
              Azkar2.push(Azkar[i])
            }
          }
          saveAzkar(JSON.parse(JSON.stringify(Azkar2)))
        }}
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          ...getDirectionalMixedSpacing({ marginRight: 5 })
        }} >
        <Ionicons name={fv ? "heart" : "heart-outline"} color={fg} size={32} testID="fav-indicator" />
      </TouchableOpacity>
    </TouchableOpacity>
  }

  React.useEffect(() => subscribeAzkar(setAzkar), [])

  const SearchHeader = () => {
    return (
      <LinearGradient
        colors={colors.headerGradient || [colors.BGreen, colors.DGreen]}
        start={colors.headerGradient ? { x: 0, y: 0 } : undefined}
        end={colors.headerGradient ? { x: 1, y: 1 } : undefined}
        style={{
          flexDirection: "row",
          height: 64,
          elevation: 1,
          shadowColor: colors.shadowColor,
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.20,
          shadowRadius: 1.41,
          elevation: 2,
        }}>
        {colors.hidePattern ? null : (
          <View style={{ flexDirection: "row", position: "absolute", left: 0, top: 0, width, height: 64 }}>
            <Hbg color={(colors.patternColor || colors.DGreen) + "55"} width={width} />
            <Hbg color={(colors.patternColor || colors.DGreen) + "55"} width={width} />
          </View>
        )}

        {/* Back/Close button */}
        <View style={{ justifyContent: 'center' }}>
          <TouchableOpacity
            testID="close-search"
            onPress={() => {
              setS(false);
              setSt("");
            }}
            style={{ padding: 8 }}
          >
            <Feather
              name={isRTL() ? "arrow-right" : "arrow-left"}
              size={30}
              style={{ marginHorizontal: 10 }}
              color={colors.BYellow}
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={{ flex: 1, justifyContent: 'center', ...getDirectionalMixedSpacing({marginRight:18}) }}>
          <TextInput
            testID="search-input"
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.BGreen}
            onChangeText={v => {
              setSt(v)
            }}
            value={st}
            autoFocus={true}
            style={[
              textStyles.withFont({
                fontSize: 18,
                color: colors.BYellow,
                textAlign: isRTL() ? 'right' : 'left',
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.DGreen + "40",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.BYellow + "30"
              })
            ]} />
        </View>

        {/* Clear button */}
        <View style={{ position: 'absolute', right: 10, top: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 }}>
          {st.length > 0 && (
            <TouchableOpacity
              testID="clear-search"
              onPress={() => setSt("")}
              style={{ padding: 8 }}
            >
              <Feather
                name="x"
                size={24}
                color={colors.BYellow}
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  };

  const StreakBadge = ({ icon, label, streak, doneToday }) => (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.DGreen,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      ...getDirectionalMixedSpacing({ marginRight: 8, marginLeft: 8 }),
    }}>
      <Feather name={icon} color={colors.BYellow} size={18} />
      <View style={getDirectionalMixedSpacing({ marginLeft: 8 })}>
        <Text style={[textStyles.body, { color: colors.BYellow, fontSize: 13 }]} numberOfLines={1}>{label}</Text>
        <Text style={[textStyles.bodySmall, { color: colors.BYellow, opacity: 0.85, fontSize: 11 }]}>
          {streak + ' ' + t('zikr.dayStreak')}
        </Text>
      </View>
      {doneToday ? <Feather name="check-circle" color={colors.BYellow} size={16} style={getDirectionalMixedSpacing({ marginLeft: 6 })} /> : null}
    </View>
  )

  return (
    <View style={{ flex: 1 }} testID="home-screen">
      {s ? (
        <SearchHeader />
      ) : (
        <CustomHeader
          title={t('app.name')}
          isHome={true}
          navigation={navigation}
          Left={() => {
            return <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 12 }}>
              <TouchableOpacity
                testID="sort-toggle"
                onPress={() => {
                  setSortVisible(true)
                }}
                style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}>
                <Ionicons name="swap-vertical" color={colors.BYellow} size={32} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="favorites-toggle"
                onPress={() => {
                  setShowFavorites(!showFavorites)
                }}
                style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}>
                <Ionicons name={showFavorites ? "heart" : "heart-outline"} color={colors.BYellow} size={32} />
              </TouchableOpacity>
              <TouchableOpacity
                testID="search-toggle"
                onPress={() => {
                  setS(!s)
                }}
                style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}>
                <Feather name="search" color={colors.BYellow} size={32} />
              </TouchableOpacity>
            </View>
          }}
        />
      )}
      {/* <React9Slice width={256}
          height={256}
          border={85}
          // image="@/assets/images/bub.webp"
          imageSize={{ x: 1024, y: 512 }}>
          HELLO WORLD!
        </React9Slice> */}
      {/* <ImageCapInset
        source={require("@/assets/images/bg.png")}
        capInsets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      /> */}
      <ImageBackground
        // source={require("@/assets/images/bg.png")}
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: colors.BGreen }}
      >
        {!s && !showFavorites && (azkarStats.morningStreak > 0 || azkarStats.eveningStreak > 0 || azkarStats.morningDoneToday || azkarStats.eveningDoneToday) ? (
          <View testID="azkar-streak-banner" style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
            <StreakBadge icon="sunrise" label={t('zikr.morningAzkar')} streak={azkarStats.morningStreak} doneToday={azkarStats.morningDoneToday} />
            <StreakBadge icon="moon" label={t('zikr.eveningAzkar')} streak={azkarStats.eveningStreak} doneToday={azkarStats.eveningDoneToday} />
          </View>
        ) : null}
        {!s && !showFavorites ? (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <DailyHadithCard />
          </View>
        ) : null}
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {showFavorites && !categories.some(c => c.fav) ? (
            <View testID="empty-favorites" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[textStyles.body, { color: colors.BYellow, textAlign: 'center' }]}>
                {t('favorites.empty')}
              </Text>
            </View>
          ) : (
            (showFavorites ? categories.filter(c => c.fav) : categories).map((c, i) => {
              if (!s || st == "" || normalizeArabic(c.name).includes(normalizeArabic(st))) {
                return <Item key={c.name} name={c.name} fav={c.fav} index={c.index} position={i} onPress={() => {
                  navigation.navigate("Screen2", { name: c.name })
                }} />
              }
            })
          )}
        </ScrollView>

      </ImageBackground>
      <AzkarSortSheet
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        order={order}
        items={categories.map(c => ({ key: c.name, label: c.name }))}
        onChange={changeOrder}
      />
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null,
};
