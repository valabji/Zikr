import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
    Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../constants/Colors';
import { t, getDirectionalMixedSpacing } from '../locales/i18n';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

const { width, height } = Dimensions.get('window');

const CompassMethodModal = ({
    visible,
    onClose,
    availableMethods,
    onMethodSelect
}) => {
    const colors = useColors();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleMethodPress = (method) => {
        onMethodSelect(method);
        onClose();
    };

    const methods = [
        {
            id: 'auto',
            title: t('qibla.autoSelect'),
            icon: 'zap',
            description: t('qibla.autoSelectDescription'),
            color: '#22c55e'
        },
        ...(availableMethods.includes('magHeading') ? [{
            id: 'magHeading',
            title: t('qibla.gpsMagneticEnhanced'),
            icon: 'compass',
            description: t('qibla.gpsMagneticEnhancedDescription'),
            color: '#8b5cf6'
        }] : []),
        ...(availableMethods.includes('trueHeading') ? [{
            id: 'trueHeading',
            title: t('qibla.gps'),
            icon: 'map-pin',
            description: t('qibla.gpsDescription'),
            color: '#3b82f6'
        }] : []),
        ...(availableMethods.includes('magnetometer') ? [{
            id: 'magnetometer',
            title: t('qibla.magnetometer'),
            icon: 'compass',
            description: t('qibla.magnetometerDescription'),
            color: '#f59e0b'
        }] : [])
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: fadeAnim,
                        }
                    ]}
                >
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.modalContainer,
                                {
                                    backgroundColor: colors.DGreen,
                                    borderColor: colors.BYellow,
                                    transform: [{ scale: scaleAnim }],
                                }
                            ]}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <Feather
                                        name="compass"
                                        size={24}
                                        color={colors.BYellow}
                                        style={getDirectionalMixedSpacing({ marginRight: 12 })}
                                    />
                                    <Text style={[
                                        styles.title,
                                        PRAYER_CONSTANTS.FONT_STYLES.SUBTITLE,
                                        { color: colors.BYellow }
                                    ]}>
                                        {t('qibla.switchCompassMethod')}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[
                                        styles.closeButton,
                                        { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                                    ]}
                                    testID="close-button"
                                >
                                    <Feather name="x" size={20} color={colors.BYellow} />
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <Text style={[
                                styles.description,
                                PRAYER_CONSTANTS.FONT_STYLES.BODY,
                                { color: colors.secondaryText || colors.text }
                            ]}>
                                {t('qibla.chooseMethod')}
                            </Text>

                            {/* Method Options */}
                            <View style={styles.methodsContainer}>
                                {methods.map((method, index) => (
                                    <TouchableOpacity
                                        key={method.id}
                                        onPress={() => handleMethodPress(method.id)}
                                        style={[
                                            styles.methodOption,
                                            {
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                                marginBottom: index === methods.length - 1 ? 0 : 12
                                            }
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[
                                            styles.methodIcon,
                                            { backgroundColor: method.color + '20' }
                                        ]}>
                                            <Feather
                                                name={method.icon}
                                                size={20}
                                                color={method.color}
                                            />
                                        </View>
                                        <View style={styles.methodContent}>
                                            <Text style={[
                                                styles.methodTitle,
                                                PRAYER_CONSTANTS.FONT_STYLES.BODY,
                                                { color: colors.BYellow }
                                            ]}>
                                                {method.title}
                                            </Text>
                                            <Text style={[
                                                styles.methodDescription,
                                                PRAYER_CONSTANTS.FONT_STYLES.CAPTION,
                                                { color: colors.secondaryText || colors.text }
                                            ]}>
                                                {method.description}
                                            </Text>
                                        </View>
                                        <Feather
                                            name="chevron-right"
                                            size={18}
                                            color={colors.BYellow}
                                            style={{ opacity: 0.6 }}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={onClose}
                                style={[
                                    styles.cancelButton,
                                    {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)'
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.cancelButtonText,
                                    PRAYER_CONSTANTS.FONT_STYLES.BODY,
                                    { color: colors.BYellow }
                                ]}>
                                    {t('qibla.cancel')}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: Math.min(width - 40, 380),
        maxHeight: height * 0.8,
        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.LARGE,
        padding: 24,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontWeight: '700',
        fontSize: 18,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        marginBottom: 24,
        lineHeight: 20,
        opacity: 0.8,
    },
    methodsContainer: {
        marginBottom: 20,
    },
    methodOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
        borderWidth: 1,
    },
    methodIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodContent: {
        flex: 1,
    },
    methodTitle: {
        fontWeight: '600',
        marginBottom: 4,
    },
    methodDescription: {
        opacity: 0.7,
        lineHeight: 16,
    },
    cancelButton: {
        padding: 16,
        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
        alignItems: 'center',
        borderWidth: 1,
    },
    cancelButtonText: {
        fontWeight: '600',
    },
});

export default CompassMethodModal;
