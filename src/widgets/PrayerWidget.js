import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const PRAYER_LABELS = {
  en: { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  ar: { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
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
  const lang = data.lang === 'ar' ? 'ar' : 'en';
  const labels = PRAYER_LABELS[lang];
  const nowLabel = lang === 'ar' ? 'الآن' : 'Now';
  const openLabel = lang === 'ar' ? 'افتح ذكر' : 'Open Zikr';

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
              text={labels[next.name]}
              style={{ fontSize: 15, fontFamily: 'Cairo_700Bold', color: theme.text, textAlign: 'center' }}
            />
            <TextWidget
              text={formatTime(next.time)}
              style={{ fontSize: 12, fontFamily: 'Cairo_400Regular', color: theme.textSecondary, textAlign: 'center' }}
            />
          </>
        ) : (
          <TextWidget text={openLabel} style={{ fontSize: 11, fontFamily: 'Cairo_400Regular', color: theme.text, textAlign: 'center' }} />
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
        <TextWidget text={data.city} style={{ fontSize: 12, fontFamily: 'Cairo_400Regular', color: theme.textSecondary }} />
      )}
      {next && (
        <TextWidget
          text={`${labels[next.name]} ${formatTime(next.time)}`}
          style={{ fontSize: 18, fontFamily: 'Cairo_700Bold', color: theme.text }}
        />
      )}
      {current && (
        <TextWidget
          text={`${nowLabel}: ${labels[current.name]}`}
          style={{ fontSize: 12, fontFamily: 'Cairo_400Regular', color: theme.textSecondary }}
        />
      )}
    </FlexWidget>
  );
};
