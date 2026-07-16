import React from 'react';
import { t } from '@/locales/i18n';
import { SettingsModalShell, SettingsRow } from './settings';

const CompassMethodModal = ({
    visible,
    onClose,
    availableMethods,
    onMethodSelect
}) => {
    const methods = [
        {
            id: 'auto',
            title: t('qibla.autoSelect'),
            icon: 'zap',
            description: t('qibla.autoSelectDescription')
        },
        ...(availableMethods.includes('magHeading') ? [{
            id: 'magHeading',
            title: t('qibla.gpsMagneticEnhanced'),
            icon: 'compass',
            description: t('qibla.gpsMagneticEnhancedDescription')
        }] : []),
        ...(availableMethods.includes('trueHeading') ? [{
            id: 'trueHeading',
            title: t('qibla.gps'),
            icon: 'map-pin',
            description: t('qibla.gpsDescription')
        }] : []),
        ...(availableMethods.includes('magnetometer') ? [{
            id: 'magnetometer',
            title: t('qibla.magnetometer'),
            icon: 'compass',
            description: t('qibla.magnetometerDescription')
        }] : [])
    ];

    return (
        <SettingsModalShell
            visible={visible}
            onClose={onClose}
            title={t('qibla.switchCompassMethod')}
            headerTestID="close-button"
        >
            {methods.map((method) => (
                <SettingsRow
                    key={method.id}
                    icon={method.icon}
                    label={method.title}
                    description={method.description}
                    onPress={() => {
                        onMethodSelect(method.id);
                        onClose();
                    }}
                    chevron
                />
            ))}
        </SettingsModalShell>
    );
};

export default CompassMethodModal;
