// screens/awr/AWRScanResultsScreen.tsx
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Appbar, ActivityIndicator, Text, Portal, Dialog, Button, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Buffer } from 'buffer';
import { BlePeripheral } from '../../device/ble/bleLibrary';
import { MainButton } from '../components/shared/MainButton ';
import * as ble from '../../device/ble/bleLibrary';
import { awrStore } from '../../stores/awrStore';
import { useAwrConn } from '../../stores/awrConnStore';

export const AWRScanResultsScreen = ({ navigation }) => {
    const { t } = useTranslation();

    const [scanning, setScanning] = useState(true);
    const [startState, setStartState] = useState(0);
    const [hasDevices, setHasDevices] = useState(false);

    // Dialog “no devices”
    const [visible, setVisible] = useState(true);

    const [connecting, setConnecting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    // ✅ NUEVO: Dialog de éxito (solo botón Aceptar)
    const [successVisible, setSuccessVisible] = useState(false);
    const [connectedLabel, setConnectedLabel] = useState<string>('');

    const upsert = awrStore(s => s.upsert);
    const { connect, startReading } = useAwrConn();

    const handleNoDevicesAccept = () => {
        setVisible(false);
        try { ble.stopScanning(); } catch { }
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate('AWR-STARTSCAN' as never);
    };

    // === Helpers advertising / bytes ===
    const bytesToAscii = (bytes: number[]) => String.fromCharCode(...bytes.map(b => b & 0xff));
    const base64ToBytes = (b64: string): number[] => {
        try {
            const bin = Buffer.from(b64, 'base64').toString('binary');
            const out: number[] = [];
            for (let i = 0; i < bin.length; i++) out.push(bin.charCodeAt(i) & 0xff);
            return out;
        } catch { return []; }
    };

    const extractAdvBytesIOS = (adv: any): number[] | null => {
        if (!adv) return null;
        if (Array.isArray(adv.manufacturerRawData)) return adv.manufacturerRawData;
        if (adv.manufacturerData && typeof adv.manufacturerData === 'object') {
            const k = Object.keys(adv.manufacturerData)[0];
            if (k && Array.isArray(adv.manufacturerData[k])) return adv.manufacturerData[k];
        }
        if (adv.serviceData && typeof adv.serviceData === 'object') {
            const k = Object.keys(adv.serviceData)[0];
            const p: any = k ? adv.serviceData[k] : undefined;
            const bytes = Array.isArray(p) ? p : Array.isArray(p?.bytes) ? p.bytes : undefined;
            if (Array.isArray(bytes)) return bytes;
        }
        return null;
    };

    const getAdvBytes = (d: any): number[] | null => {
        if (Array.isArray(d?.advBytes) && d.advBytes.length) return d.advBytes;
        const adv: any = d.peripheral?.advertising || d.advertising || {};

        const ios = extractAdvBytesIOS(adv);
        if (Array.isArray(ios)) return ios;

        if (adv?.manufacturerData?.bytes && Array.isArray(adv.manufacturerData.bytes)) return adv.manufacturerData.bytes;
        if (typeof adv?.manufacturerData === 'string') {
            const arr = base64ToBytes(adv.manufacturerData);
            if (arr.length) return arr;
        }
        if (typeof adv?.manufacturerData?.data === 'string') {
            const arr = base64ToBytes(adv.manufacturerData.data);
            if (arr.length) return arr;
        }
        if (Array.isArray(adv?.manufacturerRawData)) return adv.manufacturerRawData;
        if (adv?.rawData?.bytes && Array.isArray(adv.rawData.bytes)) return adv.rawData.bytes;

        if (typeof d.advertising === 'string' && d.advertising.includes(',')) {
            const arr = d.advertising.split(',').map((n: string) => Number(n));
            if (arr.every((x: any) => Number.isFinite(x))) return arr;
        }
        return null;
    };

    // === Helpers identificación / etiquetas ===
    const macHasAllowedPrefix = (id?: string | null) => {
        if (!id) return false;
        const parts = id.toUpperCase().split(':');
        if (parts.length >= 3) {
            const oui = parts.slice(0, 3).join(':');
            return ['00:04:3E'].includes(oui); // Agrident
        }
        return false;
    };

    const getLocalName = (d: BlePeripheral): string => {
        const adv: any = (d as any).peripheral?.advertising || (d as any).advertising || {};
        return (d.name || adv.localName || '').toString();
    };

    const macSuffix = (id?: string | null) => {
        if (!id) return '';
        const up = id.toUpperCase();
        if (!up.includes(':')) return ''; // iOS oculta MAC
        const parts = up.split(':');
        return parts.length >= 2 ? parts.slice(-2).join('') : '';
    };

const shortFromAwrName = (name?: string | null) => {
  if (!name) return '';
  const up = name.toUpperCase().trim();

  // Ej: AWR300_011106  -> 011106
  const m = up.match(/AWR300[_-]?(\d+)/);
  if (m?.[1]) {
    const digits = m[1];           // "011106"
    return digits.slice(-4);       // "1106"
  }

  return '';
};

const shortFromUuid = (id?: string | null) => {
  if (!id) return '';
  // UUID iOS: c62ee8ee-...-5577 -> 5577
  const compact = id.replace(/-/g, '').toUpperCase();
  return compact.slice(-4);
};

// ✅ ESTE será el label que verá el usuario
const labelShortFor = (d: BlePeripheral) => {
  const mac = macSuffix(d.id);
  if (mac) return `AWR ${mac}`;                 // Android: 1EB9

  const nm = getLocalName(d);
  const fromName = shortFromAwrName(nm);
  if (fromName) return `AWR ${fromName}`;       // iOS: AWR 1106

  const fromUuid = shortFromUuid(d.id);
  if (fromUuid) return `AWR ${fromUuid}`;       // fallback iOS

  return 'AWR';
};
    const labelFor = (d: BlePeripheral) =>
        macSuffix(d.id) || getLocalName(d) || (d.id ?? '').toUpperCase();

    const isAWR = (d: BlePeripheral): boolean => {
        if (macHasAllowedPrefix(d.id)) return true;      // 1) OUI
        const local = getLocalName(d).toUpperCase();     // 2) Nombre
        if (local.startsWith('AWR300')) return true;
        const bytes = getAdvBytes(d);                    // 3) Advertising
        if (Array.isArray(bytes) && bytes.length) {
            const s = bytesToAscii(bytes).toUpperCase();
            if (s.includes('AWR300')) return true;
        }
        return false;
    };

    // === Escaneo ===
    useEffect(() => {
        ble.bleAddListener();
        return () => {
            try { ble.stopScanning(); } catch { }
            ble.bleRemoveListener();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (startState < 2) {
                setStartState(startState + 1);
            } else {
                setScanning(false);
                const found = ble.devices.some(isAWR);
                setHasDevices(found);
            }
        }, stateStep());
        return () => clearTimeout(timer);
    }, [startState]);

    const stateStep = (): number => {
        switch (startState) {
            case 0: return 300;
            case 1: ble.startScanning(); return 3500;
            case 2: ble.stopScanning(); return 100;
            default: return 0;
        }
    };

    // == Conectar y mostrar POPUP (sin ir a AWR-READ)
    const connectAndGo = async (device: BlePeripheral) => {
        setErrorMsg('');
        setConnecting(true);
        try {
           // await ble.bleConnection(device.id);

            // GUARDAR EN STORE
            const label = labelShortFor(device);
            upsert({
                id: device.id,
                label,
                localName: getLocalName(device),
                lastSeen: Date.now(),
            });

            await connect(device.id);
            await startReading();

            // ✅ Mostrar diálogo de éxito (único botón Aceptar)
            try { ble.stopScanning(); } catch { }
            setConnectedLabel(label);
            setSuccessVisible(true);
        } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.toLowerCase().includes('already')) {
                const label = labelShortFor(device);
                upsert({
                    id: device.id,
                    label,
                    localName: getLocalName(device),
                    lastSeen: Date.now(),
                });

                try { ble.stopScanning(); } catch { }
                setConnectedLabel(label);
                setSuccessVisible(true);
            } else {
                setErrorMsg(msg || 'No se pudo conectar');
            }
        } finally {
            setConnecting(false);
        }
    };

    // ✅ Handler único para ir a Home (Tabs)
    const handleSuccessAccept = () => {
        setSuccessVisible(false);
        try { ble.stopScanning(); } catch { }
        const parentNav = navigation.getParent?.();
        if (parentNav) {
            parentNav.navigate('Tabs' as never);
        } else {
            navigation.navigate('Tabs' as never);
        }
        // Si prefieres limpiar historial:
        // parentNav?.reset({ index: 0, routes: [{ name: 'Tabs' as never }] });
    };

    // === UI ===
    const RenderIsScanning = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text style={{ fontSize: 18, marginTop: 8 }}>Buscando AWR300…</Text>
        </View>
    );

    const RenderDevicesNotFound = () => (
        <View style={{ alignItems: 'center', marginVertical: 60 }}>
            <Portal>
                <Dialog visible={visible} onDismiss={handleNoDevicesAccept}>
                    <Dialog.Icon icon="warning" color="red" size={60} />
                    <Dialog.Title style={{ color: 'red' }}>Aviso</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyLarge">No se han encontrado AWR300 cercanos.</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={handleNoDevicesAccept}>Aceptar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );

    const renderDevice = (device: BlePeripheral) => {
        if (!isAWR(device)) return null;
        const label = labelShortFor(device);
        return (
            <View key={device.id} style={{ marginTop: 12 }}>
                <MainButton
                    onPress={() => connectAndGo(device)}
                    label={label}
                    size={3}
                />
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="AWR300 – Resultados de escaneo" />
            </Appbar.Header>

            {(connecting || errorMsg) && (
                <View style={{ marginHorizontal: 24, marginTop: 16 }}>
                    <Card mode="contained" style={{ borderRadius: 16, padding: 12 }}>
                        {connecting && <Text>Conectando…</Text>}
                        {!!errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
                    </Card>
                </View>
            )}

            {scanning && <RenderIsScanning />}

            {!scanning && (
                hasDevices ? (
                    <View style={{ marginTop: 24, marginHorizontal: 40 }}>
                        {ble.devices.map(renderDevice)}
                    </View>
                ) : (
                    <RenderDevicesNotFound />
                )
            )}

            {/* ✅ Dialog de éxito: solo botón Aceptar */}
            <Portal>
                <Dialog visible={successVisible} dismissable={false}>
                    <Dialog.Icon icon="check-circle" color="green" size={60} />
                    <Dialog.Title style={{ color: 'green' }}>Conectado</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyLarge">
                            Conexión establecida con {connectedLabel || 'el dispositivo'}.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={handleSuccessAccept}>Aceptar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};