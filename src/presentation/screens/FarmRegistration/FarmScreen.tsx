
import { useFocusEffect } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  View,
  Alert,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Appbar, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GetFarmDataById, InsertFarmData, UpdateFarmData, deleteFarmById } from '../../../FarmDB/farmsDB';
import { farmFacility } from '../../../sharedTypes/farmInterface';
import { vglobal } from '../../../sharedTypes/globlaVars';
import { farmStore } from '../../../stores/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { IonIcon } from '../../components/shared/IonIcon';
import { guardarBaseUrlDesdeServerIp, validarInstalacionActiva } from "../../../stores/ipConfig";
import { sincronizarSesionInstalacion } from './sincronizarSesionInstalacion';

export const FarmScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('');
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [userName, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverIp, setServerIp] = useState('');

  const sfarm = farmStore((state) => state.farm);
  const UseSetNewFarm = farmStore((state) => state.UseSetNewFarm);
  const UsesetFarmDataChange = farmStore((state) => state.UsesetFarmDataChange);
  const UseresetFarm = farmStore((state) => state.resetFarm);

  const [flatTextSecureEntry, setFlatTextSecurityEntry] = useState(true);
  const [UserSecureEntry, setUserSecurityEntry] = useState(true);

  let farmData2: farmFacility;
  const { t } = useTranslation();

  const fetchFarmData = async (id: number) => {
    const farmData: farmFacility = await GetFarmDataById(id);
    setfarmdata(farmData);
  };

  const setfarmdata = (farmData: farmFacility) => {
    setName(farmData.name);
    setLocation(farmData.location);
    setProvince(farmData.province);
    setSsid(farmData.ssid);
    setWifiPassword(farmData.wifiPassword);
    setUsername(farmData.userName);
    setPassword(farmData.password);
    setServerIp(farmData.serverIp);
  };

  const fillFarmData2 = () => {
    farmData2 = {
      name,
      location,
      province,
      userName,
      password,
      ssid,
      wifiPassword,
      serverIp,
      id: route.params.id,
    };
  };

  const Inicilizefarmdata = () => {
    setName('');
    setLocation('');
    setProvince('');
    setSsid('');
    setWifiPassword('');
    setUsername('');
    setPassword('');
    setServerIp('');
  };

  useFocusEffect(
    React.useCallback(() => {
      if (route.params.isNewFarm) Inicilizefarmdata();
      else fetchFarmData(route.params.id);
      return () => { };
    }, [])
  );

  const submitData = async () => {
    const serverIpLimpia = serverIp.trim();
    const usernameLimpio = userName.trim();
    const passwordLimpia = password.trim();

    const tieneUsername = !!usernameLimpio;
    const tienePassword = !!passwordLimpia;

    if (!serverIpLimpia) {
      Alert.alert(
        "IP no configurada",
        "Introduce la Dirección IP del Servidor."
      );
      return;
    }

    if (tieneUsername !== tienePassword) {
      Alert.alert(
        "Datos incompletos",
        "Rellena Username y Clave, o deja ambos campos vacíos."
      );
      return;
    }

    try {
      /**
       * 1. Guardamos la IP activa para que la usen los endpoints.
       */
      await guardarBaseUrlDesdeServerIp(serverIpLimpia);

      /**
       * 2. Comprobamos si la instalación responde.
       * Si no responde, NO bloqueamos el guardado.
       */
      const disponibilidad = await validarInstalacionActiva();

      const farmDataGuardar: farmFacility = {
        name,
        location,
        province,
        userName: usernameLimpio,
        password: passwordLimpia,
        ssid,
        wifiPassword,
        serverIp: serverIpLimpia,
        id: route.params.id,
      };

      /**
       * 3. Guardamos la instalación en la base local.
       */
      if (route.params.isNewFarm) {
        await InsertFarmData(farmDataGuardar);
      } else {
        await UpdateFarmData(farmDataGuardar);
      }

      UsesetFarmDataChange();

      if (route.params.id === 0) {
        if (!sfarm) {
          UseSetNewFarm(1);
        }
      } else if (sfarm && route.params.id === sfarm.id) {
        UseSetNewFarm(route.params.id);
      }

      /**
       * 4. Si no hay conexión, dejamos la instalación guardada,
       * pero no intentamos login.
       */
      if (!disponibilidad.ok) {
        Alert.alert(
          "Instalación guardada sin conexión",
          disponibilidad.mensaje ||
          "La instalación se ha guardado, pero no se ha podido conectar con el servidor."
        );

        navigation.goBack();
        return;
      }

      /**
       * 5. Si la instalación responde, sincronizamos sesión:
       * IP + login/token si tiene Username y Clave.
       */
      const resultadoSesion = await sincronizarSesionInstalacion(farmDataGuardar);

      if (!resultadoSesion.ok) {
        Alert.alert(
          "Instalación guardada con aviso",
          resultadoSesion.mensaje ||
          "La instalación se ha guardado, pero no se pudo iniciar sesión."
        );

        navigation.goBack();
        return;
      }

      if (resultadoSesion.tipo === "sin_login") {
        Alert.alert(
          "Instalación guardada",
          "La instalación se ha guardado correctamente, pero no tiene Username y Clave."
        );

        navigation.goBack();
        return;
      }

      Alert.alert(
        "Instalación guardada",
        "La instalación se ha guardado correctamente y la sesión se ha iniciado."
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo guardar la instalación."
      );
    }
  };


  const deleteFarm = async () => {
    vglobal.coinciden = false;
    if (route.params.isNewFarm) {
      Alert.alert(t("NoSePuedeBorrarGranja"), "");
    } else {
      await deleteFarmById(route.params.id);
      if (route.params.id === route.params.SetectedValue) {
        UseresetFarm();
      }
      navigation.goBack();
    }
  };

  // ====== SCROLL & KEYBOARD ======
  const scrollRef = useRef<ScrollView>(null);

  // Ajusta este offset según tu header/toolbar real.
  // 64 suele ir bien (header ~56 + status bar).
  const KEYBOARD_OFFSET_IOS = 64;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Appbar FUERA del ScrollView */}
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title={t('common:DetallesInstalacion')} />
        <Appbar.Action
          icon={(props) => (
            <MaterialCommunityIcons name="delete" size={props.size} color={props.color} />
          )}
          onPress={() => {
            Alert.alert(
              t('BorrarGranja'),
              t('Deseaborrarlagranja'),
              [
                { text: t('Cancelar'), style: 'cancel' },
                { text: 'OK', style: 'destructive', onPress: () => deleteFarm() },
              ],
              { cancelable: true }
            );
          }}
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_OFFSET_IOS : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          overScrollMode="always"
          showsVerticalScrollIndicator
          contentInsetAdjustmentBehavior="always"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
        >
          <View style={{ marginTop: 20, gap: 10, marginHorizontal: 10, paddingHorizontal: 10 }}>
            <TextInput label={t("NombreGranja")} mode="outlined" placeholder="Nombre de la granja" value={name} onChangeText={setName} />
            <TextInput label={t("Localidad")} mode="outlined" placeholder="Población" value={location} onChangeText={setLocation} />
            <TextInput label={t("Provincia")} mode="outlined" placeholder="Provincia" value={province} onChangeText={setProvince} />
            <TextInput label={t("NombreWifi")} mode="outlined" placeholder="Nombre red WIFI" value={ssid} onChangeText={setSsid} />
            <TextInput
              label={t("PasswordWifi")}
              mode="outlined"
              placeholder="Wifi Password"
              value={wifiPassword}
              onChangeText={setWifiPassword}
              secureTextEntry={flatTextSecureEntry}
              right={
                <TextInput.Icon
                  icon={() => <IonIcon name={flatTextSecureEntry ? 'eye-outline' : 'eye-off-outline'} size={24} color="black" />}
                  onPress={() => setFlatTextSecurityEntry(!flatTextSecureEntry)}
                  forceTextInputFocus={false}
                />
              }
            />

            <TextInput label={t("username")} mode="outlined" placeholder="Nombre usuario" value={userName} onChangeText={setUsername} />
            <TextInput
              label={t("password")}
              mode="outlined"
              placeholder="Password usuario"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={UserSecureEntry}
              right={
                <TextInput.Icon
                  icon={() => <IonIcon name={UserSecureEntry ? 'eye-outline' : 'eye-off-outline'} size={24} color="black" />}
                  onPress={() => setUserSecurityEntry(!UserSecureEntry)}
                  forceTextInputFocus={false}
                />
              }
            />

            <TextInput
              keyboardType="default"
              label={t("Server")}
              mode="outlined"
              placeholder="IP Servidor"
              value={serverIp}
              onChangeText={setServerIp}
              onFocus={() => {
                // Al enfocar el último campo, desplaza al final para evitar solape
                requestAnimationFrame(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                });
              }}
            />

            <Pressable
              android_ripple={{ color: 'blue' }}
              style={styles.boton}
              onPress={submitData}
            >
              <Text style={styles.texto}>{t('common:Guardar')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boton: {
    backgroundColor: 'green',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  texto: {
    fontSize: 20,
    color: 'white',
  },
});
