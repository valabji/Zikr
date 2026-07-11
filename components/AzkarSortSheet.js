import * as React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';

function moveKey(keys, from, to) {
  const next = [...keys];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const MODE_LABELS = { default: 'sort.defaultOrder', alpha: 'sort.alphabetical', manual: 'sort.manual' };

export default function AzkarSortSheet({ visible, onClose, order, items, onChange, modes = ['default', 'alpha', 'manual'] }) {
  const colors = useColors();
  const keys = items.map(i => i.key);

  const selectMode = (mode) => {
    onChange({ mode, manual: mode === 'manual' && !order.manual.length ? keys : order.manual });
  };

  const move = (from, to) => {
    onChange({ mode: 'manual', manual: moveKey(keys, from, to) });
  };

  const ModeRow = ({ mode, label }) => {
    const active = order.mode === mode;
    return (
      <TouchableOpacity
        testID={`sort-mode-${mode}`}
        onPress={() => selectMode(mode)}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}
      >
        <Feather name={active ? 'check-circle' : 'circle'} size={20} color={active ? colors.accent : colors.textSecondary} />
        <Text style={[textStyles.body, { color: active ? colors.accent : colors.text, ...getDirectionalMixedSpacing({ marginLeft: 10 }) }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayBackground }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View
          testID="azkar-sort-sheet"
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
            paddingBottom: 12,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.accent + '22',
            }}
          >
            <Text style={[textStyles.subtitle, { color: colors.text, flex: 1, textAlign: getRTLTextAlign('left') }]} numberOfLines={1}>
              {t('sort.title')}
            </Text>
            <TouchableOpacity testID="sort-close" onPress={onClose} style={{ padding: 6 }}>
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {modes.map(mode => (
            <ModeRow key={mode} mode={mode} label={t(MODE_LABELS[mode])} />
          ))}

          {order.mode === 'manual' ? (
            <>
              <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, paddingHorizontal: 16, paddingBottom: 8, textAlign: getRTLTextAlign('left') }]}>
                {t('sort.hint')}
              </Text>
              <ScrollView style={{ borderTopWidth: 1, borderTopColor: colors.accent + '22' }}>
                {items.map(({ key, label }, i) => (
                  <View
                    key={key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.accent + '14',
                    }}
                  >
                    <Text style={[textStyles.body, { color: colors.text, flex: 1, fontSize: 15, textAlign: getRTLTextAlign('left') }]} numberOfLines={1}>
                      {label}
                    </Text>
                    <TouchableOpacity
                      testID={`sort-up-${i}`}
                      disabled={i === 0}
                      onPress={() => move(i, i - 1)}
                      onLongPress={() => move(i, 0)}
                      style={{ padding: 6, opacity: i === 0 ? 0.3 : 1 }}
                    >
                      <Feather name="chevron-up" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`sort-down-${i}`}
                      disabled={i === items.length - 1}
                      onPress={() => move(i, i + 1)}
                      onLongPress={() => move(i, items.length - 1)}
                      style={{ padding: 6, opacity: i === items.length - 1 ? 0.3 : 1 }}
                    >
                      <Feather name="chevron-down" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
