import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, useTheme } from '../constants/Colors';

// Demo component to test theme switching
export const ThemeDemo = () => {
  const colors = useColors();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Current Theme: {theme}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardText, { color: colors.accent }]}>
          Primary: {colors.primary}
        </Text>
        <Text style={[styles.cardText, { color: colors.accentDark }]}>
          Accent: {colors.accent}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
