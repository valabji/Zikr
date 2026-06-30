import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const PRAYER_LABELS = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const DEFAULT_THEME = { bg: '#003C34', text: '#FFE29D', textSecondary: '#D1955E' };

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const findCurrentAndNext = (prayers) => {
  const now = Date.now();
  let current = null;
  let next = null;
  for (const prayer of prayers) {
    if (new Date(prayer.time).getTime() <= now) {
      current = prayer;
    } else if (!next) {
      next = prayer;
      break;
    }
  }
  return { current, next };
};

export const renderPrayerWidget = (data) => {
  const { current, next } = findCurrentAndNext(data.prayers);
  const theme = data.theme || DEFAULT_THEME;
  const isSmall = data.widgetInfo && data.widgetInfo.width < 110;

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
        {next ? (
          <>
            <TextWidget
              text={PRAYER_LABELS[next.name]}
              style={{ fontSize: 15, fontWeight: 'bold', color: theme.text, textAlign: 'center' }}
            />
            <TextWidget
              text={formatTime(next.time)}
              style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}
            />
          </>
        ) : (
          <TextWidget text="Open Zikr" style={{ fontSize: 11, color: theme.text, textAlign: 'center' }} />
        )}
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
      {!!data.city && (
        <TextWidget text={data.city} style={{ fontSize: 12, color: theme.textSecondary }} />
      )}
      {next && (
        <TextWidget
          text={`${PRAYER_LABELS[next.name]} ${formatTime(next.time)}`}
          style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}
        />
      )}
      {current && (
        <TextWidget
          text={`Now: ${PRAYER_LABELS[current.name]}`}
          style={{ fontSize: 12, color: theme.textSecondary }}
        />
      )}
    </FlexWidget>
  );
};
