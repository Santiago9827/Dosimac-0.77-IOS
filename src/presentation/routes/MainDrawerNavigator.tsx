/* eslint-disable prettier/prettier */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';

import Ionicons from 'react-native-vector-icons/Ionicons';

import { BottomTabNavigator } from './BottomTabNavigator';
import { DRStackNavigator } from './dr_StackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';

const Drawer = createDrawerNavigator();

function getActiveTabName(props: DrawerContentComponentProps) {
    const drawerRoute = props.state.routes[props.state.index];
    const tabsState: any = drawerRoute.state;

    if (!tabsState) return 'AltaDispositivosTab';

    return tabsState.routes?.[tabsState.index ?? 0]?.name ?? 'AltaDispositivosTab';
}

const primary = '#4C1D95';

const getDeepestRouteName = (state: any): string | undefined => {
    if (!state) return undefined;

    const route = state.routes?.[state.index ?? 0];

    if (!route) return undefined;

    return getDeepestRouteName(route.state) ?? route.name;
};

const existeRutaEnEstado = (
    state: any,
    nombreRuta: string
): boolean => {
    if (!state?.routes) {
        return false;
    }

    return state.routes.some((route: any) => {
        if (route.name === nombreRuta) {
            return true;
        }

        return existeRutaEnEstado(
            route.state,
            nombreRuta
        );
    });
};

const getDeepestRouteParams = (state: any): any => {
    if (!state) return undefined;

    const route = state.routes?.[state.index ?? 0];

    if (!route) return undefined;

    return getDeepestRouteParams(route.state) ?? route.params;
};

function CustomMainDrawerContent(props: DrawerContentComponentProps) {
    const activeTab = getActiveTabName(props);

    const isAltaTab = activeTab === 'AltaDispositivosTab';
    const isGeneralTab = activeTab === 'GeneralTab';
    const isCapturaTab = activeTab === 'CapturaAnimalTab';

    const goToInicioMovimientos = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            (props.navigation as any).navigate('MainTabs', {
                screen: 'GeneralTab',
                params: {
                    screen: 'GeneralHome',
                },
            });
        }, 120);
    };
    const goToAjustes = () => {
        closeAndNavigate('Settings');
    };

    const goToConfiguracionIp = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            (props.navigation as any).navigate('MainTabs', {
                screen: 'AltaDispositivosTab',
                params: {
                    screen: 'FarmList',
                    params: {
                        screen: 'Farm list',
                    },
                },
            });
        }, 120);
    };
    const activeDrawerRoute = props.state.routeNames[props.state.index];
    const currentRouteName = getDeepestRouteName(props.state);
    const currentRouteParams = getDeepestRouteParams(props.state);

    const isLectorMaternidad = currentRouteName === 'LectorMaternidad';
    const isLectorGestacion = currentRouteName === 'LectorGestacion';
    const isPantallaLector = isLectorMaternidad || isLectorGestacion;
    const isDetalleMaternidad =
        currentRouteName === 'EstadoAnimalDetalle';
    const isDetalleTareasMovimientos =
        existeRutaEnEstado(
            props.state,
            'TareasMovimientosDetalle'
        );

    const vieneDeNoAlimentados =
        currentRouteParams?.origen === 'noAlimentados';

    const textDark = '#0F172A';
    const textMuted = '#64748B';
    const border = '#E5E7EB';

    const closeAndNavigate = (screen: string) => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            props.navigation.navigate(screen as never);
        }, 120);
    };

    const goToAltaDosimac = () => {
        closeAndNavigate('Register');
    };

    const goToInstalaciones = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            (props.navigation as any).navigate('MainTabs', {
                screen: 'AltaDispositivosTab',
                params: {
                    screen: 'FarmList',
                    params: {
                        screen: 'Farm list',
                    },
                },
            });
        }, 120);
    };

    const goBackFromLector = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            (props.navigation as any).navigate('MainTabs', {
                screen: 'GeneralTab',
                params: {
                    screen: 'GeneralLecturaAntena',
                },
            });
        }, 120);
    };

    const goBackFromDetalleTareas = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            (props.navigation as any).navigate('MainTabs', {
                screen: 'GeneralTab',
                params: {
                    screen: 'TareasMovimientos',
                },
            });
        }, 120);
    };

    const goBackFromDetalleMaternidad = () => {
        props.navigation.closeDrawer();

        setTimeout(() => {
            if (vieneDeNoAlimentados) {
                (props.navigation as any).navigate('MainTabs', {
                    screen: 'CapturaAnimalTab',
                    params: {
                        screen: 'AnimalesNoAlimentados',
                        params: {
                            screen: 'NoAlimentadosMaternidad',
                        },
                    },
                });

                return;
            }

            (props.navigation as any).navigate('MainTabs', {
                screen: 'CapturaAnimalTab',
                params: {
                    screen: 'EstadoAnimal',
                },
            });
        }, 120);
    };
    const DrawerButton = ({
        label,
        icon,
        active,
        onPress,
    }: {
        label: string;
        icon: string;
        active?: boolean;
        onPress: () => void;
    }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                style={{
                    marginHorizontal: 14,
                    marginVertical: 4,
                    borderRadius: 18,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: active ? '#F1F5F9' : 'transparent',
                }}
            >
                <View
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? primary : '#F3F4FF',
                        marginRight: 12,
                    }}
                >
                    <Ionicons
                        name={icon}
                        size={22}
                        color={active ? '#FFFFFF' : primary}
                    />
                </View>

                <Text
                    style={{
                        color: active ? textDark : primary,
                        fontWeight: '800',
                        fontSize: 17,
                    }}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={{
                flexGrow: 1,
                paddingTop: 0,
                paddingBottom: 18,
                backgroundColor: '#FFFFFF',
            }}
        >
            <View
                style={{
                    paddingHorizontal: 22,
                    paddingTop: 42,
                    paddingBottom: 18,
                    marginBottom: 6,
                }}
            >
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: textMuted,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                    }}
                >
                    MENÚ
                </Text>

                <View
                    style={{
                        marginTop: 10,
                        width: 46,
                        height: 4,
                        borderRadius: 999,
                        backgroundColor: primary,
                    }}
                />
            </View>

            {isAltaTab && (
                <View style={{ marginTop: 4 }}>
                    <DrawerButton
                        label="Alta Dosimac"
                        icon="add-circle-outline"
                        active={activeDrawerRoute === 'Register'}
                        onPress={goToAltaDosimac}
                    />

                    <DrawerButton
                        label="Instalaciones"
                        icon="document-text-outline"
                        active={
                            currentRouteName === 'FarmList' ||
                            currentRouteName === 'Farm list' ||
                            currentRouteName === 'Farm detalils'
                        }
                        onPress={goToInstalaciones}
                    />
                </View>
            )}

            {isGeneralTab && !isPantallaLector && (
                <View style={{ marginTop: 4 }}>
                    {isDetalleTareasMovimientos ? (
                        <DrawerButton
                            label="Atrás"
                            icon="arrow-back-outline"
                            active={false}
                            onPress={goBackFromDetalleTareas}
                        />
                    ) : (
                        <>
                            <DrawerButton
                                label="Inicio"
                                icon="home-outline"
                                active={
                                    currentRouteName === 'GeneralHome'
                                }
                                onPress={goToInicioMovimientos}
                            />

                            <DrawerButton
                                label="Configuración IP"
                                icon="wifi-outline"
                                active={
                                    currentRouteName === 'FarmList' ||
                                    currentRouteName === 'Farm list' ||
                                    currentRouteName === 'Farm detalils'
                                }
                                onPress={goToConfiguracionIp}
                            />
                        </>
                    )}
                </View>
            )}

            {isPantallaLector && (
                <View style={{ marginTop: 4 }}>
                    <DrawerButton
                        label="Atrás"
                        icon="arrow-back-outline"
                        active={false}
                        onPress={goBackFromLector}
                    />
                </View>
            )}

            {isCapturaTab && (
                <View style={{ marginTop: 4 }}>
                    {isDetalleMaternidad ? (
                        <DrawerButton
                            label="Atrás"
                            icon="arrow-back-outline"
                            active={false}
                            onPress={goBackFromDetalleMaternidad}
                        />
                    ) : (
                        <DrawerButton
                            label="Inicio"
                            icon="home-outline"
                            active={currentRouteName === 'CapturaAnimalHome'}
                            onPress={() => {
                                props.navigation.closeDrawer();

                                setTimeout(() => {
                                    (props.navigation as any).navigate('MainTabs', {
                                        screen: 'CapturaAnimalTab',
                                        params: {
                                            screen: 'CapturaAnimalHome',
                                        },
                                    });
                                }, 120);
                            }}
                        />
                    )}
                </View>
            )}

            <View
                style={{
                    marginTop: 'auto',
                    paddingTop: 12,
                }}
            >
                <View
                    style={{
                        height: 1,
                        backgroundColor: border,
                        marginHorizontal: 22,
                        marginBottom: 10,
                    }}
                />

                {isAltaTab && (
                    <DrawerButton
                        label="Ajustes"
                        icon="settings-outline"
                        active={activeDrawerRoute === 'Settings'}
                        onPress={goToAjustes}
                    />
                )}

                <Text
                    style={{
                        marginTop: 8,
                        marginLeft: 24,
                        fontSize: 12,
                        color: '#94A3B8',
                        fontWeight: '700',
                    }}
                >
                    Versión 10
                </Text>
            </View>
        </DrawerContentScrollView>
    );
}

export const MainDrawerNavigator = () => {

    return (
        <Drawer.Navigator
            id="RootDrawer"
            drawerContent={(props) => <CustomMainDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                overlayColor: 'rgba(0,0,0,0.25)',
                drawerStyle: {
                    width: 320,
                    backgroundColor: '#FFFFFF',
                },
            }}
        >
            <Drawer.Screen
                name="MainTabs"
                component={BottomTabNavigator}
            />

            <Drawer.Screen
                name="Register"
                component={DRStackNavigator}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />
            <Drawer.Screen
                name="Settings"
                component={SettingsStackNavigator}
                options={{
                    drawerItemStyle: { height: 0 },
                    drawerLabel: () => null,
                }}
            />
        </Drawer.Navigator>
    );
};