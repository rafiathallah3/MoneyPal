import { lightTheme as theme } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';

const Layout = () => {
    const insets = useSafeAreaInsets();

    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: '#6c757d',
                tabBarStyle: { paddingBottom: insets.bottom, height: 60 + insets.bottom, backgroundColor: theme.linearGradientBackground[0] },
                tabBarButton: ({ ref, ...props }: any) => <Pressable {...props} android_ripple={{ color: 'transparent' }} />,
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'index') {
                        return <Ionicons name="home" size={size} color={color} />;
                    }
                    if (route.name === 'analysis') {
                        return <Ionicons name="pie-chart" size={size} color={color} />;
                    }
                    if (route.name === 'categories') {
                        return <Ionicons name="list" size={size} color={color} />;
                    }
                    if (route.name === 'budget') {
                        return <Ionicons name="calculator" size={size} color={color} />;
                    }
                    return null;
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
            <Tabs.Screen name="analysis" options={{ title: t('tabs.analysis') }} />
            <Tabs.Screen name="budget" options={{ title: t('tabs.budgets') }} />
            <Tabs.Screen name="categories" options={{ title: t('tabs.categories') }} />
            {/* <Tabs.Screen name="preferences" options={{
                title: 'Preferences',
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="settings-outline" size={size} color={color} />
                ),
            }} /> */}
        </Tabs>
    )
}

export default Layout