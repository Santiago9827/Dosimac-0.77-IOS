import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, TextInput, Text, Button, Banner, Portal, Dialog, Divider, Menu, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { farmStore, stmStore } from '../../../stores/store';
import {
  dosimacInfo,
  dosimacSetup,
  pcomActiveRequestState,
  pcomActiveSetupState,
  pcomCheckStatus,
  pcomSetDeviceId,
  pcomStopStateMachine
} from '../../../libraries/comunications/dosimacBleMessages';
import { globals } from '../../../sharedTypes/globlaVars';

const errorList = [
  { id: 0, msg: 'Sin accion' },
  { id: 1, msg: 'Nombre WIFI no configurado (SSID)' },
  { id: 2, msg: 'Conectando con router' },
  { id: 3, msg: 'Error en la conexion con el router (SSID, password)' },
  { id: 4, msg: 'Conectado con router, pendiente de conexion con el servidor' },
  { id: 5, msg: 'Error en la conexion con el servidor. Revise la IP' },
  { id: 6, msg: 'Conectado con servidor, pendiente de respuesta' },
  { id: 7, msg: 'Corral ocupado' },
  { id: 8, msg: 'Corral desconocido' },
  { id: 9, msg: 'Corral no existente' },
  { id: 10, msg: 'Error desconocido' },
  { id: 11, msg: 'Corral configurado' },
  { id: 12, msg: 'Timeout sin respuesta del servidor' },
  { id: 13, msg: 'Equipo ya asociado a otro corral' }
];

export const DRSetup = ({ navigation, route }) => {
  const { t } = useTranslation();

  const [corral, setCorral] = useState('');
  const [deviceNumber, setDeviceNumber] = useState('');

  const [visible, setVisible] = useState(false);
  const [visibleMenu, setVisibleMenu] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [hasTag, setHasTag] = useState(false);

  const [sendVisible, setSendVisible] = useState(false);
  const [waitingSetting, setWaitingSetting] = useState(true);
  const [tagVisible, setTagVisible] = useState(false);

  const [nfcTag, setNfcTag] = useState('');

  // Lo que reflejamos en UI del estado del equipo
  const [dInfoComState, setDInfoComState] = useState(0);
  const [dInfomanState, setDInfomanState] = useState(0);

  // Mensajería de envío
  const [sendHasMsg, setSendHasMsg] = useState(false);
  const [sendMsg, setSendMsg] = useState('');
  const [sendHasError, setSendHasError] = useState(false);

  // 0: no inicia, 1: configurando, 2: terminada
  const [configState, setConfigState] = useState(0);
  const [tick, setTick] = useState(0);

  // Store
  const stmJob = stmStore((state) => state.jobId);
  const sfarm = farmStore((state) => state.farm);

  // Listener de salida de pantalla: parar FSM
  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionStart', (e) => {
      if (e.data.closing) {
        pcomStopStateMachine();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Arranque: setear deviceId y arrancar la FSM de request si está idle
  useEffect(() => {
    if (stmJob === 0) {
      pcomSetDeviceId(route.params.id);
      pcomActiveRequestState();
    }
  }, [stmJob, route?.params?.id]);

  // Polling suave para leer estado del módulo y reflejar en UI
  useEffect(() => {
    const timer = setTimeout(() => {
      setTick((s) => s + 1);

      const ms = pcomCheckStatus(); // ← lectura del estado global (solo lectura)
      setDInfoComState(ms.dInfoComState);
      setDInfomanState(ms.dInfomanState);

      // Avance de la mini-FSM visual
      switch (configState) {
        case 0:
          if (ms.dInfoComState === 1) setConfigState(1);
          break;
        case 1:
          if (ms.dInfoComState === 0 || ms.dInfoComState === 2) setConfigState(2);
          break;
        case 2:
        default:
          break;
      }

      if (dosimacInfo.corral > 0) setIsConfigured(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tick, configState]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsConfigured(false);
        pcomStopStateMachine();
      };
    }, [])
  );

  useEffect(() => {
    setConfigState(0);
  }, []);

  const dohideDialog = () => setVisible(false);

  const dohideDialogTagCapture = () => {
    setTagVisible(false);
  };

  const dohideDialogSendConfiguration = (opcion: number = 0) => {
    if (opcion === 0 && configState === 2 && dInfoComState === 2) return;
    if (!waitingSetting) setWaitingSetting(false);
    setSendVisible(false);
    setSendHasError(false);
    setSendMsg('');
  };

  const openMenu = () => setVisibleMenu(true);
  const closeMenu = () => setVisibleMenu(false);

  const sendButtonClick = () => {
    // Validaciones
    const corralNum = parseInt(corral);
    if (!Number.isSafeInteger(corralNum) || corralNum <= 0) {
      setSendHasMsg(true);
      setSendMsg('Corral no valido');
      setSendVisible(true);
      setSendHasError(true);
      setWaitingSetting(false);
      return;
    }

    if (globals.dispenserType > 2) {
      const devNum = parseInt(deviceNumber);
      if (!Number.isSafeInteger(devNum) || devNum <= 0 || devNum > 4) {
        setSendHasMsg(true);
        setSendMsg('Número de máquina no valido');
        setSendVisible(true);
        setSendHasError(true);
        setWaitingSetting(false);
        return;
      }
    }

    // Preparar estructura a enviar
    dosimacSetup.ssid = sfarm.ssid || '';
    dosimacSetup.wifiPassword = sfarm.wifiPassword || '';
    dosimacSetup.serverIp = sfarm.serverIp || '';

    dosimacSetup.deviceType = globals.dispenserType <= 2 ? 200 : 203;
    dosimacSetup.phase = globals.dispenserType <= 2 ? 3 : 2;
    dosimacSetup.deviceNumber = parseInt(deviceNumber) || 1;
    dosimacSetup.nfcTag = nfcTag || '';
    dosimacSetup.corral = corralNum;

    // Reset UI y lanzar FSM de setup
    setWaitingSetting(true);
    setSendVisible(true);
    setSendHasError(false);
    setSendHasMsg(false);
    setSendMsg('');

    // Reset visual de conexión/configuración
    setConfigState(0);
    setDInfoComState(-1);
    setDInfomanState(0);

    // Iniciar ciclo de configuración
    pcomActiveSetupState();
  };

  return (
    <ScrollView>
      <View style={{ marginHorizontal: 20, marginTop: 20, borderWidth: 1, borderRadius: 10, borderColor: 'lightgrey' }}>
        {/* Banner info granja */}
        <Banner
          visible
          style={{ backgroundColor: isConfigured ? 'yellow' : '#eeeeee' }}
          actions={[
            {
              label: isConfigured ? 'show configuration' : '',
              onPress: () => setVisible(true)
            }
          ]}
          icon={({ size }) => (
            <Image
              source={require('../../../assets/images/configuracion_con_equipo.png')}
              style={{ width: size, height: size }}
            />
          )}
        >
          <Text style={{ fontWeight: 'bold' }}> Información</Text>
          {'\n'}
          {'\n'}
          <Text> {sfarm.name}</Text>
          {'\n'}
          <Text> SSID: {sfarm.ssid}</Text>
          {'\n'}
          <Text> Ipserver: {sfarm.serverIp}</Text>
        </Banner>

        {/* Dialog info equipo */}
        <Portal>
          <Dialog visible={visible} onDismiss={dohideDialog} style={{ maxHeight: 0.6 * Dimensions.get('window').height }}>
            <Dialog.Title style={{ color: 'black' }}>Información</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                <Text variant="bodyLarge">SSID: {dosimacInfo.ssid}</Text>
                <Text variant="bodyLarge">SSID PSW: {'********'}</Text>
                <Text variant="bodyLarge">IP servidor: {dosimacInfo.serverIp}</Text>
                <Text variant="bodyLarge">IP equipo: {dosimacInfo.deviceIp}</Text>
                <Text variant="bodyLarge">IP Gateway: {dosimacInfo.gateWay}</Text>
                <Text variant="bodyLarge">Net mask: {dosimacInfo.subnetMask}</Text>
                <Text variant="bodyLarge">Tipo de equipo: {dosimacInfo.deviceType}</Text>
                <Text variant="bodyLarge">Número de Maquina: {dosimacInfo.deviceNumber}</Text>
                <Text variant="bodyLarge">Número corral: {dosimacInfo.corral}</Text>
                <Text variant="bodyLarge">Estado conexion: {dosimacInfo.connectionState}</Text>
                <Text variant="bodyLarge">Estado equipo: {dosimacInfo.deviceState}</Text>
                <Text variant="bodyLarge">Id animal: {dosimacInfo.idAnimal}</Text>
                <Text variant="bodyLarge">Crotal: {dosimacInfo.crotal}</Text>
                <Text variant="bodyLarge">Version SW: {dosimacInfo.swVersion}</Text>
                <Text variant="bodyLarge">Version hW: {dosimacInfo.hwVersion}</Text>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={dohideDialog}>Aceptar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog envío configuración */}
        <Portal>
          <Dialog
            visible={sendVisible}
            onDismiss={dohideDialogSendConfiguration}
            style={{ maxHeight: 0.6 * Dimensions.get('window').height }}
          >
            <Dialog.Title style={{ color: '#007263', alignSelf: 'center' }}>Envío de configuración</Dialog.Title>
            <Dialog.Content className="flex-col items-center ">
              {!sendHasError && (configState === 2 ? null : <ActivityIndicator animating color="green" size="large" />)}
              <Text> </Text>

              {!sendHasError && (
                <>
                  <Text
                    className={`text-center text-xl text-black ${
                      configState === 2 ? (dInfoComState === 2 ? 'text-blue-600' : 'text-red-600') : 'text-back'
                    }`}
                  >
                    {configState === 0
                      ? 'Iniciando conexion'
                      : configState === 1
                      ? 'configurando...'
                      : dInfoComState === 0
                      ? `Error configuración (${dInfomanState})`
                      : '*Configuracion realizada*'}
                  </Text>

                  {configState === 2 && dInfoComState === 2 ? (
                    <Pressable
                      className="flex-row mt-8 w-auto h-12 rounded-lg bg-green-700 items-center justify-center"
                      onPress={() => {
                        dohideDialogSendConfiguration(1);
                        pcomStopStateMachine();
                        navigation.navigate('DR-NEWUPDATE', { operacion: route.params.operacion });
                      }}
                    >
                      <Text className="text-center text-gray-100 text-lg px-14 font-semibold">Salir</Text>
                    </Pressable>
                  ) : (
                    configState === 2 &&
                    dInfoComState === 0 && <Text className="text-lg text-slate-700 mt-2">{errorList[dInfomanState].msg}</Text>
                  )}
                </>
              )}

              {sendHasMsg && <Text variant="bodyLarge">{sendMsg} </Text>}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => dohideDialogSendConfiguration(0)}>{waitingSetting ? '' : 'Aceptar'}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Dialog captura tag */}
        <Portal>
          <Dialog visible={tagVisible} onDismiss={dohideDialogTagCapture} style={{ maxHeight: 0.6 * Dimensions.get('window').height }}>
            <Dialog.Title style={{ color: '#007263', alignSelf: 'center' }}>Capturar tag de corral</Dialog.Title>
            <Dialog.Content>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
                <ActivityIndicator animating color="green" size="large" />
                <Text> </Text>
                <Text style={{ alignSelf: 'center' }} variant="bodyLarge">
                  capturando ...
                </Text>
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={dohideDialogTagCapture}>Aceptar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>

      {/* Formulario */}
      <View style={{ marginTop: 20, gap: 10, marginHorizontal: 10, paddingHorizontal: 10 }}>
        {/* Tag */}
        <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <Image
            source={require('../../../assets/images/rfid2tb.png')}
            style={{ width: 80, height: 80, opacity: hasTag ? 1 : 0.2 }}
          />

          <Menu
            visible={visibleMenu}
            onDismiss={closeMenu}
            anchor={
              <Pressable android_ripple={{ color: 'blue' }} style={{ ...styles.boton2 }} onPress={openMenu}>
                <Text style={styles.texto}>Corral Tag</Text>
              </Pressable>
            }
            anchorPosition="top"
          >
            <Menu.Item
              onPress={() => {
                setHasTag(true);
                setTagVisible(true);
                setVisibleMenu(false);
              }}
              title="Capturar tag"
              leadingIcon="content-copy"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                setHasTag(false);
                setNfcTag('');
              }}
              title="Borrar tag"
              leadingIcon="delete"
            />
          </Menu>
        </View>

        <TextInput
          style={{ marginTop: 5 }}
          keyboardType="number-pad"
          label="Número de  corral"
          mode="outlined"
          placeholder="Marcador corral"
          value={corral}
          onChangeText={setCorral}
        />

        {globals.dispenserType > 2 && (
          <TextInput
            style={{ marginTop: 5 }}
            keyboardType="number-pad"
            label="Número de  máquina"
            mode="outlined"
            placeholder="Número de máquina"
            value={deviceNumber}
            onChangeText={setDeviceNumber}
          />
        )}
      </View>

      {/* Botones */}
      <View style={{ marginTop: 60, gap: 25, marginHorizontal: 10, paddingHorizontal: 10 }}>
        <Pressable android_ripple={{ color: 'blue' }} style={styles.boton} onPress={sendButtonClick}>
          <Text style={styles.texto}>Enviar</Text>
        </Pressable>

        <Pressable
          android_ripple={{ color: 'blue' }}
          style={{ ...styles.boton, backgroundColor: 'darkred' }}
          onPress={() => {
            pcomStopStateMachine();
            navigation.navigate('DR-NEWUPDATE', { operacion: route.params.operacion });
          }}
        >
          <Text style={styles.texto}>Salir</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  boton: {
    backgroundColor: 'green',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center'
  },
  texto: {
    fontSize: 20,
    color: 'white'
  },
  boton2: {
    backgroundColor: '#4b4238',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 60,
    alignItems: 'center'
  }
});