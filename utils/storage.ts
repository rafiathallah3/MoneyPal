import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Tipe_MataUang, Tipe_WarnaTema, TipeBudget, Transaction } from '../types/types';
import { CURRENCIES } from './preferences';

const TRANSACTIONS_KEY = 'moneypal_transactions';
const WARNATEMA_KEY = 'moneypal_theme';
const MATAUANG_KEY = 'moneypal_matauang';
const CUSTOM_CATEGORIES_KEY = 'moneypal_custom_categories';
const BUDGET_KEY = 'moneypal_budget';
const NOTIFIKASI_KEY = "moneypal_daily_reminder";
const WAKTU_NOTIFIKASI_KEY = "moneypal_daily_reminder_time";
const PIN_KEY = "moneypal_pin";
const LANG_KEY = 'moneypal_language';

export const storageUtils = {
  // Save all transactions
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },

  // Load all transactions
  async loadTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  },

  // Add a new transaction
  async addTransaction(transaction: Transaction): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = [...existingTransactions, transaction];
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return [];
    }
  },

  // Delete a transaction
  async deleteTransaction(transactionId: string): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = existingTransactions.filter(
        transaction => transaction.id !== transactionId
      );
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return [];
    }
  },

  // Get transactions for a specific date
  async getTransactionsForDate(date: string): Promise<Transaction[]> {
    try {
      const allTransactions = await this.loadTransactions();
      return allTransactions.filter(transaction => transaction.date === date);
    } catch (error) {
      console.error('Error getting transactions for date:', error);
      return [];
    }
  },

  // Update a transaction
  async updateTransaction(updated: Transaction): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = existingTransactions.map(transaction =>
        transaction.id === updated.id ? { ...transaction, ...updated } : transaction
      );
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return [];
    }
  },

  async clearAllTransactions(): Promise<void> {
    try {
      await this.saveTransactions([]);
    } catch (error) {
      console.error('Error clearing transaction:', error);
    }
  },

  async dapatinWarnaTema(): Promise<Tipe_WarnaTema> {
    try {
      const data = await AsyncStorage.getItem(WARNATEMA_KEY);
      if (data) {
        return data as "sistem";
      }

      return "sistem";
    } catch (e) {
      console.error("Error saat mendapatkan warna tema", e);
      return "sistem";
    }
  },

  async simpanWarnaTema(warna: Tipe_WarnaTema): Promise<void> {
    try {
      await AsyncStorage.setItem(WARNATEMA_KEY, warna);
    } catch (e) {
      console.error("Error saat menyimpan warna tema", e);
    }
  },

  async simpanMataUang(mataUang: Tipe_MataUang): Promise<void> {
    try {
      await AsyncStorage.setItem(MATAUANG_KEY, mataUang)
    } catch (error) {
      console.error('Error simpan mata uang:', error);
    }
  },

  async dapatinMataUang(): Promise<Tipe_MataUang> {
    try {
      const data = await AsyncStorage.getItem(MATAUANG_KEY);

      if (CURRENCIES.find((v) => v.symbol === data) === undefined) {
        return "$";
      }

      return data as Tipe_MataUang;
    } catch (error) {
      console.error('Error dapatin mata uang:', error);
      return "$";
    }
  },

  async dapatinCustomKategori(): Promise<Category[]> {
    try {
      const kategori = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return kategori ? JSON.parse(kategori) : [];
    } catch (error) {
      console.error("Error dapatin custom kategori", error);
      return [];
    }
  },

  async simpanCustomKategori(kategori: Category): Promise<Category[]> {
    try {
      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = [...semuaKategori, kategori];
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("ERror simpan custom kategori", error);
      return [];
    }
  },

  async updateCustomKategori(kategori: Category): Promise<Category[]> {
    try {
      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = semuaKategori.map(dalamKategori =>
        dalamKategori.id === kategori.id ? { ...dalamKategori, ...kategori } : dalamKategori
      );
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("Error update custom kategori", error);
      return [];
    }
  },

  async hapusCustomKategori(id: string): Promise<Category[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      existingTransactions.map((v) => {
        if (v.id === id) {
          v.category = v.type === "expense" ? "other_expense" : "other_income";
        }

        return v;
      });
      await this.saveTransactions(existingTransactions);

      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = semuaKategori.filter((val) => val.id !== id);
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("Error hapus custom kategori", error);
      return [];
    }
  },

  async hapusSemuaCustomKategori(): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },

  async dapatinNotifikasi(): Promise<[boolean, { hour: number; minute: number }]> {
    try {
      const value = await AsyncStorage.getItem(NOTIFIKASI_KEY);
      const waktuRaw = await AsyncStorage.getItem(WAKTU_NOTIFIKASI_KEY);

      const waktu = { hour: 20, minute: 0 };
      if (waktuRaw !== null) {
        const { hour, minute } = JSON.parse(waktuRaw);
        waktu.hour = hour;
        waktu.minute = minute;
      }

      return [value === 'true', waktu];
    } catch (e: any) {
      console.log("Error saat ingin load notifikasi", e);
      return [false, { hour: 20, minute: 0 }]
    }
  },

  async simpanOpsiNotifikasi(opsi: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFIKASI_KEY, opsi.toString());
    } catch (error) {
      console.log("Error saat ingin simpan opsi notifikasi", error);
    }
  },

  async simpanWaktuNotifikasi(waktu: { hour: number, minute: number }): Promise<void> {
    try {
      await AsyncStorage.setItem(WAKTU_NOTIFIKASI_KEY, JSON.stringify(waktu));
    } catch (error) {
      console.log("Error saat ingin simpan waktu notifikasi", error);
    }
  },

  async dapatinPin(): Promise<string> {
    try {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      return pin || "";
    } catch (error) {
      console.error('Error dapatin pin:', error);
      return "";
    }
  },

  async simpanPin(pin: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
    } catch (error) {
      console.error('Error simpan pin:', error);
    }
  },

  async saveBudgetData(data: TipeBudget): Promise<void> {
    try {
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving budget data:', error);
    }
  },

  async loadBudgetData(): Promise<TipeBudget> {
    try {
      const data = await AsyncStorage.getItem(BUDGET_KEY);
      return data ? JSON.parse(data) : { budget: {}, default: {} };
    } catch (error) {
      console.error('Error loading budget data:', error);
      return { budget: {}, default: {} };
    }
  },

  async dapatinBahasa(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(LANG_KEY);
      return data || 'en';
    } catch (error) {
      console.error('Error loading language:', error);
      return 'en';
    }
  },

  async simpanBahasa(bahasa: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LANG_KEY, bahasa);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
}; 