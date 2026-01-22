import { MataUang, Tipe_MataUang, Tipe_WarnaTema } from "@/types/types";
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from "@/utils/notifikasi";
import { CURRENCIES } from "@/utils/preferences";
import { storageUtils } from "@/utils/storage";
import { darkTheme, lightTheme, WarnaTema } from "@/utils/themes";
import { ColorSchemeName } from "react-native";
import { create } from "zustand";

interface ThemeState {
    tema: Tipe_WarnaTema,
    theme: WarnaTema,
    dapat: (warna_sistem: ColorSchemeName) => Promise<void>;
    ganti: (pilihan: Tipe_WarnaTema) => Promise<void>
}

export const useTheme = create<ThemeState>((set, get) => ({
    tema: "sistem",
    theme: lightTheme,
    dapat: async (warna_sistem) => {
        const data = await storageUtils.dapatinWarnaTema();
        set({ tema: data, theme: data === "dark" ? darkTheme : warna_sistem === "dark" ? darkTheme : lightTheme });
    },
    ganti: async (tema) => {
        if (tema !== "dark" && tema !== "light" && tema !== "sistem") {
            return;
        }

        await storageUtils.simpanWarnaTema(tema);
        set({ tema: tema, theme: tema === "dark" ? darkTheme : lightTheme });
    }
}))

interface MataUangState {
    mataUang: MataUang
    dapat: () => Promise<void>;
    ganti: (pilihan: Tipe_MataUang) => Promise<void>;
}

export const useMataUang = create<MataUangState>((set, get) => ({
    mataUang: CURRENCIES[0],
    dapat: async () => {
        const uang = await storageUtils.dapatinMataUang();
        set({ mataUang: CURRENCIES.find((v) => v.symbol === uang) ?? CURRENCIES[0] });
    },
    ganti: async (pilihan: Tipe_MataUang) => {
        const hasil = CURRENCIES.find((v) => v.symbol === pilihan);
        if (hasil === undefined) {
            return;
        }

        await storageUtils.simpanMataUang(pilihan);
        set({ mataUang: hasil });
    }
}));

interface NotifikasiState {
    opsi: boolean,
    waktu: { hour: number, minute: number },
    dapat: () => Promise<void>
    ganti: (opsi: boolean, waktu: { hour: number, minute: number }) => Promise<void>
}

export const useNotifikasi = create<NotifikasiState>((set, get) => ({
    opsi: false,
    waktu: { hour: 20, minute: 0 },
    dapat: async () => {
        const [opsi_notfikasi, waktu_notifikasi] = await storageUtils.dapatinNotifikasi();
        set({ opsi: opsi_notfikasi, waktu: waktu_notifikasi });
    },
    ganti: async (opsi_notfikasi, waktu_notifikasi) => {
        await storageUtils.simpanOpsiNotifikasi(opsi_notfikasi);
        await storageUtils.simpanWaktuNotifikasi(waktu_notifikasi);
        set({ opsi: opsi_notfikasi, waktu: waktu_notifikasi });

        if (opsi_notfikasi) {
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) return;
            await scheduleDailyReminder(waktu_notifikasi.hour, waktu_notifikasi.minute);
        } else {
            await cancelDailyReminder();
        }
    }
}))