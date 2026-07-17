import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Clipboard } from 'react-native';
import { useColors } from '@/constants/Colors';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '@/locales/i18n';
import CustomHeader from '@/components/CustomHeader';
import { Feather } from '@expo/vector-icons';
import { CONTRIBUTE_CONSTANTS } from '@/constants/ContributeConstants';
import { webCursor, CONTENT_MAX_WIDTH } from '@/constants/settingsTokens';

const {
  SPACING, FONT_SIZES, BORDER_RADIUS, LINE_HEIGHTS, BUTTON_DIMENSIONS, FONT_STYLES,
  EMAIL_ADDRESS, EMAIL_SUBJECTS, EXCEL_SHEET_URL, GITHUB_URL,
} = CONTRIBUTE_CONSTANTS;

const openLink = (url, errorKey) => {
  Linking.openURL(url).catch(() => {
    Alert.alert(t('contribute.error'), t(errorKey));
  });
};

function Card({ children, style }) {
  const colors = useColors();
  return (
    <View style={{
      backgroundColor: colors.DGreen,
      borderRadius: BORDER_RADIUS.LARGE,
      padding: SPACING.CARD_PADDING,
      marginBottom: SPACING.CARD_MARGIN_BOTTOM,
      ...style,
    }}>
      {children}
    </View>
  );
}

function SectionHeader({ icon, title }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.BUTTON_PADDING }}>
      <Feather name={icon} size={FONT_SIZES.ICON_LARGE} color={colors.BYellow} />
      <Text style={{
        color: colors.BYellow,
        fontSize: FONT_SIZES.SUBTITLE,
        fontFamily: 'Cairo_400Regular',
        ...getDirectionalMixedSpacing({ marginLeft: SPACING.SMALL_PADDING }),
      }}>
        {title}
      </Text>
    </View>
  );
}

function BodyText({ children, fontSize = FONT_SIZES.SMALL_BODY, lineHeight = LINE_HEIGHTS.SMALL }) {
  const colors = useColors();
  return (
    <Text style={{
      color: colors.BYellow,
      fontSize,
      fontFamily: 'Cairo_400Regular',
      lineHeight,
      marginBottom: SPACING.CARD_MARGIN_BOTTOM,
      textAlign: getRTLTextAlign('left'),
    }}>
      {children}
    </Text>
  );
}

function ActionButton({ icon, label, onPress, style }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{
        backgroundColor: colors.BGreen,
        borderRadius: BORDER_RADIUS.MEDIUM,
        padding: SPACING.BUTTON_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }, webCursor]}
    >
      <Feather name={icon} size={FONT_SIZES.ICON_MEDIUM} color={colors.BYellow} />
      <Text style={{
        color: colors.BYellow,
        fontSize: FONT_SIZES.BODY,
        fontFamily: 'Cairo_400Regular',
        ...getDirectionalMixedSpacing({ marginLeft: SPACING.SMALL_PADDING }),
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmailOptionButton({ icon, label, subject, tall }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => openLink(`mailto:${EMAIL_ADDRESS}?subject=${subject}`, 'contribute.emailError')}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{
        backgroundColor: colors.DGreen,
        borderRadius: BORDER_RADIUS.SMALL,
        padding: tall ? SPACING.SMALL_PADDING + 2 : SPACING.SMALL_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: BUTTON_DIMENSIONS.EMAIL_OPTION_WIDTH,
        minHeight: BUTTON_DIMENSIONS.EMAIL_OPTION_HEIGHT + (tall ? 10 : 0),
      }, webCursor]}
    >
      <Feather
        name={icon}
        size={tall ? FONT_SIZES.ICON_SMALL : FONT_SIZES.ICON_TINY}
        color={colors.BYellow}
      />
      <Text style={{
        color: colors.BYellow,
        fontSize: tall ? FONT_SIZES.SMALL_BODY : FONT_SIZES.SMALL,
        fontFamily: 'Cairo_400Regular',
        ...getDirectionalMixedSpacing({ marginLeft: SPACING.EXTRA_SMALL_PADDING }),
        textAlign: 'center',
        flex: 1,
        flexWrap: 'wrap',
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function EmailSection() {
  const colors = useColors();

  const copyEmail = () => {
    Clipboard.setString(EMAIL_ADDRESS);
    Alert.alert(t('contribute.copied'), t('contribute.emailCopied'));
  };

  return (
    <View style={{
      backgroundColor: colors.BGreen,
      borderRadius: BORDER_RADIUS.MEDIUM,
      padding: SPACING.BUTTON_PADDING,
      marginBottom: SPACING.CARD_MARGIN_BOTTOM,
    }}>
      <Text style={{
        color: colors.BYellow,
        fontSize: FONT_SIZES.BODY,
        fontFamily: 'Cairo_400Regular',
        marginBottom: SPACING.BUTTON_PADDING,
      }}>
        {t('contribute.contactUs')}
      </Text>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.BUTTON_PADDING,
        backgroundColor: colors.DGreen,
        borderRadius: BORDER_RADIUS.SMALL,
        padding: SPACING.SMALL_PADDING + 2,
      }}>
        <Feather name="mail" size={FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
        <Text style={{
          color: colors.BYellow,
          fontSize: FONT_SIZES.SMALL_BODY,
          fontFamily: 'Cairo_400Regular',
          textAlign: getRTLTextAlign('left'),
          ...getDirectionalMixedSpacing({ marginLeft: SPACING.TINY_PADDING }),
          flex: 1,
        }}>
          {EMAIL_ADDRESS}
        </Text>
        <TouchableOpacity onPress={copyEmail} testID="copy-email" accessibilityRole="button" accessibilityLabel={EMAIL_ADDRESS} style={webCursor}>
          <Feather name="copy" size={FONT_SIZES.ICON_SMALL} color={colors.BYellow} />
        </TouchableOpacity>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.TINY_PADDING,
      }}>
        <EmailOptionButton icon="message-circle" label={t('contribute.suggestions')} subject={EMAIL_SUBJECTS.SUGGESTIONS} />
        <EmailOptionButton icon="globe" label={t('contribute.translation')} subject={EMAIL_SUBJECTS.TRANSLATION} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <EmailOptionButton icon="check-circle" label={t('contribute.referenceChecking')} subject={EMAIL_SUBJECTS.REFERENCE_CHECKING} tall />
        <EmailOptionButton icon="alert-triangle" label={t('contribute.bugReports')} subject={EMAIL_SUBJECTS.BUG_REPORT} tall />
      </View>
    </View>
  );
}

export default function ContributeScreen({ navigation }) {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.BGreen }} testID="contribute-screen-root">
      <CustomHeader navigation={navigation} title={t('navigation.contribute')} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: SPACING.CONTAINER_PADDING,
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={[
            FONT_STYLES.TITLE,
            {
              color: colors.BYellow,
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: SPACING.BUTTON_PADDING,
            },
          ]}>
            {t('contribute.title')}
          </Text>
          <BodyText fontSize={FONT_SIZES.BODY} lineHeight={LINE_HEIGHTS.DEFAULT}>
            {t('contribute.description')}
          </BodyText>
        </Card>

        <Card>
          <SectionHeader icon="users" title={t('contribute.forUsers')} />
          <BodyText>{t('contribute.usersDescription')}</BodyText>
          <ActionButton
            icon="download"
            label={t('contribute.downloadExcel')}
            onPress={() => openLink(EXCEL_SHEET_URL, 'contribute.linkError')}
            style={{ marginBottom: SPACING.CARD_MARGIN_BOTTOM }}
          />
          <EmailSection />
        </Card>

        <Card>
          <SectionHeader icon="code" title={t('contribute.forDevelopers')} />
          <BodyText>{t('contribute.developersDescription')}</BodyText>
          <ActionButton
            icon="github"
            label={t('contribute.openGitHub')}
            onPress={() => openLink(GITHUB_URL, 'contribute.linkError')}
          />
        </Card>

        <Card style={{ marginBottom: SPACING.LARGE_MARGIN_BOTTOM }}>
          <Text style={{
            color: colors.BYellow,
            fontSize: FONT_SIZES.SMALL_BODY,
            fontFamily: 'Cairo_400Regular',
            textAlign: 'center',
            lineHeight: LINE_HEIGHTS.SMALL,
          }}>
            {t('contribute.thankYou')}
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
