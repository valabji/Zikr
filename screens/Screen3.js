import * as React from 'react';
import CustomHeader from '../components/CHeader'
import { Text, Modal, View, SafeAreaView, Dimensions, Image, ImageBackground, ScrollView, TouchableOpacity, TouchableHighlight, StyleSheet } from 'react-native'
import { StackActions } from '@react-navigation/native';
import Clrs from "../constants/Colors";
import { Feather } from '@expo/vector-icons';


export default function Screen2({ route, navigation }) {
  const [i, setI] = React.useState(0)
  //TODO: change to FALSE
  const [mv, setMv] = React.useState(false)
  return (
    <View style={{ flex: 1 }}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={mv}
        onRequestClose={() => {
          setMv(false)
        }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "white",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.20,
          shadowRadius: 1.41,
          justifyContent: "center",alignItems:"center",
          elevation: 2,
          width: 240, height: 220, borderRadius: 20 }}>
            <Feather name="info" size={64} color={Clrs.DYellow} />
            <Text style={{
              color: Clrs.DGreen,
              fontSize: 20,
              textAlign:"right",
              marginTop: 10,
              marginRight: 15,
              fontFamily: "Cairo_400Regular",
            }}
            >هل تريد تصفير العداد ؟</Text>

            <View style={{ flexDirection: "row-reverse",width:"100%", marginTop: 20, justifyContent: "space-around" }}>
              <TouchableHighlight
                onPress={() => {
                  setI(0)
                  setMv(false)
                }}
                style={{ backgroundColor: Clrs.DYellow, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={{
                  color: Clrs.DGreen,
                  fontSize: 20,
                  lineHeight: 28,
                  fontFamily: "Cairo_400Regular",
                }}>نعم</Text>
              </TouchableHighlight>
              <TouchableHighlight
                onPress={() => {
                  setMv(false)
                }}
                style={{ backgroundColor: Clrs.BGreen, width: 80, justifyContent: "center", alignItems: "center", height: 38, borderRadius: 12 }}
              >
                <Text style={{
                  color: Clrs.BYellow,
                  fontSize: 20,
                  lineHeight: 28,
                  fontFamily: "Cairo_400Regular",
                }}>لا</Text>
              </TouchableHighlight>

            </View>
          </View>
        </View>
      </Modal>

      <CustomHeader title={"المسبحة"} isHome={true} navigation={navigation} Left={() => {
        return <TouchableOpacity
          onPress={() => {
            setMv(true)
          }}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Feather name="rotate-cw" color={Clrs.BYellow} size={32} />
        </TouchableOpacity>
      }} />
      <ImageBackground
        source={require("../assets/images/bg2.jpg")}
        style={{ flex: 1, resizeMode: "cover", alignItems: 'center', justifyContent: 'center', backgroundColor: Clrs.BGreen }}
      >
        {/* <View style={{ position: "absolute", top: 30, left: 0, justifyContent: "center", alignItems: "center", right: 0, width: "100%" }} >
          <Image
            source={require("../assets/images/ala.png")}
            style={{
              // opacity:0.5,
              width: 300, height: 100,
            }}
          />
        </View> */}
        <TouchableOpacity
          onPress={() => {
            setI(i + 1)
          }}
          style={{ flex: 1, justifyContent: "center", width: "100%", alignItems: "center" }}
        >
          <ImageBackground
            source={require("../assets/images/Star.png")}
            style={{ width: 256, height: 256, alignSelf: "center", justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                color: Clrs.BYellow,
                fontSize: 32,
              }}
            >{i}</Text>
          </ImageBackground>
        </TouchableOpacity>

      </ImageBackground>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  slide1: {
    flex: 1,
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  }
})
