import React from 'react';
import { View, Text } from 'react-native';
import { useColors } from '../../constants/Colors';
import { useRTL } from '../../hooks/useRTL';
import { textStyles } from '../../constants/Fonts';
import { SPACING, RADIUS, withAlpha, shadow } from '../../constants/settingsTokens';

export default function SettingsSection({ title, description, footnote, children, style, testID }) {
  const colors = useColors();
  const { getTextAlign } = useRTL();
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[{ marginBottom: SPACING.xl }, style]} testID={testID}>
      {title ? (
        <Text style={[textStyles.bodySmall, {
          color: colors.textSecondary,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginBottom: SPACING.sm,
          marginHorizontal: SPACING.xs,
          textAlign: getTextAlign('left'),
        }]}>
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text style={[textStyles.caption, {
          color: colors.textSecondary,
          marginBottom: SPACING.sm,
          marginHorizontal: SPACING.xs,
          textAlign: getTextAlign('left'),
        }]}>
          {description}
        </Text>
      ) : null}
      <View style={[{
        backgroundColor: colors.surface,
        borderRadius: RADIUS.card,
        overflow: 'hidden',
      }, shadow(colors.shadowColor)]}>
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {child}
            {i < items.length - 1 ? (
              <View style={{
                height: 1,
                backgroundColor: withAlpha(colors.accent, 'hairline'),
                marginHorizontal: SPACING.lg,
              }} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      {footnote ? (
        <Text style={[textStyles.caption, {
          color: colors.textSecondary,
          marginTop: SPACING.sm,
          marginHorizontal: SPACING.xs,
          textAlign: getTextAlign('left'),
        }]}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}
