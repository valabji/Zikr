import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { getWidgetPrayerData } from '../utils/PrayerWidgetService';
import { renderPrayerWidget } from './PrayerWidget';
import { renderHijriWidget } from './HijriWidget';

const renderPlaceholder = () => (
  <FlexWidget
    style={{
      height: 'match_parent',
      width: 'match_parent',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1B5E20',
      borderRadius: 16,
    }}
  >
    <TextWidget text="Set prayer location in Zikr" style={{ fontSize: 12, color: '#FFFFFF' }} />
  </FlexWidget>
);

export const widgetTaskHandler = async (props) => {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (props.widgetName === 'HijriCalendar') {
        props.renderWidget(renderHijriWidget());
      } else {
        const data = await getWidgetPrayerData();
        props.renderWidget(data ? renderPrayerWidget(data) : renderPlaceholder());
      }
      break;
    }
    default:
      break;
  }
};
