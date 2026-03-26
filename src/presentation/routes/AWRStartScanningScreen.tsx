// screens/awr/AWRStartScanningScreen.tsx
/* eslint-disable prettier/prettier */
import React from 'react';
import { View, Pressable } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

export const AWRStartScanningScreen = ({ navigation }) => {
    const { t } = useTranslation();

    return (
        <View>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="AWR300 Test" />
            </Appbar.Header>

            <View style={{ marginHorizontal: 30, marginTop: 40, borderWidth: 1, borderRadius: 10, borderColor: 'lightgrey' }}>
                <Card mode="contained">
                    <Card.Content>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>
                            Pantalla de pruebas para escanear lectores Agrident AWR300.
                        </Text>
                    </Card.Content>
                </Card>
            </View>

            <View style={{ alignItems: 'center', marginTop: 32 }}>
                <Pressable onPress={() => navigation.navigate('AWR-SCANRESULTS' as never)}>
                    <View style={{
                        width: 180, height: 180, borderRadius: 9999, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#4f46e5'
                    }}>
                        <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>Escanear AWR300</Text>
                    </View>
                </Pressable>
            </View>
        </View>
    );
};