// Test file for Prayer Times and Qibla features
import { calculateQiblaDirection, calculatePrayerTimes, getLocationFromIP } from '../utils/PrayerUtils';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

// Test Qibla calculation
const testQiblaCalculation = () => {
  console.log('Testing Qibla calculation...');
  
  // Test from New York (should be around 58 degrees)
  const nyQibla = calculateQiblaDirection(40.7128, -74.0060);
  console.log(`Qibla from New York: ${nyQibla}°`);
  
  // Test from London (should be around 118 degrees)
  const londonQibla = calculateQiblaDirection(51.5074, -0.1278);
  console.log(`Qibla from London: ${londonQibla}°`);
  
  // Test from Cairo (should be around 137 degrees)
  const cairoQibla = calculateQiblaDirection(30.0444, 31.2357);
  console.log(`Qibla from Cairo: ${cairoQibla}°`);
};

// Test Prayer Times calculation
const testPrayerTimes = () => {
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
  }
};

// Test IP location
const testIPLocation = async () => {
  console.log('Testing IP location...');
  try {
    const location = await getLocationFromIP();
    console.log('IP Location:', location);
  } catch (error) {
    console.error('IP Location error:', error);
  }
};

// Export test functions
export { testQiblaCalculation, testPrayerTimes, testIPLocation };

// Run tests if this file is executed directly
if (require.main === module) {
  testQiblaCalculation();
  testPrayerTimes();
  testIPLocation();
}
