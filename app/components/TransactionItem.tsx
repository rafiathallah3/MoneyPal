import { uangUtils } from '@/utils/preferences';
import { WarnaTema } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Category, MataUang, Transaction } from '../../types/types';
import { getCategoryById, TranslateKategori } from '../../utils/categories';

interface TransactionItemProps {
    transaction: Transaction;
    mataUang: MataUang;
    onDelete?: (id: string) => void;
    onEdit?: (transaction: Transaction) => void;
    customKategori: Category[];
    theme: WarnaTema
}

const TransactionItem = ({ transaction, mataUang, theme, onDelete, onEdit, customKategori = [] }: TransactionItemProps) => {
    const isIncome = transaction.type === 'income';
    const amountColor = isIncome ? theme.success : theme.danger;
    const borderColor = isIncome ? theme.success : theme.danger;
    const gradientColors = isIncome ? theme.transactionIncomeGradient : theme.transactionExpenseGradient;
    const [pressed, setPressed] = React.useState(false);
    const [showImageModal, setShowImageModal] = React.useState(false);

    const mainCategory = transaction.category
        ? getCategoryById(transaction.category, transaction.type, customKategori)
        : undefined;


    const fallbackCategoryId = transaction.type === "income" ? "other_income" : "other_expense";
    const fallbackCategory = getCategoryById(fallbackCategoryId, transaction.type, customKategori);

    const category = mainCategory ?? (fallbackCategory as Category);

    const { i18n } = useTranslation();

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.92}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                style={{
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: isIncome ? theme.success : theme.danger,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: pressed ? 0.18 : 0.10,
                    shadowRadius: pressed ? 12 : 8,
                    elevation: pressed ? 4 : 2,
                    marginBottom: 0,
                }}
            >
                <View style={[styles.container, { borderLeftColor: borderColor, borderLeftWidth: 5, backgroundColor: theme.card }]}>
                    <View style={[styles.gradientBg, { backgroundColor: gradientColors[0] }]} />
                    <View style={styles.content}>
                        <View style={styles.mainInfo}>
                            {transaction.title ? (
                                <>
                                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{transaction.title}</Text>
                                    <View style={styles.amountRow}>
                                        <Ionicons
                                            name={!isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                                            size={18}
                                            color={amountColor}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                                            {isIncome ? '+' : '-'} {uangUtils.formatAmount(transaction.amount, mataUang)}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.amountRowTop}>
                                    <Ionicons
                                        name={!isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                                        size={18}
                                        color={amountColor}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
                                        {isIncome ? '+' : '-'} {uangUtils.formatAmount(transaction.amount, mataUang)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.categoryRow}>
                                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                                    <Text style={styles.categoryIconText}>{category.icon}</Text>
                                </View>
                                <Text style={[styles.categoryName, { color: theme.textSecondary, backgroundColor: theme.card }]}>{TranslateKategori[i18n.language][category.id] ? TranslateKategori[i18n.language][category.id] : category.name}</Text>
                            </View>
                            {transaction.description && (
                                <View style={[styles.descriptionPill, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>{transaction.description}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.rightColumn}>
                            {transaction.imageUri && (
                                <Pressable onPress={() => setShowImageModal(true)}>
                                    <Image source={{ uri: transaction.imageUri }} style={styles.transactionImage} />
                                </Pressable>
                            )}
                            <View style={styles.actionRow}>
                                {onEdit && (
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => onEdit(transaction)}
                                    >
                                        <Ionicons name="create-outline" size={18} color="white" />
                                    </TouchableOpacity>
                                )}
                                {onDelete && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => onDelete(transaction.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
            {/* Image Preview Modal */}
            <Modal
                visible={showImageModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowImageModal(false)}>
                    <Image
                        source={{ uri: transaction.imageUri || undefined }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </Pressable>
            </Modal>
        </>
    );
}

export default React.memo(TransactionItem);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 18,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative',
    },
    gradientBg: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
        borderRadius: 18,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    mainInfo: {
        flex: 1,
        marginRight: 10,
    },
    rightColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2c3e50',
        marginBottom: 2,
        maxWidth: '100%',
        letterSpacing: 0.1,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        marginTop: 0,
    },
    amountRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        marginTop: 0,
    },
    amount: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        marginTop: 2,
    },
    categoryIcon: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 7,
    },
    categoryIconText: {
        fontSize: 13,
    },
    categoryName: {
        fontSize: 13,
        color: '#6c757d',
        fontWeight: '500',
        backgroundColor: '#f1f3f4',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    descriptionPill: {
        backgroundColor: '#f6f6f6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 4,
        maxWidth: '100%',
    },
    description: {
        fontSize: 13,
        color: '#6c757d',
        fontStyle: 'italic',
        lineHeight: 17,
    },
    transactionImage: {
        width: 72,
        height: 72,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 0,
        alignSelf: 'center',
        zIndex: 2,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#dc3545',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 0,
        marginRight: 2,
        shadowColor: '#dc3545',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 4,
        elevation: 2,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ffc107',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        shadowColor: '#ffc107',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.95 }],
    },
    fullImage: {
        width: '100%',
        height: '100%',
        alignSelf: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 