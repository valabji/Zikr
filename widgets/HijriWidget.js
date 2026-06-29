import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { toHijri } from '../utils/HijriCalendar';

const gregorianLabel = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const renderHijriWidget = () => {
  const { iDay, iMonthName, iYear } = toHijri(new Date());
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B5E20',
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget text="Hijri Date" style={{ fontSize: 11, color: '#A5D6A7' }} />
      <TextWidget
        text={`${iDay} ${iMonthName}`}
        style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}
      />
      <TextWidget text={`${iYear} AH`} style={{ fontSize: 13, color: '#C8E6C9' }} />
      <TextWidget text={gregorianLabel()} style={{ fontSize: 11, color: '#A5D6A7', marginTop: 4 }} />
    </FlexWidget>
  );
};
