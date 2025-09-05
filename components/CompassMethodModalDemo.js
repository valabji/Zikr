import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import CompassMethodModal from '../components/CompassMethodModal';
import { useColors } from '../constants/Colors';
import { PRAYER_CONSTANTS } from '../constants/PrayerConstants';

const CompassMethodModalDemo = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const colors = useColors();

    const availableMethods = ['location', 'magnetometer'];

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
        console.log('Selected method:', method);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <Text style={[
                    PRAYER_CONSTANTS.FONT_STYLES.TITLE,
                    { color: colors.text, marginBottom: 20, textAlign: 'center' }
                ]}>
                    Compass Method Modal Demo
                </Text>
                
                {selectedMethod && (
                    <Text style={[
                        PRAYER_CONSTANTS.FONT_STYLES.BODY,
                        { color: colors.text, marginBottom: 20, textAlign: 'center' }
                    ]}>
                        Last selected method: {selectedMethod}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                        backgroundColor: colors.DGreen,
                        padding: 16,
                        borderRadius: PRAYER_CONSTANTS.BORDER_RADIUS.MEDIUM,
                        borderColor: colors.BYellow,
                        borderWidth: 1
                    }}
                >
                    <Text style={[
                        PRAYER_CONSTANTS.FONT_STYLES.BODY,
                        { color: colors.BYellow, fontWeight: '600' }
                    ]}>
                        Open Compass Method Modal
                    </Text>
                </TouchableOpacity>

                <CompassMethodModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    availableMethods={availableMethods}
                    onMethodSelect={handleMethodSelect}
                />
            </View>
        </SafeAreaView>
    );
};

export default CompassMethodModalDemo;
