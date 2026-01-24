import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { Category } from '@/types/types';
import { expenseCategories, TranslateKategori } from '@/utils/categories';
import { dateUtils } from '@/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Calculator from '../components/Calculator';
import FancyLoader from '../components/FancyLoader';
import HeaderAplikasi from '../components/HeaderAplikasi';

export default function Budget() {
	const { budgetData, dapat: loadBudget, setLimit } = useBudget();
	const { kategori, dapat: dapatKategori } = useKategori();
	const { mataUang, dapat: dapatMataUang } = useMataUang();
	const { transactions, dapat: dapatTransaksi } = useTransactions();
	const [editing, setEditing] = useState<{ categoryId: string; initial: string } | null>(null);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [editModal, setEditModal] = useState<{ categoryId: string; name: string; initial: string } | null>(null);
	const [editValue, setEditValue] = useState('');
	const [showCalc, setShowCalc] = useState(false);
	const [setAsDefault, setSetAsDefault] = useState(false);
	const [loading, setLoading] = useState(true);
	const { t, i18n } = useTranslation();

	// Helper to format month string
	function formatMonth(date: Date, bahasa: string) {
		return date.toLocaleDateString(bahasa, { month: 'long', year: 'numeric' });
	}

	// Change month
	const changeMonth = async (amount: number) => {
		setLoading(true);

		const newDate = new Date(selectedDate);
		newDate.setMonth(selectedDate.getMonth() + amount);
		setSelectedDate(newDate);

		setLoading(false);
	};

	// Load categories, budget, and transactions on mount
	useEffect(() => {
		(async () => {
			await dapatMataUang();
			await dapatKategori();
			await loadBudget();
			await dapatTransaksi();

			setLoading(false);
		})();
	}, []);

	// Merge built-in and custom expense categories
	const allExpenseCategories = useMemo(() => {
		return [
			...expenseCategories,
			...kategori.filter((k) => k.type === 'expense' && !expenseCategories.some(ec => ec.id === k.id)),
		];
	}, [kategori]);

	const monthStr = dateUtils.getMonthString(selectedDate);
	// Get limit for a category or overall
	const getLimit = (categoryId: string) => {
		const budget = budgetData.budget[monthStr];
		const defaultNya = budgetData.default[categoryId];

		if (budget === undefined) {
			return defaultNya ?? 0;
		}

		const ketemu = budget.find(l => l.categoryId === categoryId);
		if (ketemu) {
			return ketemu.amount;
		}

		return defaultNya ?? 0;
	};

	// Get spent for a category or overall (current month)
	const spentOverall = useMemo(() => {
		return transactions
			.filter(t => t.type === 'expense' && t.date.startsWith(monthStr))
			.reduce((sum, t) => sum + t.amount, 0);
	}, [transactions, monthStr]);

	const spentByCategory = useMemo(() => {
		const map: Record<string, number> = {};
		allExpenseCategories.forEach(cat => { map[cat.id] = 0; });
		transactions.forEach(t => {
			if (t.type === 'expense' && t.date.startsWith(monthStr) && t.category && map[t.category] !== undefined) {
				map[t.category] += t.amount;
			}
		});
		return map;
	}, [transactions, allExpenseCategories, monthStr]);

	// Handle edit (show calculator)
	const handleEdit = (categoryId: string) => {
		const isOverall = categoryId === 'all';
		const cat = isOverall ? { name: t('Overall Limit') } : allExpenseCategories.find(c => c.id === categoryId);

		setSetAsDefault(budgetData.default[categoryId] !== undefined)
		setEditModal({
			categoryId,
			name: cat?.name || '',
			initial: getLimit(categoryId).toString() || '',
		});
		setEditValue(getLimit(categoryId).toString() || '');
	};

	// Handle calculator confirm
	const handleCalculatorConfirm = async (amount: string) => {
		if (!editing) return;

		setEditing(null);
	};

	const handleEditModalSave = async () => {
		setLoading(true);
		setEditModal(null);
		await setLimit(dateUtils.getMonthString(selectedDate), {
			categoryId: editModal?.categoryId || '',
			amount: parseFloat(editValue),
		}, setAsDefault);
		setLoading(false);
	};

	// Progress bar component
	const ProgressBar = ({ percent, color }: { percent: number; color: string }) => (
		<View style={styles.progressBarBg}>
			<View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: color }]} />
		</View>
	);

	// UI
	return (
		<LinearGradient colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]} style={{ flex: 1 }}>
			<SafeAreaView style={styles.container}>
				<HeaderAplikasi subtitle={t('Monthly Budget')} pageUtama={true} icon="wallet-outline" />
				<View style={styles.headerSpacer} />
				{/* Month Selector */}
				<View style={styles.monthNavBar}>
					<TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(-1)}>
						<Ionicons name="chevron-back" size={28} color="#007bff" />
					</TouchableOpacity>
					<Text style={styles.monthNavText}>{formatMonth(selectedDate, i18n.language)}</Text>
					<TouchableOpacity style={styles.arrowButton} onPress={() => changeMonth(1)}>
						<Ionicons name="chevron-forward" size={28} color="#007bff" />
					</TouchableOpacity>
				</View>
				{(loading ?
					<FancyLoader />
					:
					<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
						{/* Overall budget */}
						<View style={styles.overallBudgetBox}>
							<Text style={styles.sectionLabel}>{t('Overall Limit')}</Text>
							<View style={styles.limitRow}>
								<Text style={styles.limitAmount}>{mataUang.symbol}{getLimit('all').toLocaleString()}</Text>
								<TouchableOpacity style={styles.editBtn} onPress={() => handleEdit('all')}>
									<Text style={styles.editBtnText}>{t('Edit')}</Text>
								</TouchableOpacity>
							</View>
							{getLimit('all') > 0 && (
								<>
									<View style={styles.progressRow}>
										<Text style={styles.progressText}>{t('Spent')}: {mataUang.symbol}{spentOverall.toLocaleString()} ({Math.round((spentOverall / getLimit('all')) * 100)}%)</Text>
									</View>
									<ProgressBar percent={spentOverall / getLimit('all') * 100} color={spentOverall >= getLimit('all') ? '#ff3b30' : '#007bff'} />
									{spentOverall >= getLimit('all') && (
										<Text style={styles.limitReachedText}>{t('Amount has reached the limit')}</Text>
									)}
								</>
							)}
						</View>

						{/* Per-category budgets */}
						<Text style={styles.sectionLabel}>{t('Per-Category Limits')}</Text>
						{allExpenseCategories.map((cat: Category) => {
							const limit = getLimit(cat.id);
							const spent = spentByCategory[cat.id] || 0;
							const percent = limit > 0 ? (spent / limit) * 100 : 0;
							return (
								<View key={cat.id} style={styles.categoryRow}>
									<View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
										<Text style={styles.categoryIconText}>{cat.icon}</Text>
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.categoryName}>{TranslateKategori[i18n.language]?.[cat.id] ? TranslateKategori[i18n.language]?.[cat.id] : cat.name}</Text>
										{limit > 0 && (
											<>
												<View style={styles.progressRow}>
													<Text style={styles.progressText}>{t('Spent')}: {mataUang.symbol}{spent.toLocaleString()} ({Math.round(percent)}%)</Text>
												</View>
												<ProgressBar percent={percent} color={cat.color} />
												<Text style={styles.limitAmountSmallBelow}>{t('Limit')}: {mataUang.symbol}{limit.toLocaleString()}</Text>
												{spent >= limit && (
													<Text style={styles.limitReachedText}>{t('Amount has reached the limit')}</Text>
												)}
											</>
										)}
									</View>
									<TouchableOpacity style={styles.editBtnFancy} onPress={() => handleEdit(cat.id)}>
										<Ionicons name="create-outline" size={20} color="#fff" />
									</TouchableOpacity>
								</View>
							);
						})}
					</ScrollView>
				)}
				{/* Calculator Modal */}
				<Calculator
					visible={!!editing}
					onClose={() => setEditing(null)}
					onConfirm={handleCalculatorConfirm}
					initialValue={editing?.initial || ''}
					currencyLabel={mataUang.name}
				/>

				{/* Edit Budget Modal */}
				<Modal
					visible={!!editModal}
					animationType="fade"
					backdropColor={'transparent'}
					onRequestClose={() => setEditModal(null)}
				>
					<TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModal(null)}>
						<Pressable style={styles.editModalBox} onPress={e => e.stopPropagation()}>
							<Text style={styles.editModalTitle}>{t('Edit Budget')}: {editModal?.name}</Text>
							<Pressable
								style={styles.editInputBox}
								onPress={() => setShowCalc(true)}
							>
								<Text style={styles.editInputText}>{editValue ? mataUang.symbol + parseFloat(editValue).toLocaleString() : t('Tap to enter amount')}</Text>
							</Pressable>
							<View style={styles.checkboxRow}>
								<TouchableOpacity
									style={[styles.checkbox, setAsDefault && styles.checkboxChecked]}
									onPress={() => setSetAsDefault(v => !v)}
								>
									{setAsDefault && <View style={styles.checkboxInner} />}
								</TouchableOpacity>
								<Text style={styles.checkboxLabel}>{t('Set as default for future months')}</Text>
							</View>
							<View style={styles.editModalBtnRow}>
								<TouchableOpacity style={styles.editModalBtnCancel} onPress={() => setEditModal(null)}>
									<Text style={styles.editModalBtnTextCancel}>{t('Cancel')}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.editModalBtnSave}
									onPress={handleEditModalSave}
									disabled={!editValue || isNaN(parseFloat(editValue)) || parseFloat(editValue) < 0}
								>
									<Text style={styles.editModalBtnTextSave}>{t('Save')}</Text>
								</TouchableOpacity>
							</View>
						</Pressable>
					</TouchableOpacity>
					{/* Calculator for modal */}
					<Calculator
						visible={showCalc}
						onClose={() => setShowCalc(false)}
						onConfirm={v => { setEditValue(v); setShowCalc(false); }}
						initialValue={editValue}
						currencyLabel={mataUang.name}
					/>
				</Modal>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerSpacer: {
		height: 8,
		backgroundColor: '#f8f9fa',
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#2c3e50',
		alignSelf: 'center',
		marginBottom: 18,
		marginTop: 8,
	},
	scrollContent: {
		paddingHorizontal: 18,
		paddingBottom: 32,
	},
	overallBudgetBox: {
		backgroundColor: '#e3f2fd',
		borderRadius: 18,
		padding: 18,
		marginBottom: 18,
		shadowColor: '#007bff',
		shadowOpacity: 0.08,
		shadowRadius: 8,
		elevation: 2,
	},
	sectionLabel: {
		fontSize: 17,
		fontWeight: '600',
		color: '#007bff',
		marginBottom: 8,
		marginTop: 8,
	},
	limitRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	limitAmount: {
		fontSize: 24,
		fontWeight: '700',
		color: '#2c3e50',
	},
	editBtn: {
		backgroundColor: '#007bff',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginLeft: 12,
	},
	editBtnText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 15,
	},
	categoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 18,
		padding: 18,
		marginBottom: 18,
		shadowColor: '#007bff',
		shadowOpacity: 0.10,
		shadowRadius: 10,
		elevation: 4,
	},
	categoryIcon: {
		width: 38,
		height: 38,
		borderRadius: 19,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	categoryIconText: {
		fontSize: 22,
	},
	categoryName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#2c3e50',
		marginBottom: 2,
	},
	limitAmountSmall: {
		fontSize: 16,
		fontWeight: '600',
		color: '#007bff',
		marginLeft: 12,
		alignSelf: 'flex-start',
	},
	editBtnSmall: {
		backgroundColor: '#e3f2fd',
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
		marginLeft: 8,
		alignSelf: 'flex-start',
	},
	editBtnFancy: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#007bff',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 12,
		shadowColor: '#007bff',
		shadowOpacity: 0.25,
		shadowRadius: 6,
		elevation: 6,
	},
	progressBarBg: {
		height: 12,
		backgroundColor: '#e3e6ea',
		borderRadius: 8,
		marginTop: 8,
		marginBottom: 4,
		width: '100%',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#f1f3f4',
	},
	progressBarFill: {
		height: '100%',
		borderRadius: 8,
		shadowColor: '#000',
		shadowOpacity: 0.10,
		shadowRadius: 4,
		elevation: 2,
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 2,
		marginBottom: 0,
	},
	progressText: {
		fontSize: 13,
		color: '#495057',
		fontWeight: '500',
	},
	limitAmountSmallBelow: {
		fontSize: 14,
		fontWeight: '500',
		color: '#007bff',
		marginTop: 4,
		alignSelf: 'flex-start',
	},
	monthNavBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 8,
		marginBottom: 8,
		gap: 2,
	},
	monthNavText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#5e72e4',
		marginHorizontal: 2,
		minWidth: 120,
		textAlign: 'center',
	},
	arrowButton: {
		paddingHorizontal: 22,
		paddingVertical: 8,
		borderRadius: 20,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	editModalBox: {
		width: '85%',
		backgroundColor: '#fff',
		borderRadius: 18,
		padding: 24,
		alignItems: 'center',
		shadowColor: '#007bff',
		shadowOpacity: 0.12,
		shadowRadius: 16,
		elevation: 8,
	},
	editModalTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#007bff',
		marginBottom: 18,
		textAlign: 'center',
	},
	editInputBox: {
		width: '100%',
		borderWidth: 1.5,
		borderColor: '#e3e6ea',
		borderRadius: 10,
		padding: 16,
		marginBottom: 18,
		alignItems: 'center',
		backgroundColor: '#f8f9fa',
	},
	editInputText: {
		fontSize: 20,
		color: '#2c3e50',
		fontWeight: '600',
	},
	checkboxRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 18,
		alignSelf: 'flex-start',
	},
	checkbox: {
		width: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#007bff',
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
	},
	checkboxChecked: {
		backgroundColor: '#007bff',
		borderColor: '#007bff',
	},
	checkboxInner: {
		width: 12,
		height: 12,
		borderRadius: 3,
		backgroundColor: '#fff',
	},
	checkboxLabel: {
		fontSize: 15,
		color: '#007bff',
		fontWeight: '500',
	},
	editModalBtnRow: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-between',
		marginTop: 10,
		gap: 10,
	},
	editModalBtnCancel: {
		flex: 1,
		backgroundColor: '#e3e6ea',
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
	},
	editModalBtnSave: {
		flex: 1,
		backgroundColor: '#007bff',
		borderRadius: 8,
		paddingVertical: 12,
		alignItems: 'center',
		opacity: 1,
	},
	editModalBtnTextCancel: {
		color: '#007bff',
		fontWeight: '700',
		fontSize: 16,
	},
	editModalBtnTextSave: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 16,
	},
	limitReachedText: {
		color: 'red',
		fontWeight: 'bold',
		marginTop: 4,
		fontSize: 14,
	},
});