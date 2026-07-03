import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    FlatList,
    ActivityIndicator,
    Platform,
    Modal
} from 'react-native';
import { useColors } from '../constants/Colors';
import { t, getDirectionalMixedSpacing, getRTLTextAlign, isRTL } from '../locales/i18n';
import CHeader from '../components/CHeader';
import CustomToggle from '../components/CustomToggle';
import { Feather, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { CONTENT_MAX_WIDTH, withAlpha, webCursor } from '../constants/settingsTokens';
import { searchLocations, getLocationFromIP, getBrowserLocation } from '../utils/PrayerUtils';
import NotificationService from '../utils/NotificationService';
import PrayerCountdownService from '../utils/PrayerCountdownService';
import PrayerNotificationScheduler from '../utils/PrayerNotificationScheduler';
import AdhanDownloader from '../utils/AdhanDownloader';
import { ADHAN_CATALOG, getAdhanById, SELECTED_ADHAN_KEY, DEFAULT_ADHAN_ID } from '../constants/AdhanCatalog';
import { useTestedMode } from '../utils/TestedMode';

export default function UnifiedPrayerSettingsScreen({ navigation }) {
    const colors = useColors();
    const testedMode = useTestedMode();

    // Location states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Prayer settings states
    const [calculationMethod, setCalculationMethod] = useState(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
    const [madhab, setMadhab] = useState(PRAYER_CONSTANTS.DEFAULT_MADHAB);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [audioMode, setAudioMode] = useState('short');
    const [selectedAdhan, setSelectedAdhan] = useState(DEFAULT_ADHAN_ID);
    const [adhanState, setAdhanState] = useState({});
    const [notificationTimes, setNotificationTimes] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true
    });
    const [hasExactAlarm, setHasExactAlarm] = useState(true);
    const [showPersistentCountdown, setShowPersistentCountdown] = useState(false);

    // UI states
    const [isCalculationMethodModalVisible, setCalculationMethodModalVisible] = useState(false);
    const [isMadhabModalVisible, setMadhabModalVisible] = useState(false);
    const [isAudioModeModalVisible, setAudioModeModalVisible] = useState(false);
    const [isAdhanModalVisible, setAdhanModalVisible] = useState(false);

    // Initial values for change detection
    const [initialLocation, setInitialLocation] = useState(null);
    const [initialCalculationMethod, setInitialCalculationMethod] = useState(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
    const [initialMadhab, setInitialMadhab] = useState(PRAYER_CONSTANTS.DEFAULT_MADHAB);
    const [initialNotificationsEnabled, setInitialNotificationsEnabled] = useState(false);
    const [initialAudioMode, setInitialAudioMode] = useState('short');
    const [initialSelectedAdhan, setInitialSelectedAdhan] = useState(DEFAULT_ADHAN_ID);
    const [initialNotificationTimes, setInitialNotificationTimes] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true
    });
    const [initialShowPersistentCountdown, setInitialShowPersistentCountdown] = useState(false);

    // Set once a save (or explicit discard) has resolved so the beforeRemove
    // guard lets the navigation through without re-prompting.
    const skipUnsavedGuardRef = useRef(false);
    const [initialValuesSet, setInitialValuesSet] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Load all settings
    const loadSettings = async () => {
        try {
            // Load location
            const savedLocation = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION);
            if (savedLocation) {
                const locationData = JSON.parse(savedLocation);
                setCurrentLocation(locationData);
                setSelectedLocation(locationData);
            }

            // Load prayer settings
            const savedMethod = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD);
            const savedMadhab = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB);
            
            // Load new notification settings (using new storage keys)
            const savedNotifications = await AsyncStorage.getItem('@notifications_enabled');
            const savedAudioMode = await AsyncStorage.getItem('@audio_mode');
            const savedAdhan = await AsyncStorage.getItem(SELECTED_ADHAN_KEY);
            const savedNotificationTimes = await AsyncStorage.getItem('@enabled_prayers');
            const savedPersistentCountdown = await AsyncStorage.getItem('@persistent_countdown');

            if (savedMethod) {
                setCalculationMethod(savedMethod);
            }
            if (savedMadhab) {
                setMadhab(savedMadhab);
            }
            if (savedNotifications) {
                setNotificationsEnabled(savedNotifications === 'true');
            }
            if (savedAudioMode) {
                setAudioMode(savedAudioMode);
            }
            if (savedAdhan) {
                setSelectedAdhan(savedAdhan);
            }
            if (savedNotificationTimes) {
                setNotificationTimes(JSON.parse(savedNotificationTimes));
            }
            if (savedPersistentCountdown !== null) {
                setShowPersistentCountdown(savedPersistentCountdown === 'true');
            }

            // Check exact alarm permission on Android
            if (Platform.OS === 'android') {
                const hasExactAlarmPerm = await NotificationService.checkExactAlarmPermission();
                setHasExactAlarm(hasExactAlarmPerm);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        setSettingsLoaded(true);
    };

    // Set initial values for change detection only once after settings are loaded
    useEffect(() => {
        if (settingsLoaded && !initialValuesSet) {
            setInitialLocation(currentLocation);
            setInitialCalculationMethod(calculationMethod);
            setInitialMadhab(madhab);
            setInitialNotificationsEnabled(notificationsEnabled);
            setInitialAudioMode(audioMode);
            setInitialSelectedAdhan(selectedAdhan);
            setInitialNotificationTimes({ ...notificationTimes });
            setInitialShowPersistentCountdown(showPersistentCountdown);
            setInitialValuesSet(true);
        }
    }, [settingsLoaded, initialValuesSet, currentLocation, calculationMethod, madhab, notificationsEnabled, audioMode, selectedAdhan, notificationTimes, showPersistentCountdown]);

    useEffect(() => {
        AdhanDownloader.checkInstalled();
        const unsubscribe = AdhanDownloader.subscribe(setAdhanState);
        return unsubscribe;
    }, []);

    // Location search with debouncing
    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length < PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchLocations(query);
                // Filter out duplicates based on name and country
                const uniqueResults = results.filter((item, index, self) => 
                    index === self.findIndex((t) => 
                        t.name === item.name && t.country === item.country
                    )
                );
                setSearchResults(uniqueResults);
            } catch (error) {
                Alert.alert(t('locationSettings.error'), t('locationSettings.searchError'));
            } finally {
                setIsSearching(false);
            }
        }, PRAYER_CONSTANTS.LOCATION_SEARCH.DEBOUNCE_DELAY);
    };

    // Get current location using GPS
    const getCurrentLocation = async () => {
        setIsGettingLocation(true);
        try {
            // Try browser geolocation first on web
            if (Platform.OS === 'web') {
                try {
                    const browserLocation = await getBrowserLocation();
                    if (browserLocation) {
                        setSelectedLocation(browserLocation);
                        return;
                    }
                } catch (error) {
                    console.warn('Browser geolocation failed:', error);
                }
            }

            // Use expo-location for mobile or as fallback
            if (Platform.OS !== 'web') {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        t('locationSettings.permissionDenied'),
                        t('locationSettings.permissionDeniedMessage')
                    );
                    return;
                }

                try {
                    const locationData = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        timeout: PRAYER_CONSTANTS.ANIMATION.LOCATION_TIMEOUT,
                    });

                    const timezone = await Location.reverseGeocodeAsync({
                        latitude: locationData.coords.latitude,
                        longitude: locationData.coords.longitude,
                    });

                    const newLocation = {
                        latitude: locationData.coords.latitude,
                        longitude: locationData.coords.longitude,
                        city: timezone[0]?.city || 'Unknown',
                        region: timezone[0]?.region || 'Unknown',
                        country: timezone[0]?.country || 'Unknown',
                        timezone: moment.tz.guess()
                    };

                    setSelectedLocation(newLocation);
                    return;
                } catch (locationError) {
                    console.warn('Expo location failed:', locationError);
                }
            }

            // Fallback to IP-based location
            const ipLocation = await getLocationFromIP();
            setSelectedLocation(ipLocation);

        } catch (error) {
            Alert.alert(
                t('locationSettings.error'),
                t('locationSettings.gpsError')
            );
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Get location from IP
    const getIPLocation = async () => {
        setIsGettingLocation(true);
        try {
            const ipLocation = await getLocationFromIP();
            setSelectedLocation(ipLocation);
        } catch (error) {
            Alert.alert(
                t('locationSettings.error'),
                t('locationSettings.ipLocationError')
            );
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Save all settings (location + prayer settings). Returns true on success.
    const saveAllSettings = async () => {
        // Allow saving if we have either selectedLocation or currentLocation
        if (!selectedLocation && !currentLocation) {
            Alert.alert(t('locationSettings.error'), t('locationSettings.noLocationSelected'));
            return false;
        }

        try {
            // Save location (only if there's a new selection)
            if (selectedLocation) {
                await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.LOCATION, JSON.stringify(selectedLocation));
                setCurrentLocation(selectedLocation);
            }

            // Save prayer settings
            await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.CALCULATION_METHOD, calculationMethod);
            await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.MADHAB, madhab);
            
            // Save new notification settings (using new storage keys)
            await AsyncStorage.setItem('@notifications_enabled', notificationsEnabled.toString());
            await AsyncStorage.setItem('@audio_mode', audioMode);
            await AsyncStorage.setItem(SELECTED_ADHAN_KEY, selectedAdhan);
            await AsyncStorage.setItem('@enabled_prayers', JSON.stringify(notificationTimes));
            await AsyncStorage.setItem('@persistent_countdown', showPersistentCountdown.toString());

            // Restart countdown service with new settings
            if (showPersistentCountdown) {
                await PrayerCountdownService.stop();
                await PrayerCountdownService.start();
            } else {
                await PrayerCountdownService.stop();
            }

            // Reschedule adhan notifications so the new settings take effect
            // immediately — no app restart required.
            await PrayerNotificationScheduler.refresh();

            // Sync the change-detection baselines so the unsaved-changes guard clears.
            if (selectedLocation) setInitialLocation(selectedLocation);
            setInitialCalculationMethod(calculationMethod);
            setInitialMadhab(madhab);
            setInitialNotificationsEnabled(notificationsEnabled);
            setInitialAudioMode(audioMode);
            setInitialSelectedAdhan(selectedAdhan);
            setInitialNotificationTimes({ ...notificationTimes });
            setInitialShowPersistentCountdown(showPersistentCountdown);

            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert(t('common.error'), t('prayerSettings.saveError'));
            return false;
        }
    };

    // Toggle notification for specific prayer
    const handlePrayerNotificationToggle = (prayer, enabled) => {
        setNotificationTimes(prev => ({
            ...prev,
            [prayer]: enabled
        }));
    };

    // Show calculation method picker
    const showCalculationMethodPicker = () => {
        setCalculationMethodModalVisible(true);
    };

    // Show madhab picker
    const showMadhabPicker = () => {
        setMadhabModalVisible(true);
    };

    // Handle calculation method selection
    const handleCalculationMethodSelection = (method) => {
        setCalculationMethod(method);
        setCalculationMethodModalVisible(false);
    };

    // Handle madhab selection
    const handleMadhabSelection = (selectedMadhab) => {
        setMadhab(selectedMadhab);
        setMadhabModalVisible(false);
    };

    // Handle audio mode selection
    const handleAudioModeSelection = (mode) => {
        setAudioMode(mode);
        setAudioModeModalVisible(false);
    };

    // Pick a recitation; download it first if it isn't on the device yet.
    const handleAdhanSelection = (id) => {
        const entry = getAdhanById(id);
        setSelectedAdhan(id);
        if (!entry.bundled && !AdhanDownloader.isDownloaded(id)) {
            AdhanDownloader.start(id);
        }
        setAdhanModalVisible(false);
    };

    // Handle notifications toggle
    const handleNotificationsToggle = async (value) => {
        if (value) {
            // Request permissions when enabling
            const result = await NotificationService.requestPermissions();
            if (!result.granted) {
                Alert.alert(
                    t('notifications.permissionRequired') || 'Permission Required',
                    t('notifications.permissionMessage') || 'Please enable notification permissions in your device settings.',
                    [{ text: t('common.ok') || 'OK' }]
                );
                return;
            }
            
            if (result.needsExactAlarm && Platform.OS === 'android') {
                Alert.alert(
                    t('notifications.exactAlarmRequired') || 'Exact Alarm Required',
                    t('notifications.exactAlarmMessage') || 'For precise prayer time notifications, please enable exact alarms in the next screen.',
                    [
                        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                        { text: t('notifications.openSettings') || 'Open Settings', onPress: () => NotificationService.openExactAlarmSettings() },
                    ]
                );
            }
        }
        setNotificationsEnabled(value);
    };

    // Handle opening exact alarm settings
    const handleOpenExactAlarmSettings = async () => {
        await NotificationService.openExactAlarmSettings();
        // Re-check permission after user returns
        setTimeout(async () => {
            const hasPermission = await NotificationService.checkExactAlarmPermission();
            setHasExactAlarm(hasPermission);
        }, 1000);
    };

    // Handle opening battery settings
    const handleOpenBatterySettings = async () => {
        await NotificationService.openBatterySettings();
    };

    // Dev-only: fire a test adhan notification 60 seconds from now using the
    // currently-selected audio mode. Useful for verifying the full pipeline
    // (permission → schedule → fire → audio playback → tap) on a real device
    // without waiting for an actual prayer time.
    const handleTestNotification = async () => {
        try {
            // Make sure permissions are granted first
            const perm = await NotificationService.requestPermissions();
            if (!perm.granted) {
                Alert.alert(
                    'Test notification',
                    'Notification permission is not granted. Enable it and try again.',
                );
                return;
            }
            if (perm.needsExactAlarm && Platform.OS === 'android') {
                Alert.alert(
                    'Exact alarm needed',
                    'Grant the exact-alarm permission so the test notification fires on time.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open settings', onPress: () => NotificationService.openExactAlarmSettings() },
                    ],
                );
                return;
            }

            const trigger = new Date(Date.now() + 60_000);
            const id = `prayer-test-${Date.now()}`;
            const result = await NotificationService.scheduleExactNotification(
                id,
                '🕌 Test adhan',
                `Scheduled to fire at ${trigger.toLocaleTimeString()}`,
                trigger,
                audioMode,
            );

            if (result) {
                Alert.alert(
                    'Test scheduled',
                    `A test notification (audio mode: ${audioMode}) will fire in 60 seconds. Background the app or wait — if foreground and audio mode is "short", you should hear the short alert. Tap it to play the full adhan.`,
                );
            } else {
                Alert.alert('Test failed', 'Could not schedule the test notification. Check the console for details.');
            }
        } catch (error) {
            console.error('Test notification error:', error);
            Alert.alert('Test failed', error?.message || 'Unknown error');
        }
    };

    // Check for unsaved changes
    const hasUnsavedChanges = useCallback(() => {
        // Location changes
        if (selectedLocation) {
            if (!initialLocation) return true;
            if (selectedLocation.latitude !== initialLocation.latitude || selectedLocation.longitude !== initialLocation.longitude) return true;
        }

        // Prayer settings changes
        if (calculationMethod !== initialCalculationMethod) return true;
        if (madhab !== initialMadhab) return true;
        if (notificationsEnabled !== initialNotificationsEnabled) return true;
        if (audioMode !== initialAudioMode) return true;
        if (selectedAdhan !== initialSelectedAdhan) return true;
        if (JSON.stringify(notificationTimes) !== JSON.stringify(initialNotificationTimes)) return true;
        if (showPersistentCountdown !== initialShowPersistentCountdown) return true;

        return false;
    }, [selectedLocation, initialLocation, calculationMethod, initialCalculationMethod, madhab, initialMadhab, notificationsEnabled, initialNotificationsEnabled, audioMode, initialAudioMode, selectedAdhan, initialSelectedAdhan, notificationTimes, initialNotificationTimes, showPersistentCountdown, initialShowPersistentCountdown]);

    useEffect(() => {
        loadSettings();
        
        // Web-specific: Ensure body can scroll
        if (Platform.OS === 'web') {
            document.body.style.overflow = 'auto';
            document.body.style.height = 'auto';
        }
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Handle back navigation with unsaved changes warning
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (skipUnsavedGuardRef.current || !hasUnsavedChanges()) {
                return;
            }
            e.preventDefault();
            Alert.alert(
                t('common.unsavedChanges'),
                t('common.unsavedChangesMessage'),
                [
                    { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
                    { text: t('common.discard'), style: 'destructive', onPress: () => { skipUnsavedGuardRef.current = true; navigation.dispatch(e.data.action); } },
                    { text: t('common.save'), style: 'default', onPress: async () => {
                        const ok = await saveAllSettings();
                        if (ok) {
                            skipUnsavedGuardRef.current = true;
                            navigation.dispatch(e.data.action);
                        }
                    } }
                ]
            );
        });

        return unsubscribe;
    }, [navigation, hasUnsavedChanges]);

    // Helper function to get prayer-specific icons
    const getPrayerIcon = (prayer) => {
        switch (prayer) {
            case 'fajr':
                return 'sunrise';
            case 'dhuhr':
                return 'sun';
            case 'asr':
                return 'sunset';
            case 'maghrib':
                return 'moon';
            case 'isha':
                return 'star';
            default:
                return 'bell';
        }
    };

    // Audio mode options
    const audioModeOptions = [
        { id: 'none', labelEn: 'Silent (No Sound)', labelAr: 'صامت (بدون صوت)', descriptionEn: 'Show the reminder with no sound', descriptionAr: 'يعرض التذكير بدون صوت' },
        { id: 'short', labelEn: 'Short Alert', labelAr: 'تنبيه قصير', descriptionEn: 'Plays a short takbir when the prayer time arrives', descriptionAr: 'يشغّل تكبيرًا قصيرًا عند دخول وقت الصلاة' },
        { id: 'full', labelEn: 'Full Adhan', labelAr: 'أذان كامل', descriptionEn: 'Short takbir on arrival; tap the notification for the full adhan', descriptionAr: 'تكبير قصير عند الوصول، اضغط على الإشعار لسماع الأذان كاملاً' },
    ];

    const renderLocationItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => setSelectedLocation(item)}
            style={[{
                backgroundColor: selectedLocation?.name === item.name ? withAlpha(colors.accent, 'activeRow') : colors.DGreen,
                borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                borderWidth: 1,
                borderColor: selectedLocation?.name === item.name ? colors.BYellow : 'transparent'
            }, webCursor]}
        >
            <Text style={{
                color: colors.BYellow,
                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                fontFamily: "Cairo_400Regular",
                marginBottom: 2
            }}>
                {item.name}
            </Text>
            <Text style={{
                color: colors.BYellow,
                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                fontFamily: "Cairo_400Regular",
                opacity: 0.8
            }}>
                {item.country}
            </Text>
        </TouchableOpacity>
    );

    const renderSection = (title, icon, content) => (
        <View style={{
            backgroundColor: colors.DGreen,
            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
            }}>
                <Feather name={icon} size={24} color={colors.BYellow} />
                <Text style={{
                    color: colors.BYellow,
                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
                    fontFamily: "Cairo_400Regular",
                    ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
                }}>
                    {title}
                </Text>
            </View>
            {content}
        </View>
    );

    return (
        <View testID="unified-prayer-settings-screen" style={{
            flex: 1,
            backgroundColor: colors.BGreen,
            ...(Platform.OS === 'web' && {
                height: '100vh',
                display: 'flex',
                flexDirection: 'column'
            })
        }}>
            <CHeader navigation={navigation} title={t('prayerSettings.title')} />

            <ScrollView
                style={{ 
                    flex: 1,
                    ...(Platform.OS === 'web' && { 
                        WebkitOverflowScrolling: 'touch',
                        overflowY: 'auto'
                    })
                }}
                contentContainerStyle={{
                    padding: PRAYER_CONSTANTS.SPACING.CONTAINER_PADDING,
                    width: '100%',
                    maxWidth: CONTENT_MAX_WIDTH,
                    alignSelf: 'center',
                    ...(Platform.OS === 'web' && {
                        paddingBottom: 50
                    })
                }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {/* Location Settings Section */}
                {renderSection(
                    t('locationSettings.title'),
                    'map-pin',
                    (
                        <>
                            {/* Current Location Display */}
                            <View style={{ marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN }}>
                                <Text style={{
                                    color: colors.BYellow,
                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                    fontFamily: "Cairo_400Regular"
                                }}>
                                    <Text style={{ fontFamily: "Cairo_400Regular" }}>
                                        {t('locationSettings.currentLocation')}:
                                    </Text>
                                    {' '}
                                    <Text style={{ opacity: currentLocation ? 1 : 0.6 }}>
                                        {currentLocation
                                            ? (currentLocation.name || `${currentLocation.city}, ${currentLocation.country}`)
                                            : t('locationSettings.noLocationSet')
                                        }
                                    </Text>
                                </Text>
                            </View>

                            {/* New Location (only visible when selected) */}
                            {selectedLocation && selectedLocation !== currentLocation && (
                                <View style={{ marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN }}>
                                    <Text style={{
                                        color: colors.currentPrayer,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular"
                                    }}>
                                        <Text style={{ fontFamily: "Cairo_400Regular" }}>
                                            {t('locationSettings.newLocation')}:
                                        </Text>
                                        {' '}
                                        {selectedLocation.name || `${selectedLocation.city}, ${selectedLocation.country}`}
                                    </Text>
                                </View>
                            )}

                            {/* Search Location */}
                            <View style={{ marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN }}>
                                <Text style={{
                                    color: colors.BYellow,
                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                    fontFamily: "Cairo_400Regular",
                                    marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                }}>
                                    {t('locationSettings.searchLocation')}
                                </Text>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.BGreen,
                                    borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                    paddingHorizontal: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                    marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                }}>
                                    <Feather name="search" size={20} color={colors.BYellow} />
                                    <TextInput
                                        style={{
                                            flex: 1,
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                            fontFamily: "Cairo_400Regular",
                                            paddingVertical: PRAYER_CONSTANTS.SPACING.BUTTON_PADDING,
                                            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING }),
                                            textAlign: getRTLTextAlign('left')
                                        }}
                                        placeholder={t('locationSettings.searchPlaceholder')}
                                        placeholderTextColor={colors.BYellow + '60'}
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                        returnKeyType="search"
                                        autoCorrect={false}
                                        autoCapitalize="words"
                                    />
                                    {isSearching && <ActivityIndicator size="small" color={colors.BYellow} />}
                                </View>

                                {searchResults.length > 0 && (
                                    Platform.OS === 'web' ? (
                                        <View style={{ maxHeight: 200, overflow: 'auto' }}>
                                            {searchResults.map((item, index) => (
                                                <TouchableOpacity
                                                    key={`search-${index}`}
                                                    onPress={() => setSelectedLocation(item)}
                                                    style={[{
                                                        backgroundColor: selectedLocation?.name === item.name ? withAlpha(colors.accent, 'activeRow') : colors.DGreen,
                                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                                        marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                                                        borderWidth: 1,
                                                        borderColor: selectedLocation?.name === item.name ? colors.BYellow : 'transparent'
                                                    }, webCursor]}
                                                >
                                                    <Text style={{
                                                        color: colors.BYellow,
                                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                        fontFamily: "Cairo_400Regular",
                                                        marginBottom: 2
                                                    }}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={{
                                                        color: colors.BYellow,
                                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                                        fontFamily: "Cairo_400Regular",
                                                        opacity: 0.8
                                                    }}>
                                                        {item.country}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <FlatList
                                            data={searchResults}
                                            renderItem={renderLocationItem}
                                            keyExtractor={(item, index) => `search-${index}`}
                                            style={{ maxHeight: 200 }}
                                            showsVerticalScrollIndicator={false}
                                            scrollEnabled={true}
                                            nestedScrollEnabled={false}
                                        />
                                    )
                                )}

                                {searchQuery.length >= PRAYER_CONSTANTS.LOCATION_SEARCH.MIN_QUERY_LENGTH &&
                                    !isSearching &&
                                    searchResults.length === 0 && (
                                        <View style={{
                                            backgroundColor: colors.BGreen,
                                            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                            marginTop: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                        }}>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                                fontFamily: "Cairo_400Regular",
                                                opacity: 0.6,
                                                textAlign: getRTLTextAlign('center')
                                            }}>
                                                {t('locationSettings.noResultsFound')}
                                            </Text>
                                        </View>
                                    )}
                            </View>

                            {/* Auto Location Buttons */}
                            <View style={{ marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN }}>
                                <Text style={{
                                    color: colors.BYellow,
                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                    fontFamily: "Cairo_400Regular",
                                    marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                }}>
                                    {t('locationSettings.autoLocate')}
                                </Text>

                                <View style={{
                                    flexDirection: 'column',
                                    gap: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                }}>
                                    <TouchableOpacity
                                        onPress={getCurrentLocation}
                                        disabled={isGettingLocation}
                                        style={[{
                                            backgroundColor: colors.BGreen,
                                            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            opacity: isGettingLocation ? 0.7 : 1,
                                            borderWidth: 1,
                                            borderColor: colors.BYellow + '40',
                                            shadowColor: colors.BGreen,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                            elevation: 5,
                                            minHeight: 50
                                        }, webCursor]}
                                    >
                                        {isGettingLocation ? (
                                            <ActivityIndicator size="small" color={colors.BYellow} />
                                        ) : (
                                            <Feather name="crosshair" size={20} color={colors.BYellow} />
                                        )}
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                            fontFamily: "Cairo_400Regular",
                                            fontWeight: '500',
                                            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
                                        }}>
                                            {t('locationSettings.useGPS')}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={getIPLocation}
                                        disabled={isGettingLocation}
                                        style={[{
                                            backgroundColor: colors.BGreen,
                                            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'flex-start',
                                            opacity: isGettingLocation ? 0.7 : 1,
                                            borderWidth: 1,
                                            borderColor: colors.BYellow + '40',
                                            shadowColor: colors.BGreen,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                            elevation: 5,
                                            minHeight: 50
                                        }, webCursor]}
                                    >
                                        {isGettingLocation ? (
                                            <ActivityIndicator size="small" color={colors.BYellow} />
                                        ) : (
                                            <Feather name="wifi" size={20} color={colors.BYellow} />
                                        )}
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                            fontFamily: "Cairo_400Regular",
                                            fontWeight: '500',
                                            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
                                        }}>
                                            {t('locationSettings.useIP')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )
                )}

                {/* Prayer Calculation Settings Section */}
                {renderSection(
                    t('prayerSettings.calculationSettingsSection'),
                    'compass',
                    (
                        <>
                            {/* Calculation Method */}
                            <TouchableOpacity
                                onPress={showCalculationMethodPicker}
                                style={[{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: colors.BGreen,
                                    padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                    borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                    borderWidth: 1,
                                    borderColor: colors.BYellow,
                                    marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                    shadowColor: colors.BGreen,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }, webCursor]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        marginBottom: 5
                                    }}>
                                        {t('prayerSettings.calculationMethod')}
                                    </Text>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                        fontFamily: "Cairo_400Regular",
                                        opacity: 0.8
                                    }}>
                                        {t(`prayerSettings.calculationMethods.${calculationMethod}`)}
                                    </Text>
                                </View>
                                <AntDesign name={isCalculationMethodModalVisible ? "up" : "down"} size={20} color={colors.BYellow} />
                            </TouchableOpacity>

                            {/* Madhab */}
                            <TouchableOpacity
                                onPress={showMadhabPicker}
                                style={[{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: colors.BGreen,
                                    padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                    borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                    borderWidth: 1,
                                    borderColor: colors.BYellow,
                                    marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                    shadowColor: colors.BGreen,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }, webCursor]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        marginBottom: 5
                                    }}>
                                        {t('prayerSettings.madhab')}
                                    </Text>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                        fontFamily: "Cairo_400Regular",
                                        opacity: 0.8
                                    }}>
                                        {madhab === 'Hanafi' ? t('prayerSettings.hanafiMadhab') : t('prayerSettings.shafiMadhab')}
                                    </Text>
                                </View>
                                <AntDesign name={isMadhabModalVisible ? "up" : "down"} size={20} color={colors.BYellow} />
                            </TouchableOpacity>
                        </>
                    )
                )}

                {/* Notification Settings Section */}
                {renderSection(
                    t('settings.notifications.title') || '🔔 Prayer Notifications',
                    'bell',
                    (
                        <>
                            {/* Android Warnings */}
                            {Platform.OS === 'android' && Platform.Version >= 31 && !hasExactAlarm && (
                                <TouchableOpacity
                                    onPress={handleOpenExactAlarmSettings}
                                    style={[{
                                        backgroundColor: colors.BYellow + '20',
                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                        marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderLeftWidth: 4,
                                        borderLeftColor: colors.BYellow,
                                    }, webCursor]}
                                >
                                    <AntDesign name="exclamationcircle" size={20} color={colors.BYellow} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                            fontFamily: "Cairo_400Regular",
                                            fontWeight: 'bold',
                                        }}>
                                            {t('settings.notifications.exactAlarmRequired') || 'Exact Alarms Required'}
                                        </Text>
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: 12,
                                            fontFamily: "Cairo_400Regular",
                                            opacity: 0.8,
                                        }}>
                                            {t('settings.notifications.exactAlarmMessage') || 'Enable for precise timing'}
                                        </Text>
                                    </View>
                                    <AntDesign name="right" size={16} color={colors.BYellow} />
                                </TouchableOpacity>
                            )}

                            {Platform.OS === 'android' && (
                                <TouchableOpacity
                                    onPress={handleOpenBatterySettings}
                                    style={[{
                                        backgroundColor: colors.BYellow + '15',
                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                        marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }, webCursor]}
                                >
                                    <Feather name="battery" size={20} color={colors.BYellow} />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                            fontFamily: "Cairo_400Regular",
                                            fontWeight: 'bold',
                                        }}>
                                            {t('settings.notifications.batteryOptimization') || 'Battery Optimization'}
                                        </Text>
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: 12,
                                            fontFamily: "Cairo_400Regular",
                                            opacity: 0.8,
                                        }}>
                                            {t('settings.notifications.batteryMessage') || 'Disable for reliable notifications'}
                                        </Text>
                                    </View>
                                    <AntDesign name="right" size={16} color={colors.BYellow} />
                                </TouchableOpacity>
                            )}

                            {/* Main Toggle */}
                            <View style={{
                                backgroundColor: colors.BGreen,
                                borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        fontWeight: 'bold',
                                    }}>
                                        {t('settings.notifications.enabled') || 'Enable Notifications'}
                                    </Text>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: 12,
                                        fontFamily: "Cairo_400Regular",
                                        opacity: 0.7,
                                        marginTop: 2,
                                    }}>
                                        {t('settings.notifications.enabledDescription') || 'Receive prayer time reminders'}
                                    </Text>
                                </View>
                                <CustomToggle
                                    value={notificationsEnabled}
                                    onValueChange={handleNotificationsToggle}
                                    activeColor={colors.BYellow}
                                    inactiveColor={colors.pastPrayer}
                                    icon="bell"
                                    size={24}
                                />
                            </View>

                            {/* Audio Mode Selection */}
                            {notificationsEnabled && (
                                <>
                                    <TouchableOpacity
                                        onPress={() => setAudioModeModalVisible(true)}
                                        style={[{
                                            backgroundColor: colors.BGreen,
                                            borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                            marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }, webCursor]}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                                fontFamily: "Cairo_400Regular",
                                                fontWeight: 'bold',
                                                marginBottom: 4,
                                            }}>
                                                {t('settings.notifications.audioMode') || 'Audio Mode'}
                                            </Text>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                fontFamily: "Cairo_400Regular",
                                            }}>
                                                {audioModeOptions.find(m => m.id === audioMode)?.[isRTL() ? 'labelAr' : 'labelEn'] || 'Short Alert'}
                                            </Text>
                                        </View>
                                        <AntDesign name="right" size={20} color={colors.BYellow} />
                                    </TouchableOpacity>

                                    {/* Adhan Recitation Selection (played when the notification is tapped) */}
                                    {audioMode !== 'none' && (
                                        <TouchableOpacity
                                            onPress={() => setAdhanModalVisible(true)}
                                            style={[{
                                                backgroundColor: colors.BGreen,
                                                borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                                marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }, webCursor]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={{
                                                    color: colors.BYellow,
                                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                                    fontFamily: "Cairo_400Regular",
                                                    fontWeight: 'bold',
                                                    marginBottom: 4,
                                                }}>
                                                    {t('settings.notifications.adhanRecitation') || 'Adhan Recitation'}
                                                </Text>
                                                <Text style={{
                                                    color: colors.BYellow,
                                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                    fontFamily: "Cairo_400Regular",
                                                }}>
                                                    {isRTL() ? getAdhanById(selectedAdhan).nameAr : getAdhanById(selectedAdhan).nameEn}
                                                </Text>
                                                {adhanState[selectedAdhan]?.downloading && (
                                                    <Text style={{
                                                        color: colors.BYellow,
                                                        fontSize: 12,
                                                        fontFamily: "Cairo_400Regular",
                                                        opacity: 0.7,
                                                        marginTop: 2,
                                                    }}>
                                                        {(t('settings.notifications.downloading') || 'Downloading') + ` ${Math.round((adhanState[selectedAdhan]?.progress || 0) * 100)}%`}
                                                    </Text>
                                                )}
                                            </View>
                                            {adhanState[selectedAdhan]?.downloading
                                                ? <ActivityIndicator size="small" color={colors.BYellow} />
                                                : <AntDesign name="right" size={20} color={colors.BYellow} />}
                                        </TouchableOpacity>
                                    )}

                                    {/* Tested mode: fire a test adhan in 60 seconds */}
                                    {testedMode && (
                                        <TouchableOpacity
                                            onPress={handleTestNotification}
                                            style={[{
                                                backgroundColor: colors.BGreen,
                                                borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                                marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderWidth: 1,
                                                borderColor: colors.BYellow,
                                                borderStyle: 'dashed',
                                            }, webCursor]}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={{
                                                    color: colors.BYellow,
                                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                                    fontFamily: "Cairo_400Regular",
                                                    fontWeight: 'bold',
                                                    marginBottom: 4,
                                                }}>
                                                    🧪 Test notification
                                                </Text>
                                                <Text style={{
                                                    color: colors.BYellow,
                                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
                                                    fontFamily: "Cairo_400Regular",
                                                }}>
                                                    Fire a test adhan in 60 seconds
                                                </Text>
                                            </View>
                                            <Feather name="play-circle" size={22} color={colors.BYellow} />
                                        </TouchableOpacity>
                                    )}

                                    {/* Individual Prayer Notifications */}
                                    <View style={{
                                        backgroundColor: colors.BGreen,
                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                    }}>
                                        <Text style={{
                                            color: colors.BYellow,
                                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                                            fontFamily: "Cairo_400Regular",
                                            fontWeight: 'bold',
                                            marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                        }}>
                                            {t('settings.notifications.selectPrayers') || 'Select Prayers'}
                                        </Text>

                                        {Object.keys(notificationTimes).map((prayer) => (
                                            <View key={prayer} style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                            }}>
                                                <Text style={{
                                                    color: colors.BYellow,
                                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                    fontFamily: "Cairo_400Regular"
                                                }}>
                                                    {t(`prayerTimes.${prayer}`)}
                                                </Text>
                                                <CustomToggle
                                                    value={notificationTimes[prayer]}
                                                    onValueChange={(enabled) => handlePrayerNotificationToggle(prayer, enabled)}
                                                    activeColor={colors.BYellow}
                                                    inactiveColor={colors.pastPrayer}
                                                    icon={getPrayerIcon(prayer)}
                                                    size={20}
                                                />
                                            </View>
                                        ))}
                                    </View>

                                    {/* Persistent Countdown Notification Toggle */}
                                    <View style={{
                                        backgroundColor: colors.BGreen,
                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                        marginTop: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                fontFamily: "Cairo_400Regular",
                                                fontWeight: 'bold',
                                                marginBottom: 4,
                                            }}>
                                                {t('prayerTimes.persistentNotification') || 'Show Countdown Notification'}
                                            </Text>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.CAPTION,
                                                fontFamily: "Cairo_400Regular",
                                                opacity: 0.7,
                                            }}>
                                                {t('prayerTimes.persistentNotificationDesc') || 'Keep countdown in notification tray'}
                                            </Text>
                                        </View>
                                        <CustomToggle
                                            value={showPersistentCountdown}
                                            onValueChange={setShowPersistentCountdown}
                                            activeColor={colors.BYellow}
                                            inactiveColor={colors.pastPrayer}
                                            icon="bell"
                                            size={24}
                                        />
                                    </View>
                                </>
                            )}
                        </>
                    )
                )}



                {/* Disclaimer */}
                <View style={{
                    backgroundColor: colors.noticeBackground,
                    borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                    padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                    marginBottom: PRAYER_CONSTANTS.SPACING.CARD_MARGIN,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.noticeAccent
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                    }}>
                        <Feather name="info" size={18} color={colors.noticeAccent} />
                        <Text style={{
                            color: colors.noticeAccent,
                            fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                            fontFamily: "Cairo_400Regular",
                            ...getDirectionalMixedSpacing({ marginLeft: PRAYER_CONSTANTS.SPACING.SMALL_PADDING })
                        }}>
                            {t('common.prayerTimesDisclaimer')}
                        </Text>
                    </View>

                    <Text style={{
                        color: colors.noticeText,
                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.SMALL_BODY,
                        fontFamily: "Cairo_400Regular",
                        lineHeight: 20,
                        textAlign: getRTLTextAlign('left')
                    }}>
                        {t('common.prayerTimesDisclaimerText')}
                    </Text>
                </View>
            </ScrollView>

            {/* Floating Save Button */}
            <TouchableOpacity
                onPress={async () => {
                    const ok = await saveAllSettings();
                    if (ok) {
                        skipUnsavedGuardRef.current = true;
                        Alert.alert(
                            t('common.success'),
                            t('prayerSettings.saveSuccess'),
                            [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
                        );
                    }
                }}
                disabled={!selectedLocation && !currentLocation}
                style={{
                    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
                    bottom: Platform.OS === 'web' ? 20 : 30,
                    ...getDirectionalMixedSpacing({ right: 20 }),
                    backgroundColor: (selectedLocation || currentLocation) ? colors.BYellow : colors.pastPrayer,
                    borderRadius: 28,
                    width: 56,
                    height: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (selectedLocation || currentLocation) ? 1 : 0.5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4.65,
                    elevation: 8,
                    zIndex: 1000,
                    ...(Platform.OS === 'web' && {
                        cursor: (selectedLocation || currentLocation) ? 'pointer' : 'not-allowed',
                        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none'
                    })
                }}
            >
                <Feather name="save" size={24} color={colors.DGreen} />
            </TouchableOpacity>

            {/* Calculation Method Modal */}
            <Modal
                visible={isCalculationMethodModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCalculationMethodModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: colors.overlayBackground,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setCalculationMethodModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
                        maxWidth: 480,
                        maxHeight: '70%',
                        backgroundColor: colors.DGreen,
                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                        borderWidth: 1,
                        borderColor: colors.BYellow,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}>
                        <View style={{
                            backgroundColor: colors.BGreen,
                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.BYellow + '33'
                        }}>
                            <Text style={{
                                color: colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center'
                            }}>
                                {t('prayerSettings.calculationMethod')}
                            </Text>
                        </View>
                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            style={Platform.OS === 'web' ? { maxHeight: '60vh' } : {}}
                        >
                            {Object.values(PRAYER_CONSTANTS.CALCULATION_METHODS).map((method) => (
                                <TouchableOpacity
                                    key={method}
                                    style={[{
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.BYellow + '20',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: calculationMethod === method ? colors.BYellow : 'transparent'
                                    }, webCursor]}
                                    onPress={() => handleCalculationMethodSelection(method)}
                                >
                                    <Text style={{
                                        color: calculationMethod === method ? colors.DGreen : colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        textAlign: 'center',
                                        flex: 1
                                    }}>
                                        {t(`prayerSettings.calculationMethods.${method}`)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Madhab Modal */}
            <Modal
                visible={isMadhabModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMadhabModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: colors.overlayBackground,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setMadhabModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
                        maxWidth: 480,
                        backgroundColor: colors.DGreen,
                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                        borderWidth: 1,
                        borderColor: colors.BYellow,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}>
                        <View style={{
                            backgroundColor: colors.BGreen,
                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.BYellow + '33'
                        }}>
                            <Text style={{
                                color: colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center'
                            }}>
                                {t('prayerSettings.madhab')}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[{
                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.BYellow + '20',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: madhab === 'Shafi' ? colors.BYellow : 'transparent'
                            }, webCursor]}
                            onPress={() => handleMadhabSelection('Shafi')}
                        >
                            <Text style={{
                                color: madhab === 'Shafi' ? colors.DGreen : colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center',
                                flex: 1
                            }}>
                                {t('prayerSettings.shafiMadhab')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[{
                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: madhab === 'Hanafi' ? colors.BYellow : 'transparent'
                            }, webCursor]}
                            onPress={() => handleMadhabSelection('Hanafi')}
                        >
                            <Text style={{
                                color: madhab === 'Hanafi' ? colors.DGreen : colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center',
                                flex: 1
                            }}>
                                {t('prayerSettings.hanafiMadhab')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Audio Mode Modal */}
            <Modal
                visible={isAudioModeModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAudioModeModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: colors.overlayBackground,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setAudioModeModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
                        maxWidth: 480,
                        backgroundColor: colors.DGreen,
                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                        borderWidth: 1,
                        borderColor: colors.BYellow,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}>
                        <View style={{
                            backgroundColor: colors.BGreen,
                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.BYellow + '33'
                        }}>
                            <Text style={{
                                color: colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center'
                            }}>
                                {t('settings.notifications.audioMode') || 'Audio Mode'}
                            </Text>
                        </View>

                        {audioModeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[{
                                    padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.BYellow + '1A',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: audioMode === option.id ? colors.BYellow + '20' : 'transparent'
                                }, webCursor]}
                                onPress={() => handleAudioModeSelection(option.id)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        fontWeight: audioMode === option.id ? 'bold' : 'normal',
                                    }}>
                                        {isRTL() ? option.labelAr : option.labelEn}
                                    </Text>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: 12,
                                        fontFamily: "Cairo_400Regular",
                                        opacity: 0.7,
                                        marginTop: 2,
                                    }}>
                                        {isRTL() ? option.descriptionAr : option.descriptionEn}
                                    </Text>
                                </View>
                                {audioMode === option.id && (
                                    <AntDesign name="checkcircle" size={20} color={colors.BYellow} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Adhan Recitation Modal */}
            <Modal
                visible={isAdhanModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAdhanModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: colors.overlayBackground,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setAdhanModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
                        maxWidth: 480,
                        maxHeight: '80%',
                        backgroundColor: colors.DGreen,
                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
                        borderWidth: 1,
                        borderColor: colors.BYellow,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        elevation: 8,
                    }}>
                        <View style={{
                            backgroundColor: colors.BGreen,
                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.BYellow + '33'
                        }}>
                            <Text style={{
                                color: colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.SUBTITLE,
                                fontFamily: "Cairo_400Regular",
                                textAlign: 'center'
                            }}>
                                {t('settings.notifications.adhanRecitation') || 'Adhan Recitation'}
                            </Text>
                        </View>

                        <ScrollView>
                            {ADHAN_CATALOG.map((option) => {
                                const st = adhanState[option.id];
                                const isDownloaded = option.bundled || st?.downloaded;
                                const isDownloading = st?.downloading;
                                let status;
                                if (option.bundled) status = isRTL() ? option.reciterAr : option.reciterEn;
                                else if (isDownloading) status = (t('settings.notifications.downloading') || 'Downloading') + ` ${Math.round((st?.progress || 0) * 100)}%`;
                                else if (st?.downloaded) status = t('settings.notifications.downloaded') || 'Downloaded';
                                else status = `${(option.bytes / 1048576).toFixed(1)} MB · ${t('settings.notifications.tapToDownload') || 'tap to download'}`;
                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[{
                                            padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.BYellow + '1A',
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            backgroundColor: selectedAdhan === option.id ? colors.BYellow + '20' : 'transparent'
                                        }, webCursor]}
                                        onPress={() => handleAdhanSelection(option.id)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                                fontFamily: "Cairo_400Regular",
                                                fontWeight: selectedAdhan === option.id ? 'bold' : 'normal',
                                            }}>
                                                {isRTL() ? option.nameAr : option.nameEn}
                                            </Text>
                                            <Text style={{
                                                color: colors.BYellow,
                                                fontSize: 12,
                                                fontFamily: "Cairo_400Regular",
                                                opacity: 0.7,
                                                marginTop: 2,
                                            }}>
                                                {status}
                                            </Text>
                                        </View>
                                        {!option.bundled && st?.downloaded && (
                                            <TouchableOpacity
                                                onPress={() => AdhanDownloader.remove(option.id)}
                                                style={[{ paddingHorizontal: 8 }, webCursor]}
                                            >
                                                <Feather name="trash-2" size={18} color={colors.BYellow} />
                                            </TouchableOpacity>
                                        )}
                                        {isDownloading
                                            ? <ActivityIndicator size="small" color={colors.BYellow} />
                                            : selectedAdhan === option.id
                                                ? <AntDesign name="checkcircle" size={20} color={colors.BYellow} />
                                                : (!isDownloaded && <Feather name="download" size={20} color={colors.BYellow} />)}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
