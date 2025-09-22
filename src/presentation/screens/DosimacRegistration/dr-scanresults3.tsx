import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Appbar, Text, Button, Portal, Dialog } from 'react-native-paper';
import { MainButton } from '../../components/shared/MainButton ';
import { useTranslation } from 'react-i18next';
import * as ble from '../../../device/ble/bleLibrary';
import { BlePeripheral } from '../../../device/ble/bleLibrary';

type Props = {
  navigation: any;
  route: { params?: { operacion?: number } };
};

// ASCII de “DOSIMAC”
const DOSIMAC_ASCII = [68, 79, 83, 73, 77, 65, 67];

function includesSubsequence(haystack: number[], needle: number[]) {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function isDosimac(d: BlePeripheral) {
  const n = (d.name || '').toUpperCase();
  if (n.includes('DOSIMAC')) return true;

  // si la librería guarda advBytes (recomendado)
  const advAny = (d as any).advBytes as number[] | undefined;
  if (Array.isArray(advAny) && advAny.length >= 4) {
    // saltamos Company ID de manufacturer (2 bytes)
    const payload = advAny.slice(2);
    return includesSubsequence(payload, DOSIMAC_ASCII);
  }
  return false;
}

function hex2(b: number) {
  return (b & 0xff).toString(16).padStart(2, '0');
}

function isPrintableAscii(b: number) {
  const x = b & 0xff;
  return x >= 0x20 && x <= 0x7e; // visibles
}

// Etiqueta mostrada en el botón (lo que imprime el equipo)
function getDeviceLabel(d: BlePeripheral): string {
  // 1) Preferir ADV BYTES siempre (iOS: manufacturer data empieza con 2 bytes de Company ID)
  const advAny = (d as any).advBytes as number[] | undefined;
  if (Array.isArray(advAny) && advAny.length >= 4) {
    const payload = advAny.slice(2);           // saltar Company ID
    const tail4 = payload.slice(-4);           // últimos 4 bytes del payload

    // Si esos 4 bytes son ASCII imprimibles, úsalos tal cual (lo que imprime el equipo)
    if (tail4.length === 4 && tail4.every(isPrintableAscii)) {
      return tail4.map(b => String.fromCharCode(b)).join('');
    }

    // Si no son ASCII, usa los últimos 2 en HEX (ej. BF8E)
    const tail2 = payload.slice(-2);
    if (tail2.length === 2) {
      return tail2.map(hex2).join('').toUpperCase();
    }
  }

  // 2) Fallback: últimas 4 del nombre si existe
  const n = (d.name || '').trim();
  if (n) return n.slice(-4).toUpperCase();

  // 3) Último recurso: cola del UUID
  return (d.id || '').replace(/-/g, '').slice(-5).toUpperCase();
}
export const DRScanResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();

  const [scanning, setScanning] = useState(true);
  const [startState, setStartState] = useState(0);
  const [hasDevices, setHasDevices] = useState(false);
  const [visible, setVisible] = useState(true);

  const dohideDialog = () => {
    setVisible(false);
    navigation.navigate('DR-NEWUPDATE');
  };

  useEffect(() => {
    // inicio BLE
    ble.BleStart();
    ble.bleAddListener();
    return () => {
      ble.bleRemoveListener();
    };
  }, []);

  // Máquina de estados para el escaneo inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      if (startState < 2) {
        setStartState(s => s + 1);
      } else {
        setScanning(false);

        // ¿hay algún DOSIMAC?
        const found = ble.devices.some(isDosimac);
        setHasDevices(found);

        // (opcional) logs de depuración
        ble.devices.forEach((d, i) => {
          console.log(`-----: ${i + 1}`);
          console.log('ID:', d.id, 'NAME:', d.name ?? 'null');
          console.log('advBytes length:', Array.isArray((d as any).advBytes) ? (d as any).advBytes.length : 0);
        });
        console.log('Total devices:', ble.devices.length);
      }
    }, startBleStateMachine());
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startState]);

  const startBleStateMachine = (): number => {
    switch (startState) {
      case 0:
        return 500;
      case 1:
        ble.startScanning();
        return 3000;
      case 2:
        ble.stopScanning();
        return 100;
      default:
        return 0;
    }
  };

  const RenderIsScanning = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <View>
        <Text style={{ fontFamily: 'Roboto-Light', fontSize: 20 }}>
          {t('common:SearchingDevices') ?? 'Buscando equipos...'}
        </Text>
      </View>
    </View>
  );

  const RenderDevicesNotFound = () => (
    <View style={{ alignItems: 'center', marginVertical: 60 }}>
      <Portal>
        <Dialog visible={visible} onDismiss={dohideDialog}>
          <Dialog.Icon icon="warning" color="red" size={60} />
          <Dialog.Title style={{ color: 'red' }}>{t('common:Aviso') ?? 'Aviso'}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">{t('common:No_hay_dispositivos') ?? 'No hay dispositivos'}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dohideDialog}>{t('common:Aceptar') ?? 'Aceptar'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );

  const renderDevice = (device: BlePeripheral) => {
    const label = getDeviceLabel(device);
    return (
      <View key={device.id} style={{ marginTop: 15 }}>
        <MainButton
          onPress={() =>
            navigation.navigate('DR-SETUP', {
              id: device.id,
              operacion: route?.params?.operacion,
            })
          }
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
        <Appbar.Content title={t('common:DosimacList') ?? 'Lista DOSIMAC'} />
      </Appbar.Header>

      {scanning && <RenderIsScanning />}

      {!scanning &&
        (hasDevices ? (
          <View style={{ marginTop: 60, marginHorizontal: 40 }}>
            {ble.devices.filter(isDosimac).map(renderDevice)}
          </View>
        ) : (
          <RenderDevicesNotFound />
        ))}
    </View>
  );
};

export default DRScanResultsScreen;
