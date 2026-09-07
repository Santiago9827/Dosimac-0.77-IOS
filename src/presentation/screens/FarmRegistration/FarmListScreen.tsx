/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appbar, Button, Caption, Divider, List, RadioButton, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native-gesture-handler';
import { FarmScreen } from './FarmScreen';
import { farmFacility } from '../../../sharedTypes/farmInterface';
import { farmStore } from '../../../stores/store';
import { vglobal } from '../../../sharedTypes/globlaVars';
import { useAuthStore } from '../../../stores/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GetFarmsList, InicialiceFarmDataTable, GetFarmDataById } from '../../../FarmDB/farmsDB';
import { guardarBaseUrlDesdeServerIp, validarInstalacionActiva } from '../../../stores/ipConfig';
import { sincronizarSesionInstalacion } from './sincronizarSesionInstalacion';
import { Camera, CameraType } from 'react-native-camera-kit';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// interface farmFacility {
//   name: String;
//   location: String;
//   province: String;
//   userName: String;
//   password: String;
//   ssid: String;
//   wifiPassword: String;
//   serverIp: String;
//   id: number;
// }




export const FarmListScreen = ({ navigation, route }) => {

  // const navigation = useNavigation();
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [farms, setFarms] = useState<farmFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalConexionVisible, setModalConexionVisible] = useState(false);
  const [modalConexionTipo, setModalConexionTipo] = useState<'loading' | 'success' | 'error'>('loading');
  const [modalConexionTitulo, setModalConexionTitulo] = useState('');
  const [modalConexionTexto, setModalConexionTexto] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [qrEscaneado, setQrEscaneado] = useState(false);

  const timerModalConexionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarModalConexion = (
    tipo: 'loading' | 'success' | 'error',
    titulo: string,
    texto: string,
    autocerrar = false
  ) => {
    if (timerModalConexionRef.current) {
      clearTimeout(timerModalConexionRef.current);
    }

    setModalConexionTipo(tipo);
    setModalConexionTitulo(titulo);
    setModalConexionTexto(texto);
    setModalConexionVisible(true);

    if (autocerrar) {
      timerModalConexionRef.current = setTimeout(() => {
        setModalConexionVisible(false);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerModalConexionRef.current) {
        clearTimeout(timerModalConexionRef.current);
      }
    };
  }, []);

  const cerrarModalConexion = () => {
    if (timerModalConexionRef.current) {
      clearTimeout(timerModalConexionRef.current);
    }

    setModalConexionVisible(false);
  };

  const sfarm = farmStore((state) => state.farm);
  const sfarmId = farmStore((state) => state.farmId);
  // const UseSetFarm=farmStore((state)=> state.UseSetFarm);
  const UseSetFarmId = farmStore((state) => state.UseSetFarmId);
  const UseSetNewFarm = farmStore((state) => state.UseSetNewFarm);
  const farmDataChange = farmStore((state) => state.farmDataChange);
  const resetFarm = farmStore((state) => state.resetFarm);
  const setFirstElment = farmStore((state) => state.setFirstElement);
  const UseSetFirstElement = farmStore((state) => state.UseSetFirstElement);
  const UseSetFarmsAmount = farmStore((state) => state.UseSetFarmsAmount);
  const farmsAmount = farmStore((state) => state.farmsAmount);

  //const token = useAuthStore((s) => s.token);

  const goToHome = () => {
    const parent = navigation.getParent?.();

    if (parent?.navigate) {
      parent.navigate('AltaDispositivosHome');
      return;
    }

    navigation.navigate('AltaDispositivosHome');
  };


  // const navigator=useNavigation();

  const fetchFarms = React.useCallback(async () => {
    setLoading(true);
    try {
      await InicialiceFarmDataTable();

      const list = await GetFarmsList();   // puede lanzar error si hay SQL mal
      setFarms(list ?? []);
      UseSetFarmsAmount(list?.length ?? 0);
    } catch (e) {
      console.log('GetFarmsList ERR', e);
      setFarms([]);                        // fuerza vacío
    } finally {
      setLoading(false);                   // SIEMPRE baja el loading
    }
  }, [UseSetFarmsAmount]);

  useFocusEffect(
    React.useCallback(() => {
      fetchFarms();
      return () => { };
    }, [fetchFarms, farmDataChange])
  );

  useEffect(() => {
    const selectedId = sfarm?.id;
    if (selectedId && farms.some(f => f.id === selectedId)) {
      setValue(String(selectedId));
    } else if (farms.length > 0) {
      setValue(String(farms[0].id));
      UseSetNewFarm(farms[0].id);
    } else {
      setValue('');
    }
  }, [sfarm?.id, farms, UseSetNewFarm]);



  // useEffect(() => {
  //    const fetchFarms = async () => {
  //     const farmsList = await GetFarmsList();
  //      setFarms(farmsList);
  //   /};
  //    fetchFarms();
  //   console.log('reder farmlist', sfarm);

  //  (if farms.length===0)

  //   if (sfarm)
  //     setValue(sfarm.id.toString());
  //   else {
  //     setValue('1');
  //     if (farms.length > 0)
  //       UseSetNewFarm(farms[0].id);
  //   }

  //   console.log('use efect de farmlist');

  // }, []);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     fetchFarms();
  //     if (farms.length === 1) {
  //       UseSetNewFarm(farms[0].id);
  //       setValue('1');
  //     }

  //     if (vglobal.coinciden)
  //       console.log('setFirstElment true')
  //     else
  //       console.log('setFirstElment false')

  //     if (vglobal.coinciden) {
  //       vglobal.coinciden = false;
  //       if ((farms.length > 0)) {
  //         UseSetNewFarm(farms[0].id);
  //         console.log(farms[0].id)
  //         setValue(farms[0].id.toString());
  //         UseSetFirstElement(false);
  //       }
  //     }
  //     if (farms.length === 0) {
  //       // resetFarm();

  //     }
  //      if (farmDataChange)
  //     // farmsList
  //     //Alert.alert('Screen was focused');
  //     // Do something when the screen is focused
  //     console.log('screen was focused');
  //     return () => {
  //       // Alert.alert('Screen was unfocused');
  //       // Do something when the screen is unfocused
  //       // Useful for cleanup functions
  //     };
  //   }, [])
  // );

  const handleRender = (item: farmFacility) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, backgroundColor: 'lightblue' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'left' }}>{item.name}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'lightblue' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'left' }}>{item.location}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'lightblue' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'left' }}>{item.province}</Text>
        </View>
      </View>
    );


  };


  const listRedernItem = (item: farmFacility) => {
    return (<View style={{ flexDirection: 'row', paddingBottom: 10 }}>
      <Text>{item.name}</Text>
      <Text>{item.location}</Text>
      <Text>{item.province}</Text>
      {/* <Text>{item.userName}</Text>
      <Text>{item.password}</Text>
      <Text>{item.ssid}</Text>
      <Text>{item.wifiPassword}</Text>
      <Text>{item.serverIp}</Text> */}


    </View>);

  };

  const seleccionarInstalacion = async (item: farmFacility) => {
    try {
      setValue(String(item.id));
      UseSetNewFarm(item.id);

      
      mostrarModalConexion(
        'loading',
        t('farmList.conectando'),
        t('conectandoInstalacionSeleccionada')
      );

      const instalacionCompleta = await GetFarmDataById(item.id);

      if (!instalacionCompleta) {
        mostrarModalConexion(
          'error',
          'No se ha podido conectar',
          'No se han encontrado los datos de esta instalación.'
        );
        return;
      }

      const serverIpLimpia = String(instalacionCompleta.serverIp ?? '').trim();

      if (!serverIpLimpia) {
        mostrarModalConexion(
          'error',
          'IP no configurada',
          'La instalación no tiene Server IP configurada.'
        );
        return;
      }

      await guardarBaseUrlDesdeServerIp(serverIpLimpia);

      const disponibilidad = await validarInstalacionActiva();

      if (!disponibilidad.ok) {
        mostrarModalConexion(
          'error',
          'No se ha podido conectar',
          disponibilidad.mensaje ||
          t('noPuedeConectarInstalacionSeleccionada'));
        return;
      }

      const resultadoSesion = await sincronizarSesionInstalacion(instalacionCompleta);

      if (!resultadoSesion.ok) {
        mostrarModalConexion(
          'error',
          'No se ha podido conectar',
          resultadoSesion.mensaje ||
          'Revisa la IP, el usuario o la clave de esta instalación.'
        );
        return;
      }

      if (resultadoSesion.tipo === 'sin_login') {
        mostrarModalConexion(
          'success',
          t('instalacionSeleccionada'),
          t('ipAplicadaSinCredenciales'),
          true
        );
        return;
      }

      mostrarModalConexion(
        'success',
        t('conexionExitosa'),
        t('instalacionConectadaCorrectamente'),
        true
      );

      console.log('Instalación activa:', instalacionCompleta.name);
      console.log('Disponibilidad:', disponibilidad.tipo);
      console.log('Sesión:', resultadoSesion.tipo);
    } catch (error: any) {
      console.log('Error seleccionando instalación', error);

      mostrarModalConexion(
        'error',
        'No se ha podido conectar',
        error?.message || 'Ha ocurrido un error al conectar con la instalación.'
      );
    }
  };

  const handleRender2 = (item: farmFacility) => {
    return (


      <List.Item
        style={{ paddingHorizontal: 10 }}
        titleStyle={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: '#0a0a0a' }}
        descriptionStyle={{ fontSize: 16, fontWeight: '100', textAlign: 'left', color: '#940909', paddingTop: 5 }}
        title={item.name.toUpperCase()}
        description={`${item.location}    ${item.province}`}
        left={props => (
          <View style={[props.style, { width: 40, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons
              name="home-outline"
              size={24}
              color={props.color ?? '#6b7280'}
            />
          </View>
        )}
        right={() => (
          <View style={styles.radioContainer}>
            <RadioButton.Android
              value={item.id.toString()}
              status={value === item.id.toString() ? 'checked' : 'unchecked'}
              onPress={() => seleccionarInstalacion(item)}
              color="#0F766E"
              uncheckedColor="#4B5563"
            />
          </View>
        )} onPress={() => navigation.navigate('Farm detalils', { id: item.id, isNewFarm: false, SetectedValue: Number(value) })}
      />
    );
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.nodataContainer}>
        <Text style={styles.nodata}>{t('common:Nodata')}</Text>
      </View>
    );
  }

  const normalizarCampoQR = (valor: any) => {
    if (valor === null || valor === undefined) {
      return '';
    }

    return String(valor);
  };

  const obtenerInstalacionDesdeQR = (contenido: any) => {
    const tipo = String(contenido?.type ?? '').trim();
    const version = Number(contenido?.version);

    if (tipo !== 'DOSIMAC_INSTALLATION') {
      throw new Error(`Tipo incorrecto: ${tipo || 'vacío'}`);
    }

    if (version !== 1) {
      throw new Error(`Versión incorrecta: ${contenido?.version ?? 'vacía'}`);
    }

    if (!contenido?.data || typeof contenido.data !== 'object') {
      throw new Error('El QR no contiene datos de instalación.');
    }

    const data = contenido.data;

    return {
      name: normalizarCampoQR(data.name),
      location: normalizarCampoQR(data.location),
      province: normalizarCampoQR(data.province),
      serverIp: normalizarCampoQR(data.serverIp),
      userName: normalizarCampoQR(data.userName),
      password: normalizarCampoQR(data.password),
      ssid: normalizarCampoQR(data.ssid),
      wifiPassword: normalizarCampoQR(data.wifiPassword),
    };
  };

  const abrirScannerQR = async () => {
    setQrEscaneado(false);

    const estadoCamara = await check(PERMISSIONS.IOS.CAMERA);

    if (estadoCamara === RESULTS.GRANTED) {
      setScannerVisible(true);
      return;
    }

    const nuevoEstado = await request(PERMISSIONS.IOS.CAMERA);

    if (nuevoEstado !== RESULTS.GRANTED) {
      mostrarModalConexion(
        'error',
        t('permisoCamaraNecesario'),
        t('permisoCamaraQrTexto')
      );
      return;
    }

    setScannerVisible(true);
  };

  const cerrarScannerQR = () => {
    setScannerVisible(false);
    setQrEscaneado(false);
  };

  const procesarCodigoQR = (event: any) => {
    if (qrEscaneado) {
      return;
    }

    setQrEscaneado(true);

    let textoQR = '';

    try {
      textoQR = String(event?.nativeEvent?.codeStringValue ?? '').trim();

      if (!textoQR) {
        throw new Error('El QR se ha leído vacío.');
      }

      textoQR = textoQR.replace(/^\uFEFF/, '');

      const prefijo = 'DOSIMAC_INSTALLATION::';

      if (!textoQR.startsWith(prefijo)) {
        throw new Error(
          t('qrNoEsInstalacionDosimac')
        );
      }

      const jsonLimpio = textoQR.replace(prefijo, '');
      const contenido = JSON.parse(jsonLimpio);

      const instalacionImportada = obtenerInstalacionDesdeQR(contenido);

      setScannerVisible(false);
      setQrEscaneado(false);

      navigation.navigate('Farm detalils', {
        id: 0,
        isNewFarm: true,
        SetectedValue: Number(value) || 0,
        importedFarm: instalacionImportada,
      });
    } catch (error: any) {
      setScannerVisible(false);
      setQrEscaneado(false);

      mostrarModalConexion(
        'error',
        t('qrNoValido'),
        error?.message || 'Este código QR no contiene una instalación DOSIMAC válida.'
      );
    }
  };

  return (


    <ScrollView>

      <Appbar.Header elevated>

        <Appbar.BackAction onPress={goToHome} />
        <Appbar.Content title={t('common:Lista_instalaciones')} />
        <Appbar.Action
          accessibilityLabel="Escanear QR de instalación"
          icon={({ size, color }) => (
            <Ionicons
              name="scan-outline"
              size={size}
              color={color}
            />
          )}
          onPress={abrirScannerQR}
        />
        <Appbar.Action icon="add" onPress={() => { navigation.navigate("Farm detalils", { id: 0, isNewFarm: true, SetectedValue: 0 }) }} />
        {/* <Appbar.Action icon="add" onPress={() => {UseSetFirstElement(!setFirstElment)}} /> */}
      </Appbar.Header>


      {/* <FlatList

            data={itemLista}
            renderItem={({item})=>handleRender2(item)}
            keyExtractor={(item)=>item.id.toString()}
            // extraData={renderFlag}
         /> */}


      <RadioButton.Group
        value={value}
        onValueChange={(nuevoValor) => {
          const instalacionSeleccionada = farms.find(
            (farm) => String(farm.id) === String(nuevoValor)
          );

          if (instalacionSeleccionada) {
            seleccionarInstalacion(instalacionSeleccionada);
          }
        }}
      >
        {loading ? null : farms.length === 0 ? (
          renderEmptyList()
        ) : (
          <View>
            {farms.map(item => (
              <View key={item.id}>
                {handleRender2(item)}
                <Divider style={{ height: 8, backgroundColor: 'lightgray' }} />
              </View>
            ))}
          </View>
        )}
      </RadioButton.Group>
      <Modal
        visible={scannerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={cerrarScannerQR}
      >
        <View style={styles.scannerContainer}>
          <Appbar.Header elevated>
            <Appbar.BackAction onPress={cerrarScannerQR} />
            <Appbar.Content title="Escanear instalación" />
          </Appbar.Header>

          <View style={styles.scannerBody}>
            <Camera
              style={styles.scannerCamera}
              cameraType={CameraType.Back}
              scanBarcode={true}
              showFrame={true}
              laserColor="red"
              frameColor="white"
              onReadCode={procesarCodigoQR}
            />

            <View style={styles.scannerInfoBox}>
              <Ionicons
                name="qr-code-outline"
                size={34}
                color="#FFFFFF"
              />

              <Text style={styles.scannerInfoTitle}>
                {t('escaneaCodigoQr')}
              </Text>

              <Text style={styles.scannerInfoText}>
                {t('colocaQrInstalacionCamara')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={modalConexionVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalConexion}
      >
        <View style={styles.modalConexionOverlay}>
          <View style={styles.modalConexionCard}>
            <View
              style={[
                styles.modalConexionIconBox,
                {
                  backgroundColor:
                    modalConexionTipo === 'success'
                      ? '#DCFCE7'
                      : modalConexionTipo === 'error'
                        ? '#FEE2E2'
                        : '#E0F2FE',
                },
              ]}
            >
              {modalConexionTipo === 'loading' ? (
                <ActivityIndicator size="large" color="#0891B2" />
              ) : (
                <Ionicons
                  name={
                    modalConexionTipo === 'success'
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={44}
                  color={
                    modalConexionTipo === 'success'
                      ? '#16A34A'
                      : '#DC2626'
                  }
                />
              )}
            </View>

            <Text style={styles.modalConexionTitulo}>
              {modalConexionTitulo}
            </Text>

            <Text style={styles.modalConexionTexto}>
              {modalConexionTexto}
            </Text>

            {modalConexionTipo === 'error' && (
              <Pressable
                style={styles.modalConexionBotonError}
                onPress={cerrarModalConexion}
              >
                <Text style={styles.modalConexionBotonTexto}>
                  {t('Aceptar')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>

  );
};


const styles = StyleSheet.create({
  boton: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
    margin: 3,
    marginHorizontal: 10,
    color: 'black',

  },
  lista: {
    backgroundColor: 'lightblue',
    fontSize: 10,

    color: 'black',
    padding: 10,
  },
  container: { flex: 1, paddingTop: 10, paddingHorizontal: 10, backgroundColor: '#fff' },
  head: { height: 44, backgroundColor: 'lavender', fontSize: 30 },
  row: { height: 40, backgroundColor: 'lightyellow' },
  headerContainer: {
    flex: 1,
    backgroundColor: 'lightgreen',
    paddingHorizontal: 10,

  },
  headerText: {
    color: 'black',

    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingVertical: 10,

  },
  nodataContainer: {
    // flex: 1, 
    alignContent: 'center',
    justifyContent: 'center',

    alignItems: 'center',
    marginTop: 30,
    backgroundColor: 'lightgrey',
    paddingHorizontal: 10,
  },
  nodata: {
    color: 'red',
    fontSize: 20,
    padding: 30,
  },
  radioContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConexionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalConexionCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalConexionIconBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  modalConexionTitulo: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },

  modalConexionTexto: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 23,
  },

  modalConexionBotonError: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  modalConexionBotonTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scannerBody: {
    flex: 1,
    backgroundColor: '#000000',
  },

  scannerCamera: {
    flex: 1,
    width: '100%',
  },

  scannerInfoBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },

  scannerInfoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },

  scannerInfoText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },


});

const itemLista: farmFacility[] = [
  {
    name: 'granja 1',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 1,
  },
  {
    name: 'granja 2',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 2,
  },
  {
    name: 'granja 3',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 3,
  },
  {
    name: 'granja 4',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 4,
  },
  {
    name: 'granja 5',
    location: 'churra 1234567890 1234567890 123456789',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 5,
  },
  {
    name: 'granja 6',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 6,
  },
  {
    name: 'granja 7',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 7,
  },
  {
    name: 'granja 8',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 8,
  },
  {
    name: 'granja 9',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 9,
  },

  {
    name: 'granja 10',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 10,
  },
  {
    name: 'granja 11',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 11,
  },
  {
    name: 'granja 12',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 12,
  },
  {
    name: 'granja 13',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 13,
  },
  {
    name: 'granja 14',
    location: 'churra',
    province: 'murcia',
    userName: 'Luis',
    password: '00000',
    ssid: 'miwifi',
    wifiPassword: '123456',
    serverIp: '192.168.1.1',
    id: 14,
  },
  {
    name: 'granja 15',
    location: 'santomera',
    province: 'alicante',
    userName: 'pedro',
    password: '777777',
    ssid: 'miwifi2',
    wifiPassword: '999999',
    serverIp: '192.168.1.2',
    id: 15,
  },
];