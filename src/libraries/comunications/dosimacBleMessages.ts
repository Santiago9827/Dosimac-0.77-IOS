import { Buffer } from "buffer";
import { bleConnection, bleDisconnection, bleDosimacWrite, bleSubscribeNotify, blehandleMTU, canWrite } from "../../device/ble/bleLibrary";
// import { BLETestingScreen } from "../../presentation/screens/Debug/BLETesting/BLETestingScreen";
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
};
//const sfarm = farmStore((state) => state.farm);
// let stateRequestMachine:number = 0;
// let stateSetupMachine:number = 0;
// let requestStatusRecivedResponse:number = 0;
// let setupConfigRecivedResponse:number = 0;
let requestState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };
let setupState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };
let inicialState: STMinfo = { state: 0, responseRecieved: 0, waitRetries: 0, stateRetries: 0, error: 0 };

let masterState: MasterState = { actualJob: 0, timerId: undefined, isInitialized: false, bleDevice: "", dInfoComState: -1, dInfomanState: 0, forceStop: false, unControlError: false };

// const stmError = stmStore((state) => state.error);
// const stmSubState = stmStore((state) => state.subState);
// const stmJob = stmStore((state) => state.jobId);
// const setStmError = stmStore((state) => state.SetError);
// const setStmSubState = stmStore((state) => state.SetSubState);
// const setStmJob = stmStore((state) => state.SetJobId);




// let manState={
//    state:0,
//    error:0
// }

// export const fmanState=() => {
//    return manState;
// }

//*************************************************************************************** */
// Definicion de los custom hooks para conectar esta funcionalidad con el componente visual

// export const useManState = (inicalState: number = 0) => {
//    const [msError, iSetmsError] = useState(false);
//    const [msActualJob, iSetActualJob] = useState(inicalState);
//    const [msSubState, iSetmsSubState] = useState(0);
//    const activeRequestState = () => { handleActiveRequestState() }
//    const activeSetupState = () => { handleActiveSetupState() }
//    const SetError = (valor: boolean) => { iSetmsError(valor) }
//    const SetActualJob = (job: number) => { iSetActualJob(job) }
//    const SetSubState = (valor: number) => { iSetmsSubState(valor) }

//    return {
//       msError,
//       msActualJob,
//       msSubState,
//       SetError,
//       SetActualJob,
//       SetSubState,
//       activeRequestState,
//       activeSetupState
//    }
// }


//export const interfaceManState = useManState(0)

// IMPLEMENTACION DEL PROGRMA ************************************************************




//Inicio del envio de informacion
export const pcomSendB = () => {

   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   console.log("****************ENVIO DE LA B ********************************")
   const data = Buffer.from([66])
   bleDosimacWrite(data);



}


//Dosimac request configuration information
export const pcomRequestDosimacStatus = () => {

   let payLoad: Buffer;
   let buff1: iFrameMsg;
   console.log("Call to tmsgRequestDosimacStatus*****")

   // payLoad=Buffer.from(payLoadRequestDosimacStatus());
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


//SETUP CONFIGURATION:----------------------------------------------------------------

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


const payloadSetup = (): Buffer => {


   console.log("Inside payloadSetup");
   const payLoad = Buffer.alloc(148);

   payLoad.writeUInt16LE(1, 0) //Version
   payLoad.writeUInt16LE(1, 2) //Tipo de informacion=> Setup configuration

   payLoad.write(dosimacSetup.ssid, 4, 32, 'utf16le') //ssid unicode 64bytes //
   payLoad.write(dosimacSetup.wifiPassword, 68, 32, 'ascii') //password wifi 32bytes//
   payLoad.write(dosimacSetup.serverIp, 100, 32, 'ascii') //ip servidor 32bytes //

   payLoad.writeUInt16LE(dosimacSetup.deviceType, 132) //Tipo de equipo  2 byte //
   payLoad.writeUInt8(dosimacSetup.phase, 134) //Fase 1 byte //
   payLoad.writeUInt8(dosimacSetup.deviceNumber, 135) //Numero de maquina 2 byte //

   //payLoad.writeBigUInt64LE(BigInt(dosimacSetup.nfcTag), 136) //tag ncf 64 bytes //payLoad.writeBigUInt64LE(0x0101010101010101n,136) //tag ncf 64 bytes
   //payLoad.writeBigUInt64LE(0x0101010101010101n,136) //tag ncf 64 bytes

   payLoad.writeUInt16LE(dosimacSetup.corral, 144) //corral 2 bytes

   payLoad.writeUInt16LE(9, 146) //reserva 2 bytes





   //* Test data
   // payLoad.write("CTICONTROL_IN", 4, 32, 'utf16le') //ssid unicode 64bytes
   // payLoad.write("Free43aba", 68, 32, 'ascii') //password wifi 32bytes
   // payLoad.write("192.168.10.70", 100, 32, 'ascii') //ip servidor 32bytes

   // payLoad.writeUInt16LE(1, 132) //Tipo de equipo  2 byte
   // payLoad.writeUInt8(1, 134) //Fase 1 byte
   // payLoad.writeUInt8(1, 135) //Numero de maquina 2 byte

   // payLoad.writeInt32LE(0x01020304, 136) //tag ncf 64 bytes //payLoad.writeBigUInt64LE(0x0101010101010101n,136) //tag ncf 64 bytes


   // payLoad.writeUInt16LE(278, 144) //corral 2 bytes
   // payLoad.writeUInt16LE(9, 146) //reserva 2 bytes
   //* End Test data

   console.log("End payloadSetup");
   return payLoad;
}

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
            requestState.responseRecieved = 1;
            setupState.responseRecieved = 1;
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


   //parser.payLoad.copy(dosimacInfo as unknown as Uint8Array ,0,0,parser.payLoad.length)
   //let dosimacInfox: DosimacInfo = {};

   // dosimacInfo.deviceIp="hola mundo"
   // console.log(dosimacInfo);


   requestState.responseRecieved = parser.payLoad.readUint16LE(2);
   setupState.responseRecieved = requestState.responseRecieved;
   console.log("(pcomresponseStatus): " + requestState.responseRecieved)

   if (requestState.responseRecieved === 2) { // || requestState.responseRecieved===4) {
      console.log("ES UNA TRAMA DE RESPUESTRA (pcomresponseStatus): " + requestState.responseRecieved)
      //Son respuestas sin carga de datos
      return;
   }



   dosimacInfo.deviceIp = parser.payLoad.toString('ascii', 132, 164);
   dosimacInfo.ssid = parser.payLoad.toString("utf16le", 4, 68);
   dosimacInfo.wifiPassword = parser.payLoad.toString('ascii', 68, 100);
   dosimacInfo.serverIp = parser.payLoad.toString('ascii', 100, 132);
   dosimacInfo.deviceIp = parser.payLoad.toString('ascii', 132, 164);
   dosimacInfo.gateWay = parser.payLoad.toString('ascii', 164, 196);
   dosimacInfo.subnetMask = parser.payLoad.toString('ascii', 196, 228);
   dosimacInfo.deviceType = parser.payLoad.readUint16LE(228);
   dosimacInfo.phase = parser.payLoad.readUint8(230); //parseInt(parser.payLoad.toString('hex', 230, 231));
   dosimacInfo.deviceNumber = parser.payLoad.readUint8(231);
   dosimacInfo.nfcTag = parser.payLoad.toString('hex', 232, 240);
   dosimacInfo.corral = parser.payLoad.readUint16LE(240);
   dosimacInfo.connectionState = parser.payLoad.readUint8(242)
   dosimacInfo.deviceState = parser.payLoad.readUint8(243)
   dosimacInfo.idAnimal = parser.payLoad.readUint32LE(244) //  parseInt(parser.payLoad.toString('hex', 244, 248)); //hex
   dosimacInfo.crotal = parseInt(parser.payLoad.toString('hex', 248, 256)); //hex
   dosimacInfo.swVersion = parser.payLoad.readUint16LE(256)
   dosimacInfo.hwVersion = parser.payLoad.readUint16LE(258)






   // dosimacInfo.deviceType = parseInt(parser.payLoad.toString('hex', 228, 230));
   // dosimacInfo.phase = parseInt(parser.payLoad.toString('hex', 230, 231));
   // dosimacInfo.deviceNumber = parseInt(parser.payLoad.toString('hex', 231, 232));
   // dosimacInfo.nfcTag = parser.payLoad.toString('hex', 232, 240);
   // dosimacInfo.corral = parseInt(parser.payLoad.toString('hex', 240, 242));
   // dosimacInfo.connectionState = parseInt(parser.payLoad.toString('hex', 242, 243)); //hex
   // dosimacInfo.deviceState = parseInt(parser.payLoad.toString('hex', 243, 244)); //hex
   // dosimacInfo.idAnimal = parseInt(parser.payLoad.toString('hex', 244, 248)); //hex
   // dosimacInfo.crotal = parseInt(parser.payLoad.toString('hex', 248, 256)); //hex
   // dosimacInfo.swVersion = parseInt(parser.payLoad.toString('hex', 256, 258)); //hex
   // dosimacInfo.hwVersion = parseInt(parser.payLoad.toString('hex', 258, 260)); //hex

   masterState.dInfoComState = dosimacInfo.connectionState;
   masterState.dInfomanState = dosimacInfo.deviceState;


   //Visualizacion de datos
   if (process.env.BUILD_MODE === 'DEBUG') {

      console.log(parser.payLoad.toString('hex', 0, parser.payLoadSize));


      console.log("Version: ", parser.payLoad.readUint16LE(0).toString(16)) //Version
      console.log("Tipo Informacion: ", parser.payLoad.readUInt16LE(2).toString(16)) //Tipo de informacion=> Setup configuration

      console.log("SSID: ", dosimacInfo.ssid) //ssid unicode 64bytes
      console.log("WIFI PSW: ", dosimacInfo.wifiPassword) //password wifi 32bytes
      console.log("IP servidor: ", dosimacInfo.serverIp) //ip servidor 32bytes
      console.log("IP equipo: ", dosimacInfo.deviceIp) //ip servidor 32bytes
      console.log("IP Gateway: ", dosimacInfo.gateWay) //ip servidor 32bytes
      console.log("Net mask ", dosimacInfo.subnetMask) //ip servidor 32bytes
      console.log("Tipo equipo: ", dosimacInfo.deviceType)
      console.log("Nu Fase: ", dosimacInfo.phase) //Fase 1 byte
      console.log("Nu Maquina: ", dosimacInfo.deviceNumber) //Numero de maquina 2 byte
      console.log("Tag NFC: ", dosimacInfo.nfcTag) //tag ncf 8 bytes
      console.log("Nu corral: ", dosimacInfo.corral) //corral 2 bytes
      console.log("Estado conexion: ", dosimacInfo.connectionState) //Fase 1 byte
      console.log("Estado equipo: ", dosimacInfo.deviceState) //Fase 1 byte
      console.log("Id animal: ", dosimacInfo.idAnimal) //corral 2 bytes
      console.log("Crotal: ", dosimacInfo.crotal) //corral 2 bytes
      console.log("Version SW: ", dosimacInfo.swVersion) //reserva 2 bytes
      console.log("Version hW: ", dosimacInfo.hwVersion) //reserva 2 bytes
   }


   // console.log("Version: ", parser.payLoad.readUint16LE(0).toString(16)) //Version
   // console.log("Tipo Informacion: ", parser.payLoad.readUInt16LE(2).toString(16)) //Tipo de informacion=> Setup configuration

   // console.log("SSID: ", parser.payLoad.toString("utf16le", 4, 68)) //ssid unicode 64bytes
   // console.log("SSID PSW: ", parser.payLoad.toString('ascii', 68, 100)) //password wifi 32bytes
   // console.log("IP servidor: ", parser.payLoad.toString('ascii', 100, 132)) //ip servidor 32bytes
   // console.log("IP equipo: ", parser.payLoad.toString('ascii', 132, 164)) //ip servidor 32bytes
   // console.log("IP Gateway: ", parser.payLoad.toString('ascii', 164, 196)) //ip servidor 32bytes
   // console.log("Net mask ", parser.payLoad.toString('ascii', 196, 228)) //ip servidor 32bytes
   // console.log("Tipo equipo: ", parser.payLoad.toString('hex', 228, 230))
   // console.log("Nu Fase: ", parser.payLoad.toString('hex', 230, 231)) //Fase 1 byte
   // console.log("Nu Maquina: ", parser.payLoad.toString('hex', 231, 232)) //Numero de maquina 2 byte
   // console.log("Tag NFC: ", parser.payLoad.toString('hex', 232, 240)) //tag ncf 8 bytes
   // console.log("Nu corral: ", parser.payLoad.toString('hex', 240, 242)) //corral 2 bytes
   // console.log("Estado conexion: ", parser.payLoad.toString('hex', 242, 243)) //Fase 1 byte
   // console.log("Estado equipo: ", parser.payLoad.toString('hex', 243, 244)) //Fase 1 byte
   // console.log("Id animal: ", parser.payLoad.toString('hex', 244, 248)) //corral 2 bytes
   // console.log("Crotal: ", parser.payLoad.toString('hex', 248, 256)) //corral 2 bytes
   // console.log("Version SW: ", parser.payLoad.toString('hex', 256, 258)) //reserva 2 bytes
   // console.log("Version hW: ", parser.payLoad.toString('hex', 258, 260)) //reserva 2 bytes




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
   dosimacInfo.crotal = parseInt(parser.payLoad.toString('hex', 248, 256)); //hex
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
   //Inicialize the state machine


   if (masterState.timerId !== undefined)
      clearTimeout(masterState.timerId);


   inicializeSMS(requestState);
   pcomInicializeDosimacInfo();
   masterState.forceStop = false;
   masterState.unControlError = false;
   masterState.actualJob = 1;
   // setStmJob(masterState.actualJob);
   //interfaceManState.SetActualJob(masterState.actualJob);

   masterState.timerId = masterStateMachine();


}


export const pcomActiveSetupState = () => {

   if (masterState.timerId !== undefined)
      clearTimeout(masterState.timerId);

   inicializeSMS(setupState);
   masterState.forceStop = false;
   masterState.unControlError = false;

   masterState.actualJob = 2;
   //setStmJob(masterState.actualJob);
   // interfaceManState.SetActualJob(masterState.actualJob);

   masterState.timerId = masterStateMachine();

}

export const pcomSetDeviceId = (id: string) => {

   masterState.bleDevice = id;
   console.log("masterState.bleDevice: ", masterState.bleDevice);

}


export const pcomStopStateMachine = () => {

   // if (masterState.timerId !== undefined)
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

   let delay: number = 200; //Pequeño retraso para darle tiempo a conectarse

   let msTimer = setTimeout(


      function manStateTimer() {

         if (!masterState.isInitialized) {
            if (!masterState.forceStop)
               delay = inicialStateMachine();

         }
         else {
            switch (masterState.actualJob) {
               case 0:
                  delay = 100;
                  break;

               case 1:
                  delay = stateMachineRequestState();
                  break;
               case 2:
                  delay = stateMachineSetupConfiguration();
                  break;
               default:
                  delay = 0;
                  break;
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
         return 1500; //Wait 1 second before send MTU
         break;
case 1:
  // activar notificaciones
  bleSubscribeNotify();
  inicialState.state++;
  return 300;

case 2:
  if (!canWrite()) {
    // reintenta cada ~1s
    if ((++inicialState.waitRetries % 5) === 0) {
      console.log('[init] Reintentando startNotification…');
      bleSubscribeNotify();
    }
    return 200; // sigue esperando
  }
  inicialState.waitRetries = 0;
  inicialState.state++;
  return 100;

case 3:
  masterState.isInitialized = true;
  inicialState.state = 0;
  return 100;


         break;
      default:
         return 100; //
         break;
   }


}

export const stateMachineRequestState = (): number => {
  console.log("stateMachineRequestState REQUEST: ", requestState.state, requestState.responseRecieved);

  switch (requestState.state) {
    case 0: {
      // Paso 0: Enviar B una única vez para abrir ventana de escritura
      if (!canWrite()) return 150;     // aún no hay notifs/servicios listos
      requestState.responseRecieved = 0;
      requestState.waitRetries = 0;
      pcomSendB();
      requestState.state = 1;          // esperar ACK=1
      return 200;
    }

    case 1: {
      // Esperando ACK (msgType 0x01 => responseRecieved=1)
      if (requestState.responseRecieved === 0) {
        // sigue esperando
        if (++requestState.waitRetries > 60) { // ~12s
          requestState.waitRetries = 0;
          if (requestState.stateRetries++ < 3) {
            requestState.state = 0; // reintento de B
          } else {
            requestState.stateRetries = 0;
            masterState.unControlError = true;
            return 500; // error no controlado
          }
        }
        return 200;
      }

      if (requestState.responseRecieved === 1) {
        // ACK recibido: ahora sí pedimos estado UNA vez
        requestState.responseRecieved = 0;  // limpiamos para esperar la respuesta de estado
        requestState.waitRetries = 0;
        requestState.stateRetries = 0;
        pcomRequestDosimacStatus();
        requestState.state = 2;            // ahora esperamos (2/4)
        return 300;
      }

      // Si llegó una trama de estado aquí por carrera (2/4), pasa directo a case 2
      requestState.state = 2;
      return 0;
    }

    case 2: {
      // Esperando la respuesta de estado: (pcomresponseStatus la coloca a 2 o 4)
      if (requestState.responseRecieved === 0) {
        if (++requestState.waitRetries > 60) {
          // timeout esperando el estado -> reintenta pidiendo estado (sin volver a enviar B)
          requestState.waitRetries = 0;
          if (requestState.stateRetries++ < 3) {
            pcomRequestDosimacStatus();
            return 300;
          } else {
            // demasiados timeouts -> vuelve a B
            requestState.stateRetries = 0;
            requestState.state = 0;
            return 300;
          }
        }
        return 200;
      }

      // Llegó estado (2 o 4) -> ciclo completado
      // (ya has procesado el payload en pcomresponseStatus)
      requestState.responseRecieved = 0;
      requestState.waitRetries = 0;
      requestState.stateRetries = 0;

      // Importante: NO reenvíes la B. Simplemente vuelve a case 1 y pide estado de nuevo
      // cuando quieras (p. ej., cada 2s).
      requestState.state = 1;
      return 2000; // siguiente sondeo dentro de 2s
    }

    default:
      return 0;
  }
};



export const stateMachineSetupConfiguration = (): number => {

   console.log("stateMachine SETUP State: ", setupState.state, setupState.responseRecieved);

   switch (setupState.state) {
     case 0:
    if (!canWrite()) {
      // aún no están listas las notificaciones; espera y reintenta
      return 150;
    }
    setupState.responseRecieved = 0;
    pcomSendB();
    setupState.state = 1;
    console.log("HE ENVIADO LA B ************************************************");
    return 200;
      case 1:
         if (setupState.responseRecieved === 0) {
            //Error: No ha llegado la respuesta. 
            setupState.waitRetries++;
            if (setupState.waitRetries > 60) {
               setupState.state = 0;
               setupState.waitRetries = 0;
               if (setupState.stateRetries < 3)
                  setupState.stateRetries++;
               else {
                  setupState.stateRetries = 0;
                  masterState.unControlError = true;
                  return 500; //! DEBE DAR ERROR

               }
            }
            return 200;
         }
         else { //Correcto: solo puede entrar aqui con un 1

            //requestState.state = 0;
            setupState.stateRetries = 0;
            setupState.waitRetries = 0;
            setupState.responseRecieved = 0;
            setupState.state++;
            pcomDosimacSetup();

            return 300;
         }
         break;
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
                  return 100; //! DEBE DAR ERROR

               }
            }

         }
         else {
            //Respuesta recibida->Todo OK
            //Hay que parar esta maquina de estados y pasar a la que pide el estado
            console.log("Vamos a RequestState");
            // pcomActiveRequestState();
            setupState.stateRetries = 0;
            setupState.waitRetries = 0;
            setupState.responseRecieved = 0;
            setupState.state++;
            return 1500;

         }
         return 500;

         break;
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
// Wait for some time...
console.log(getSecondsSince(start)); // This will log the number of seconds since `start`