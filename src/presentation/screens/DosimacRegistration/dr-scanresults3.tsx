import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Appbar, Text, Button, Portal, Dialog } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as ble from '../../../device/ble/bleLibrary';
import { BlePeripheral } from '../../../device/ble/bleLibrary';
import { SevenSegButton } from '../../components/shared/SevenSeg';

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
  if (op === 4) return ['DOSIMAC_W', 'DOSIMAC-W'];

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

  // 1) Nombre/localName
  const n = (d.name || '').toUpperCase();

  if (n) {
    if (needles.some(x => n.includes(x))) return true;

    if (needles.length === 1 && needles[0] === 'DOSIMAC' && n.includes('DOSIMAC')) {
      return true;
    }
  }

  // 2) Advertising bytes
  const bytes = getAdvBytes(d);

  if (bytes) {
    const s = bytesToAscii(bytes).toUpperCase();

    if (needles.some(x => s.includes(x.toUpperCase()))) return true;

    if (needles.length === 1 && needles[0] === 'DOSIMAC') {
      const DOSIMAC_ASCII = ASCII('DOSIMAC');

      if (includesSubsequence(bytes, DOSIMAC_ASCII)) {
        return true;
      }
    }
  }

  return false;
}

/* ==========================================
   Etiqueta de botón
   ========================================== */
function isPrintableAscii(b: number) {
  const x = b & 0xff;
  return x >= 0x20 && x <= 0x7e;
}

function hex2(b: number) {
  return (b & 0xff).toString(16).padStart(2, '0');
}

function getDeviceLabel(d: BlePeripheral): string {
  const adv = getAdvBytes(d);

  if (adv && adv.length >= 4) {
    const tail4 = adv.slice(-4);

    if (tail4.every(isPrintableAscii)) {
      return tail4.map(b => String.fromCharCode(b)).join('');
    }

    const tail2 = adv.slice(-2);

    if (tail2.length === 2) {
      return tail2.map(hex2).join('');
    }
  }

  const n = (d.name || '').trim();

  if (n) return n.slice(-4);

  return (d.id || '').replace(/-/g, '').slice(-5);
}

export const DRScanResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();

  const [scanning, setScanning] = useState(true);
  const [hasDevices, setHasDevices] = useState(false);
  const [visible, setVisible] = useState(true);

  const operacion = route?.params?.operacion;

  const dohideDialog = () => {
    setVisible(false);
    navigation.navigate('DR-NEWUPDATE');
  };

  useEffect(() => {
    let pantallaActiva = true;
    let escaneoFinalizado = false;

    let intervaloEscaneo: ReturnType<typeof setInterval> | null = null;
    let timeoutEscaneo: ReturnType<typeof setTimeout> | null = null;

    const finalizarEscaneo = async () => {
      if (escaneoFinalizado) return;

      escaneoFinalizado = true;

      if (intervaloEscaneo) {
        clearInterval(intervaloEscaneo);
        intervaloEscaneo = null;
      }

      if (timeoutEscaneo) {
        clearTimeout(timeoutEscaneo);
        timeoutEscaneo = null;
      }

      try {
        await ble.stopScanning();
      } catch (error) {
        console.log('Error parando escaneo:', error);
      }

      const dispositivosDosimac = ble.devices.filter(d =>
        isOursIOS(d, operacion)
      );

      dispositivosDosimac.forEach((d, i) => {
        const adv = getAdvBytes(d);

        console.log(`DOSIMAC encontrado ${i + 1}`);
        console.log('ID:', d.id, 'NAME:', d.name ?? 'null');
        console.log('advBytes length:', Array.isArray(adv) ? adv.length : 0);
      });

      console.log('Total devices BLE:', ble.devices.length);
      console.log('Total DOSIMAC filtrados:', dispositivosDosimac.length);

      if (!pantallaActiva) return;

      setHasDevices(dispositivosDosimac.length > 0);
      setScanning(false);
    };

    const iniciarEscaneo = async () => {
      try {
        setScanning(true);
        setHasDevices(false);
        setVisible(true);

        // Limpia escaneos/conexiones anteriores
        await ble.resetBleSession();

        // Arranca BLE y listener de discovery
        ble.BleStart();
        ble.bleAddListener();

        // Empieza a escanear
        await ble.startScanning();

        // Cada 400ms miramos si ya apareció un DOSIMAC válido.
        // Si aparece, paramos antes para no esperar siempre todo el tiempo.
        intervaloEscaneo = setInterval(() => {
          const found = ble.devices.some(d =>
            isOursIOS(d, operacion)
          );

          if (found) {
            finalizarEscaneo();
          }
        }, 400);

        // Máximo tiempo de espera.
        timeoutEscaneo = setTimeout(() => {
          finalizarEscaneo();
        }, 6000);

      } catch (error) {
        console.log('Error iniciando escaneo:', error);

        if (!pantallaActiva) return;

        setHasDevices(false);
        setScanning(false);
      }
    };

    iniciarEscaneo();

    return () => {
      pantallaActiva = false;
      escaneoFinalizado = true;

      if (intervaloEscaneo) {
        clearInterval(intervaloEscaneo);
      }

      if (timeoutEscaneo) {
        clearTimeout(timeoutEscaneo);
      }

      try {
        ble.stopScanning();
      } catch { }

      ble.bleRemoveListener();
    };
  }, [operacion]);

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

          <Dialog.Title style={{ color: 'red' }}>
            {t('common:Aviso') ?? 'Aviso'}
          </Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyLarge">
              {t('common:No_hay_dispositivos') ?? 'No hay dispositivos'}
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={dohideDialog}>
              {t('common:Aceptar') ?? 'Aceptar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );

  const irASetup = async (device: BlePeripheral) => {
    try {
      await ble.stopScanning();
      ble.bleRemoveListener();
    } catch (error) {
      console.log('Error limpiando antes de ir a DR-SETUP:', error);
    }

    navigation.navigate('DR-SETUP', {
      id: device.id,
      operacion,
    });
  };

  const renderDevice = (device: BlePeripheral) => {
    if (!isOursIOS(device, operacion)) return null;

    const label = getDeviceLabel(device);

    return (
      <View key={device.id} style={{ marginTop: 15 }}>
        <SevenSegButton
          text={label}
          onPress={() => irASetup(device)}
          size={28}
          thickness={6}
          letterSpacing={18}
          containerPadding={14}
          borderRadius={22}
          backgroundColor="#006d75"
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