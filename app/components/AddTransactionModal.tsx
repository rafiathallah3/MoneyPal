import { useTransactions } from '@/hooks/useTransactions';
import { uangUtils } from '@/utils/preferences';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Category, MataUang, TipeBudget, Transaction, TransactionFormData } from '../../types/types';
import { getCategoryById, TranslateKategori } from '../../utils/categories';
import { dateUtils } from '../../utils/dateUtils';
import Calculator from './Calculator';
import CategoryPicker from './CategoryPicker';

interface AddTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (transaction: Transaction) => void;
    selectedDate: Date;
    transaction?: Transaction;
    mataUang: MataUang
    kategori: Category[]
    budgetData: TipeBudget
    onUpdate?: (transaction: Transaction) => void;
}

export default function AddTransactionModal({
    visible,
    onClose,
    onSave,
    selectedDate,
    transaction,
    mataUang,
    kategori,
    budgetData,
    onUpdate,
}: AddTransactionModalProps) {
    const { transactions } = useTransactions();
    const isEditMode = !!transaction;
    const [formData, setFormData] = useState<TransactionFormData>({
        title: '',
        amount: '',
        type: 'expense',
        date: dateUtils.formatDate(selectedDate),
        description: '',
        category: '',
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uneditedAmount, setUneditedAmount] = useState<number>(0);
    const { t, i18n } = useTranslation();

    React.useEffect(() => {
        if (isEditMode && transaction) {
            setFormData({
                title: transaction.title,
                amount: transaction.amount.toString(),
                type: transaction.type,
                date: transaction.date,
                description: transaction.description || '',
                category: transaction.category || '',
            });
            setSelectedImage(transaction.imageUri || null);
            setUneditedAmount(transaction.amount);
        } else {
            setFormData({
                title: '',
                amount: '',
                type: 'expense',
                date: dateUtils.formatDate(selectedDate),
                description: '',
                category: '',
            });
            setSelectedImage(null);
            setUneditedAmount(0);
        }
    }, [transaction, visible, selectedDate]);

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setFormData(prev => ({
                ...prev,
                date: dateUtils.formatDate(date),
            }));
        }
    };

    const handleCalculatorConfirm = (amount: string) => {
        setFormData(prev => ({ ...prev, amount }));
    };

    const handleCategorySelect = (category: Category) => {
        setFormData(prev => ({ ...prev, category: category.id }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(t('add_transaction.permission_needed_title'), t('add_transaction.permission_needed_message'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            // aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const pickCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('add_transaction.permission_needed_title'), t('add_transaction.permission_needed_message_camera'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            // aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const pilihGambar = () => {
        Alert.alert(
            t('add_transaction.upload_photo'),
            t('add_transaction.choose_option'),
            [
                { text: t('add_transaction.take_photo'), onPress: pickCamera },
                { text: t('add_transaction.pick_from_gallery'), onPress: pickImage },
                { text: t('add_transaction.cancel'), style: "cancel" }
            ]
        );
    };
        

    const removeImage = () => {
        setSelectedImage(null);
    };

    const handleSave = () => {
        // if (!formData.title.trim()) {
        //     Alert.alert('Error', 'Please enter a title');
        //     return;
        // }
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert(t('add_transaction.error_title'), t('add_transaction.error_amount'));
            return;
        }
        if (!formData.category) {
            Alert.alert(t('add_transaction.error_title'), t('add_transaction.error_category'));
            return;
        }
        const newTransaction: Transaction = {
            id: isEditMode && transaction ? transaction.id : Date.now().toString(),
            title: formData.title.trim(),
            amount: amount,
            type: formData.type,
            date: formData.date,
            createdAt: isEditMode && transaction ? transaction.createdAt : new Date().toISOString(),
            description: formData.description.trim() || undefined,
            imageUri: selectedImage || undefined,
            category: formData.category,
        };
        if (isEditMode && onUpdate) {
            onUpdate(newTransaction);
        } else {
            onSave(newTransaction);
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            amount: '',
            type: 'expense',
            date: dateUtils.formatDate(selectedDate),
            description: '',
            category: '',
        });
        setSelectedImage(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const selectedCategory = getCategoryById(formData.category, formData.type, kategori);

    let remainingBudget: number | null = null;
    let spentThisMonth = 0;
    let budgetLimit = 0;
    if (formData.type === 'expense' && budgetData) {
        const monthStr = dateUtils.getMonthString(selectedDate);
        if(budgetData.budget[monthStr]) {
            budgetLimit = budgetData.budget[monthStr].find(l => l.categoryId === 'all')?.amount ?? 0;
        } else if(budgetData.default["all"] > 0) {
            budgetLimit = budgetData.default["all"]
        }

        if(budgetLimit > 0) {
            spentThisMonth = transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(monthStr))
                .reduce((sum, t) => sum + t.amount, 0);
            const inputAmount = parseFloat(formData.amount);
            if (!isNaN(inputAmount) && inputAmount > 0) {
                remainingBudget = budgetLimit - spentThisMonth - inputAmount;
                if(isEditMode && uneditedAmount > 0) {
                    remainingBudget += uneditedAmount;
                }
            }
        }
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            backdropColor={'transparent'}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>{isEditMode ? t('add_transaction.edit_title') : t('add_transaction.add_title')}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.title_label')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                            placeholder={t('add_transaction.title_placeholder')}
                            placeholderTextColor={"grey"}
                            maxLength={50}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.amount_label')}</Text>
                        <TouchableOpacity
                            style={styles.amountButton}
                            onPress={() => setShowCalculator(true)}
                        >
                            <Text style={styles.amountText}>
                                {formData.amount ? uangUtils.simpleFormat(formData.amount, mataUang) : t('add_transaction.amount_placeholder')}
                            </Text>
                        </TouchableOpacity>
                        {/* Remaining Budget */}
                        {remainingBudget !== null && (
                            <Text style={[styles.remainingBudgetText, remainingBudget < 0 && styles.remainingBudgetOver]}>
                                {t('add_transaction.remaining_budget')}: {remainingBudget < 0 ? '-' : ''}{mataUang.symbol}{Math.abs(remainingBudget).toLocaleString()}
                            </Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.type_label')}</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    formData.type === 'expense' && styles.typeButtonActive,
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                            >
                                <Text
                                    style={[
                                        styles.typeText,
                                        formData.type === 'expense' && styles.typeTextActive,
                                    ]}
                                >
                                    {t('add_transaction.expense')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    formData.type === 'income' && styles.typeButtonActive,
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                            >
                                <Text
                                    style={[
                                        styles.typeText,
                                        formData.type === 'income' && styles.typeTextActive,
                                    ]}
                                >
                                    {t('add_transaction.income')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.category_label')}</Text>
                        <TouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => setShowCategoryPicker(true)}
                        >
                            {selectedCategory ? (
                                <View style={styles.selectedCategoryContainer}>
                                    <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color }]}>
                                        <Text style={styles.categoryIconText}>{selectedCategory.icon}</Text>
                                    </View>
                                    <Text style={styles.categoryText}>{TranslateKategori[i18n.language][selectedCategory.id] ? TranslateKategori[i18n.language][selectedCategory.id] : selectedCategory.name}</Text>
                                </View>
                            ) : (
                                <Text style={styles.categoryPlaceholder}>{t('add_transaction.category_placeholder')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.description_label')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                            placeholder={t('add_transaction.description_placeholder')}
                            placeholderTextColor={"grey"}
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.image_label')}</Text>
                        {selectedImage ? (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                                    <Text style={styles.removeImageText}>{t('add_transaction.remove_image')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addImageButton} onPress={pilihGambar}>
                                <Text style={styles.addImageText}>📷 {t('add_transaction.add_photo')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{t('add_transaction.date_label')}</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>
                                {dateUtils.formatDateForDisplay(dateUtils.parseDate(formData.date), i18n.language)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateUtils.parseDate(formData.date)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleDateChange}
                        />
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                        <Text style={styles.cancelText}>{t('add_transaction.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveText}>{t('add_transaction.save')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Calculator Modal */}
                <Calculator
                    visible={showCalculator}
                    onClose={() => setShowCalculator(false)}
                    onConfirm={handleCalculatorConfirm}
                    initialValue={formData.amount}
                    currencyLabel={mataUang.name}
                />

                {/* Category Picker Modal */}
                <CategoryPicker
                    visible={showCategoryPicker}
                    onClose={() => setShowCategoryPicker(false)}
                    onSelect={handleCategorySelect}
                    type={formData.type}
                    selectedCategory={formData.category}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#6c757d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#495057',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    amountButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
    },
    amountText: {
        fontSize: 16,
        color: '#495057',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ced4da',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    typeText: {
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '500',
    },
    typeTextActive: {
        color: '#ffffff',
    },
    categoryButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
    },
    selectedCategoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    categoryIconText: {
        fontSize: 16,
    },
    categoryText: {
        fontSize: 16,
        color: '#495057',
    },
    categoryPlaceholder: {
        fontSize: 16,
        color: '#6c757d',
    },
    addImageButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    addImageText: {
        fontSize: 16,
        color: '#495057',
    },
    imageContainer: {
        alignItems: 'center',
    },
    selectedImage: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
    },
    removeImageButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    removeImageText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    dateButton: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 12,
    },
    dateText: {
        fontSize: 16,
        color: '#495057',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6c757d',
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#007bff',
        alignItems: 'center',
    },
    saveText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    remainingBudgetText: {
        marginTop: 8,
        fontSize: 15,
        color: '#007bff',
        fontWeight: '600',
    },
    remainingBudgetOver: {
        color: '#dc3545',
    },
}); 
