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
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import CHeader from '../components/CHeader';
import { Feather } from '@expo/vector-icons';
import { CONTRIBUTE_CONSTANTS } from '../constants/ContributeConstants';

export default function ContributeScreen({ navigation }) {
  const colors = useColors();

  const openExcelSheet = () => {
    const url = CONTRIBUTE_CONSTANTS.EXCEL_SHEET_URL;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t('contribute.error'),
        t('contribute.linkError')
      );
    });
  };

  const openEmail = (subject = CONTRIBUTE_CONSTANTS.EMAIL_SUBJECTS.DEFAULT) => {
    const emailUrl = `mailto:${CONTRIBUTE_CONSTANTS.EMAIL_ADDRESS}?subject=${subject}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        t('contribute.error'),
        t('contribute.emailError')
      );
    });
  };

  const copyEmail = () => {
    Clipboard.setString(CONTRIBUTE_CONSTANTS.EMAIL_ADDRESS);
    Alert.alert(
      t('contribute.copied'),
      t('contribute.emailCopied')
    );
  };

  const openGitHub = () => {
    const githubUrl = CONTRIBUTE_CONSTANTS.GITHUB_URL;
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
        contentContainerStyle={{ padding: CONTRIBUTE_CONSTANTS.SPACING.CONTAINER_PADDING }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: CONTRIBUTE_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM
        }}>
          <Text style={[
            CONTRIBUTE_CONSTANTS.FONT_STYLES.TITLE,
            {
              color: colors.BYellow,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING
            }
          ]}>
            {t('contribute.title')}
          </Text>

          <Text style={{
            color: colors.BYellow,
            fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.BODY,
            fontFamily: "Cairo_400Regular",
            lineHeight: CONTRIBUTE_CONSTANTS.LINE_HEIGHTS.DEFAULT,
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM,
            textAlign: getRTLTextAlign('left')
          }}>
            {t('contribute.description')}
          </Text>
        </View>

        {/* For Normal Users */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: CONTRIBUTE_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING
          }}>
            <Feather name="users" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_LARGE} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SUBTITLE,
              fontFamily: "Cairo_400Regular",
              ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING }),
            }}>
              {t('contribute.forUsers')}
            </Text>
          </View>

          <Text style={{
            color: colors.BYellow,
            fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
            fontFamily: "Cairo_400Regular",
            lineHeight: CONTRIBUTE_CONSTANTS.LINE_HEIGHTS.SMALL,
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM,
            textAlign: getRTLTextAlign('left')
          }}>
            {t('contribute.usersDescription')}
          </Text>

          <TouchableOpacity
            onPress={openExcelSheet}
            style={{
              backgroundColor: colors.BGreen,
              borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.MEDIUM,
              padding: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM
            }}
          >
            <Feather name="download" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_MEDIUM} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.BODY,
              fontFamily: "Cairo_400Regular",
              ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING }),
            }}>
              {t('contribute.downloadExcel')}
            </Text>
          </TouchableOpacity>

          {/* Email Section */}
          <View style={{
            backgroundColor: colors.BGreen,
            borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.MEDIUM,
            padding: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING,
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM
          }}>
            <Text style={{
              color: colors.BYellow,
              fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.BODY,
              fontFamily: "Cairo_400Regular",
              marginBottom: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING
            }}>
              {t('contribute.contactUs')}
            </Text>

            {/* Email Address with Copy */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING,
              backgroundColor: colors.DGreen,
              borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.SMALL,
              padding: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING + 2
            }}>
              <Feather name="mail" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
              <Text style={{
                color: colors.BYellow,
                fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
                fontFamily: "Cairo_400Regular",
                textAlign: getRTLTextAlign('left'),
                ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.TINY_PADDING }),
                flex: 1
              }}>
                {CONTRIBUTE_CONSTANTS.EMAIL_ADDRESS}
              </Text>
              <TouchableOpacity onPress={copyEmail} testID="copy-email">
                <Feather name="copy" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
              </TouchableOpacity>
            </View>

            {/* Email Options */}
            <View>
              {/* Top row: Suggestions and Translation */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: CONTRIBUTE_CONSTANTS.SPACING.TINY_PADDING
              }}>
                <TouchableOpacity
                  onPress={() => openEmail(CONTRIBUTE_CONSTANTS.EMAIL_SUBJECTS.SUGGESTIONS)}
                  style={{
                    backgroundColor: colors.DGreen,
                    borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.SMALL,
                    padding: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_WIDTH,
                    minHeight: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_HEIGHT
                  }}
                >
                  <Feather name="message-circle" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_TINY} color={colors.BYellow} />
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL,
                    fontFamily: "Cairo_400Regular",
                    ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.EXTRA_SMALL_PADDING }),
                    textAlign: 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                  }}>
                    {t('contribute.suggestions')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openEmail(CONTRIBUTE_CONSTANTS.EMAIL_SUBJECTS.TRANSLATION)}
                  style={{
                    backgroundColor: colors.DGreen,
                    borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.SMALL,
                    padding: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_WIDTH,
                    minHeight: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_HEIGHT
                  }}
                >
                  <Feather name="globe" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_TINY} color={colors.BYellow} />
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL,
                    fontFamily: "Cairo_400Regular",
                    ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.EXTRA_SMALL_PADDING }),
                    textAlign: 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                  }}>
                    {t('contribute.translation')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom row: Reference Checking and Bug Reports */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
                <TouchableOpacity
                  onPress={() => openEmail(CONTRIBUTE_CONSTANTS.EMAIL_SUBJECTS.REFERENCE_CHECKING)}
                  style={{
                    backgroundColor: colors.DGreen,
                    borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.SMALL,
                    padding: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING + 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_WIDTH,
                    minHeight: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_HEIGHT + 10
                  }}
                >
                  <Feather name="check-circle" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
                    fontFamily: "Cairo_400Regular",
                    ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.EXTRA_SMALL_PADDING }),
                    textAlign: 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                  }}>
                    {t('contribute.referenceChecking')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openEmail(CONTRIBUTE_CONSTANTS.EMAIL_SUBJECTS.BUG_REPORT)}
                  style={{
                    backgroundColor: colors.DGreen,
                    borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.SMALL,
                    padding: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING + 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_WIDTH,
                    minHeight: CONTRIBUTE_CONSTANTS.BUTTON_DIMENSIONS.EMAIL_OPTION_HEIGHT + 10
                  }}
                >
                  <Feather name="alert-triangle" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
                  <Text style={{
                    color: colors.BYellow,
                    fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
                    fontFamily: "Cairo_400Regular",
                    ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.EXTRA_SMALL_PADDING }),
                    textAlign: 'center',
                    flex: 1,
                    flexWrap: 'wrap'
                  }}>
                    {t('contribute.bugReports')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* For Developers */}
        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: CONTRIBUTE_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING
          }}>
            <Feather name="code" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_LARGE} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SUBTITLE,
              fontFamily: "Cairo_400Regular",
              ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING }),
            }}>
              {t('contribute.forDevelopers')}
            </Text>
          </View>

          <Text style={{
            color: colors.BYellow,
            fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
            fontFamily: "Cairo_400Regular",
            lineHeight: CONTRIBUTE_CONSTANTS.LINE_HEIGHTS.SMALL,
            marginBottom: CONTRIBUTE_CONSTANTS.SPACING.CARD_MARGIN_BOTTOM,
            textAlign: getRTLTextAlign('left')
          }}>
            {t('contribute.developersDescription')}
          </Text>

          <TouchableOpacity
            onPress={openGitHub}
            style={{
              backgroundColor: colors.BGreen,
              borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.MEDIUM,
              padding: CONTRIBUTE_CONSTANTS.SPACING.BUTTON_PADDING,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Feather name="github" size={CONTRIBUTE_CONSTANTS.FONT_SIZES.ICON_MEDIUM} color={colors.BYellow} />
            <Text style={{
              color: colors.BYellow,
              fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.BODY,
              fontFamily: "Cairo_400Regular",
              ...getDirectionalMixedSpacing({ marginLeft: CONTRIBUTE_CONSTANTS.SPACING.SMALL_PADDING }),
            }}>
              {t('contribute.openGitHub')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          backgroundColor: colors.DGreen,
          borderRadius: CONTRIBUTE_CONSTANTS.BORDER_RADIUS.LARGE,
          padding: CONTRIBUTE_CONSTANTS.SPACING.CARD_PADDING,
          marginBottom: CONTRIBUTE_CONSTANTS.SPACING.LARGE_MARGIN_BOTTOM
        }}>
          <Text style={{
            color: colors.BYellow,
            fontSize: CONTRIBUTE_CONSTANTS.FONT_SIZES.SMALL_BODY,
            fontFamily: "Cairo_400Regular",
            textAlign: 'center',
            lineHeight: CONTRIBUTE_CONSTANTS.LINE_HEIGHTS.SMALL,
            fontStyle: 'italic'
          }}>
            {t('contribute.thankYou')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
