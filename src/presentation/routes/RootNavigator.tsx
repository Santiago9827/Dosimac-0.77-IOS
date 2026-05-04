import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../../stores/authStore';

import { PublicDrawerNavigator } from './PublicDrawerNavigator';
import { PrivateDrawerNavigator } from './SideMenuNavigator';
import { validarTokenEspada } from '../../stores/validarToken';
import { PublicStartScreen } from '../routes/PantallaSeleccionInicio';

const Stack = createStackNavigator();

const PantallaInicioSeleccion = ({ navigation }: any) => {
    const token = useAuthStore((s) => s.token);

    const navigationProxy = {
        ...navigation,
        navigate: (destino: string, params?: any) => {
            if (destino === 'Login') {
                if (token) {
                    navigation.replace('Privado', { screen: 'Tabs' });
                } else {
                    navigation.replace('Publico', { screen: 'Login' });
                }
                return;
            }

            if (destino === 'PublicHome') {
                if (token) {
                    navigation.replace('Privado', { screen: 'AltaDispositivosHome' });
                } else {
                    navigation.replace('Publico', { screen: 'PublicHome' });
                }
                return;
            }

            navigation.navigate(destino, params);
        },
    };

    return <PublicStartScreen navigation={navigationProxy} />;
};
const PantallaPrivadaProtegida = () => {
    const token = useAuthStore((s) => s.token);

    if (!token) {
        return <PublicDrawerNavigator />;
    }

    return <PrivateDrawerNavigator />;
};

export const RootNavigator = () => {
    const token = useAuthStore((s) => s.token);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const logout = useAuthStore((s) => s.logout);

    useEffect(() => {
        let cancelado = false;

        const comprobarToken = async () => {
            if (!isHydrated || !token) return;

            try {
                const respuesta = await validarTokenEspada(token);

                if (cancelado) return;

                if (respuesta.ok) return;

                if (respuesta.status === 401) {
                    const detalle =
                        (respuesta.data &&
                            (respuesta.data.message ||
                                respuesta.data.error ||
                                respuesta.data.mensaje)) ||
                        respuesta.rawText ||
                        'Token no válido';

                    Alert.alert('Sesión expirada', String(detalle));
                    logout();
                }

                // Si falla por red o por otra causa distinta de 401,
                // no bloqueamos el arranque.
            } catch {
                // Sin alerta al arrancar para no molestar al usuario.
            }
        };

        comprobarToken();

        return () => {
            cancelado = true;
        };
    }, [token, isHydrated, logout]);

    if (!isHydrated) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="InicioSeleccion"
                component={PantallaInicioSeleccion}
            />
            <Stack.Screen
                name="Publico"
                component={PublicDrawerNavigator}
            />
            <Stack.Screen
                name="Privado"
                component={PantallaPrivadaProtegida}
            />
        </Stack.Navigator>
    );
};