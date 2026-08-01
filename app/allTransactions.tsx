import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { Category, Transaction } from '@/types/types';
import { expenseCategories, getCategoryById, incomeCategories, TranslateKategori } from '@/utils/categories';
import { dateUtils } from '@/utils/dateUtils';
import { uangUtils } from '@/utils/preferences';
import { lightTheme as theme } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, SectionList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddTransactionModal from './components/AddTransactionModal';
import HeaderAplikasi from './components/HeaderAplikasi';
import { Text } from './components/StyledText';
import TransactionItem from './components/TransactionItem';

const TOLERANCE_PRESETS = [0, 5, 10, 20, 30, 50];

export default function AllTransactions() {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const { transactions: allTransactions, dapat, hapus, update } = useTransactions();
    const { kategori, dapat: dapatKategori } = useKategori();
    const { mataUang, dapat: dapatMataUang } = useMataUang();
    const { budgetData, dapat: dapatBudget } = useBudget();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [targetAmountInput, setTargetAmountInput] = useState<string>('');
    const [tolerancePercent, setTolerancePercent] = useState<number>(20);

    // Modal UI states
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [amountModalVisible, setAmountModalVisible] = useState(false);
    const [tempAmountInput, setTempAmountInput] = useState<string>('');
    const [tempTolerance, setTempTolerance] = useState<number>(20);

    useEffect(() => {
        dapat();
        dapatKategori();
        dapatMataUang();
        dapatBudget();
    }, []);

    // Target amount numeric evaluation
    const targetVal = useMemo(() => {
        if (!targetAmountInput.trim()) return null;
        const parsed = parseFloat(targetAmountInput.replace(/,/g, '.'));
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }, [targetAmountInput]);

    const isFiltered = useMemo(() => {
        return selectedCategory !== 'all' || targetVal !== null;
    }, [selectedCategory, targetVal]);

    // Available categories grouped
    const availableCategories = useMemo(() => {
        const customExpenses = kategori.filter(k => k.type === 'expense');
        const customIncomes = kategori.filter(k => k.type === 'income');
        return {
            expenses: [...expenseCategories, ...customExpenses],
            incomes: [...incomeCategories, ...customIncomes],
        };
    }, [kategori]);

    // Selected category object
    const selectedCategoryObj = useMemo(() => {
        if (selectedCategory === 'all') return null;
        return getCategoryById(selectedCategory, 'expense', kategori) ||
               getCategoryById(selectedCategory, 'income', kategori);
    }, [selectedCategory, kategori]);

    const selectedCategoryLabel = useMemo(() => {
        if (!selectedCategoryObj) return t('all_categories', 'All Categories');
        const translated = TranslateKategori[i18n.language]?.[selectedCategoryObj.id];
        return translated || selectedCategoryObj.name;
    }, [selectedCategoryObj, i18n.language, t]);

    // Filtering transactions
    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(tx => {
            // Category filter
            if (selectedCategory !== 'all') {
                const txCategory = tx.category || (tx.type === 'income' ? 'other_income' : 'other_expense');
                if (txCategory !== selectedCategory) {
                    return false;
                }
            }

            // Amount filter (value around input number)
            if (targetVal !== null) {
                const margin = targetVal * (tolerancePercent / 100);
                const minVal = Math.max(0, targetVal - margin);
                const maxVal = targetVal + margin;
                if (tx.amount < minVal || tx.amount > maxVal) {
                    return false;
                }
            }

            return true;
        });
    }, [allTransactions, selectedCategory, targetVal, tolerancePercent]);

    // Group transactions by date for SectionList
    const groupedSections = useMemo(() => {
        const groups: { [date: string]: Transaction[] } = {};
        filteredTransactions.forEach(t => {
            const dateObj = dateUtils.parseDate(t.date);
            const sectionTitle = dateObj.toLocaleDateString(i18n.language, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            if (!groups[sectionTitle]) groups[sectionTitle] = [];
            groups[sectionTitle].push(t);
        });

        const sorted = Object.entries(groups)
            .sort((a, b) => {
                const dateA = dateUtils.parseDate(a[1][0].date).getTime();
                const dateB = dateUtils.parseDate(b[1][0].date).getTime();
                return dateB - dateA;
            })
            .map(([title, transactions]) => {
                const sortedTransactions = [...transactions].sort((a, b) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                });
                return { title, data: sortedTransactions };
            });

        return sorted;
    }, [filteredTransactions, i18n.language]);

    const handleResetFilters = useCallback(() => {
        setSelectedCategory('all');
        setTargetAmountInput('');
    }, []);

    const openAmountModal = useCallback(() => {
        setTempAmountInput(targetAmountInput);
        setTempTolerance(tolerancePercent);
        setAmountModalVisible(true);
    }, [targetAmountInput, tolerancePercent]);

    const handleApplyAmountFilter = useCallback(() => {
        setTargetAmountInput(tempAmountInput);
        setTolerancePercent(tempTolerance);
        setAmountModalVisible(false);
    }, [tempAmountInput, tempTolerance]);

    const handleClearAmountFilter = useCallback(() => {
        setTempAmountInput('');
        setTargetAmountInput('');
        setAmountModalVisible(false);
    }, []);

    const tempTargetVal = useMemo(() => {
        if (!tempAmountInput.trim()) return null;
        const parsed = parseFloat(tempAmountInput.replace(/,/g, '.'));
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }, [tempAmountInput]);

    const tempRange = useMemo(() => {
        if (tempTargetVal === null) return null;
        const margin = tempTargetVal * (tempTolerance / 100);
        const minVal = Math.max(0, tempTargetVal - margin);
        const maxVal = tempTargetVal + margin;
        return {
            minStr: uangUtils.formatAmount(minVal, mataUang),
            maxStr: uangUtils.formatAmount(maxVal, mataUang),
        };
    }, [tempTargetVal, tempTolerance, mataUang]);

    const handleDeleteTransaction = useCallback(async (transactionId: string) => {
        Alert.alert(
            t('categories.delete_title'),
            t('categories.delete_message'),
            [
                { text: t('categories.cancel'), style: 'cancel' },
                {
                    text: t('categories.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        hapus(transactionId);
                    },
                },
            ]
        );
    }, [hapus, t]);

    const handleEditTransaction = useCallback((transaction: Transaction) => {
        setEditingTransaction(transaction);
        setModalVisible(true);
    }, []);

    const handleUpdateTransaction = async (transaction: Transaction) => {
        update(transaction);
        setModalVisible(false);
        setEditingTransaction(null);
    };

    const renderTransactionItem = useCallback(({ item }: { item: Transaction }) => {
        return (
            <TransactionItem
                transaction={item}
                theme={theme}
                mataUang={mataUang}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
                customKategori={kategori}
            />
        );
    }, [mataUang, kategori, handleDeleteTransaction, handleEditTransaction]);

    const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
    ), []);

    const keyExtractor = useCallback((item: Transaction) => item.id, []);

    const renderEmptyList = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Ionicons name="funnel-outline" size={64} color="#90caf9" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
                {isFiltered 
                    ? t('no_matching_transactions', 'No transactions found matching your filters.')
                    : t('no_transactions_for_this_summary_mode')}
            </Text>
            {isFiltered && (
                <TouchableOpacity style={styles.emptyResetButton} onPress={handleResetFilters}>
                    <Ionicons name="refresh-outline" size={16} color="#1976d2" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyResetText}>{t('clear_filters', 'Clear All Filters')}</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [t, isFiltered, handleResetFilters]);

    const renderCategoryItem = useCallback((cat: Category) => {
        const isSelected = selectedCategory === cat.id;
        const translatedName = TranslateKategori[i18n.language]?.[cat.id] || cat.name;
        return (
            <TouchableOpacity
                key={cat.id}
                style={[
                    styles.categoryGridItem,
                    isSelected && styles.categoryGridItemSelected,
                ]}
                onPress={() => {
                    setSelectedCategory(cat.id);
                    setCategoryModalVisible(false);
                }}
            >
                <View style={[styles.categoryIconBadge, { backgroundColor: cat.color }]}>
                    <Text style={styles.categoryIconEmoji}>{cat.icon}</Text>
                </View>
                <Text style={[styles.categoryGridItemText, isSelected && styles.categoryGridItemTextSelected]} numberOfLines={1}>
                    {translatedName}
                </Text>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#1976d2" style={{ marginLeft: 4 }} />
                )}
            </TouchableOpacity>
        );
    }, [selectedCategory, i18n.language]);

    return (
        <LinearGradient colors={theme.linearGradientBackground} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <HeaderAplikasi subtitle={t('all_transactions')} pageUtama={false} icon="" />

                {/* Filter Bar */}
                <View style={styles.filterBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {/* Category Filter Button */}
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedCategory !== 'all' && styles.filterChipActiveCategory,
                            ]}
                            onPress={() => setCategoryModalVisible(true)}
                        >
                            {selectedCategoryObj ? (
                                <Text style={{ fontSize: 14, marginRight: 4 }}>{selectedCategoryObj.icon}</Text>
                            ) : (
                                <Ionicons
                                    name="grid-outline"
                                    size={16}
                                    color={selectedCategory !== 'all' ? '#1565c0' : '#495057'}
                                    style={{ marginRight: 6 }}
                                />
                            )}
                            <Text
                                style={[
                                    styles.filterChipText,
                                    selectedCategory !== 'all' && styles.filterChipTextActiveCategory,
                                ]}
                            >
                                {selectedCategoryLabel}
                            </Text>
                            <Ionicons
                                name="chevron-down-outline"
                                size={14}
                                color={selectedCategory !== 'all' ? '#1565c0' : '#888'}
                                style={{ marginLeft: 4 }}
                            />
                        </TouchableOpacity>

                        {/* Amount Filter Button */}
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                targetVal !== null && styles.filterChipActiveAmount,
                            ]}
                            onPress={openAmountModal}
                        >
                            <Ionicons
                                name="cash-outline"
                                size={16}
                                color={targetVal !== null ? '#2e7d32' : '#495057'}
                                style={{ marginRight: 6 }}
                            />
                            <Text
                                style={[
                                    styles.filterChipText,
                                    targetVal !== null && styles.filterChipTextActiveAmount,
                                ]}
                            >
                                {targetVal !== null
                                    ? `~${uangUtils.formatAmount(targetVal, mataUang)} (±${tolerancePercent}%)`
                                    : t('around_amount', 'Around Amount')}
                            </Text>
                            <Ionicons
                                name="chevron-down-outline"
                                size={14}
                                color={targetVal !== null ? '#2e7d32' : '#888'}
                                style={{ marginLeft: 4 }}
                            />
                        </TouchableOpacity>

                        {/* Clear Filters Button */}
                        {isFiltered && (
                            <TouchableOpacity style={styles.filterChipClear} onPress={handleResetFilters}>
                                <Ionicons name="close-circle" size={16} color="#d32f2f" style={{ marginRight: 4 }} />
                                <Text style={styles.filterChipClearText}>{t('clear', 'Clear')}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>

                    {/* Filter result count banner */}
                    {isFiltered && (
                        <View style={styles.filterSummaryBanner}>
                            <Text style={styles.filterSummaryText}>
                                {t('showing_filtered', 'Showing {{count}} matching transaction(s)', { count: filteredTransactions.length })}
                            </Text>
                        </View>
                    )}
                </View>

                <SectionList
                    sections={groupedSections}
                    renderItem={renderTransactionItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
                    stickySectionHeadersEnabled={true}
                    showsVerticalScrollIndicator={false}
                />

                {/* Category Selection Modal */}
                <Modal
                    visible={categoryModalVisible}
                    transparent
                    animationType="fade"
                    statusBarTranslucent={true}
                    onRequestClose={() => setCategoryModalVisible(false)}
                >
                    <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalVisible(false)}>
                        <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]} onPress={e => e.stopPropagation()}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleRow}>
                                    <Ionicons name="funnel" size={20} color="#1976d2" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalTitle}>{t('select_category', 'Filter by Category')}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                                {/* All Categories Option */}
                                <TouchableOpacity
                                    style={[
                                        styles.categoryGridItem,
                                        selectedCategory === 'all' && styles.categoryGridItemSelected,
                                        { marginBottom: 12 },
                                    ]}
                                    onPress={() => {
                                        setSelectedCategory('all');
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <View style={[styles.categoryIconBadge, { backgroundColor: '#e3f2fd' }]}>
                                        <Ionicons name="apps-outline" size={16} color="#1976d2" />
                                    </View>
                                    <Text style={[styles.categoryGridItemText, selectedCategory === 'all' && styles.categoryGridItemTextSelected]}>
                                        {t('all_categories', 'All Categories')}
                                    </Text>
                                    {selectedCategory === 'all' && (
                                        <Ionicons name="checkmark-circle" size={18} color="#1976d2" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>

                                {/* Expense Categories */}
                                <Text style={styles.categorySectionHeader}>
                                    🔻 {t('expense_categories', 'Expense Categories')}
                                </Text>
                                <View style={styles.categoryGrid}>
                                    {availableCategories.expenses.map(renderCategoryItem)}
                                </View>

                                {/* Income Categories */}
                                <Text style={[styles.categorySectionHeader, { marginTop: 16 }]}>
                                    🔺 {t('income_categories', 'Income Categories')}
                                </Text>
                                <View style={styles.categoryGrid}>
                                    {availableCategories.incomes.map(renderCategoryItem)}
                                </View>
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* Amount Range Filter Modal */}
                <Modal
                    visible={amountModalVisible}
                    transparent
                    animationType="fade"
                    statusBarTranslucent={true}
                    onRequestClose={() => setAmountModalVisible(false)}
                >
                    <Pressable style={styles.modalBackdrop} onPress={() => setAmountModalVisible(false)}>
                        <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]} onPress={e => e.stopPropagation()}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleRow}>
                                    <Ionicons name="cash" size={20} color="#2e7d32" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalTitle}>{t('filter_by_amount', 'Filter by Amount')}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setAmountModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.amountModalSubtitle}>
                                {t('amount_filter_desc', 'Show transactions with amounts around a target value.')}
                            </Text>

                            {/* Amount Input */}
                            <View style={styles.amountInputContainer}>
                                <Text style={styles.currencySymbolPrefix}>{mataUang.symbol}</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="e.g. 50000"
                                    placeholderTextColor="#999"
                                    keyboardType="numeric"
                                    value={tempAmountInput}
                                    onChangeText={setTempAmountInput}
                                    autoFocus
                                />
                                {tempAmountInput.length > 0 && (
                                    <TouchableOpacity onPress={() => setTempAmountInput('')}>
                                        <Ionicons name="close-circle" size={20} color="#aaa" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Tolerance selector */}
                            <Text style={styles.toleranceLabel}>
                                {t('tolerance_margin', 'Tolerance Margin (±%)')}
                            </Text>
                            <View style={styles.toleranceRow}>
                                {TOLERANCE_PRESETS.map(preset => {
                                    const isSelected = tempTolerance === preset;
                                    return (
                                        <TouchableOpacity
                                            key={preset}
                                            style={[
                                                styles.toleranceChip,
                                                isSelected && styles.toleranceChipSelected,
                                            ]}
                                            onPress={() => setTempTolerance(preset)}
                                        >
                                            <Text
                                                style={[
                                                    styles.toleranceChipText,
                                                    isSelected && styles.toleranceChipTextSelected,
                                                ]}
                                            >
                                                {preset === 0 ? 'Exact' : `±${preset}%`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Dynamic Range Preview */}
                            {tempRange && (
                                <View style={styles.rangePreviewBox}>
                                    <Ionicons name="information-circle-outline" size={18} color="#2e7d32" style={{ marginRight: 6 }} />
                                    <Text style={styles.rangePreviewText}>
                                        {t('range_preview', 'Range: {{min}} – {{max}}', {
                                            min: tempRange.minStr,
                                            max: tempRange.maxStr,
                                        })}
                                    </Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.modalActionRow}>
                                {tempAmountInput.length > 0 && (
                                    <TouchableOpacity style={styles.clearActionButton} onPress={handleClearAmountFilter}>
                                        <Text style={styles.clearActionButtonText}>{t('remove', 'Remove')}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.applyActionButton} onPress={handleApplyAmountFilter}>
                                    <Text style={styles.applyActionButtonText}>{t('apply', 'Apply Filter')}</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

                <AddTransactionModal
                    visible={modalVisible}
                    onClose={() => {
                        setEditingTransaction(null);
                        setModalVisible(false);
                    }}
                    onSave={() => {}}
                    selectedDate={new Date()}
                    transaction={editingTransaction || undefined}
                    mataUang={mataUang}
                    kategori={kategori}
                    budgetData={budgetData || { budget: {}, default: { all: 0 } }}
                    onUpdate={handleUpdateTransaction}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 40,
    },
    filterBar: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    filterScroll: {
        alignItems: 'center',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    filterChipActiveCategory: {
        backgroundColor: '#e3f2fd',
        borderColor: '#90caf9',
    },
    filterChipActiveAmount: {
        backgroundColor: '#e8f5e9',
        borderColor: '#a5d6a7',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#495057',
    },
    filterChipTextActiveCategory: {
        color: '#1565c0',
    },
    filterChipTextActiveAmount: {
        color: '#2e7d32',
    },
    filterChipClear: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    filterChipClearText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#d32f2f',
    },
    filterSummaryBanner: {
        marginTop: 6,
        paddingHorizontal: 6,
    },
    filterSummaryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#1976d2',
    },
    sectionHeader: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 18,
        marginTop: 18,
        marginBottom: 6,
        marginLeft: 20,
        shadowColor: '#90caf9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        letterSpacing: 0.2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        lineHeight: 22,
    },
    emptyResetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    emptyResetText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
    },

    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
    },
    categorySectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6c757d',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    categoryGridItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e9ecef',
        width: '48%',
    },
    categoryGridItemSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#90caf9',
    },
    categoryIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    categoryIconEmoji: {
        fontSize: 14,
    },
    categoryGridItemText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#343a40',
    },
    categoryGridItemTextSelected: {
        fontWeight: '700',
        color: '#1976d2',
    },

    // Amount Modal Styles
    amountModalSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 16,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#ced4da',
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 16,
    },
    currencySymbolPrefix: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212529',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        paddingVertical: 8,
    },
    toleranceLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
    },
    toleranceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    toleranceChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f1f3f5',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    toleranceChipSelected: {
        backgroundColor: '#e8f5e9',
        borderColor: '#81c784',
    },
    toleranceChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#495057',
    },
    toleranceChipTextSelected: {
        fontWeight: '700',
        color: '#2e7d32',
    },
    rangePreviewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#c8e6c9',
    },
    rangePreviewText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2e7d32',
        flex: 1,
    },
    modalActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    clearActionButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#ffebee',
    },
    clearActionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d32f2f',
    },
    applyActionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#2e7d32',
        alignItems: 'center',
    },
    applyActionButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
    },
});
