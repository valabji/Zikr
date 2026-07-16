import { useState, useCallback, useEffect } from 'react';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '@/constants/PrayerConstants';
import { calculatePrayerTimes, getCurrentAndNextPrayer, getTimeUntilNextPrayer } from '@/utils/PrayerUtils';

export function usePrayerCountdown({ location, calculationMethod, madhab }) {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  const updatePrayerTimes = useCallback((
    locationData = location,
    method = calculationMethod || PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD,
    madhab2 = madhab || PRAYER_CONSTANTS.DEFAULT_MADHAB,
  ) => {
    if (!locationData) return false;
    const times = calculatePrayerTimes(
      locationData.latitude,
      locationData.longitude,
      locationData.timezone,
      new Date(),
      method,
      madhab2
    );
    if (!times) return false;
    setPrayerTimes(times);
    const { current, next } = getCurrentAndNextPrayer(
      times,
      locationData.latitude,
      locationData.longitude,
      locationData.timezone,
      method,
      madhab2
    );
    setCurrentPrayer(current);
    setNextPrayer(next);
    if (next && next.time) {
      setTimeUntilNext(getTimeUntilNextPrayer(next.time));
    }
    return true;
  }, [location, calculationMethod, madhab]);

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextPrayer || !nextPrayer.time) return '';
      try {
        const timeRemaining = getTimeUntilNextPrayer(nextPrayer.time);
        setTimeUntilNext(timeRemaining || '');
        if ((!timeRemaining || timeRemaining === '') && prayerTimes && location) {
          const { current, next } = getCurrentAndNextPrayer(
            prayerTimes,
            location.latitude,
            location.longitude,
            location.timezone,
            calculationMethod,
            madhab
          );
          setCurrentPrayer(current);
          setNextPrayer(next);
          if (next && next.time) {
            setTimeUntilNext(getTimeUntilNextPrayer(next.time) || '');
          }
        }
        return timeRemaining;
      } catch (error) {
        console.error('Error updating countdown:', error);
        return '';
      }
    };

    const timeRemaining = updateCountdown();
    let updateInterval = PRAYER_CONSTANTS.ANIMATION.PRAYER_UPDATE_INTERVAL;
    // Under 5 minutes left, tick every 10s for a smoother transition
    if (timeRemaining && typeof timeRemaining === 'string' &&
        ((timeRemaining.includes('m') && parseInt(timeRemaining) <= 5) || timeRemaining.includes('s'))) {
      updateInterval = 10000;
    }

    const interval = setInterval(() => {
      try {
        updateCountdown();
        const now = moment();
        if (now.hours() === 0 && now.minutes() === 0) {
          updatePrayerTimes();
        }
      } catch (error) {
        console.error('Error in countdown interval:', error);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [nextPrayer, updatePrayerTimes, prayerTimes, location, calculationMethod, madhab]);

  useEffect(() => {
    if (location) {
      updatePrayerTimes();
    }
  }, [calculationMethod, madhab, updatePrayerTimes]);

  const isPrayerAvailable = useCallback((prayerName) => {
    if (!prayerTimes || !prayerTimes[prayerName]) return false;
    return !prayerTimes[prayerName].isAfter(moment());
  }, [prayerTimes]);

  return { prayerTimes, currentPrayer, nextPrayer, timeUntilNext, updatePrayerTimes, isPrayerAvailable };
}
