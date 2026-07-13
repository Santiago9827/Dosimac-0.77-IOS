import { Buffer } from 'buffer';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Parser } from '../../libraries/comunications/cti-parser';
import { pcomProccessResponse, pcomResponseClassifier } from '../../libraries/comunications/dosimacBleMessages';
import { Platform } from 'react-native';


const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);
let selectedDevice: string | null = null;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function writeChunkedIOS(
  peripheralId: string,
  serviceUUID: string,
  characteristicUUID: string,
  bytes: number[],
  chunkSize = 20,
  interChunkDelayMs = 10   // <- pausa
) {
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    await BleManager.write(peripheralId, serviceUUID, characteristicUUID, chunk);
    await sleep(interChunkDelayMs); // <- DA AIRE AL DISPOSITIVO
  }
}
export const setSelectedDeviceId = (id: string) => { selectedDevice = id; };

//!Vars definitions
export interface BlePeripheral {
  id: string;
  name: string | null;
  advertising?: string | null;
  peripheral: any;
  advBytes?: number[];
}

export let devices: BlePeripheral[];
export let conectedDevices: BlePeripheral[];
let notifsReady = false;
let notifyListenerSubscription: any = null;
let notifyListenerAttached = false;

let writeServiceUUIDIOS: string | null = null;
let writeCharUUIDIOS: string | null = null;


// let selectedDevice:Peripheral | null;

const buffer = Buffer.from([66])  //Esto es una B
let contador: number = 0;
type ConnCb = (id: string) => void;
type DiscCb = (id: string, error?: any) => void;

//const parser=new Parser();


//!Implementations

// utils BLE (misma librería donde tienes BleStart/scan/handleDiscoverPeripheral)


function extractAdvBytesIOS(adv: any): number[] | null {
  if (!adv) return null;

  // 1) iOS: kCBAdvDataManufacturerData suele venir en base64 (string)
  if (typeof adv.kCBAdvDataManufacturerData === 'string') {
    try {
      return Array.from(Buffer.from(adv.kCBAdvDataManufacturerData, 'base64'));
    } catch { }
  }

  // 2) manufacturerData como objeto (a veces librerías lo exponen así)
  if (adv.manufacturerData && typeof adv.manufacturerData === 'object') {
    for (const k of Object.keys(adv.manufacturerData)) {
      const v = adv.manufacturerData[k];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try { return Array.from(Buffer.from(v, 'base64')); } catch { }
      }
    }
  }

  // 3) ServiceData como posible alternativa
  if (adv.kCBAdvDataServiceData && typeof adv.kCBAdvDataServiceData === 'object') {
    for (const k of Object.keys(adv.kCBAdvDataServiceData)) {
      const v = adv.kCBAdvDataServiceData[k];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try { return Array.from(Buffer.from(v, 'base64')); } catch { }
      }
    }
  }

  if (adv.serviceData && typeof adv.serviceData === 'object') {
    for (const k of Object.keys(adv.serviceData)) {
      const v = adv.serviceData[k];
      if (Array.isArray(v)) return v;
      if (v?.bytes && Array.isArray(v.bytes)) return v.bytes;
    }
  }

  return null;
}


let bleStarted = false;

export const BleStart = async () => {
  if (bleStarted) return;            // ✅ evita reiniciar BLE
  bleStarted = true;

  console.log("BleStart called (once)");

  // ✅ NO limpies selectedDevice aquí
  // clearDevices();  ❌ quítalo de aquí

  await BleManager.start({ showAlert: false });
};

let discoverListenerSubscription: any = null;

export const bleAddListener = () => {
  if (discoverListenerSubscription) {
    console.log('Discover listener ya estaba añadido');
    return;
  }

  discoverListenerSubscription = bleManagerEmitter.addListener(
    'BleManagerDiscoverPeripheral',
    handleDiscoverPeripheral
  );
};

export const bleRemoveListener = () => {
  try {
    discoverListenerSubscription?.remove?.();
  } catch (error) {
    console.log('Error eliminando discover listener:', error);
  }

  discoverListenerSubscription = null;
};

export const startScanning = async () => {
  await BleStart();   // ✅ garantiza init 1 vez
  clearDevices();
  console.log('Start Scanning...');
  await BleManager.scan([], 5, false, { matchMode: 2 });
};

const handleDiscoverPeripheral = (p: any) => {
  const adv: any = p?.advertising || {};
  // iOS: nombre “completo” suele venir aquí
  const localName =
    adv?.kCBAdvDataLocalName ??
    adv?.kCBAdvDataCompleteLocalName ??
    adv?.localName ??
    p?.name ??
    null;

  // Extraer bytes de advertising:
  let advBytes: number[] | undefined;
  // iOS
  if (typeof adv?.kCBAdvDataManufacturerData === 'string') {
    try { advBytes = Array.from(Buffer.from(adv.kCBAdvDataManufacturerData, 'base64')); } catch { }
  }
  if (!advBytes && adv?.manufacturerData && typeof adv.manufacturerData === 'object') {
    const k = Object.keys(adv.manufacturerData)[0];
    const v = k ? adv.manufacturerData[k] : undefined;
    if (Array.isArray(v)) advBytes = v;
    else if (typeof v === 'string') {
      try { advBytes = Array.from(Buffer.from(v, 'base64')); } catch { }
    }
  }
  if (!advBytes && adv?.serviceData && typeof adv.serviceData === 'object') {
    const k = Object.keys(adv.serviceData)[0];
    const v: any = k ? adv.serviceData[k] : undefined;
    const bytes = Array.isArray(v) ? v : Array.isArray(v?.bytes) ? v.bytes : undefined;
    if (Array.isArray(bytes)) advBytes = bytes;
  }
  // Android (variantes)
  if (!advBytes) advBytes = adv?.manufacturerRawData ?? adv?.rawData?.bytes ?? undefined;

  const peritemp: BlePeripheral = {
    id: p?.id,
    name: localName,
    peripheral: p,
    advBytes,
  };

  if (!devices.some(d => d.id === peritemp.id)) {
    devices.push(peritemp);
  }
};


export const stopScanning = async () => {
  console.log("Trying to stopped scanning...");

  try {
    await BleManager.stopScan();
    console.log("Scan stopped");
  } catch (error) {
    console.log("stopScanning error:", error);
  }
};

const clearDevices = () => {
  devices = [];
  selectedDevice = null;
};




// export const bleConnection = (id: string) => {
//   if (!id) { console.log('BLEConnection: No device selected'); return; }

//   // cada intento: limpia flags
//   notifsReady = false;

//   BleManager.connect(id)
//     .then(() => {
//       console.log('Connected to ' + id);
//       selectedDevice = id;
//       return BleManager.retrieveServices(id);
//     })
//     .then((peripheralInfo) => {
//       console.log(peripheralInfo);
//       // Opcional: aquí podrías llamar bleSubscribeNotify() si tu FSM lo permite
//     })
//     .catch((error) => {
//       console.log('Connection error ....', error);
//     });
// }
// bleLibrary.ts
export const bleConnection = async (id: string) => {
  if (!id) throw new Error('BLEConnection: No device selected');

  notifsReady = false;

  try {
    // iOS: parar escaneo antes de conectar
    try { await BleManager.stopScan(); } catch { }

    await BleManager.connect(id);
    console.log('Connected to ' + id);

    selectedDevice = id;

    const info = await BleManager.retrieveServices(id);
    console.log('Services retrieved', info);

    return info;
  } catch (error) {
    console.log('Connection error ....', error);
    selectedDevice = null;
    throw error;
  }
};
export const blehandleMTU = async () => {
  if (!selectedDevice) return;
  try {
    if (Platform.OS === 'android') {
      const mtu = await BleManager.requestMTU(selectedDevice, 512);
      console.log('MTU size changed to ' + mtu + ' bytes');
    } else {
      // iOS: no hace nada
      console.log('iOS: requestMTU not supported, skipping');
    }
  } catch (e) {
    console.log('requestMTU error (expected on iOS):', e);
  }
};

//*Con esta funcion envio la informacón al dosimac
export const bleDosimacWrite = async (request: Buffer) => {
  if (!selectedDevice) { console.log('bleDosimacWrite: No device selected'); return; }
  if (!writeSvcUUID || !writeCharUUID) { console.log('bleDosimacWrite: write UUIDs no listos'); return; }

  const data = request.toJSON().data;
  try {
    if (Platform.OS === 'ios') {
      await writeChunkedIOS(selectedDevice, writeSvcUUID, writeCharUUID, data, 20, 10);
    } else {
      await BleManager.writeWithoutResponse(selectedDevice, writeSvcUUID, writeCharUUID, data, 512);
    }
    console.log('** Write Success **');
  } catch (e) {
    console.log('Write Error...', e);
  }
};


export const bleDisconnection = async (id: string) => {
  if (!id) {
    console.log('bleDisconnection: No device selected');
    return;
  }

  try {
    if (selectedDevice && notifySvcUUID && notifyCharUUID) {
      try {
        await BleManager.stopNotification(selectedDevice, notifySvcUUID, notifyCharUUID);
        console.log('Characteristic stopped notifying');
      } catch (error) {
        console.log('stopNotification error:', error);
      }
    }

    try {
      notifyListenerSubscription?.remove?.();
    } catch (error) {
      console.log('remove notify listener error:', error);
    }

    notifyListenerSubscription = null;
    notifyListenerAttached = false;
    notifsReady = false;

    const isConnected = await BleManager.isPeripheralConnected(id, []);

    if (isConnected) {
      console.log('Disconnecting from peripheral with UUID:', id);
      await BleManager.disconnect(id);
      console.log('Disconected ' + id);
    }

    selectedDevice = null;
    writeSvcUUID = null;
    writeCharUUID = null;
    notifySvcUUID = null;
    notifyCharUUID = null;

  } catch (error) {
    console.log('Disconnection error ....', error);
  }
};

export const resetBleSession = async () => {
  console.log('resetBleSession...');

  try {
    await stopScanning();
  } catch (error) {
    console.log('resetBleSession stopScanning error:', error);
  }

  try {
    if (selectedDevice) {
      await bleDisconnection(selectedDevice);
    }
  } catch (error) {
    console.log('resetBleSession disconnect error:', error);
  }

  try {
    notifyListenerSubscription?.remove?.();
  } catch (error) {
    console.log('resetBleSession remove notify listener error:', error);
  }

  notifyListenerSubscription = null;
  notifyListenerAttached = false;
  notifsReady = false;

  devices = [];
  selectedDevice = null;
  writeSvcUUID = null;
  writeCharUUID = null;
  notifySvcUUID = null;
  notifyCharUUID = null;
};


//Me suscribo a la notificicaicones para obtener respuesta de equipo
let writeCharUUID: string | null = null;
let writeSvcUUID: string | null = null;
let notifyCharUUID: string | null = null;
let notifySvcUUID: string | null = null;

export const bleSubscribeNotify = async () => {
  if (!selectedDevice) return;

  try {
    const info = await BleManager.retrieveServices(selectedDevice);
    const chars = info?.characteristics || [];

    // localizar CFF1 (write) y CFF5 (notify) del servicio AFF2, case-insensitive
    const cff1 = chars.find(c =>
      String(c.service).toLowerCase() === 'aff2' &&
      String(c.characteristic).toLowerCase() === 'cff1'
    );
    const cff5 = chars.find(c =>
      String(c.service).toLowerCase() === 'aff2' &&
      String(c.characteristic).toLowerCase() === 'cff5'
    );

    if (!cff1 || !cff5) {
      console.log('[bleSubscribeNotify] No se encontraron CFF1/CFF5 en AFF2. Dump:', chars);
      notifsReady = false;
      return;
    }

    // guardar para writes
    writeSvcUUID = cff1.service;
    writeCharUUID = cff1.characteristic;

    // listener (una vez)
   if (!notifyListenerAttached) {
  notifyListenerSubscription = bleManagerEmitter.addListener(
    'BleManagerDidUpdateValueForCharacteristic',
    ({ value, characteristic, service }) => {
      const buff = Buffer.from(value);
      pcomProccessResponse(buff, buff.length);
    }
  );

  notifyListenerAttached = true;
}
    // activar notificación en CFF5 (NO en CFF1)
    notifySvcUUID = cff5.service;
    notifyCharUUID = cff5.characteristic;

    await BleManager.startNotification(selectedDevice, notifySvcUUID, notifyCharUUID);
    notifsReady = true;
    console.log('[bleSubscribeNotify] startNotification OK → notifsReady=true', notifySvcUUID, notifyCharUUID);
  } catch (e) {
    notifsReady = false;
    console.log('[bleSubscribeNotify] startNotification ERROR → notifsReady=false', e);
  }
};



export const canWrite = () => Boolean(selectedDevice && notifsReady);


export const addConnectionListeners = (onConnect: ConnCb, onDisconnect: DiscCb) => {
  const subConn = bleManagerEmitter.addListener(
    'BleManagerConnectPeripheral',
    ({ peripheral }) => onConnect?.(peripheral)
  );
  const subDisc = bleManagerEmitter.addListener(
    'BleManagerDisconnectPeripheral',
    ({ peripheral, error }) => onDisconnect?.(peripheral, error)
  );
  return () => { try { subConn.remove(); } catch { } try { subDisc.remove(); } catch { }; };
};

export const addBtStateListener = (onState: (state: string) => void) => {
  const sub = bleManagerEmitter.addListener('BleManagerDidUpdateState', ({ state }) => onState?.(state));
  return () => { try { sub.remove(); } catch { } };
};

export const bleIsConnected = async (id: string) => {
  try { return await BleManager.isPeripheralConnected(id, []); } catch { return false; }
};

export const bleSubscribeGeneric = async (
  serviceUUID: string,
  characteristicUUID: string,
  onValue: (value: number[]) => void
) => {
  if (!selectedDevice) throw new Error('No device selected');

  // listener SOLO para ese device/servicio/char
  const listener = bleManagerEmitter.addListener(
    'BleManagerDidUpdateValueForCharacteristic',
    ({ value, peripheral, characteristic, service }) => {
      const sameDev = peripheral?.toLowerCase?.() === selectedDevice?.toLowerCase?.();
      const sameSvc = service?.toLowerCase?.() === serviceUUID?.toLowerCase?.();
      const sameChr = characteristic?.toLowerCase?.() === characteristicUUID?.toLowerCase?.();
      if (sameDev && sameSvc && sameChr) {
        onValue(value as number[]);
      }
    }
  );

  // habilita notificaciones
  await BleManager.startNotification(selectedDevice, serviceUUID, characteristicUUID);

  // devuelve handle para limpiar
  return {
    remove: async () => {
      try { await BleManager.stopNotification(selectedDevice!, serviceUUID, characteristicUUID); } catch { }
      try { listener.remove(); } catch { }
    }
  };
};


async function connectAndPrepare(peripheral: any, service: string, characteristic: string) {
  // Connect to device
  await BleManager.connect(peripheral);
  // Before startNotification you need to call retrieveServices
  await BleManager.retrieveServices(peripheral);
  // To enable BleManagerDidUpdateValueForCharacteristic listener
  await BleManager.startNotification(peripheral, service, characteristic);
  // Add event listener
  bleManagerEmitter.addListener(
    "BleManagerDidUpdateValueForCharacteristic",
    ({ value, peripheral, characteristic, service }) => {


      // Convert bytes array to string
      //const data = bytesToString(value);
      // setNotifyCounter(notifyCounter + 1);
      const data = value as number[];  //! Datos recibidos
      console.log(`Received ${data} for characteristic ${characteristic}`);
      const cadena: string = String.fromCharCode.apply(null, data);

      console.log(`Datos: ${cadena}`);
      // console.log(`(${notifyCounter}) ${contador}  ----------------------------------------------------`);
      incrementNotifyCounter();

      //creo un buffer con la respuesta, lo parse y envio al clasificador del mensaje
      const buff = Buffer.from(value);
      // console.log(buff.toString());
      pcomProccessResponse(buff, buff.length);
      // parser.doParser(buff,buff.length);
      // pcomResponseClassifier();

    }
  );
  // Actions triggereng BleManagerDidUpdateValueForCharacteristic event
}

const incrementNotifyCounter = () => {
  //
  contador = contador + 1;
  // setNotifyCounter(a=>a+1);

}