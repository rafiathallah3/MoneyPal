import { lightTheme as theme } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, Text } from 'react-native';

// Hook the Material Top Tabs navigator into Expo Router's file-based system
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

// Custom tab bar that tracks swipe position in real-time
const SwipeAwareTabBar = (props: any) => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [visualIndex, setVisualIndex] = useState(props.state.index);

    // Listen to the pager's animated scroll position so the icon
    // color updates mid-swipe instead of waiting for the route change
    useEffect(() => {
        if (!props.position) return;
        const listener = props.position.addListener(({ value }: { value: number }) => {
            const rounded = Math.round(value);
            setVisualIndex(rounded);
        });
        return () => props.position.removeListener(listener);
    }, [props.position]);

    // Also sync when the navigation state changes (e.g. tab tap)
    useEffect(() => {
        setVisualIndex(props.state.index);
    }, [props.state.index]);

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: theme.linearGradientBackground[0],
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
        }}>
            {props.state.routes.map((route: any, index: number) => {
                const isFocused = visualIndex === index;
                const color = isFocused ? '#007bff' : '#6c757d';

                let iconName: any = 'home';
                let label = t('tabs.home');

                if (route.name === 'index') { iconName = 'home'; label = t('tabs.home'); }
                if (route.name === 'analysis') { iconName = 'pie-chart'; label = t('tabs.analysis'); }
                if (route.name === 'budget') { iconName = 'calculator'; label = t('tabs.budgets'); }
                if (route.name === 'categories') { iconName = 'list'; label = t('tabs.categories'); }

                return (
                    <Pressable
                        key={route.key}
                        onPress={() => {
                            const event = props.navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                props.navigation.navigate(route.name);
                            }
                        }}
                        android_ripple={{ color: 'transparent' }}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Ionicons name={iconName} size={24} color={color} />
                        <Text style={{ color, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const Layout = () => {
    const { t } = useTranslation();

    return (
        <MaterialTopTabs
            tabBarPosition="bottom"
            screenOptions={{
                animationEnabled: false, // Jumps cleanly when tapping buttons
            }}
            tabBar={(props) => <SwipeAwareTabBar {...props} />}
        >
            <MaterialTopTabs.Screen name="index" options={{ title: t('tabs.home') }} />
            <MaterialTopTabs.Screen name="analysis" options={{ title: t('tabs.analysis') }} />
            <MaterialTopTabs.Screen name="budget" options={{ title: t('tabs.budgets') }} />
            <MaterialTopTabs.Screen name="categories" options={{ title: t('tabs.categories') }} />
        </MaterialTopTabs>
    );
};

export default Layout