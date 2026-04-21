/* eslint-disable prettier/prettier */
import React from 'react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItem,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Platform, useWindowDimensions, View, Text } from 'react-native';
import { Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { globalColors } from '../theme/theme';
import { IonIcon } from '../components/shared/IonIcon';

import { LoginScreen } from '../screens/login/login';
import { DRStackNavigator } from './dr_StackNavigator';
import { FarmListNavigator } from './FarmListNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';

//  Tu pantalla principal sin sesión (la “principal pública”)
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { ConfiguracionIPScreen } from "../screens/ip/ConfiguracionIPScreen";
import { PublicStartScreen } from '../routes/PantallaSeleccionInicio';
type PublicDrawerParamList = {
    Login: undefined;
    PublicStart: undefined;
    PublicHome: undefined;
    Register: undefined;
    FarmList: undefined;
    Settings: undefined;
    ConfigIP: undefined;
};

const Drawer = createDrawerNavigator<PublicDrawerParamList>();


// const Drawer = createDrawerNavigator();

export const PublicDrawerNavigator = () => {
    const { width: winW } = useWindowDimensions();
    const isTablet = winW >= 768;

    const drawerW =
        Platform.OS === 'web'
            ? Math.min(560, Math.round(winW * 0.68))
            : isTablet
                ? Math.min(420, Math.round(winW * 0.45))
                : Math.min(360, Math.round(winW * 0.72));

    return (
        <Drawer.Navigator
            id="PublicDrawer"
            initialRouteName="PublicStart"
            drawerContent={(props) => <PublicDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                overlayColor: 'rgba(0,0,0,0.25)',
                drawerStatusBarAnimation: 'fade',
                drawerStyle: {
                    width: drawerW,
                    backgroundColor: '#fff',
                    ...(Platform.OS === 'web' && {
                        borderTopRightRadius: 16,
                        borderBottomRightRadius: 16,
                    }),
                },
                drawerActiveBackgroundColor: globalColors.primary,
                drawerActiveTintColor: 'white',
                drawerInactiveTintColor: globalColors.primary,
                drawerLabelStyle: { flexShrink: 1, marginRight: 4 },
                drawerItemStyle: { borderRadius: 100, paddingHorizontal: 0 },
            }}
        >
            {/*  Visible en el drawer (lo pintamos manualmente también) */}
            <Drawer.Screen name="Login" component={LoginScreen} />

            {/*  Pantalla principal pública (SIN sesión). La ocultamos del DrawerItemList */}
            <Drawer.Screen
                name="PublicStart"
                component={PublicStartScreen}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />

            <Drawer.Screen
                name="PublicHome"
                component={HomeScreen}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />
            {/*  Rutas públicas “de alta dispositivo” (también ocultas; las pintamos manualmente) */}
            <Drawer.Screen
                name="Register"
                component={DRStackNavigator}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />
            <Drawer.Screen
                name="FarmList"
                component={FarmListNavigator}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />

            {/* Ajustes oculto como ya tenías */}
            <Drawer.Screen
                name="Settings"
                component={SettingsStackNavigator}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />

            <Drawer.Screen
                name="ConfigIP"
                component={ConfiguracionIPScreen}
                options={{
                    title: "Configuración IP",
                    drawerIcon: ({ color }) => <IonIcon name="wifi-outline" color={color} />,
                }}
            />
        </Drawer.Navigator>
    );
};

const PublicDrawerContent = (props: DrawerContentComponentProps) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // const activeRoute = props.state.routeNames[props.state.index]; 
    const activeRoute = props.state.routeNames[props.state.index] as keyof PublicDrawerParamList;


    const activeBg = globalColors.primary;
    const activeTint = 'white';
    const inactiveTint = globalColors.primary;

    const go = (name: string) => {
        const nav = props.navigation;
        nav.closeDrawer();
        setTimeout(() => nav.navigate(name as never), 120);
    };

    const itemStyle = (focused: boolean) => ([
        { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
        focused && { backgroundColor: activeBg },
    ]);

    const labelStyle = (focused: boolean) => ({
        color: focused ? activeTint : inactiveTint,
        fontWeight: '700' as const,
    });

    const iconColor = (focused: boolean) => (focused ? activeTint : inactiveTint);

    const isSimpleMenu =
        activeRoute === "Login" ||
        activeRoute === "ConfigIP" ||
        activeRoute === "PublicStart";
    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
        >
            {/*  MENÚ CONDICIONAL */}
            {isSimpleMenu ? (
                <>
                    <DrawerItem
                        label="Login"
                        icon={() => <IonIcon name="log-in-outline" color={iconColor(activeRoute === "Login")} />}
                        labelStyle={labelStyle(activeRoute === "Login")}
                        style={itemStyle(activeRoute === "Login")}
                        onPress={() => go("Login" as never)}
                    />

                    <DrawerItem
                        label="Alta dispositivos"
                        icon={() => <IonIcon name="add-outline" color={iconColor(false)} />}
                        labelStyle={labelStyle(false)}
                        style={itemStyle(false)}
                        onPress={() => go("PublicHome" as never)}
                    />

                    <DrawerItem
                        label="Configuración IP"
                        icon={() => <IonIcon name="wifi-outline" color={iconColor(activeRoute === "ConfigIP")} />}
                        labelStyle={labelStyle(activeRoute === "ConfigIP")}
                        style={itemStyle(activeRoute === "ConfigIP")}
                        onPress={() => go("ConfigIP" as never)}
                    />
                </>
            ) : (
                <>
                    <DrawerItem
                        label="Login"
                        icon={() => <IonIcon name="log-in-outline" color={iconColor(false)} />}
                        labelStyle={labelStyle(false)}
                        style={itemStyle(false)}
                        onPress={() => go("Login")}
                    />
                    <DrawerItem
                        label="Alta Dosimac"
                        icon={() => <IonIcon name="add-outline" color={iconColor(activeRoute === "Register")} />}
                        labelStyle={labelStyle(activeRoute === "Register")}
                        style={itemStyle(activeRoute === "Register")}
                        onPress={() => go("Register" as never)}
                    />

                    <DrawerItem
                        label="Instalaciones"
                        icon={() => <IonIcon name="document-text-outline" color={iconColor(activeRoute === "FarmList")} />}
                        labelStyle={labelStyle(activeRoute === "FarmList")}
                        style={itemStyle(activeRoute === "FarmList")}
                        onPress={() => go("FarmList" as never)}
                    />

                    {/* ❌ aquí NO pones ConfigIP */}
                </>
            )}

            {/*  Footer igual que el tuyo */}
            <View style={{ marginTop: 'auto' }}>
                <Text style={{ marginLeft: 16, marginBottom: 6, fontSize: 12, fontWeight: '600', color: '#666' }}>
                    {t('common:softwareVersion', { defaultValue: 'softwareVersion' })} 3
                </Text>

                <Divider style={{ marginHorizontal: 16, marginBottom: 4 }} />

                <DrawerItem
                    label={t('common:settings', { defaultValue: 'Ajustes' })}
                    icon={() => <IonIcon name="settings-outline" color={iconColor(activeRoute === 'Settings')} />}
                    labelStyle={labelStyle(activeRoute === 'Settings')}
                    style={itemStyle(activeRoute === 'Settings')}
                    onPress={() => go('Settings')}
                />
            </View>
        </DrawerContentScrollView>
    );
};