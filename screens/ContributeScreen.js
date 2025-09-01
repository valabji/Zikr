import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  I18nManager,
  Clipboard
} from 'react-native';
import { useColors } from '../constants/Colors';
import { t } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { Feather } from '@expo/vector-icons';

export default function ContributeScreen({ navigation }) {
  const colors = useColors();

  const openExcelSheet = () => {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBPd_n5b0kvOR4ImV-vmh3509yAvDFAjysFeMvJMYcUJzd8H2jY8MQEd_1rPjBFwSr1_SRmpdNsvzq/pub?output=xlsx';
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t('contribute.error'),
        t('contribute.linkError')
      );
    });
  };

  const openEmail = (subject = 'Zikr Contribution') => {
    const emailUrl = `mailto:zikr@valabji.com?subject=${subject}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        t('contribute.error'),
        t('contribute.emailError')
      );
    });
  };

  const copyEmail = () => {
    Clipboard.setString('zikr@valabji.com');
    Alert.alert(
      t('contribute.copied'),
      t('contribute.emailCopied')
    );
  };

  const openGitHub = () => {
    const githubUrl = 'https://github.com/valabji/Zikr';
    Linking.openURL(githubUrl).catch(() => {
      Alert.alert(
        t('contribute.error'),
        t('contribute.linkError')
      );
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }}>
      <CHeader navigation={navigation} title={t('navigation.contribute')} />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: 15,
          padding: 20,
          marginBottom: 20
        }}>
          <Text style={{
            color: colors.BYellow,
            fontSize: 24,
            fontFamily: "Cairo_600SemiBold",
            textAlign: 'center',
            marginBottom: 15
          }}>
            {t('contribute.title')}
          </Text>
          
          <Text style={{
            color: colors.BYellow,
            fontSize: 16,
            fontFamily: "Cairo_400Regular",
            lineHeight: 24,
            marginBottom: 20
          }}>
            {t('contribute.description')}
          </Text>
        </View>

        {/* For Normal Users */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: 15,
          padding: 20,
          marginBottom: 20
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <Feather name="users" size={24} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: 20,
              fontFamily: "Cairo_600SemiBold",
              marginLeft: 10,
            }}>
              {t('contribute.forUsers')}
            </Text>
          </View>
          
          <Text style={{
            color: colors.BYellow,
            fontSize: 14,
            fontFamily: "Cairo_400Regular",
            lineHeight: 22,
            marginBottom: 20
          }}>
            {t('contribute.usersDescription')}
          </Text>

          <TouchableOpacity
            onPress={openExcelSheet}
            style={{
              backgroundColor: colors.BGreen,
              borderRadius: 10,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}
          >
            <Feather name="download" size={20} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: 16,
              fontFamily: "Cairo_500Medium",
              marginLeft: 10,
            }}>
              {t('contribute.downloadExcel')}
            </Text>
          </TouchableOpacity>

          {/* Email Section */}
          <View style={{
            backgroundColor: colors.BGreen,
            borderRadius: 10,
            padding: 15,
            marginBottom: 20
          }}>
            <Text style={{
              color: colors.BYellow,
              fontSize: 16,
              fontFamily: "Cairo_600SemiBold",
              marginBottom: 15
            }}>
              {t('contribute.contactUs')}
            </Text>
            
            {/* Email Address with Copy */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 15,
              backgroundColor: colors.DGreen,
              borderRadius: 8,
              padding: 12
            }}>
              <Feather name="mail" size={18} color={colors.BYellow} />
              <Text style={{
                color: colors.BYellow,
                fontSize: 14,
                fontFamily: "Cairo_400Regular",
                marginLeft: 8,
                flex: 1
              }}>
                zikr@valabji.com
              </Text>
              <TouchableOpacity onPress={copyEmail} testID="copy-email">
                <Feather name="copy" size={18} color={colors.BYellow} />
              </TouchableOpacity>
            </View>

            {/* Email Options */}
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <TouchableOpacity
                onPress={() => openEmail('Zikr Reference Checking')}
                style={{
                  backgroundColor: colors.DGreen,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  width: '48%',
                  height: 54
                }}
              >
                <Feather name="check-circle" size={16} color={colors.BYellow} />
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 12,
                  fontFamily: "Cairo_500Medium",
                  marginLeft: 6,
                  textAlign: 'center',
                  flex: 1
                }}>
                  {t('contribute.referenceChecking')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openEmail('Zikr Translation Help')}
                style={{
                  backgroundColor: colors.DGreen,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  width: '48%',
                  height: 54
                }}
              >
                <Feather name="globe" size={16} color={colors.BYellow} />
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 12,
                  fontFamily: "Cairo_500Medium",
                  marginLeft: 6,
                  textAlign: 'center',
                  flex: 1
                }}>
                  {t('contribute.translation')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openEmail('Zikr App Suggestions')}
                style={{
                  backgroundColor: colors.DGreen,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  width: '48%',
                  height: 54
                }}
              >
                <Feather name="message-circle" size={16} color={colors.BYellow} />
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 12,
                  fontFamily: "Cairo_500Medium",
                  marginLeft: 6,
                  textAlign: 'center',
                  flex: 1
                }}>
                  {t('contribute.suggestions')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openEmail('Zikr Bug Report')}
                style={{
                  backgroundColor: colors.DGreen,
                  borderRadius: 8,
                  padding: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48%',
                  height: 54
                }}
              >
                <Feather name="alert-triangle" size={16} color={colors.BYellow} />
                <Text style={{
                  color: colors.BYellow,
                  fontSize: 12,
                  fontFamily: "Cairo_500Medium",
                  marginLeft: 6,
                  textAlign: 'center',
                  flex: 1
                }}>
                  {t('contribute.bugReports')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* For Developers */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: 15,
          padding: 20,
          marginBottom: 20
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <Feather name="code" size={24} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: 20,
              fontFamily: "Cairo_600SemiBold",
              marginLeft: 10,
            }}>
              {t('contribute.forDevelopers')}
            </Text>
          </View>
          
          <Text style={{
            color: colors.BYellow,
            fontSize: 14,
            fontFamily: "Cairo_400Regular",
            lineHeight: 22,
            marginBottom: 20
          }}>
            {t('contribute.developersDescription')}
          </Text>

          <TouchableOpacity
            onPress={openGitHub}
            style={{
              backgroundColor: colors.BGreen,
              borderRadius: 10,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Feather name="github" size={20} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: 16,
              fontFamily: "Cairo_500Medium",
              marginLeft: 10,
            }}>
              {t('contribute.openGitHub')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: 15,
          padding: 20,
          marginBottom: 30
        }}>
          <Text style={{
            color: colors.BYellow,
            fontSize: 14,
            fontFamily: "Cairo_400Regular",
            textAlign: 'center',
            lineHeight: 22,
            fontStyle: 'italic'
          }}>
            {t('contribute.thankYou')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
