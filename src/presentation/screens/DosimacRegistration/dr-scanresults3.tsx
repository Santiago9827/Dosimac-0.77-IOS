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

/* =========================
   Helpers comunes (ASCII)
   ========================= */
const ASCII = (s: string) => s.split('').map(c => c.charCodeAt(0));
const bytesToAscii = (bytes: number[]) =>
  String.fromCharCode(...bytes.map(b => b & 0xff));

function includesSubsequence(hay: number[], needle: number[]) {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if ((hay[i + j] & 0xff) !== (needle[j] & 0xff)) continue outer;
    }
    return true;
  }
  return false;
}

/* =========================================================
   Agujas según operación (1 = I, 3 = G) + fallback genérico
   ========================================================= */
function getNeedles(operacion?: number): string[] {
  const op = Number(operacion) || 0;
  if (op === 1) return ['DOSIMAC-I'];
  if (op === 3) return ['DOSIMAC-G'];
  return ['DOSIMAC'];
}

/* ==========================================
   Recuperar los advBytes guardados por BLE
   ========================================== */
function getAdvBytes(d: BlePeripheral): number[] | null {
  const adv = (d as any).advBytes;
  return Array.isArray(adv) && adv.length ? adv : null;
}

/* ======================================================
   ¿Es nuestro equipo? (iOS) — robusto para I/G y genérico
   ====================================================== */
function isOursIOS(d: BlePeripheral, operacion?: number): boolean {
  const needles = getNeedles(operacion);

  // 1) Nombre/localName (iOS suele traerlo), sin distinción de mayúsc/minúsc
  const n = (d.name || '').toUpperCase();
  if (n) {
    if (needles.some(x => n.includes(x))) return true;
    if (needles.length === 1 && needles[0] === 'DOSIMAC' && n.includes('DOSIMAC')) return true;
  }

  // 2) Manufacturer/Service data: buscar en TODO el payload (no asumir offset=2)
  const bytes = getAdvBytes(d);
  if (bytes) {
    const s = bytesToAscii(bytes).toUpperCase();
    if (needles.some(x => s.includes(x))) return true;

    // Genérico: por si el equipo emite "DOSIMAC" sin sufijo
    if (needles.length === 1 && needles[0] === 'DOSIMAC') {
      const DOSIMAC_ASCII = ASCII('DOSIMAC');
      if (includesSubsequence(bytes, DOSIMAC_ASCII)) return true;
    }
  }

  return false;
}

/* ==========================================
   Etiqueta de botón (bonita y estable)
   ========================================== */
function isPrintableAscii(b: number) {
  const x = b & 0xff;
  return x >= 0x20 && x <= 0x7e;
}
function hex2(b: number) {
  return (b & 0xff).toString(16).padStart(2, '0');
}
function getDeviceLabel(d: BlePeripheral): string {
  // Preferimos derivarla del payload de advertising (últimos 4 bytes si son ASCII)
  const adv = getAdvBytes(d);
  if (adv && adv.length >= 4) {
    const tail4 = adv.slice(-4);
    if (tail4.every(isPrintableAscii)) {
      return tail4.map(b => String.fromCharCode(b)).join('');
    }
    // Si no son ASCII, usar los últimos 2 bytes en HEX (p.ej. "BF8E")
    const tail2 = adv.slice(-2);
    if (tail2.length === 2) {
      return tail2.map(hex2).join('').toUpperCase();
    }
  }

  // Fallback: últimas 4 letras del nombre, si existe
  const n = (d.name || '').trim();
  if (n) return n.slice(-4).toUpperCase();

  // Último recurso: cola del UUID
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
    // Inicio BLE
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

        // ¿hay algún DOSIMAC del tipo solicitado?
        const found = ble.devices.some(d => isOursIOS(d, route?.params?.operacion));
        setHasDevices(found);

        // (opcional) logs de depuración
        ble.devices.forEach((d, i) => {
          const adv = getAdvBytes(d);
          console.log(`-----: ${i + 1}`);
          console.log('ID:', d.id, 'NAME:', d.name ?? 'null');
          console.log('advBytes length:', Array.isArray(adv) ? adv.length : 0);
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
        // En iOS es útil ampliar a 5–6s si los anuncios son lentos
        ble.startScanning(); // tu bleLibrary puede ajustar la duración si lo deseas
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
    if (!isOursIOS(device, route?.params?.operacion)) return null;
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
            {ble.devices.map(renderDevice)}
          </View>
        ) : (
          <RenderDevicesNotFound />
        ))}
    </View>
  );
};

export default DRScanResultsScreen;
