import { Buffer } from 'buffer';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { Parser } from '../../libraries/comunications/cti-parser';
import { pcomProccessResponse, pcomResponseClassifier } from '../../libraries/comunications/dosimacBleMessages';
import { Platform } from 'react-native';



const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);



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

// let selectedDevice:Peripheral | null;
let selectedDevice: any | null;

const buffer = Buffer.from([66])  //Esto es una B
let contador: number = 0;

//const parser=new Parser();


//!Implementations

// utils BLE (misma librería donde tienes BleStart/scan/handleDiscoverPeripheral)


function extractAdvBytesIOS(adv: any): number[] | null {
  if (!adv) return null;

  // 1) iOS: kCBAdvDataManufacturerData suele venir en base64 (string)
  if (typeof adv.kCBAdvDataManufacturerData === 'string') {
    try {
      return Array.from(Buffer.from(adv.kCBAdvDataManufacturerData, 'base64'));
    } catch {}
  }

  // 2) manufacturerData como objeto (a veces librerías lo exponen así)
  if (adv.manufacturerData && typeof adv.manufacturerData === 'object') {
    for (const k of Object.keys(adv.manufacturerData)) {
      const v = adv.manufacturerData[k];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try { return Array.from(Buffer.from(v, 'base64')); } catch {}
      }
    }
  }

  // 3) ServiceData como posible alternativa
  if (adv.kCBAdvDataServiceData && typeof adv.kCBAdvDataServiceData === 'object') {
    for (const k of Object.keys(adv.kCBAdvDataServiceData)) {
      const v = adv.kCBAdvDataServiceData[k];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try { return Array.from(Buffer.from(v, 'base64')); } catch {}
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


export const BleStart = () => {
  console.log("BleStart called");
  clearDevices();
  BleManager.start({ showAlert: false });
}

export const bleAddListener = () => {
  bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
}

export const bleRemoveListener = () => {
  bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
}

export const startScanning = () => {
  clearDevices();
  console.log('Start Scanning...');
  BleManager.scan([], 3, false, { matchMode: 2 }).then(() => {
    console.log('Scanning...');
  });
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
    try { advBytes = Array.from(Buffer.from(adv.kCBAdvDataManufacturerData, 'base64')); } catch {}
  }
  if (!advBytes && adv?.manufacturerData && typeof adv.manufacturerData === 'object') {
    const k = Object.keys(adv.manufacturerData)[0];
    const v = k ? adv.manufacturerData[k] : undefined;
    if (Array.isArray(v)) advBytes = v;
    else if (typeof v === 'string') {
      try { advBytes = Array.from(Buffer.from(v, 'base64')); } catch {}
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


export const stopScanning = () => {
  console.log("Trying to stopped scanning...");
  BleManager.stopScan().then(() => {
    console.log("Scan stopped");
  });
};

const clearDevices = () => {
  devices = [];
  selectedDevice = null;
};




export const bleConnection = (id: string) => {
  if (id.length > 0) {
    BleManager.connect(id)
      .then(() => {
        console.log('Connected to ' + id);
        selectedDevice = id;
        return BleManager.retrieveServices(id);
      })
      .then((peripheralInfo) => {
        console.log(peripheralInfo);
      })
      .catch((error) => {
        console.log('Connection error ....', error);
      });
  }
  else {
    console.log('BLEConnection: No device selected');
  }


}

export const blehandleMTU = () => {
  if (selectedDevice) {
    BleManager.requestMTU(selectedDevice, 512)
      .then((mtu) => {
        // Success code
        console.log("MTU size changed to " + mtu + " bytes");
      })
      .catch((error) => {
        // Failure code
        console.log(error);
      });
  }
}

//*Con esta funcion envio la informacón al dosimac
export const bleDosimacWrite = (request: Buffer) => {
  if (selectedDevice) {
    BleManager.writeWithoutResponse(
      selectedDevice,
      "AFF2",
      "CFF1",
      // encode & extract raw `number[]`.
      // Each number should be in the 0-255 range as it is converted from a valid byte.
      request.toJSON().data,
      512
    )
      .then(() => {
        // Success code
        console.log("** Write Success**: ");

      })
      .catch((error) => {
        // Failure code
        console.log("Write Error... ");
        console.log(error);
        console.log(buffer.toJSON().data)

      });
  }
  else {
    console.log('bleDosimacWrite: No device selected');
  }


};

export const bleDisconnection = (id: string) => {
  if (id.length > 0) {
    BleManager.disconnect(id)
      .then(() => {
        console.log('Disconected ' + id);
        selectedDevice = null;
      })
      .catch((error) => {
        console.log('Disconnection error ....', error);

      })
  }
  else {
    console.log('bleDisconnection: No device selected');
  }


};



//Me suscribo a la notificicaicones para obtener respuesta de equipo
export const bleSubscribeNotify = () => {
  if (selectedDevice) {

    connectAndPrepare(
      selectedDevice,
      "AFF2",
      "CFF5"
    );
  }
}


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










