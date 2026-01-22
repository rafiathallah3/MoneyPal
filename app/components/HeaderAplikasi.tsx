import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeaderAplikasiProps {
    subtitle: string,
    pageUtama: boolean,
    icon: string,
    onBack?: () => void
}

const HeaderPageUtama = ({ subtitle, topPadding }: { subtitle: string, topPadding: number }) => {
    const navigation = useNavigation<DrawerNavigationProp<any>>();

    return (
        <View style={[styles.headerRow, { paddingTop: topPadding, backgroundColor: '#007bff' }]}>
            <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.openDrawer()}
            >
                <Ionicons name="ellipsis-vertical" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.appTitle}>MoneyPal</Text>
                <Text style={styles.appSubtitle}>{subtitle}</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
    )
}

const HeaderSidePage = ({ subtitle, topPadding, icon, onBack }: { subtitle: string, topPadding: number, icon: string, onBack?: () => void }) => {
    const router = useRouter();

    return (
        <View style={[styles.headerRow, { paddingTop: topPadding, backgroundColor: "transparent", borderBottomWidth: 0 }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                    if (onBack) {
                        onBack();
                    } else {
                        router.back();
                    }
                }}
            >
                <Ionicons name="arrow-back" size={24} color="#007bff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Ionicons name={icon as "link"} size={28} style={styles.headerIcon} />
                <Text style={styles.headerTitle}>{subtitle}</Text>
            </View>
        </View>
    )
}

export default function HeaderAplikasi({ subtitle, pageUtama = true, icon = '', onBack }: HeaderAplikasiProps) {
    const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

    return pageUtama ? (
        <HeaderPageUtama subtitle={subtitle} topPadding={topPadding} />
    ) : (
        <HeaderSidePage subtitle={subtitle} topPadding={topPadding} icon={icon} onBack={onBack} />
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 18,
        minHeight: 72,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        marginRight: 12,
        color: "#007bff"
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    menuButton: {
        padding: 2,
        marginRight: 8,
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
})