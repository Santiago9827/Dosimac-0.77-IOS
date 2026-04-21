import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

import { PublicDrawerNavigator } from './PublicDrawerNavigator';
import { PrivateDrawerNavigator } from './SideMenuNavigator';
import { validarTokenEspada } from '../../stores/validarToken'; // ajusta la ruta real

export const RootNavigator = () => {
    const token = useAuthStore((s) => s.token);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const logout = useAuthStore((s) => s.logout);

    const [validandoToken, setValidandoToken] = useState(false);
    const [tokenValidado, setTokenValidado] = useState(false);

    useEffect(() => {
        const comprobarToken = async () => {
            if (!isHydrated) return;

            if (!token) {
                setTokenValidado(false);
                setValidandoToken(false);
                return;
            }

            try {
                setValidandoToken(true);

                const respuesta = await validarTokenEspada(token);

                if (respuesta.ok) {
                    setTokenValidado(true);
                    return;
                }

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
                    setTokenValidado(false);
                    return;
                }

                const detalle =
                    (respuesta.data &&
                        (respuesta.data.message ||
                            respuesta.data.error ||
                            respuesta.data.mensaje)) ||
                    respuesta.rawText ||
                    `HTTP ${respuesta.status}`;

                Alert.alert('Aviso', String(detalle));

                // Mantener sesión
                setTokenValidado(true);
            } catch {
                Alert.alert(
                    'Error de red',
                    'No se pudo validar la sesión con el servidor.'
                );

                // Mantener sesión
                setTokenValidado(true);
            } finally {
                setValidandoToken(false);
            }
        };

        comprobarToken();
    }, [token, isHydrated, logout]);
    if (!isHydrated || validandoToken) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!token || !tokenValidado) {
        return <PublicDrawerNavigator />;
    }

    return <PrivateDrawerNavigator />;
};