import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { DATA_SOURCES, LICENSES } from '../constants/AboutConstants';

export default function CreditsScreen({ navigation }) {
  const colors = useColors();

  const openUrl = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert(t('about.error'), t('about.linkError'));
    });
  };

  const card = {
    backgroundColor: colors.DGreen,
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
  };

  const heading = {
    color: colors.BYellow,
    fontSize: 18,
    fontFamily: 'Cairo_400Regular',
    marginBottom: 12,
    textAlign: getRTLTextAlign('left'),
  };

  const Row = ({ children, onPress, last, testID }) => {
    const inner = (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.BGreen,
      }}>
        {children}
      </View>
    );
    return onPress ? (
      <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>
    ) : (
      <View testID={testID}>{inner}</View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="credits-screen-root">
      <CHeader navigation={navigation} title={t('credits.title')} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={card}>
          <Text style={{
            color: colors.BYellow,
            fontSize: 15,
            fontFamily: 'Cairo_400Regular',
            lineHeight: 24,
            textAlign: getRTLTextAlign('left'),
          }}>{t('credits.intro')}</Text>
        </View>

        <View style={card}>
          <Text style={heading}>{t('credits.dataSources')}</Text>
          {DATA_SOURCES.map((src, i) => (
            <Row
              key={src.roleKey}
              testID={`credit-source-${src.roleKey}`}
              last={i === DATA_SOURCES.length - 1}
              onPress={src.url ? () => openUrl(src.url) : null}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 13,
                  fontFamily: 'Cairo_400Regular',
                  opacity: 0.8,
                  textAlign: getRTLTextAlign('left'),
                }}>{t(`credits.sources.${src.roleKey}`)}</Text>
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 15,
                  fontFamily: 'Cairo_400Regular',
                  marginTop: 2,
                  textAlign: getRTLTextAlign('left'),
                }}>{t(`credits.sourceNames.${src.roleKey}`)}</Text>
              </View>
              {src.url ? <Feather name="external-link" size={18} color={colors.BYellow} /> : null}
            </Row>
          ))}
        </View>

        <View style={card}>
          <Text style={heading}>{t('credits.licenses')}</Text>
          {LICENSES.map((lib, i) => (
            <Row
              key={lib.name}
              testID={`credit-license-${i}`}
              last={i === LICENSES.length - 1}
              onPress={lib.url ? () => openUrl(lib.url) : null}
            >
              <Text style={{
                color: colors.BYellow,
                fontSize: 15,
                fontFamily: 'Cairo_400Regular',
                flex: 1,
                textAlign: getRTLTextAlign('left'),
              }}>{lib.name}</Text>
              <Text style={{
                color: colors.BGreen,
                backgroundColor: colors.BYellow,
                fontSize: 11,
                fontFamily: 'Cairo_400Regular',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 6,
                overflow: 'hidden',
                ...getDirectionalMixedSpacing({ marginLeft: 10, marginRight: 10 }),
              }}>{lib.license}</Text>
            </Row>
          ))}
        </View>

        <View style={card}>
          <Text style={heading}>{t('credits.thanks')}</Text>
          <Text style={{
            color: colors.BYellow,
            fontSize: 15,
            fontFamily: 'Cairo_400Regular',
            lineHeight: 24,
            textAlign: getRTLTextAlign('left'),
          }}>{t('credits.thanksBody')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
