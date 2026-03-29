import { Text } from '@/app/components/StyledText';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LockScreen({ onUnlock, pinAsli }: { onUnlock: () => void, pinAsli: string }) {
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState(false);
    const fadeAnim = new Animated.Value(1);

    useEffect(() => {
        if (error) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.3,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [error]);

    const handleNumberPress = (number: string) => {
        if (pin.length >= 4 && error) {
            setPin(number);
            setError(false);
        }

        if (pin.length < 4) {
            const newPin = pin + number;
            setError(false);
            setPin(newPin);

            if (newPin.length === 4) {
                if (newPin === pinAsli) {
                    onUnlock();
                } else {
                    setError(true);
                    setPin('');
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const { t } = useTranslation();

    return (
        <LinearGradient
            colors={["#2480ea", "#2480ea", "#5abce0"]}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Image
                        source={require('../../assets/images/icon.png')}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>{t('lockscreen.enter_pin')}</Text>
                <Text style={styles.subtitle}>{t('lockscreen.enter_pin_desc')}</Text>

                <Animated.View
                    style={[styles.pinContainer, { opacity: fadeAnim }]}
                >
                    {[...Array(4)].map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.pinDot,
                                pin.length > index && styles.pinDotFilled,
                                error && styles.pinDotError
                            ]}
                        >
                            {pin.length > index && (
                                <View style={styles.pinDotInner} />
                            )}
                        </View>
                    ))}
                </Animated.View>

                <View style={styles.errorContainer}>
                    {error && (
                        <Text style={styles.errorText}>{t('lockscreen.incorrect_pin')}</Text>
                    )}
                </View>

                <View style={styles.keypad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '←'].map((number, index) => (
                        number !== '' && (
                            <TouchableOpacity
                                key={index}
                                style={[styles.key, number === '←' && styles.deleteKey]}
                                onPress={() => number === '←' ? handleDelete() : handleNumberPress(number.toString())}
                            >
                                <LinearGradient
                                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                                    style={styles.keyGradient}
                                >
                                    <Text style={[styles.keyText, number === '←' && styles.deleteText]}>
                                        {number}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )
                    ))}
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 120,
        height: 120,
        marginBottom: 40,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 15,
    },
    icon: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 50,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        margin: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    pinDotFilled: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    pinDotError: {
        backgroundColor: 'rgba(231,76,60,0.3)',
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        height: 30,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: Dimensions.get('window').width * 0.8,
        maxWidth: 400,
    },
    key: {
        width: '30%',
        aspectRatio: 1,
        padding: 5,
        margin: '1.5%',
    },
    keyGradient: {
        flex: 1,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteKey: {
        width: '30%',
    },
    keyText: {
        fontSize: 28,
        color: 'white',
        fontWeight: '500',
    },
    deleteText: {
        fontSize: 24,
    },
});