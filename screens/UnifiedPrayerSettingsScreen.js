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
import { t, getDirectionalMixedSpacing, getRTLTextAlign } from '../locales/i18n';
import CHeader from '../components/CHeader';
import CustomToggle from '../components/CustomToggle';
import { Feather, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import moment from 'moment-timezone';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';
import { searchLocations, getLocationFromIP, getBrowserLocation } from '../utils/PrayerUtils';
import { Restart } from '../utils/restart';

export default function UnifiedPrayerSettingsScreen({ navigation }) {
    const colors = useColors();

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
    const [notificationTimes, setNotificationTimes] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true
    });

    // UI states
    const [isCalculationMethodModalVisible, setCalculationMethodModalVisible] = useState(false);
    const [isMadhabModalVisible, setMadhabModalVisible] = useState(false);

    // Initial values for change detection
    const [initialLocation, setInitialLocation] = useState(null);
    const [initialCalculationMethod, setInitialCalculationMethod] = useState(PRAYER_CONSTANTS.DEFAULT_CALCULATION_METHOD);
    const [initialMadhab, setInitialMadhab] = useState(PRAYER_CONSTANTS.DEFAULT_MADHAB);
    const [initialNotificationsEnabled, setInitialNotificationsEnabled] = useState(false);
    const [initialNotificationTimes, setInitialNotificationTimes] = useState({
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true
    });

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
            const savedNotifications = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED);
            const savedNotificationTimes = await AsyncStorage.getItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATION_TIMES);

            if (savedMethod) {
                setCalculationMethod(savedMethod);
            }
            if (savedMadhab) {
                setMadhab(savedMadhab);
            }
            if (savedNotifications) {
                setNotificationsEnabled(JSON.parse(savedNotifications));
            }
            if (savedNotificationTimes) {
                setNotificationTimes(JSON.parse(savedNotificationTimes));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        // Set initial values for change detection
        setInitialLocation(currentLocation);
        setInitialCalculationMethod(calculationMethod);
        setInitialMadhab(madhab);
        setInitialNotificationsEnabled(notificationsEnabled);
        setInitialNotificationTimes({ ...notificationTimes });
    };

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

    // Save all settings (location + prayer settings)
    const saveAllSettings = async () => {
        // Allow saving if we have either selectedLocation or currentLocation
        if (!selectedLocation && !currentLocation) {
            Alert.alert(t('locationSettings.error'), t('locationSettings.noLocationSelected'));
            return;
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
            await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATIONS_ENABLED, JSON.stringify(notificationsEnabled));
            await AsyncStorage.setItem(PRAYER_CONSTANTS.STORAGE_KEYS.NOTIFICATION_TIMES, JSON.stringify(notificationTimes));

            setTimeout(() => {
                Restart();
            }, 100);
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert(t('common.error'), t('prayerSettings.saveError'));
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
        if (JSON.stringify(notificationTimes) !== JSON.stringify(initialNotificationTimes)) return true;

        return false;
    }, [selectedLocation, initialLocation, calculationMethod, initialCalculationMethod, madhab, initialMadhab, notificationsEnabled, initialNotificationsEnabled, notificationTimes, initialNotificationTimes]);

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
            if (hasUnsavedChanges()) {
                e.preventDefault();
                Alert.alert(
                    t('common.unsavedChanges'),
                    t('common.unsavedChangesMessage'),
                    [
                        { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
                        { text: t('common.discard'), style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
                        { text: t('common.save'), style: 'default', onPress: async () => {
                            await saveAllSettings();
                            navigation.dispatch(e.data.action);
                        } }
                    ]
                );
            }
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

    const renderLocationItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => setSelectedLocation(item)}
            style={{
                backgroundColor: selectedLocation?.name === item.name ? colors.nextPrayer : colors.DGreen,
                borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                borderWidth: 1,
                borderColor: selectedLocation?.name === item.name ? colors.BYellow : 'transparent'
            }}
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
        <View style={{ 
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
                                                    style={{
                                                        backgroundColor: selectedLocation?.name === item.name ? colors.nextPrayer : colors.DGreen,
                                                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                                        marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING,
                                                        borderWidth: 1,
                                                        borderColor: selectedLocation?.name === item.name ? colors.BYellow : 'transparent'
                                                    }}
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
                                        style={{
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
                                        }}
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
                                        style={{
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
                                        }}
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
                                style={{
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
                                }}
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
                                style={{
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
                                }}
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

                {/* Notification Settings Section - Hidden until notification logic is implemented */}
                {false && renderSection(
                    t('prayerSettings.prayerNotificationsSection'),
                    'bell',
                    (
                        <>
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
                                <Text style={{
                                    color: colors.BYellow,
                                    fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                    fontFamily: "Cairo_400Regular"
                                }}>
                                    {t('prayerSettings.notifications')}
                                </Text>
                                <CustomToggle
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    activeColor={colors.BYellow}
                                    inactiveColor={colors.pastPrayer}
                                    icon="bell"
                                    size={24}
                                />
                            </View>

                            {/* Individual Prayer Notifications */}
                            {notificationsEnabled && (
                                <View style={{
                                    backgroundColor: colors.BGreen,
                                    borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                                    padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                }}>
                                    <Text style={{
                                        color: colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: "Cairo_400Regular",
                                        marginBottom: PRAYER_CONSTANTS.SPACING.SMALL_PADDING
                                    }}>
                                        {t('prayerSettings.notifyFor')}
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
                onPress={saveAllSettings}
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
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setCalculationMethodModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
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
                                    style={{
                                        padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.BYellow + '20',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: calculationMethod === method ? colors.BYellow : 'transparent'
                                    }}
                                    onPress={() => handleCalculationMethodSelection(method)}
                                >
                                    <Text style={{
                                        color: calculationMethod === method ? colors.DGreen : colors.BYellow,
                                        fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                        fontFamily: calculationMethod === method ? "Cairo_400Regular" : "Cairo_400Regular",
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
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setMadhabModalVisible(false)}
                >
                    <View style={{
                        width: '85%',
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
                            style={{
                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.BYellow + '20',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: madhab === 'Shafi' ? colors.BYellow : 'transparent'
                            }}
                            onPress={() => handleMadhabSelection('Shafi')}
                        >
                            <Text style={{
                                color: madhab === 'Shafi' ? colors.DGreen : colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                fontFamily: madhab === 'Shafi' ? "Cairo_400Regular" : "Cairo_400Regular",
                                textAlign: 'center',
                                flex: 1
                            }}>
                                {t('prayerSettings.shafiMadhab')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                padding: PRAYER_CONSTANTS.SPACING.CARD_PADDING,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: madhab === 'Hanafi' ? colors.BYellow : 'transparent'
                            }}
                            onPress={() => handleMadhabSelection('Hanafi')}
                        >
                            <Text style={{
                                color: madhab === 'Hanafi' ? colors.DGreen : colors.BYellow,
                                fontSize: PRAYER_CONSTANTS.FONT_SIZES.BODY,
                                fontFamily: madhab === 'Hanafi' ? "Cairo_400Regular" : "Cairo_400Regular",
                                textAlign: 'center',
                                flex: 1
                            }}>
                                {t('prayerSettings.hanafiMadhab')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
