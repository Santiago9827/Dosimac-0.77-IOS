import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Appbar } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAwrConn } from '../../stores/awrConnStore';

const CARD_BORDER = '#E2E8F0';
const BRAND = '#4F46E5';
const normalize = (s: string) => s.replace(/\s+/g, '').toUpperCase();

export default function BuscarAnimalScreen() {
    const navigation = useNavigation<any>();
    const { isConnected, startReading, stopReading, lastTag, error } = useAwrConn();

    const [crotal, setCrotal] = useState('');
    const [scanning, setScanning] = useState(false);
    const target = useMemo(() => normalize(crotal), [crotal]);

    const jumped = useRef(false);
    const isNavigating = useRef(false);
    const [foundMsg, setFoundMsg] = useState<string | null>(null);

    const goToCTIFEED = async () => {
        try { await stopReading?.(); } catch { }
        setScanning(false);

        // Si estás dentro del drawer privado, esto es lo más fiable
        const drawer = navigation.getParent?.('RootDrawer');
        if (drawer?.navigate) {
            drawer.navigate('Tabs', {
                screen: 'Tabs',       // TabsStack -> Screen "Tabs" (BottomTabNavigator)
                params: { screen: 'Tab4' }, // BottomTabNavigator -> Tab4 (CTIFEED)
            });
        } else {
            // fallback
            navigation.navigate('Tabs');
        }
    };

    const onBuscar = async () => {
        const t = target;
        if (!t) { Alert.alert('Introduce un crotal'); return; }
        try {
            await startReading();
            jumped.current = false;
            isNavigating.current = false;
            setFoundMsg(null);
            setScanning(true);
        } catch (e: any) {
            Alert.alert('No se pudo iniciar la lectura', e?.message ?? 'Error desconocido');
        }
    };

    // Si esta pantalla pierde foco o se desmonta -> parar lectura
    useFocusEffect(
        React.useCallback(() => {
            return () => {
                stopReading?.().catch(() => { });
                setScanning(false);
            };
        }, [stopReading])
    );

    // Observa el último tag leído y compara
    // useEffect(() => {
    //     if (!scanning || !target) return;

    //     const tag = lastTag ? normalize(String(lastTag)) : '';
    //     if (tag && tag === target && !jumped.current && !isNavigating.current) {
    //         jumped.current = true;
    //         isNavigating.current = true;
    //         Vibration.vibrate(300);
    //         setScanning(false);

    //         (async () => {
    //             try { await stopReading?.(); } catch { }

    //             setTimeout(() => {
    //                 try {
    //                     navigation.push('AnimalDetalle' as never, { crotal: target } as never);
    //                 } catch (e) {
    //                     try {
    //                         navigation.getParent()?.navigate('AnimalSearch' as never, {
    //                             screen: 'AnimalDetalle',
    //                             params: { crotal: target },
    //                         } as never);
    //                     } catch (e2: any) {
    //                         Alert.alert('Error al navegar', e2?.message ?? String(e2));
    //                     }
    //                 }
    //             }, 80);
    //         })();
    //     }
    // }, [lastTag, scanning, target, navigation, stopReading]);


    //-------------------Mensaje cuando lo encuentra-------------------

    useEffect(() => {
        if (!scanning || !target) return;

        const tag = lastTag ? normalize(String(lastTag)) : "";
        if (tag && tag === target && !jumped.current && !isNavigating.current) {
            jumped.current = true;
            isNavigating.current = true;

            //Vibration.vibrate(200);
            setScanning(false);

            // parar lectura
            (async () => {
                try { await stopReading?.(); } catch { }
            })();

            // mensaje simple
            setFoundMsg(` Se ha encontrado el crotal ${target}`);
            // o si lo quieres como Alert:
            Alert.alert("Encontrado", `Se ha encontrado el crotal ${target}`);
        }
    }, [lastTag, scanning, target, stopReading]);


    //--------------------Fin Mensaje-----------------------------------

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* ✅ Header con flecha atrás */}
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={goToCTIFEED} />
                <Appbar.Content title="Buscar animal" />
            </Appbar.Header>

            <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900' }}>
                    Buscar animal por crotal
                </Text>
                <Text style={{ color: '#64748B', marginTop: 6 }}>
                    Escribe el crotal y pulsa “Buscar con AWR300”. Cuando el lector lo detecte, vibrará y te llevaremos al detalle.
                </Text>

                <View style={{ marginTop: 16, borderWidth: 1, borderColor: CARD_BORDER, backgroundColor: '#fff', borderRadius: 16, padding: 12 }}>
                    <Text style={{ color: '#64748B', marginBottom: 6 }}>Crotal</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: CARD_BORDER, borderRadius: 12, paddingHorizontal: 10, height: 48 }}>
                        <Ionicons name="pricetags-outline" size={18} color="#64748B" />
                        <TextInput
                            value={crotal}
                            onChangeText={setCrotal}
                            placeholder="Introduce crotal"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            style={{ flex: 1, marginLeft: 8, color: '#0f172a' }}
                        />
                        {scanning && <ActivityIndicator size="small" color={BRAND} />}
                    </View>

                    {!!error && <Text style={{ color: '#DC2626', marginTop: 6 }}>{error}</Text>}

                    <TouchableOpacity
                        onPress={onBuscar}
                        disabled={!crotal.trim()}
                        activeOpacity={0.9}
                        style={{
                            marginTop: 12,
                            height: 48,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: crotal.trim() ? BRAND : '#C7D2FE',
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Buscar con AWR300</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={async () => {
                            const t = target;
                            if (!t) { Alert.alert('Introduce un crotal'); return; }
                            try { await stopReading?.(); } catch { }
                            navigation.navigate('AnimalDetalle' as never, { crotal: t } as never);
                        }}
                        activeOpacity={0.9}
                        style={{
                            marginTop: 10,
                            height: 44,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#E5E7EB',
                        }}
                    >
                        <Text style={{ color: '#0f172a', fontWeight: '700' }}>Buscar manualmente</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={isConnected ? 'radio-outline' : 'alert-circle-outline'} size={16} color={isConnected ? BRAND : '#DC2626'} />
                        <Text style={{ marginLeft: 6, color: isConnected ? BRAND : '#DC2626', fontWeight: '700' }}>
                            {isConnected ? 'AWR300 conectado' : 'AWR300 no conectado'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}