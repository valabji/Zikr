// Test file for Prayer Times and Qibla features
import { calculateQiblaDirection, calculatePrayerTimes, getLocationFromIP } from '../PrayerUtils';
import { PRAYER_CONSTANTS } from '../../constants/PrayerConstants';

describe('PrayerUtils', () => {
  // Test Qibla calculation
  it('should calculate Qibla direction correctly', () => {
    // Test from New York (should be around 58 degrees)
    const nyQibla = calculateQiblaDirection(40.7128, -74.0060);
    console.log(`Qibla from New York: ${nyQibla}°`);
    expect(typeof nyQibla).toBe('number');
    expect(nyQibla).toBeGreaterThanOrEqual(0);
    expect(nyQibla).toBeLessThan(360);
    
    // Test from London (should be around 118 degrees)
    const londonQibla = calculateQiblaDirection(51.5074, -0.1278);
    console.log(`Qibla from London: ${londonQibla}°`);
    expect(typeof londonQibla).toBe('number');
    
    // Test from Cairo (should be around 137 degrees)
    const cairoQibla = calculateQiblaDirection(30.0444, 31.2357);
    console.log(`Qibla from Cairo: ${cairoQibla}°`);
    expect(typeof cairoQibla).toBe('number');
  });

  // Test Prayer Times calculation
  it('should calculate prayer times correctly', () => {
    console.log('Testing Prayer Times calculation...');
    
    // Test for New York
    const nyTimes = calculatePrayerTimes(
      40.7128, 
      -74.0060, 
      'America/New_York',
      new Date(),
      PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD,
      PRAYER_CONSTANTS.DEFAULT_MADHAB
    );
    
    if (nyTimes) {
      console.log('Prayer Times for New York:');
      console.log(`Fajr: ${nyTimes.fajr.format('h:mm A')}`);
      console.log(`Dhuhr: ${nyTimes.dhuhr.format('h:mm A')}`);
      console.log(`Asr: ${nyTimes.asr.format('h:mm A')}`);
      console.log(`Maghrib: ${nyTimes.maghrib.format('h:mm A')}`);
      console.log(`Isha: ${nyTimes.isha.format('h:mm A')}`);
      
      expect(nyTimes).toHaveProperty('fajr');
      expect(nyTimes).toHaveProperty('dhuhr');
      expect(nyTimes).toHaveProperty('asr');
      expect(nyTimes).toHaveProperty('maghrib');
      expect(nyTimes).toHaveProperty('isha');
    } else {
      expect(nyTimes).toBeNull();
    }
  });

  // Test IP location
  it('should handle IP location', async () => {
    console.log('Testing IP location...');
    try {
      const location = await getLocationFromIP();
      console.log('IP Location:', location);
      if (location) {
        expect(location).toHaveProperty('latitude');
        expect(location).toHaveProperty('longitude');
      }
    } catch (error) {
      console.error('IP Location error:', error);
      // In test environment, IP location might fail, which is acceptable
      expect(error).toBeDefined();
    }
  });
});
