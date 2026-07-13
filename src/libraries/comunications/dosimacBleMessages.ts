import { Buffer } from "buffer";
import { bleConnection, bleDisconnection, bleDosimacWrite, bleSubscribeNotify, blehandleMTU, canWrite } from "../../device/ble/bleLibrary";
import { Parser } from "./cti-parser";
import { DosimacInfo, DosimacSetup } from '../../sharedTypes/dosimacSetup';
import { useState } from "react";
import { stmStore } from "../../stores/store";

//DEFINICION DE TIPOS ********************************************************************

type iFrameMsg = {
   data: Buffer,
   length: number
}

type STMinfo = {
   state: number,
   responseRecieved: number,
   waitRetries: number,
   stateRetries: number
   error: number;
}

export type MasterState = {
   actualJob: number,
   timerId: NodeJS.Timeout,
   isInitialized: boolean,
   bleDevice: string;
   dInfoComState: number;
   dInfomanState: number;
   forceStop: boolean;
   unControlError: boolean;
}

//DEFINICION DE VARIABLES ****************************************************************     
const parser = new Parser();

export let dosimacInfo: DosimacInfo = {
   deviceIp: "",
   gateWay: "",
   subnetMask: "",
   connectionState: 0,
   deviceState: 0,
   idAnimal: 0,
   crotal: 0,
   swVersion: 0,
   hwVersion: 0,
   ssid: "",
   wifiPassword: "",
   serverIp: "",
   deviceType: 0,
   phase: 0,
   deviceNumber: 0,
   nfcTag: "",
   corral: 0
};

export let dosimacSetup: DosimacSetup = {
   ssid: "",
   wifiPassword: "",
   serverIp: "",
   deviceType: 0,
   phase: 0,
   deviceNumber: 0,
   nfcTag: "",
   corral: 0
   // (corral32 lo tratamos como opcional para no tocar el type compartido)
};

let requestState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };
let setupState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };
let inicialState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };

let masterState: MasterState = { actualJob: 0, timerId: undefined, isInitialized: false, bleDevice: "", dInfoComState: -1, dInfomanState: 0, forceStop: false, unControlError: false };

// Inicio del envio de informacion
export const pcomSendB = () => {
   console.log("****************ENVIO DE LA B ********************************");
   const data = Buffer.from([66]);
   bleDosimacWrite(data);
}

// Dosimac request configuration information
export const pcomRequestDosimacStatus = () => {
   let payLoad: Buffer;
   let buff1: iFrameMsg;
   console.log("Call to tmsgRequestDosimacStatus*****")

   payLoad = payLoadRequestDosimacStatus()

   console.log("Payload: ", payLoad);
   console.log("Payload length: ", payLoad.length);

   buff1 = parser.responseContructor(0x1C, 0x02, payLoad, payLoad.length, false);

   console.log("buff1: " + buff1.data.toString('hex'));
   console.log("buff1 length: ", buff1.data.length)

   bleDosimacWrite(buff1.data);
}

const payLoadRequestDosimacStatus = (): Buffer => {
   const payLoad = Buffer.alloc(4);
   payLoad.writeUInt16LE(1, 0) //Version
   payLoad.writeUInt16LE(3, 2) //Tipo de informacion=> Peticion de estado
   return payLoad;
}

// SETUP CONFIGURATION:----------------------------------------------------------------

export const pcomDosimacSetup = () => {
   let payLoad: Buffer;
   let buff1: iFrameMsg;
   console.log("Call to tmsgDosimacSetup*****")

   payLoad = payloadSetup()

   console.log("Payload setup: ", payLoad);
   console.log("Payload setup length: ", payLoad.length);

   buff1 = parser.responseContructor(0x1C, 0x02, payLoad, payLoad.length, false);

   console.log("buff1 setup: " + buff1.data.toString('hex'));
   console.log("buff1 setup length: ", buff1.data.length)

   bleDosimacWrite(buff1.data);
}

//! -----versión inicial sin corral32 ------------------

// const payloadSetup = (): Buffer => {
//    console.log("Inside payloadSetup");
//    const payLoad = Buffer.alloc(148);

//    payLoad.writeUInt16LE(1, 0) //Version
//    payLoad.writeUInt16LE(1, 2) //Tipo de informacion=> Setup configuration

//    payLoad.write(dosimacSetup.ssid, 4, 32, 'utf16le') //ssid unicode 64bytes //
//    payLoad.write(dosimacSetup.wifiPassword, 68, 32, 'ascii') //password wifi 32bytes//
//    payLoad.write(dosimacSetup.serverIp, 100, 32, 'ascii') //ip servidor 32bytes //

//    payLoad.writeUInt16LE(dosimacSetup.deviceType, 132) //Tipo de equipo  2 byte //
//    payLoad.writeUInt8(dosimacSetup.phase, 134) //Fase 1 byte //
//    payLoad.writeUInt8(dosimacSetup.deviceNumber, 135) //Numero de maquina 1 byte //

//    // === NUEVO: decidir si enviamos corral en 32-bit o 16-bit según versión ===
//    const isI = dosimacSetup.deviceType === 200;
//    const isG = dosimacSetup.deviceType === 203;
//    const sw = dosimacInfo.swVersion || 0;
//    const allowUint32 = (isI && sw >= 155) || (isG && sw >= 134);

//    const corral32 = (dosimacSetup as any).corral32 ?? 0;

//    console.log(
//   `[DOSIMAC][SETUP] ${new Date().toISOString()} ` +
//   `build payload: sw=${sw}, deviceType=${dosimacSetup.deviceType}, allowUint32=${allowUint32}, ` +
//   `corral16=${dosimacSetup.corral}, corral32=${corral32}`
// );

//    // Usamos bytes 136..139 para corral32 (LE). Si no aplica, enviamos 0.
//    if (allowUint32 && corral32 > 0) {
//       payLoad.writeUInt32LE(corral32, 136);
//    } else {
//       payLoad.writeUInt32LE(0, 136);
//    }

//    // Campo legado corral16 en 144..145. Si usamos 32-bit, aquí debe ir 0.
//    payLoad.writeUInt16LE(allowUint32 ? 0 : dosimacSetup.corral, 144);

//    // Reserva
//    payLoad.writeUInt16LE(9, 146) //reserva 2 bytes

//    console.log("End payloadSetup");
//    return payLoad;
// }

// -----versión con corral32 ------------------

const payloadSetup = (): Buffer => {
   console.log("Inside payloadSetup");

   const isI = dosimacSetup.deviceType === 200;
   const isG = dosimacSetup.deviceType === 203;
   const sw = dosimacInfo.swVersion || 0;
   const allowUint32 = (isI && sw >= 155) || (isG && sw >= 134);

   const baseLen = 148;                 // payload clásico
   const extraLen = allowUint32 ? 4 : 0;// +4 si enviamos corral32
   const payLoad = Buffer.alloc(baseLen + extraLen);

   // Cabecera
   payLoad.writeUInt16LE(1, 0);  // Version
   payLoad.writeUInt16LE(1, 2);  // Setup configuration

   // Cadenas
   payLoad.write(dosimacSetup.ssid, 4, 32, 'utf16le'); // 4..67
   payLoad.write(dosimacSetup.wifiPassword, 68, 32, 'ascii');   // 68..99
   payLoad.write(dosimacSetup.serverIp, 100, 32, 'ascii');   // 100..131

   // Campos fijos
   payLoad.writeUInt16LE(dosimacSetup.deviceType, 132);
   payLoad.writeUInt8(dosimacSetup.phase, 134);
   payLoad.writeUInt8(dosimacSetup.deviceNumber, 135);

   // 136..143 = NFC (no tocar: queda a 0s si no se usa)

   // Corral 16-bit legado (144..145). Si usamos 32-bit, va 0.
   payLoad.writeUInt16LE(allowUint32 ? 0 : dosimacSetup.corral, 144);

   // Reserva (146..147)
   payLoad.writeUInt16LE(9, 146);

   // Corral 32-bit al FINAL (148..151) solo si procede
   if (allowUint32) {
      const c32 = (dosimacSetup as any).corral32 ?? 0;
      payLoad.writeUInt32LE(c32, 148);
   }

   console.log(
      `[DOSIMAC][SETUP] ${new Date().toISOString()} ` +
      `build payload: len=${payLoad.length}, sw=${sw}, type=${dosimacSetup.deviceType}, ` +
      `allowUint32=${allowUint32}, corral16=${allowUint32 ? 0 : dosimacSetup.corral}, ` +
      `corral32=${(dosimacSetup as any).corral32 ?? 0}`
   );

   console.log("End payloadSetup");
   return payLoad;
};


export const pcomProccessResponse = (response: Buffer, length: number) => {
   parser.doParser(response, length);
   pcomResponseClassifier();
}

export const pcomResponseClassifier = () => {
   console.log("******* RESPUESTA DOSIMAC BLE ******");

   if (parser.frameType === 28) {
      if (!parser.crcOk) {
         console.log("****--- CRC ERRONEO ---***");
      }

      switch (parser.msgType) {
         case 0x01:
            console.log("--- El movil puede enviar datos al dispositivo ---")

            if (masterState.actualJob === 1) {
               requestState.responseRecieved = 1;
            }

            if (masterState.actualJob === 2) {
               setupState.responseRecieved = 1;
            }

            break;
         case 0x02:
            console.log("--- Recibida trama de configuración ---")
            break;
         case 0x03:
            console.log("--- Procesamos Trama peticion estado ---")
            pcomresponseStatus();
            break;
         case 0x04:
            console.log("--- Recibida trama de peticion de estado ---")
            break;
      }
   }
   else {
      console.log("Error en el tipo de trama. Trama no esperada ", parser.frameType);
   }
}

const pcomresponseStatus = () => {
   const tipoRespuesta = parser.payLoad.readUInt16LE(2);

   console.log("(pcomresponseStatus): " + tipoRespuesta);

   if (tipoRespuesta === 2) {
      console.log("ES UNA TRAMA DE RESPUESTA SETUP ACK: " + tipoRespuesta);

      if (masterState.actualJob === 2) {
         setupState.responseRecieved = 2;
      }

      return;
   }

   if (tipoRespuesta === 4) {
      if (masterState.actualJob === 1) {
         requestState.responseRecieved = 4;
      }
   }

   dosimacInfo.deviceIp = parser.payLoad.toString('ascii', 132, 164);
   dosimacInfo.ssid = parser.payLoad.toString("utf16le", 4, 68);
   dosimacInfo.wifiPassword = parser.payLoad.toString('ascii', 68, 100);
   dosimacInfo.serverIp = parser.payLoad.toString('ascii', 100, 132);
   dosimacInfo.deviceIp = parser.payLoad.toString('ascii', 132, 164);
   dosimacInfo.gateWay = parser.payLoad.toString('ascii', 164, 196);
   dosimacInfo.subnetMask = parser.payLoad.toString('ascii', 196, 228);
   dosimacInfo.deviceType = parser.payLoad.readUint16LE(228);
   dosimacInfo.phase = parser.payLoad.readUint8(230);
   dosimacInfo.deviceNumber = parser.payLoad.readUint8(231);
   dosimacInfo.nfcTag = parser.payLoad.toString('hex', 232, 240);
   dosimacInfo.corral = parser.payLoad.readUint16LE(240);
   dosimacInfo.connectionState = parser.payLoad.readUint8(242)
   dosimacInfo.deviceState = parser.payLoad.readUint8(243)
   dosimacInfo.idAnimal = parser.payLoad.readUint32LE(244)
   dosimacInfo.crotal = parseInt(parser.payLoad.toString('hex', 248, 256));
   dosimacInfo.swVersion = parser.payLoad.readUint16LE(256)
   dosimacInfo.hwVersion = parser.payLoad.readUint16LE(258)

   const corral16 = parser.payLoad.readUInt16LE(240);   // 16-bit legado
   const corral32 = parser.payLoad.readUInt32LE(136);   // 32-bit nuevo

   // Reglas por versión/tipo
   const isI = dosimacInfo.deviceType === 200;
   const isG = dosimacInfo.deviceType === 203;
   const allowUint32 = (isI && dosimacInfo.swVersion >= 155) || (isG && dosimacInfo.swVersion >= 134);

   // Selecciona el “corral efectivo” para mostrar/usar en la app
   const corralEfectivo = allowUint32 ? (corral16 === 0 ? corral32 : corral16) : corral16;
   // ⬇️ log siempre visible con marca de tiempo y tipo de equipo
   console.log(
      `[DOSIMAC][STATUS] v=${dosimacInfo.swVersion} type=${dosimacInfo.deviceType} ` +
      `allow32=${allowUint32} corral16=${corral16} corral32=${corral32} => efectivo=${corralEfectivo}`
   );
   console.log(
      `[DOSIMAC][STATUS] ${new Date().toISOString()} ` +
      `swVersion=${dosimacInfo.swVersion} hwVersion=${dosimacInfo.hwVersion} ` +
      `deviceType=${dosimacInfo.deviceType}`
   );

   masterState.dInfoComState = dosimacInfo.connectionState;
   masterState.dInfomanState = dosimacInfo.deviceState;

   if (process.env.BUILD_MODE === 'DEBUG') {
      console.log(parser.payLoad.toString('hex', 0, parser.payLoadSize));
      console.log("Version: ", parser.payLoad.readUint16LE(0).toString(16))
      console.log("Tipo Informacion: ", parser.payLoad.readUInt16LE(2).toString(16))
      console.log("SSID: ", dosimacInfo.ssid)
      console.log("WIFI PSW: ", dosimacInfo.wifiPassword)
      console.log("IP servidor: ", dosimacInfo.serverIp)
      console.log("IP equipo: ", dosimacInfo.deviceIp)
      console.log("IP Gateway: ", dosimacInfo.gateWay)
      console.log("Net mask ", dosimacInfo.subnetMask)
      console.log("Tipo equipo: ", dosimacInfo.deviceType)
      console.log("Nu Fase: ", dosimacInfo.phase)
      console.log("Nu Maquina: ", dosimacInfo.deviceNumber)
      console.log("Tag NFC: ", dosimacInfo.nfcTag)
      console.log("Nu corral: ", dosimacInfo.corral)
      console.log("Estado conexion: ", dosimacInfo.connectionState)
      console.log("Estado equipo: ", dosimacInfo.deviceState)
      console.log("Id animal: ", dosimacInfo.idAnimal)
      console.log("Crotal: ", dosimacInfo.crotal)
      console.log("Version SW: ", dosimacInfo.swVersion)
      console.log("Version hW: ", dosimacInfo.hwVersion)
   }
}

const pcomInicializeDosimacInfo = () => {
   dosimacInfo.deviceIp = "";
   dosimacInfo.ssid = "";
   dosimacInfo.wifiPassword = "";
   dosimacInfo.serverIp = "";
   dosimacInfo.deviceIp = "";
   dosimacInfo.gateWay = "";
   dosimacInfo.subnetMask = "";
   dosimacInfo.deviceType = 0;
   dosimacInfo.phase = 0;
   dosimacInfo.deviceNumber = 0;
   dosimacInfo.nfcTag = "";
   dosimacInfo.corral = 0;
   dosimacInfo.connectionState = 0;
   dosimacInfo.deviceState = 0;
   dosimacInfo.idAnimal = 0;
   dosimacInfo.crotal = parseInt(parser.payLoad.toString('hex', 248, 256));
   dosimacInfo.swVersion = 0;
   dosimacInfo.hwVersion = 0;
}

//**** MAQUINAS DE ESTADO DEL PROTOCOLO */
const inicializeSMS = (man: STMinfo): STMinfo => {
   man.state = 0;
   man.error = 0;
   man.responseRecieved = 0;
   man.waitRetries = 0;
   man.stateRetries = 0;
   return man;
}

export const pcomActiveRequestState = () => {
   if (masterState.timerId !== undefined)
      clearTimeout(masterState.timerId);

   inicializeSMS(requestState);
   pcomInicializeDosimacInfo();
   masterState.forceStop = false;
   masterState.unControlError = false;
   masterState.actualJob = 1;

   masterState.timerId = masterStateMachine();
}

export const pcomActiveSetupState = () => {
   if (masterState.timerId !== undefined)
      clearTimeout(masterState.timerId);

   inicializeSMS(setupState);
   masterState.forceStop = false;
   masterState.unControlError = false;

   masterState.actualJob = 2;
   masterState.timerId = masterStateMachine();
}

export const pcomSetDeviceId = (id: string) => {
   masterState.bleDevice = id;
   console.log("masterState.bleDevice: ", masterState.bleDevice);
}

export const pcomStopStateMachine = () => {
   clearTimeout(masterState.timerId);
   bleDisconnection(masterState.bleDevice);
   masterState.actualJob = 0;
   masterState.timerId = null;
   masterState.isInitialized = false;
   masterState.forceStop = true;
}

export const pcomCheckStatus = (): MasterState => {
   return masterState;
}

const masterStateMachine = () => {
   let delay: number = 200;

   let msTimer = setTimeout(
      function manStateTimer() {
         if (!masterState.isInitialized) {
            if (!masterState.forceStop)
               delay = inicialStateMachine();
         }
         else {
            switch (masterState.actualJob) {
               case 0:
                  delay = 100; break;
               case 1:
                  delay = stateMachineRequestState(); break;
               case 2:
                  delay = stateMachineSetupConfiguration(); break;
               default:
                  delay = 0; break;
            }
         }

         msTimer = setTimeout(manStateTimer, delay);
         masterState.timerId = msTimer;
      }, delay);

   return msTimer;
}

const inicialStateMachine = (): number => {
   console.log("Inical state machine: ", inicialState.state);

   switch (inicialState.state) {
      case 0:
         bleConnection(masterState.bleDevice);
         inicialState.state++;
         return 1500;
      case 1:
         bleSubscribeNotify();
         inicialState.state++;
         return 300;
      case 2:
         if (!canWrite()) {
            if ((++inicialState.waitRetries % 5) === 0) {
               console.log('[init] Reintentando startNotification…');
               bleSubscribeNotify();
            }
            return 200;
         }
         inicialState.waitRetries = 0;
         inicialState.state++;
         return 100;
      case 3:
         masterState.isInitialized = true;
         inicialState.state = 0;
         return 100;
      default:
         return 100;
   }
}

export const stateMachineRequestState = (): number => {
   console.log("stateMachineRequestState REQUEST: ", requestState.state, requestState.responseRecieved);

   switch (requestState.state) {
      case 0: {
         if (!canWrite()) return 150;
         requestState.responseRecieved = 0;
         requestState.waitRetries = 0;
         pcomSendB();
         requestState.state = 1;
         return 200;
      }
      case 1: {
         if (requestState.responseRecieved === 0) {
            if (++requestState.waitRetries > 60) {
               requestState.waitRetries = 0;
               if (requestState.stateRetries++ < 3) {
                  requestState.state = 0;
               } else {
                  requestState.stateRetries = 0;
                  masterState.unControlError = true;
                  return 500;
               }
            }
            return 200;
         }
         if (requestState.responseRecieved === 1) {
            requestState.responseRecieved = 0;
            requestState.waitRetries = 0;
            requestState.stateRetries = 0;
            pcomRequestDosimacStatus();
            requestState.state = 2;
            return 300;
         }
         requestState.state = 2;
         return 0;
      }
      case 2: {
         if (requestState.responseRecieved === 0) {
            if (++requestState.waitRetries > 60) {
               requestState.waitRetries = 0;
               if (requestState.stateRetries++ < 3) {
                  pcomRequestDosimacStatus();
                  return 300;
               } else {
                  requestState.stateRetries = 0;
                  requestState.state = 0;
                  return 300;
               }
            }
            return 200;
         }
         requestState.responseRecieved = 0;
         requestState.waitRetries = 0;
         requestState.stateRetries = 0;
         requestState.state = 1;
         return 2000;
      }
      default:
         return 0;
   }
};

export const stateMachineSetupConfiguration = (): number => {
   console.log("stateMachine SETUP State: ", setupState.state, setupState.responseRecieved);

   switch (setupState.state) {
      case 0:
         if (!canWrite()) return 150;
         setupState.responseRecieved = 0;
         pcomSendB();
         setupState.state = 1;
         console.log("HE ENVIADO LA B ************************************************");
         return 200;
      case 1:
         if (setupState.responseRecieved === 0) {
            setupState.waitRetries++;
            if (setupState.waitRetries > 60) {
               setupState.state = 0;
               setupState.waitRetries = 0;
               if (setupState.stateRetries < 3)
                  setupState.stateRetries++;
               else {
                  setupState.stateRetries = 0;
                  masterState.unControlError = true;
                  return 500;
               }
            }
            return 200;
         } else {
            setupState.stateRetries = 0;
            setupState.waitRetries = 0;
            setupState.responseRecieved = 0;
            setupState.state++;
            pcomDosimacSetup();
            return 300;
         }
      case 2:
         if (setupState.responseRecieved === 0) {
            setupState.waitRetries++;
            if (setupState.waitRetries > 10) {
               setupState.state = 0;
               setupState.waitRetries = 0;
               if (setupState.stateRetries < 3)
                  setupState.stateRetries++;
               else {
                  setupState.stateRetries = 0;
                  return 100;
               }
            }
         } else {
            console.log("Vamos a RequestState");
            setupState.stateRetries = 0;
            setupState.waitRetries = 0;
            setupState.responseRecieved = 0;
            setupState.state++;
            return 1500;
         }
         return 500;
      case 3:
         pcomActiveRequestState();
         return 500;
   }
   return 5;
}

function getSecondsSince(start: Date): number {
   const now = new Date();
   const differenceInMilliseconds = now.getTime() - start.getTime();
   const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
   return differenceInSeconds;
}

const start = new Date();
console.log(getSecondsSince(start));
