import { Transaction } from "@/types/types";
import { storageUtils } from "@/utils/storage";
import { create } from 'zustand';

interface TransactionState {
    transactions: Transaction[];
    dapat: () => Promise<void>;
    tambah: (t: Transaction) => Promise<void>;
    update: (t: Transaction) => Promise<void>;
    hapus: (id: string) => Promise<void>;
    hapusSemua: () => Promise<void>;
}
  
export const useTransactions = create<TransactionState>((set, get) => ({
    transactions: [],
    dapat: async () => {
        const loaded = await storageUtils.loadTransactions();
        set({ transactions: loaded })        
    },
    tambah: async (t) => {
        const data = await storageUtils.addTransaction(t);
        set({ transactions: data });
    },
    update: async (t) => {
        const data = await storageUtils.updateTransaction(t);
        set({ transactions: data })
    },
    hapus: async (id) => {
        set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
        const data = await storageUtils.deleteTransaction(id);
        set({ transactions: data });
    },
    hapusSemua: async () => {
        await storageUtils.clearAllTransactions();
        set({ transactions: [] })
    }
}))

// export function useTransactions() {
//     const [transactions, setTransactions] = useState<Transaction[]>([]);

//     useEffect(() => {
//         (async () => {
//             const loaded = await storageUtils.loadTransactions();
//             setTransactions(loaded);
//         })();
//     }, []);

//     const tambah = async (newTransactions: Transaction) => {
//         const data = await storageUtils.addTransaction(newTransactions);
//         setTransactions(data);
//     };

//     const update = async (newTransactions: Transaction) => {
//         const data = await storageUtils.updateTransaction(newTransactions);
//         setTransactions(data);
//     };

//     const hapus = async (transactionId: string) => {
//         const data = await storageUtils.deleteTransaction(transactionId);
//         setTransactions(data);
//     }

//     return { transactions, tambah, update, hapus };
// }