import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    FlatList,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

import { useMataUang, useNotifikasi } from '@/hooks/usePreference';
import { requestNotificationPermission, scheduleDailyReminder } from '@/utils/notifikasi';
import { CURRENCIES } from '@/utils/preferences';
import { storageUtils } from '@/utils/storage';
import i18n from '../utils/i18n';
import Restore from './restore';

const { width } = Dimensions.get('window');

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const STEPS = {
    LANGUAGE: 0,
    CURRENCY: 1,
    NOTIFICATION: 2,
    PIN: 3,
};

export default function Welcome({ onDismiss }: { onDismiss?: () => void }) {
    const router = useRouter();
    const { t } = useTranslation();
    const { ganti: gantiMataUang } = useMataUang();
    const { ganti: gantiNotifikasi } = useNotifikasi();

    const [currentStep, setCurrentStep] = useState(STEPS.LANGUAGE);
    const [selectedLanguage, setSelectedLanguage] = useState(Localization.getLocales()[0]?.languageCode || 'en');
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isConfirmingPin, setIsConfirmingPin] = useState(false);
    const [pinError, setPinError] = useState('');
    const [showRestore, setShowRestore] = useState(false);
    const [doneRestore, setDoneRestore] = useState(false);

    const [notificationTime, setNotificationTime] = useState<{ hour: number, minute: number }>({ hour: 20, minute: 0 });
    const [showTimePicker, setShowTimePicker] = useState(false);

    const handleLanguageSelect = async (langCode: string) => {
        setSelectedLanguage(langCode);
        await i18n.changeLanguage(langCode);
        storageUtils.simpanBahasa(langCode);
    };

    const handleCurrencySelect = (currency: any) => {
        setSelectedCurrency(currency);
    };

    const handleNotificationSetup = async (enable: boolean) => {
        if (enable) {
            const hasPermission = await requestNotificationPermission();
            if (hasPermission) {
                await gantiNotifikasi(true, notificationTime);
                await scheduleDailyReminder(notificationTime.hour, notificationTime.minute);
            } else {
                await gantiNotifikasi(false, { hour: 20, minute: 0 });
            }
        } else {
            await gantiNotifikasi(false, { hour: 20, minute: 0 });
        }
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            setNotificationTime({
                hour: selectedDate.getHours(),
                minute: selectedDate.getMinutes()
            });
        }
    };

    const handlePinInput = (num: number | string) => {
        setPinError('');
        if (num === 'delete') {
            if (isConfirmingPin) {
                setConfirmPin(prev => prev.slice(0, -1));
            } else {
                setPin(prev => prev.slice(0, -1));
            }
            return;
        }

        if (typeof num === 'number') {
            if (isConfirmingPin) {
                if (confirmPin.length < 4) {
                    const newPin = confirmPin + num;
                    setConfirmPin(newPin);
                    if (newPin.length === 4) {
                        if (newPin === pin) {
                            finishSetup(newPin);
                        } else {
                            setPinError(t("welcome.pin_mismatch") || "PINs do not match");
                            setConfirmPin('');
                        }
                    }
                }
            } else {
                if (pin.length < 4) {
                    const newPin = pin + num;
                    setPin(newPin);
                    if (newPin.length === 4) {
                        setIsConfirmingPin(true);
                    }
                }
            }
        }
    };

    const finishSetup = async (finalPin: string) => {
        // Save everything
        await gantiMataUang(selectedCurrency.symbol);
        if (finalPin) {
            await storageUtils.simpanPin(finalPin);
        }
        await storageUtils.setHasLaunched();

        if (onDismiss) {
            onDismiss();
        } else {
            router.replace('/(tabs)');
        }
    }

    const handleNext = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (currentStep === STEPS.LANGUAGE) {
            setCurrentStep(STEPS.CURRENCY);
        } else if (currentStep === STEPS.CURRENCY) {
            await gantiMataUang(selectedCurrency.symbol);
            setCurrentStep(STEPS.NOTIFICATION);
        } else if (currentStep === STEPS.NOTIFICATION) {
            setCurrentStep(STEPS.PIN);
        }
    };

    const handleBack = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (currentStep === STEPS.CURRENCY) {
            setCurrentStep(STEPS.LANGUAGE);
        } else if (currentStep === STEPS.NOTIFICATION) {
            setCurrentStep(STEPS.CURRENCY);
        } else if (currentStep === STEPS.PIN) {
            setCurrentStep(STEPS.NOTIFICATION);
        }
    };

    const handleSkipPin = async () => {
        await finishSetup("");
    }


    // --- Render Steps ---

    const renderLanguageStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('welcome.select_language') || "Select Language"}</Text>
            <Text style={styles.stepDesc}>{t('welcome.select_language_desc') || "Choose your preferred language for the app."}</Text>

            <FlatList
                data={LANGUAGES}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.optionItem,
                            selectedLanguage === item.code && styles.optionItemSelected
                        ]}
                        onPress={() => handleLanguageSelect(item.code)}
                    >
                        <Text style={styles.optionText}>{item.flag} {item.label}</Text>
                        {selectedLanguage === item.code && <Ionicons name="checkmark-circle" size={24} color="#0984e3" />}
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => setShowRestore(true)}
            >
                <Ionicons name="cloud-download-outline" size={20} color="#0984e3" />
                <Text style={styles.restoreText}>{t('welcome.restore_data') || "Restore from Backup"}</Text>
            </TouchableOpacity>
        </View>
    );

    if (showRestore) {
        return <Restore onBack={() => setShowRestore(false)} onDone={() => setDoneRestore(true)} />;
    }

    if (doneRestore) {
        storageUtils.setHasLaunched();
        onDismiss?.();
        return;
    }

    const renderCurrencyStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('welcome.select_currency') || "Select Currency"}</Text>
            <Text style={styles.stepDesc}>{t('welcome.select_currency_desc') || "Choose the currency you use for transactions."}</Text>

            <FlatList
                data={CURRENCIES}
                keyExtractor={item => item.symbol}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.optionItem,
                            selectedCurrency.symbol === item.symbol && styles.optionItemSelected
                        ]}
                        onPress={() => handleCurrencySelect(item)}
                    >
                        <View>
                            <Text style={styles.optionTitle}>{item.symbol}  {item.name}</Text>
                        </View>
                        {selectedCurrency.symbol === item.symbol && <Ionicons name="checkmark-circle" size={24} color="#0984e3" />}
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    const renderNotificationStep = () => (
        <View style={styles.stepContainerCenter}>
            <View style={styles.iconCircle}>
                <Ionicons name="notifications" size={50} color="#0984e3" />
            </View>
            <Text style={styles.stepTitle}>{t('welcome.notifications') || "Daily Reminders"}</Text>
            <Text style={[styles.stepDesc, { textAlign: 'center' }]}>
                {t('welcome.notifications_desc') || "Stay on track! Enable daily reminders to record your expenses at 20:00 every day."}
            </Text>

            <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
            >
                <Ionicons name="time-outline" size={24} color="#0984e3" />
                <Text style={styles.timePickerText}>
                    {`${notificationTime.hour.toString().padStart(2, '0')}:${notificationTime.minute.toString().padStart(2, '0')}`}
                </Text>
            </TouchableOpacity>

            {showTimePicker && (
                <DateTimePicker
                    value={new Date(new Date().setHours(notificationTime.hour, notificationTime.minute))}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTimeChange}
                />
            )}

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={async () => {
                    handleNext();
                    await handleNotificationSetup(true);
                }}
            >
                <Text style={styles.primaryButtonText}>{t('welcome.enable_notifications') || "Enable Notifications"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={async () => {
                    handleNext();
                    await handleNotificationSetup(false);
                }}
            >
                <Text style={styles.secondaryButtonText}>{t('welcome.skip') || "Skip"}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPinStep = () => (
        <View style={styles.stepContainerCenter}>
            <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={40} color="#0984e3" />
            </View>
            <Text style={styles.stepTitle}>
                {isConfirmingPin
                    ? (t('welcome.confirm_pin') || "Confirm PIN")
                    : (t('welcome.create_pin') || "Create a PIN")}
            </Text>
            <Text style={[styles.stepDesc, { textAlign: 'center' }]}>
                {isConfirmingPin
                    ? (t('welcome.confirm_pin_desc') || "Re-enter your PIN to confirm.")
                    : (t('welcome.create_pin_desc') || "Secure your data with a 4-digit PIN.")}
            </Text>

            <View style={styles.pinDotsContainer}>
                {[...Array(4)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.pinDot,
                            (isConfirmingPin ? confirmPin.length > i : pin.length > i) && styles.pinDotFilled,
                            pinError !== '' && styles.pinDotError
                        ]}
                    />
                ))}
            </View>

            {pinError !== '' && <Text style={styles.errorText}>{pinError}</Text>}

            <View style={styles.keypad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.key}
                        onPress={() => item !== '' && handlePinInput(item)}
                        disabled={item === ''}
                    >
                        {item === 'delete' ? (
                            <Ionicons name="backspace-outline" size={24} color="#333" />
                        ) : (
                            <Text style={styles.keyText}>{item}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
            <View style={{ height: 60, justifyContent: 'center', marginTop: 20 }}>
                {!isConfirmingPin && pin.length === 0 && (
                    <TouchableOpacity onPress={handleSkipPin}>
                        <Text style={styles.skipText}>{t('welcome.skip_pin') || "Skip PIN Setup"}</Text>
                    </TouchableOpacity>
                )}
                {isConfirmingPin && (
                    <TouchableOpacity onPress={() => { setIsConfirmingPin(false); setConfirmPin(''); setPin(''); }}>
                        <Text style={styles.skipText}>{t('welcome.reset_pin') || "Reset & Start Over"}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <LinearGradient colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Header / Progress Indicator */}
                    <View style={styles.header}>
                        <View style={styles.topHeader}>
                            <View style={{ flex: 1, alignItems: 'flex-start' }}>
                                <TouchableOpacity
                                    onPress={handleBack}
                                    disabled={currentStep === 0}
                                    style={{ padding: 4, opacity: currentStep > 0 ? 1 : 0 }}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#0984e3" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.headerText}>Step {currentStep + 1} of 4</Text>
                            </View>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <TouchableOpacity onPress={() => finishSetup("")}>
                                    <Text style={styles.skipButtonText}>{t('welcome.skip') || "Skip"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${((currentStep + 1) / 4) * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.content}>
                        {currentStep === STEPS.LANGUAGE && renderLanguageStep()}
                        {currentStep === STEPS.CURRENCY && renderCurrencyStep()}
                        {currentStep === STEPS.NOTIFICATION && renderNotificationStep()}
                        {currentStep === STEPS.PIN && renderPinStep()}
                    </View>

                    {/* Navigation Buttons for Step 1 & 2 */}
                    {(currentStep === STEPS.LANGUAGE || currentStep === STEPS.CURRENCY) && (
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                                <Text style={styles.nextButtonText}>{t('welcome.next') || "Next"}</Text>
                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        marginBottom: 20,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600'
    },
    skipButtonText: {
        color: '#0984e3',
        fontSize: 14,
        fontWeight: 'bold'
    },
    progressBar: {
        height: 6,
        width: '100%',
        backgroundColor: '#dee2e6',
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0984e3',
        borderRadius: 3
    },
    content: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
    },
    stepContainerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: "center"
    },
    stepTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0984e3',
        marginBottom: 8,
        textAlign: 'left'
    },
    stepDesc: {
        fontSize: 16,
        color: '#636e72',
        marginBottom: 24,
        lineHeight: 22,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionItemSelected: {
        borderColor: '#0984e3',
        backgroundColor: '#f1f9ff'
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2d3436'
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3436'
    },
    footer: {
        paddingVertical: 25,
    },
    nextButton: {
        backgroundColor: '#0984e3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#0984e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    primaryButton: {
        backgroundColor: '#0984e3',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        marginTop: 20
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginTop: 10
    },
    secondaryButtonText: {
        color: '#636e72',
        fontSize: 16,
        fontWeight: '600'
    },
    // PIN Styles
    pinDotsContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        justifyContent: 'center'
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#b2bec3',
        marginHorizontal: 12
    },
    pinDotFilled: {
        backgroundColor: '#0984e3',
        borderColor: '#0984e3'
    },
    pinDotError: {
        borderColor: '#d63031',
        backgroundColor: '#d63031'
    },
    errorText: {
        color: '#d63031',
        marginBottom: 20,
        fontSize: 14,
        fontWeight: 'bold'
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: 280
    },
    key: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 6,
        //   backgroundColor: '#fff'
    },
    keyText: {
        fontSize: 28,
        fontWeight: '600',
        color: '#2d3436'
    },
    skipText: {
        color: '#636e72',
        fontSize: 16,
        textDecorationLine: 'underline'
    },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 10
    },
    restoreText: {
        marginLeft: 8,
        color: '#0984e3',
        fontWeight: '600',
        fontSize: 16
    },
    timePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f9ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0984e3',
        marginBottom: 24,
    },
    timePickerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0984e3',
        marginLeft: 10,
    },
});
