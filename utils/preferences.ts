import { MataUang } from "@/types/types";

export const CURRENCIES: MataUang[] = [
    { symbol: '$', name: 'US Dollar' },
    { symbol: '€', name: 'Euro' },
    { symbol: '£', name: 'British Pound' },
    { symbol: '¥', name: 'Japanese Yen' },
    { symbol: 'Rp', name: 'Indonesian Rupiah' },
    { symbol: '₹', name: 'Indian Rupee' },
    { symbol: 'K', name: 'Myanmar Kyat' },
];

export const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'tl', label: 'Timor-Leste', flag: '🇹🇱' },
    { code: 'mm', label: 'Myanmar', flag: '🇲🇲' },
    { code: 'jv', label: 'Basa Jawa', flag: '🇮🇩' },
];

export const uangUtils = {
    formatAmount: (amount: number, mataUang: MataUang) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount).replace("$", mataUang.symbol);
    },
    simpleFormat: (jumlah: string, mataUang: MataUang) => {
        return `${mataUang.symbol}${parseFloat(jumlah).toFixed(2)}`
    }
}