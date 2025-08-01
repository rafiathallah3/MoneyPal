import { Category } from '../types/types';

export const TranslateKategori: {[bahasa: string]: {[id: string]: string}} = {
  "en": {
    "food": "Food & Dining",
    "transport": "Transportation",
    "shopping": "Shopping",
    "entertainment": "Entertainment",
    "health": "Health & Medical",
    "education": "Education",
    "bills": "Bills & Utilities",
    "clothes": "Clothes",
    "laundry": "Laundry",
    "home": "Home & Garden",
    "personal": "Personal Care",
    "other_expense": "Other",
    "salary": "Salary",
    "freelance": "Freelance",
    "investment": "Investment",
    "gift": "Gift",
    "refund": "Refund",
    "other_income": "Other",
  },
  "id": {
    "food": "Makanan & Makan",
    "transport": "Transportasi",
    "shopping": "Belanja",
    "entertainment": "Hiburan",
    "health": "Kesehatan & Medis",
    "education": "Pendidikan",
    "bills": "Tagihan & Utilitas",
    "clothes": "Pakaian",
    "laundry": "Cuci Pakaian",
    "home": "Rumah & Taman",
    "personal": "Perawatan Pribadi",
    "other_expense": "Lainnya",
    "salary": "Gaji",
    "freelance": "Freelance",
    "investment": "Investasi",
    "gift": "Hadiah",
    "refund": "Pengembalian",
    "other_income": "Lainnya",
  },
  "ja": {
    "food": "食事 & ダイニング",
    "transport": "交通",
    "shopping": "ショッピング",
    "entertainment": "エンタメ",
    "health": "健康 & 医療",
    "education": "教育",
    "bills": "請求 & 公共",
    "clothes": "衣類",
    "laundry": "洗濯",
    "home": "家 & 庭",
    "personal": "個人",
    "other_expense": "その他",
    "salary": "給与",
    "freelance": "フリーランス",
    "investment": "投資",
    "gift": "贈り物",
    "refund": "返金",
    "other_income": "その他",
  }
}

export const expenseCategories: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', type: "expense" },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4', type: "expense" },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#45B7D1', type: "expense" },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#96CEB4', type: "expense" },
  { id: 'health', name: 'Health & Medical', icon: '🏥', color: '#FFEAA7', type: "expense" },
  { id: 'education', name: 'Education', icon: '📚', color: '#DDA0DD', type: "expense" },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#98D8C8', type: "expense" },
  { id: 'clothes', name: 'Clothes', icon: '👕', color: '#F7DC6F', type: "expense" },
  { id: 'laundry', name: 'Laundry', icon: '👚', color: '#BB8FCE', type: "expense" },
  { id: 'home', name: 'Home & Garden', icon: '🏠', color: '#85C1E9', type: "expense" },
  { id: 'personal', name: 'Personal Care', icon: '💄', color: '#F8C471', type: "expense" },
  { id: 'other_expense', name: 'Other', icon: '📦', color: '#BDC3C7', type: "expense" }
];

export const incomeCategories: Category[] = [
  { id: 'salary', name: 'Salary', icon: '💰', color: '#2ECC71', type: "income" },
  { id: 'freelance', name: 'Freelance', icon: '💼', color: '#3498DB', type: "income" },
  { id: 'investment', name: 'Investment', icon: '📈', color: '#E74C3C', type: "income" },
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#9B59B6', type: "income" },
  { id: 'refund', name: 'Refund', icon: '↩️', color: '#F39C12', type: "income" },
  { id: 'other_income', name: 'Other', icon: '💵', color: '#1ABC9C', type: "income" },
];

export const getCategoriesByType = (type: 'income' | 'expense'): Category[] => {
  return type === 'income' ? incomeCategories : expenseCategories;
};

export const getCategoryById = (id: string, type: 'income' | 'expense', customKategori: Category[] = []): Category | undefined => {
  const categories = [...getCategoriesByType(type), ...customKategori.filter((v) => v.type === type)];
  return categories.find(cat => cat.id === id);
}; 