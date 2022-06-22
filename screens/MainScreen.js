import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { StackActions } from '@react-navigation/native';
import Clrs from "../constants/Colors";
// import Azkar from '../constants/Azkar.js';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mystore } from '../App';
const width = Dimensions.get("screen").width

export default function HomeScreen({ navigation }) {
  const [s, setS] = React.useState(false)
  const [st, setSt] = React.useState("")
  const [ft, setFt] = React.useState(true)
  const [Azkar, setAzkar] = React.useState(mystore.getState().obj.Azkar)

  const Item = ({ name, onPress, fav, index }) => {
    let size = 32
    const [fv, setFv] = React.useState(fav)
    return <TouchableOpacity
      onPress={onPress}
      style={{
        width: width - 20,
        // flex:0.8,
        height: 48,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 5,
        backgroundColor: Clrs.DGreen,
        flexDirection: "row-reverse",
      }}>
      <Image
        source={require("../assets/images/muslim.png")}
        style={{
          width: 48, height: 48
        }}
      />
      <View style={{ justifyContent: "center" }} >
        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{
          color: Clrs.BYellow,
          // fontSize:22,
          // fontSize: name.length > 35 ? 12 : name.length > 25 ? 16 : 22,
          fontSize: 16,
          // marginTop: 6,
          marginRight: -20,
          textAlign: "right",
          width: width - 48 - 48,
          // height: 32,
          fontFamily: "Cairo_400Regular",
        }}>{name}</Text>
      </View>
      <TouchableOpacity
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
        style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }} >
        <AntDesign name={fv ? "heart" : "hearto"} color={Clrs.BYellow} size={32} />
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
  }

  let p = ""
  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title="تطبيق ذِكْر" isHome={true} navigation={navigation}
        Left={() => {
          return <TouchableOpacity
            onPress={() => {
              setS(!s)
            }}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            {
              s ?
                <Feather name="rotate-cw" color={Clrs.BYellow} size={32} />
                :
                <Feather name="search" color={Clrs.BYellow} size={32} />
            }
          </TouchableOpacity>
        }} />
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
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: Clrs.BGreen }}
      >
        <View style={{ width: width, alignItems: "center", justifyContent: "center", marginBottom: 3, marginTop: 3, display: s ? "flex" : "none" }}>
          <View style={{ width: width - 20, alignItems: "center", justifyContent: "center", backgroundColor: Clrs.DGreen, width: width - 20, paddingTop: 10, paddingBottom: 10, paddingLeft: 15, paddingRight: 15, borderWidth: 1, borderColor: "#fff", borderRadius: 12 }}>
            <TextInput
              placeholder="بحث..."
              placeholderTextColor={Clrs.BGreen}
              onChangeText={v => {
                setSt(v)
              }}
              style={{ width: width - 40, fontSize: 24, color: Clrs.BYellow, textAlign: "right" }} />
          </View>
        </View>
        <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}>

          {Azkar.map((i, index) => {
            const cat = "" + i.category
            let ccat = cat.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")
            let cst = st.replace("ة", "ه").replace("أ", "ا").replace("آ", "ا").replace("إ", "ا").replace("ى", "ي")
            if (cat != p) {
              p = cat
              if (!s || st == "" || ccat.includes(cst)) {
                return <Item key={Math.random()*9999} name={cat} fav={i.fav == true} index={index} onPress={() => {
                  navigation.navigate("Screen2", { name: cat })
                }} />
              }
            }

          })}
        </ScrollView>

      </ImageBackground>
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null,
};
