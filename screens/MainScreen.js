import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TextInput, I18nManager, Platform } from 'react-native'
import { StackActions } from '@react-navigation/native';
import { useColors } from "../constants/Colors";
import { textStyles } from '../constants/Fonts';
import { t, isRTL, getDirectionalMixedSpacing, getRTLTextAlign, getDirectionalSpacing } from '../locales/i18n';
// import Azkar from '../constants/Azkar.js';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mystore } from '../redux/store';
import { MuslimIconSvg } from '../components/MuslimIconSvg';
import { MuslimIconEnSvg } from '../components/MuslimIconEnSvg';
import { LinearGradient } from 'expo-linear-gradient';
import { Hbg } from '../components/Hbg';
// import {
//   AdMobBanner,
//   AdMobInterstitial,
//   PublisherBanner,
//   AdMobRewarded,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

const Banner = "ca-app-pub-1740754568229700/6853520443"
const Interstatel = "ca-app-pub-1740754568229700/7975030420"

export default function HomeScreen({ navigation, route }) {
  const colors = useColors();
  const [s, setS] = React.useState(false)
  const [st, setSt] = React.useState("")
  const [ft, setFt] = React.useState(true)
  const [Azkar, setAzkar] = React.useState(mystore.getState().obj.Azkar)
  const [screenDimensions, setScreenDimensions] = React.useState(Dimensions.get('window'))

  // Get showFavorites parameter from route params, default to false (show all)
  const showFavorites = route?.params?.showFavorites || false

  // Listen for dimension changes
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window)
    })

    return () => subscription?.remove()
  }, [])

  const width = screenDimensions.width

  const Item = ({ name, onPress, fav, index }) => {
    let size = 32
    const [fv, setFv] = React.useState(fav)
    return <TouchableOpacity
      testID="zikr-item"
      onPress={onPress}
      style={{
        width: width - 20,
        height: 48,
        ...getDirectionalMixedSpacing({ marginLeft: 10, marginRight: 10 }),
        marginTop: 5,
        backgroundColor: colors.DGreen,
        flexDirection: "row",
      }}>
      {isRTL() ? (
        <MuslimIconSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={48} height={48} />
      ) : (
        <MuslimIconEnSvg color={colors.BYellow} backgroundColor={colors.DGreen} width={48} height={48} />
      )}
      <View style={{
        justifyContent: "center",
        flex: 1,
        paddingHorizontal: 2
      }}  >
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={[
          textStyles.body,
          {
            color: colors.BYellow,
            textAlign: getRTLTextAlign('left'),
          }
        ]}>{name}</Text>
      </View>
      <TouchableOpacity
        testID="fav-toggle"
        onPress={() => {
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
            // Azkar2.push(Azkar[i])
          }
          // Azkar2[index].fav = !fv
          Azkar2 = JSON.parse(JSON.stringify(Azkar2))
          setFv(!fv)
          global.zikr = JSON.stringify(Azkar2)
          mystore.dispatch({ type: 'change', "obj": { "Azkar": Azkar2 } })
          AsyncStorage.setItem("@zikr", JSON.stringify(Azkar2))
        }}
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          ...getDirectionalMixedSpacing({ marginRight: 5 })
        }} >
        <AntDesign name={fv ? "heart" : "hearto"} color={colors.BYellow} size={32} testID="fav-indicator" />
      </TouchableOpacity>
    </TouchableOpacity>
  }

  const chaged = () => {
    try {
      setAzkar(mystore.getState().obj.Azkar)
    } catch (e) {

    }
  }

  if (ft) {
    setFt(false)
    mystore.subscribe(chaged)
    // setTimeout(() => {
    //   AdMobInterstitial.setAdUnitID(Interstatel).then(() => {
    //     AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true }).then(() => {
    //       AdMobInterstitial.showAdAsync()
    //     })
    //   })
    // }, 3000);
  }

  // Custom Search Header Component
  const SearchHeader = () => {
    return (
      <LinearGradient
        colors={[colors.BGreen, colors.DGreen]}
        locations={[0, 1]}
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
        <View style={{ flexDirection: "row", position: "absolute", left: 0, top: 0, width, height: 64 }}>
          <Hbg color={colors.DGreen + "55"} width={width} />
          <Hbg color={colors.DGreen + "55"} width={width} />
        </View>

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

  let p = ""
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
            return <TouchableOpacity
              testID="search-toggle"
              onPress={() => {
                setS(!s)
              }}
              style={{ flex: 1, justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 20 }}>
              <Feather name="search" color={colors.BYellow} size={32} />
            </TouchableOpacity>
          }}
        />
      )}
      {/* <React9Slice width={256}
          height={256}
          border={85}
          // image="../assets/images/bub.webp"
          imageSize={{ x: 1024, y: 512 }}>
          HELLO WORLD!
        </React9Slice> */}
      {/* <ImageCapInset
        source={require("../assets/images/bg.png")}
        capInsets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      /> */}
      <ImageBackground
        // source={require("../assets/images/bg.png")}
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: colors.BGreen }}
      >
        {/* <AdMobBanner
          bannerSize="fullBanner"
          adUnitID={Banner} // Test ID, Replace with your-admob-unit-id
          servePersonalizedAds={true} // true or false
          onDidFailToReceiveAdWithError={err=>{
            console.warn(err)
          }} /> */}
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {showFavorites ? (
            // Favorites view with search
            Azkar.filter(i => i.fav).length === 0 ?
              <View testID="empty-favorites" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[textStyles.body, { color: colors.BYellow, textAlign: 'center' }]}>
                  {t('favorites.empty')}
                </Text>
              </View>
              :
              Azkar.map((i, index) => {
                if (i.fav) {
                  const cat = "" + i.category
                  let ccat = cat.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")
                  let cst = st.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")

                  // Apply search filter to favorites too
                  if (!s || st == "" || ccat.includes(cst)) {
                    return <Item
                      key={index}
                      name={i.category}
                      fav={i.fav == true}
                      index={index}
                      onPress={() => {
                        navigation.navigate("Screen2", { name: i.category })
                      }}
                    />
                  }
                }
              })
          ) : (
            // All items view with search functionality
            Azkar.map((i, index) => {
              const cat = "" + i.category
              let ccat = cat.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")
              let cst = st.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")
              if (cat != p) {
                p = cat
                if (!s || st == "" || ccat.includes(cst)) {
                  return <Item key={index} name={cat} fav={i.fav == true} index={index} onPress={() => {
                    navigation.navigate("Screen2", { name: cat })
                  }} />
                }
              }
            })
          )}
        </ScrollView>

      </ImageBackground>
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null,
};
