import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWidgetPrayerData, getWidgetThemeColors } from '../utils/PrayerWidgetService';
import { renderPrayerWidget } from './PrayerWidget';
import { renderHijriWidget } from './HijriWidget';

const DEFAULT_THEME = { bg: '#003C34', text: '#FFE29D', textSecondary: '#D1955E' };

const renderPlaceholder = (theme = DEFAULT_THEME) => (
  <FlexWidget
    style={{
      height: 'match_parent',
      width: 'match_parent',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.bg,
      borderRadius: 16,
    }}
  >
    <TextWidget text="Set prayer location in Zikr" style={{ fontSize: 12, color: theme.text }} />
  </FlexWidget>
);

export const widgetTaskHandler = async (props) => {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const widgetInfo = props.widgetInfo;
      if (props.widgetInfo.widgetName === 'HijriCalendar') {
        const [theme, lang] = await Promise.all([
          getWidgetThemeColors(),
          AsyncStorage.getItem('@language').then((v) => v || 'ar'),
        ]);
        props.renderWidget(renderHijriWidget({ theme, widgetInfo, lang }));
      } else {
        const [data, lang] = await Promise.all([
          getWidgetPrayerData(),
          AsyncStorage.getItem('@language').then((v) => v || 'en'),
        ]);
        if (data) {
          props.renderWidget(renderPrayerWidget({ ...data, widgetInfo, lang }));
        } else {
          const theme = await getWidgetThemeColors();
          props.renderWidget(renderPlaceholder(theme));
        }
      }
      break;
    }
    default:
      break;
  }
};
