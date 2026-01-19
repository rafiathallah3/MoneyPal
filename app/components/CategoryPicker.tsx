import { useKategori } from '@/hooks/useCategory';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { i18n } from 'i18next';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Category } from '../../types/types';
import { getCategoriesByType, TranslateKategori } from '../../utils/categories';

interface CategoryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (category: Category) => void;
    type: 'income' | 'expense';
    selectedCategory?: string;
}

// Custom hook for card press animation
function useCategoryCardAnimation() {
    const scale = React.useRef(new Animated.Value(1)).current;
    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
    };
    return { scale, handlePressIn, handlePressOut };
}

// Card component for each category
function CategoryCard({ item, isSelected, i18n, onPress }: { item: Category, isSelected: boolean, i18n: i18n, onPress: () => void }) {
    const { scale, handlePressIn, handlePressOut } = useCategoryCardAnimation();
    return (
        <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                // style={{ flex: 1 }}
                onPress={onPress}
            >
                <LinearGradient
                    colors={isSelected ? ["#e3f2fd", "#f8f9fa"] : ["#fff", "#f1f3f4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.categoryItem,
                        isSelected && styles.selectedCategory,
                    ]}
                >
                    <LinearGradient
                        colors={[item.color + 'cc', item.color + '99', '#fff0']}
                        style={styles.iconGlow}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                            <Text style={styles.icon}>{item.icon}</Text>
                            {isSelected && (
                                <View style={styles.checkmarkCircle}>
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                    <Text style={[
                        styles.categoryName,
                        isSelected && styles.selectedCategoryName,
                    ]}>
                        {TranslateKategori[i18n.language][item.id] ? TranslateKategori[i18n.language][item.id] : item.name}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function CategoryPicker({
    visible,
    onClose,
    onSelect,
    type,
    selectedCategory,
}: CategoryPickerProps) {
    const { kategori, dapat } = useKategori();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        dapat();
    }, []);

    // Sort so 'Other' is last
    const categories = [
        ...getCategoriesByType(type),
        ...kategori.filter((k) => k.type === type)
    ].sort((a, b) => {
        if (a.name.toLowerCase() === 'other') return 1;
        if (b.name.toLowerCase() === 'other') return -1;
        return 0;
    });

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <CategoryCard
            item={item}
            i18n={i18n}
            isSelected={selectedCategory === item.id}
            onPress={() => {
                onSelect(item);
                onClose();
            }}
        />
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <LinearGradient
                colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]}
                style={styles.gradientBg}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('category_picker.select_category')}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <FlatList
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    gradientBg: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#e3e6ea',
        marginHorizontal: 20,
        marginBottom: 8,
        borderRadius: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2c3e50',
        letterSpacing: 0.2,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6c757d',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6c757d',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    closeText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: -2,
    },
    list: {
        padding: 18,
        paddingBottom: 32,
    },
    categoryItem: {
        flex: 1,
        margin: 8,
        paddingVertical: 22,
        paddingHorizontal: 8,
        borderRadius: 22,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1.5,
        borderColor: '#e3e6ea',
        minWidth: 140,
        maxWidth: 180,
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    selectedCategory: {
        backgroundColor: 'rgba(227,242,253,0.7)',
        borderWidth: 2.5,
        borderColor: '#007bff',
        shadowColor: '#007bff',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 5,
    },
    iconGlow: {
        borderRadius: 32,
        padding: 4,
        marginBottom: 10,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 2,
        position: 'relative',
    },
    icon: {
        fontSize: 30,
        zIndex: 99
    },
    checkmarkCircle: {
        position: 'absolute',
        right: -8,
        top: -8,
        backgroundColor: '#007bff',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007bff',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 3,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2c3e50',
        textAlign: 'center',
        marginTop: 2,
    },
    selectedCategoryName: {
        color: '#007bff',
        fontWeight: '700',
    },
}); 
