import * as React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { textStyles } from '../constants/Fonts';
import { t, getDirectionalMixedSpacing } from '../locales/i18n';
import { useTasbih, getCounterDisplayName, computeCounterStats } from '../utils/TasbihStore';
import { TASBIH_CONSTANTS } from '../constants/TasbihConstants';

function TargetChips({ value, onChange, colors }) {
  const presets = [...TASBIH_CONSTANTS.TARGET_PRESETS, 0];
  const isCustom = value > 0 && !TASBIH_CONSTANTS.TARGET_PRESETS.includes(value);
  const [custom, setCustom] = React.useState(isCustom ? String(value) : '');

  const commitCustom = () => {
    const n = parseInt(custom, 10);
    if (!isNaN(n) && n > 0) onChange(n);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {presets.map((p) => {
        const active = value === p;
        const label = p === 0 ? t('counter.noTarget') : String(p);
        return (
          <TouchableOpacity
            key={p}
            onPress={() => onChange(p)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginTop: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.accent + '44',
              backgroundColor: active ? colors.accent + '22' : 'transparent',
              ...getDirectionalMixedSpacing({ marginRight: 8 }),
            }}
          >
            <Text style={[textStyles.base, { color: active ? colors.accent : colors.text, fontSize: 14 }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
      <TextInput
        value={custom}
        onChangeText={setCustom}
        onEndEditing={commitCustom}
        onSubmitEditing={commitCustom}
        placeholder={t('counter.custom')}
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        style={[
          textStyles.base,
          {
            color: isCustom ? colors.accent : colors.text,
            fontSize: 14,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginTop: 6,
            minWidth: 70,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isCustom ? colors.accent : colors.accent + '44',
          },
        ]}
      />
    </View>
  );
}

function CounterRow({ counter, isActive, manage, isFirst, isLast, colors, onSelect, onRename, onSetTarget, onMove, onDelete }) {
  const [draftName, setDraftName] = React.useState(getCounterDisplayName(counter));
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    setDraftName(getCounterDisplayName(counter));
  }, [counter.id, counter.name, counter.nameKey]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== getCounterDisplayName(counter)) onRename(counter.id, trimmed);
  };

  const targetLabel = counter.target > 0 ? t('counter.target') + ': ' + counter.target : t('counter.noTarget');
  const statsLabel = t('counter.total') + ': ' + (counter.total || 0) + '  ·  ' + t('counter.rounds') + ': ' + (counter.rounds || 0) + '  ·  ' + t('counter.totalRounds') + ': ' + (counter.totalRounds || 0);
  const { weeklyTotal, monthlyTotal } = computeCounterStats(counter);
  const periodLabel = t('counter.weekly') + ': ' + weeklyTotal + '  ·  ' + t('counter.monthly') + ': ' + monthlyTotal;

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.accent + '22',
        backgroundColor: isActive ? colors.accent + '18' : 'transparent',
      }}
    >
      <TouchableOpacity
        disabled={manage}
        onPress={() => onSelect(counter.id)}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <View style={{ flex: 1 }}>
          {manage ? (
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              onEndEditing={commitName}
              onSubmitEditing={commitName}
              placeholder={t('counter.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={[textStyles.subtitle, { color: colors.text, padding: 0 }]}
            />
          ) : (
            <Text style={[textStyles.subtitle, { color: isActive ? colors.accent : colors.text }]} numberOfLines={1}>
              {getCounterDisplayName(counter)}
            </Text>
          )}
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>{targetLabel}</Text>
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 2 }]}>{statsLabel}</Text>
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 12, marginTop: 1 }]}>{periodLabel}</Text>
        </View>
        {!manage ? (
          <Text style={[textStyles.title, { color: isActive ? colors.accent : colors.text }]}>{counter.count || 0}</Text>
        ) : null}
        {isActive && !manage ? (
          <Feather name="check" size={20} color={colors.accent} style={getDirectionalMixedSpacing({ marginLeft: 10 })} />
        ) : null}
      </TouchableOpacity>

      {manage ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13 }]}>{t('counter.target')}</Text>
          <TargetChips value={counter.target || 0} onChange={(n) => onSetTarget(counter.id, n)} colors={colors} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <TouchableOpacity
              disabled={isFirst}
              onPress={() => onMove(counter.id, 'up')}
              style={{ padding: 6, opacity: isFirst ? 0.3 : 1, ...getDirectionalMixedSpacing({ marginRight: 8 }) }}
            >
              <Feather name="chevron-up" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isLast}
              onPress={() => onMove(counter.id, 'down')}
              style={{ padding: 6, opacity: isLast ? 0.3 : 1 }}
            >
              <Feather name="chevron-down" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setConfirming(true)} style={{ padding: 6 }}>
              <Feather name="trash-2" size={20} color={colors.accentDark} />
            </TouchableOpacity>
          </View>

          {confirming ? (
            <View style={{ marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: colors.accent + '14' }}>
              <Text style={[textStyles.base, { color: colors.text, marginBottom: 10 }]}>{t('counter.deleteConfirmation')}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setConfirming(false)}
                  style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '44', ...getDirectionalMixedSpacing({ marginRight: 10 }) }}
                >
                  <Text style={[textStyles.base, { color: colors.text }]}>{t('counter.no')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setConfirming(false); onDelete(counter.id); }}
                  style={{ paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.accent }}
                >
                  <Text style={[textStyles.base, { color: colors.primaryDark }]}>{t('counter.yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function AddForm({ colors, onSave, onCancel }) {
  const [name, setName] = React.useState('');
  const [target, setTarget] = React.useState(0);

  return (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.accent + '22' }}>
      <Text style={[textStyles.subtitle, { color: colors.text, marginBottom: 8 }]}>{t('counter.addCounter')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('counter.namePlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={[
          textStyles.base,
          { color: colors.text, fontSize: 16, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '44' },
        ]}
      />
      <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13, marginTop: 12 }]}>{t('counter.target')}</Text>
      <TargetChips value={target} onChange={setTarget} colors={colors} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '44', ...getDirectionalMixedSpacing({ marginRight: 10 }) }}
        >
          <Text style={[textStyles.base, { color: colors.text }]}>{t('counter.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSave({ name: name.trim(), target })}
          disabled={!name.trim()}
          style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: colors.accent, opacity: name.trim() ? 1 : 0.5 }}
        >
          <Text style={[textStyles.base, { color: colors.primaryDark }]}>{t('counter.save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TasbihCountersSheet({ visible, onClose }) {
  const colors = useColors();
  const { state, stats, setActiveId, addCounter, renameCounter, setTarget, deleteCounter, moveCounter } = useTasbih();
  const [manage, setManage] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (!visible) { setManage(false); setAdding(false); }
  }, [visible]);

  const counters = (state && state.counters) || [];

  const handleSelect = (id) => { setActiveId(id); onClose(); };
  const handleSave = ({ name, target }) => { addCounter({ name, target }); setAdding(false); };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayBackground }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <View
          testID="tasbih-counters-sheet"
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
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
            <Text style={[textStyles.subtitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {t('counter.switchCounter')}
            </Text>
            <TouchableOpacity
              onPress={() => { setAdding((v) => !v); setManage(false); }}
              style={{ padding: 6, ...getDirectionalMixedSpacing({ marginRight: 6 }) }}
            >
              <Feather name="plus" size={24} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setManage((v) => !v); setAdding(false); }}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.accent + '44' }}
            >
              <Text style={[textStyles.base, { color: colors.accent, fontSize: 14 }]}>
                {manage ? t('counter.done') : t('counter.manage')}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.accent + '22',
              flexDirection: 'row',
            }}
          >
            <Text style={[textStyles.base, { color: colors.textSecondary, fontSize: 13 }]}>
              {t('counter.weekly') + ': ' + (stats ? stats.weeklyTotal : 0) + '   ' + t('counter.monthly') + ': ' + (stats ? stats.monthlyTotal : 0)}
            </Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {adding ? (
              <AddForm colors={colors} onSave={handleSave} onCancel={() => setAdding(false)} />
            ) : null}
            {counters.map((c, i) => (
              <CounterRow
                key={c.id}
                counter={c}
                isActive={c.id === state.activeId}
                manage={manage}
                isFirst={i === 0}
                isLast={i === counters.length - 1}
                colors={colors}
                onSelect={handleSelect}
                onRename={renameCounter}
                onSetTarget={setTarget}
                onMove={moveCounter}
                onDelete={deleteCounter}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
