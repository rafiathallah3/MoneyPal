import { Text } from '@/app/components/StyledText';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CalculatorProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (amount: string) => void;
    initialValue?: string;
    currencyLabel?: string;
}

const { width } = Dimensions.get('window');

const numberButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '⌫'],
];

const operationButtons = ['÷', '×', '-', '+'];

export default function Calculator({ visible, onClose, onConfirm, initialValue = '', currencyLabel = "Rupiah" }: CalculatorProps) {
    const [display, setDisplay] = useState(initialValue);
    const [hasDecimal, setHasDecimal] = useState(initialValue.includes('.'));
    const [previousValue, setPreviousValue] = useState<string>('');
    const [operation, setOperation] = useState<string>('');
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);
    const blinkAnimation = useRef(new Animated.Value(1)).current;
    const { t } = useTranslation();

    useEffect(() => {
        if (!visible) return; // Don't reset state if not visible
        setDisplay(initialValue);
    }, [visible, initialValue]);

    // Helper function to count digits (excluding decimal point)
    const countDigits = (value: string): number => {
        return value.replace('.', '').length;
    };

    // Helper function to limit number to 10 digits
    const limitToTenDigits = (value: string): string => {
        const parts = value.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';

        if (integerPart.length > 10) {
            return integerPart.slice(0, 10);
        }

        if (integerPart.length === 10 && decimalPart.length > 0) {
            return integerPart;
        }

        return value;
    };

    // Blinking animation effect
    useEffect(() => {
        if (isOverLimit) {
            const blink = Animated.sequence([
                Animated.timing(blinkAnimation, {
                    toValue: 0.3,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(blinkAnimation, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]);

            Animated.loop(blink).start();
        } else {
            blinkAnimation.setValue(1);
        }
    }, [isOverLimit]);

    const formatDisplay = (value: string) => {
        if (value === '') return '0.00';

        const num = parseFloat(value);
        if (isNaN(num)) return '0.00';

        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const handleNumberPress = (num: string) => {
        if (waitingForOperand) {
            setDisplay(num);
            setWaitingForOperand(false);
            setHasDecimal(num === '.');
            setIsOverLimit(false);
        } else {
            if (display === '0' && num !== '.') {
                setDisplay(num);
                setHasDecimal(num === '.');
                setIsOverLimit(false);
            } else if (num === '.' && hasDecimal) {
                return; // Don't add another decimal
            } else {
                const newDisplay = display + num;
                const digitCount = countDigits(newDisplay);

                if (digitCount > 10) {
                    setIsOverLimit(true);
                    return; // Don't add more digits
                }

                setDisplay(newDisplay);
                if (num === '.') setHasDecimal(true);
                setIsOverLimit(false);
            }
        }
    };

    const handleOperation = (op: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === '') {
            setPreviousValue(display);
        } else if (operation) {
            const currentValue = parseFloat(previousValue);
            const newValue = performCalculation(currentValue, inputValue, operation);
            const limitedValue = limitToTenDigits(String(newValue));

            setDisplay(limitedValue);
            setPreviousValue(limitedValue);
            setIsOverLimit(countDigits(limitedValue) > 10);
        }

        setWaitingForOperand(true);
        setOperation(op);
        setHasDecimal(false);
    };

    const performCalculation = (firstValue: number, secondValue: number, op: string): number => {
        switch (op) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '×':
                return firstValue * secondValue;
            case '÷':
                return secondValue !== 0 ? firstValue / secondValue : 0;
            default:
                return secondValue;
        }
    };

    const handleEquals = () => {
        if (!operation || previousValue === '') return;

        const inputValue = parseFloat(display);
        const currentValue = parseFloat(previousValue);
        const newValue = performCalculation(currentValue, inputValue, operation);
        const limitedValue = limitToTenDigits(String(newValue));

        setDisplay(limitedValue);
        setPreviousValue('');
        setOperation('');
        setWaitingForOperand(false);
        setHasDecimal(limitedValue.includes('.'));
        setIsOverLimit(countDigits(limitedValue) > 10);
    };

    const handleClear = () => {
        setDisplay('0');
        setPreviousValue('');
        setOperation('');
        setWaitingForOperand(false);
        setHasDecimal(false);
        setIsOverLimit(false);
    };

    const handleDelete = () => {
        if (display.length > 0) {
            const newDisplay = display.slice(0, -1);
            setDisplay(newDisplay);
            setHasDecimal(newDisplay.includes('.'));
            setIsOverLimit(false);
        } else {
            setDisplay("0");
        }
    };

    const handleConfirm = () => {
        let valueToConfirm = display;
        if (operation && previousValue !== '') {
            // Perform pending calculation
            const inputValue = parseFloat(display);
            const currentValue = parseFloat(previousValue);
            const newValue = performCalculation(currentValue, inputValue, operation);
            const limitedValue = limitToTenDigits(String(newValue));
            setDisplay(limitedValue);
            valueToConfirm = limitedValue;
            setPreviousValue('');
            setOperation('');
            setWaitingForOperand(false);
            setHasDecimal(limitedValue.includes('.'));
            setIsOverLimit(countDigits(limitedValue) > 10);
        }
        if (valueToConfirm && parseFloat(valueToConfirm) >= 0) {
            onConfirm(valueToConfirm);
            handleClose();
        }
    };

    const handleClose = () => {
        // setDisplay('');
        setPreviousValue('');
        setOperation('');
        setWaitingForOperand(false);
        setHasDecimal(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            backdropColor={'transparent'}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={styles.calculator}>
                    {/* Display */}
                    <View style={styles.display}>
                        {currencyLabel && (
                            <Text style={styles.currencyLabel}>{currencyLabel}</Text>
                        )}
                        <Animated.Text
                            style={[
                                styles.displayText,
                                isOverLimit && { color: '#dc3545' },
                                { opacity: blinkAnimation }
                            ]}
                        >
                            {display ? formatDisplay(display) : '0.00'}
                        </Animated.Text>
                        {operation && previousValue && (
                            <Text style={styles.operationText}>
                                {formatDisplay(previousValue)} {operation}
                            </Text>
                        )}
                    </View>

                    {/* Calculator Body */}
                    <View style={styles.calculatorBody}>
                        {/* Operations Column */}
                        <View style={styles.operationsColumn}>
                            {operationButtons.map((op) => (
                                <TouchableOpacity
                                    key={op}
                                    style={[
                                        styles.operationButton,
                                        operation === op && styles.activeOperationButton,
                                    ]}
                                    onPress={() => handleOperation(op)}
                                >
                                    <Text style={[
                                        styles.operationButtonText,
                                        operation === op && styles.activeOperationButtonText,
                                    ]}>
                                        {op}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Number Pad */}
                        <View style={styles.keypad}>
                            {numberButtons.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.row}>
                                    {row.map((button) => (
                                        <TouchableOpacity
                                            key={button}
                                            style={[
                                                styles.button,
                                                button === '⌫' && styles.deleteButton,
                                            ]}
                                            onPress={() => {
                                                if (button === '⌫') {
                                                    handleDelete();
                                                } else {
                                                    handleNumberPress(button);
                                                }
                                            }}
                                        >
                                            <Text style={[
                                                styles.buttonText,
                                                button === '⌫' && styles.deleteButtonText,
                                            ]}>
                                                {button}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}

                            {/* Equals Button */}
                            <TouchableOpacity style={styles.equalsButton} onPress={handleEquals}>
                                <Text style={styles.equalsButtonText}>=</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                            <Text style={styles.clearButtonText}>{t('calculator.clear')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>{t('calculator.confirm')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        // backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    calculator: {
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    display: {
        backgroundColor: '#ffffff',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    currencyLabel: {
        alignSelf: 'flex-end',
        fontSize: 15,
        color: '#007bff',
        fontWeight: '600',
        marginBottom: 2,
    },
    displayText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#2c3e50',
    },
    operationText: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 5,
    },
    calculatorBody: {
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    operationsColumn: {
        width: 80,
        marginRight: 10,
    },
    operationButton: {
        width: 70,
        height: 60,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    activeOperationButton: {
        backgroundColor: '#007bff',
    },
    operationButtonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#6c757d',
    },
    activeOperationButtonText: {
        color: '#ffffff',
    },
    keypad: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    button: {
        flex: 1,
        height: 60,
        backgroundColor: '#ffffff',
        marginHorizontal: 5,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#2c3e50',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
    },
    deleteButtonText: {
        color: '#ffffff',
    },
    equalsButton: {
        height: 60,
        backgroundColor: '#28a745',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    equalsButtonText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#ffffff',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 20,
        paddingHorizontal: 20,
        gap: 10,
    },
    clearButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#6c757d',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#ffffff',
    },
    confirmButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#007bff',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#ffffff',
    },
}); 