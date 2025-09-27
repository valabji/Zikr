
import LogEvent from './events';

export default async function loadFirebaseAnalytics() {
    await LogEvent('App_Loaded_Successfully', {
        my_note: 'working from env',
    });
}