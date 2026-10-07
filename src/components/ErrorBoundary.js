import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { t } from '@/locales/i18n';
import { Restart } from '@/utils/restart';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  handleRestart = () => {
    this.setState({ error: null });
    Restart();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('errorBoundary.title')}</Text>
        <Text style={styles.message}>
          {String(this.state.error?.message || this.state.error) || t('errorBoundary.message')}
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
          <Text style={styles.buttonText}>{t('errorBoundary.restart')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// Hardcoded palette: the theme context may be what crashed, so this screen must not depend on it.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#c0c0d0',
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e0b040',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
