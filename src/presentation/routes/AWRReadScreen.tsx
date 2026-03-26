/* eslint-disable prettier/prettier */
import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { Appbar, Text, Card } from 'react-native-paper';
import { useAwrConn } from '../../stores/awrConnStore';

export const AWRReadScreen = ({ navigation, route }: any) => {
    const { id, label } = route.params || {};
    const { isConnected, currentId, startReading, lastTag, history, error } = useAwrConn();

    useEffect(() => {
        // si ya venimos conectados, solo aseguramos lectura
        startReading().catch(() => { });
        // NOTA: no paramos lectura ni desconectamos al salir
    }, []);

    const titleLabel = label || id || currentId || '';

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title={`AWR300 – Lectura (${String(titleLabel).toUpperCase()})`} />
            </Appbar.Header>

            <View style={{ marginHorizontal: 16, marginTop: 12 }}>
                <Card mode="contained" style={{ borderRadius: 16, padding: 12 }}>
                    {!!error && <Text style={{ color: 'red' }}>{error}</Text>}
                    {!error && (
                        <>
                            <Text>{isConnected ? 'Conectado y suscrito a notificaciones.' : 'No conectado.'}</Text>
                            {!!lastTag && (
                                <Text style={{ marginTop: 8, fontSize: 22, fontWeight: '700' }}>
                                    Último recibido: {lastTag}
                                </Text>
                            )}
                        </>
                    )}
                </Card>
            </View>

            <View style={{ marginTop: 12, flex: 1 }}>
                <Text style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: 0.6 }}>
                    Historial (últimos 50)
                </Text>
                <FlatList
                    data={history}
                    keyExtractor={(item, idx) => `${item}-${idx}`}
                    renderItem={({ item }) => (
                        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                            <Text style={{ fontSize: 18 }}>{item}</Text>
                        </View>
                    )}
                />
            </View>
        </View>
    );
};