import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { toHijri } from '../utils/HijriCalendar';

const DEFAULT_THEME = { bg: '#003C34', text: '#FFE29D', textSecondary: '#D1955E' };

const gregorianLabel = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const renderHijriWidget = ({ theme = DEFAULT_THEME, widgetInfo } = {}) => {
  const { iDay, iMonthName, iYear } = toHijri(new Date());
  const isSmall = widgetInfo && widgetInfo.width < 110;

  if (isSmall) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.bg,
          borderRadius: 16,
          padding: 8,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text={`${iDay}`}
          style={{ fontSize: 28, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}
        />
        <TextWidget
          text={iMonthName}
          style={{ fontSize: 10, color: theme.textSecondary, textAlign: 'center' }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.bg,
        borderRadius: 16,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget text="Hijri Date" style={{ fontSize: 11, color: theme.textSecondary }} />
      <TextWidget
        text={`${iDay} ${iMonthName}`}
        style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}
      />
      <TextWidget text={`${iYear} AH`} style={{ fontSize: 13, color: theme.textSecondary }} />
      <TextWidget text={gregorianLabel()} style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }} />
    </FlexWidget>
  );
};
