import { useKategori } from '@/hooks/useCategory';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Category } from '../../types/types';
import { expenseCategories, incomeCategories, TranslateKategori } from '../../utils/categories';
import HeaderAplikasi from '../components/HeaderAplikasi';

// Expanded color palette (36+ colors)
const COLOR_PALETTE = [
    '#007bff', '#6f42c1', '#e83e8c', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8', '#6610f2', '#dc3545', '#01c326',
    '#343a40', '#adb5bd', '#f8f9fa', '#f1c40f', '#e67e22', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#1f479b',
    '#ffb6b9', '#fae3d9', '#bbded6', '#8ac6d1', '#ff6f69', '#ffcc5c', '#88d8b0', '#d5f01c', '#9058c6', '#fdcb6e',
    '#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8', '#e17055', '#dfe6e9', '#b2bec3', '#636e72', '#ffeaa7',
];

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
    const results: T[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        results.push(arr.slice(i, i + chunkSize));
    }
    return results;
}

function ColorPalette({ selectedColor, onSelect }: { selectedColor: string, onSelect: (color: string) => void }) {
    const rows = chunkArray(COLOR_PALETTE, Math.ceil(COLOR_PALETTE.length / 3));
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'column' }}>
                {rows.map((row, rowIdx) => (
                    <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: 6 }}>
                        {row.map(color => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => onSelect(color)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: color,
                                    marginHorizontal: 6,
                                    borderWidth: selectedColor === color ? 3 : 1,
                                    borderColor: selectedColor === color ? '#222' : '#fff',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {selectedColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

// Emoji validation utility
function isSingleEmoji(str: string) {
    // This regex matches a single emoji (including most common emoji)
    // It is not perfect for all Unicode emoji, but works for most cases
    return /^\p{Emoji}$/u.test(str) || (Array.from(str).length === 1 && /\p{Emoji}/u.test(str));
}

// Category Modal Component
function CategoryModal({
    visible,
    category,
    onSave,
    onCancel
}: {
    visible: boolean;
    category: Category | null;
    onSave: (category: Category) => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState<Category>({
        id: '',
        name: '',
        icon: '',
        color: '#007bff',
        type: 'expense'
    });
    const { t } = useTranslation();

    const isEditing = !!category;

    // Update form data when category prop changes
    useEffect(() => {
        if (category && isEditing) {
            setFormData(category);
        } else {
            setFormData({
                id: '',
                name: '',
                icon: '',
                color: '#007bff',
                type: 'expense'
            });
        }
    }, [category]);

    const handleSave = () => {
        if (!formData.name.trim() || !formData.icon.trim()) {
            Alert.alert(t('categories.error_title'), t('categories.error_name_icon'));
            return;
        }
        if (formData.name.trim().length > 35) {
            Alert.alert(t('categories.error_title'), t('categories.error_name_length'));
            return;
        }
        if (Array.from(formData.icon.trim()).length !== 1 || !isSingleEmoji(formData.icon.trim())) {
            Alert.alert(t('categories.error_title'), t('categories.error_icon'));
            return;
        }

        const categoryToSave: Category = {
            ...formData,
            id: category?.id || Date.now().toString(),
            name: formData.name.trim(),
            icon: formData.icon.trim(),
        };

        onSave(categoryToSave);
        setFormData({
            id: '',
            name: '',
            icon: '',
            color: '#007bff',
            type: 'expense'
        });
    };

    return (
        <Modal visible={visible} animationType="fade" backdropColor={'transparent'}>
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onCancel}
            >
                <TouchableOpacity
                    style={styles.modalContent}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={styles.modalTitle}>
                        {isEditing ? t('categories.edit_category') : t('categories.add_category')}
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder={t('categories.name_placeholder')}
                        placeholderTextColor="grey"
                        value={formData.name}
                        onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder={t('categories.icon_placeholder')}
                        placeholderTextColor="grey"
                        value={formData.icon}
                        onChangeText={text => setFormData(prev => ({ ...prev, icon: text }))}
                    />

                    {/* Type selector */}
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { backgroundColor: formData.type === 'expense' ? '#007bff' : '#f1f3f4' }
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                        >
                            <Text style={[
                                styles.typeButtonText,
                                { color: formData.type === 'expense' ? '#fff' : '#222' }
                            ]}>
                                {t('add_transaction.expense')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { backgroundColor: formData.type === 'income' ? '#007bff' : '#f1f3f4' }
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                        >
                            <Text style={[
                                styles.typeButtonText,
                                { color: formData.type === 'income' ? '#fff' : '#222' }
                            ]}>
                                {t('add_transaction.income')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Color palette */}
                    <ColorPalette
                        selectedColor={formData.color}
                        onSelect={color => setFormData(prev => ({ ...prev, color }))}
                    />

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelBtnText}>{t('Cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveBtnText}>{t('Save')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

export default function CategoriesScreen() {
    const { kategori, dapat, simpan, update, hapus } = useKategori();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        (async () => {
            await dapat();
        })();
    }, []);

    const handleSaveCategory = (category: Category) => {
        if (editingCategory) {
            update(category);
        } else {
            simpan(category);
        }
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleCancelModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setModalVisible(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setModalVisible(true);
    };

    const handleDeleteCategory = (id: string) => {
        Alert.alert(t('categories.delete_title'), t('categories.delete_message'), [
            { text: t('categories.cancel'), style: 'cancel' },
            {
                text: t('categories.delete'),
                style: 'destructive',
                onPress: () => hapus(id)
            }
        ]);
    };

    const renderCategory = ({ item, editable }: { item: Category, editable: boolean }) => (
        <View style={styles.categoryRow}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                <Text style={styles.categoryIconText}>{item.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{TranslateKategori[i18n.language][item.id] ? TranslateKategori[i18n.language][item.id] : item.name}</Text>
            {/* Show type badge for custom categories */}
            {editable && (
                <View style={[
                    styles.typeBadge,
                    { backgroundColor: item.type === 'income' ? '#28a745' : '#dc3545' }
                ]}>
                    <Text style={styles.typeBadgeText}>
                        {item.type === 'income' ? t('income') : t('expenses')}
                    </Text>
                </View>
            )}
            {editable && (
                <>
                    <TouchableOpacity
                        onPress={() => handleEditCategory(item)}
                        style={styles.editBtn}
                    >
                        <Ionicons name="create-outline" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteCategory(item.id)}
                        style={styles.deleteBtn}
                    >
                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    return (
        <LinearGradient
            colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar style="auto" />
                {/* Fancy Header */}
                <HeaderAplikasi subtitle={t('categories.manage_categories')} icon='' pageUtama={true} />
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('categories.default_expense_categories')}</Text>
                        <FlatList
                            data={expenseCategories}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => renderCategory({ item, editable: false })}
                            scrollEnabled={false}
                        />
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('categories.default_income_categories')}</Text>
                        <FlatList
                            data={incomeCategories}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => renderCategory({ item, editable: false })}
                            scrollEnabled={false}
                        />
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>{t('categories.custom_categories')}</Text>
                        <FlatList
                            data={kategori}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => renderCategory({ item, editable: true })}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>{t('categories.no_custom_categories')}</Text>
                            }
                            scrollEnabled={false}
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.addBtnText}>{t('categories.add_category')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                {/* Single Modal for both Add and Edit */}
                <CategoryModal
                    visible={modalVisible}
                    category={editingCategory}
                    onSave={handleSaveCategory}
                    onCancel={handleCancelModal}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingBottom: 30 },
    header: {
        backgroundColor: '#007bff',
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    appSubtitle: {
        fontSize: 14,
        color: '#e3f2fd',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        marginHorizontal: 16,
        marginVertical: 14,
        padding: 22,
        shadowColor: '#90caf9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.13,
        shadowRadius: 14,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e3f2fd',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#007bff', textAlign: 'center' },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 0,
        marginBottom: 12,
        letterSpacing: 0.2,
        textShadowColor: '#e3f2fd',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    categoryIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    categoryIconText: { fontSize: 18 },
    categoryName: { fontSize: 16, color: '#2c3e50', flex: 1 },
    editBtn: { marginHorizontal: 6 },
    deleteBtn: { marginHorizontal: 6 },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 0,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2
    },
    addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
    emptyText: { color: '#adb5bd', fontSize: 15, textAlign: 'center', marginVertical: 20 },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: 300,
        alignItems: 'stretch'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 16,
        textAlign: 'center'
    },
    input: {
        backgroundColor: '#f1f3f4',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12
    },
    typeButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    typeButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#adb5bd',
        marginRight: 10
    },
    cancelBtnText: { color: '#fff', fontWeight: '500' },
    saveBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#007bff'
    },
    saveBtnText: { color: '#fff', fontWeight: '500' },
    typeBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 8,
        alignSelf: 'center',
    },
    typeBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
}); 
