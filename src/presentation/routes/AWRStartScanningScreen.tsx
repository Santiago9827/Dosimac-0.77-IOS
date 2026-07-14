// screens/awr/AWRStartScanningScreen.tsx
/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Appbar, Card, Text, ActivityIndicator } from 'react-native-paper';
import BleManager from 'react-native-ble-manager';
import * as ble from '../../device/ble/bleLibrary';
import { useTranslation } from 'react-i18next';


export const AWRStartScanningScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [btListo, setBtListo] = useState(false);
  const [pidiendoPermiso, setPidiendoPermiso] = useState(true);

  useEffect(() => {
    // 1) Arranca BLE manager (esto es lo que hace que iOS pueda pedir permiso)
    try { ble.BleStart(); } catch { }

    // 2) Escucha el estado del BT (on/off/unknown)
    const unsub = ble.addBtStateListener((state) => {
      const ok = state === 'on';
      setBtListo(ok);
      setPidiendoPermiso(!ok);
    });

    // 3) Fuerza a iOS a emitir el estado (y a mostrar el popup la primera vez)
    try { BleManager.checkState(); } catch { }

    return () => {
      try { unsub?.(); } catch { }
    };
  }, []);

  return (
    <View>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content title="Conexión directa" />
      </Appbar.Header>

      <View style={{ marginHorizontal: 30, marginTop: 40, borderWidth: 1, borderRadius: 10, borderColor: 'lightgrey' }}>
        <Card mode="contained">
          <Card.Content>
            <Text style={{ fontSize: 18, textAlign: 'center' }}>
              {t("awrStartScan_description")}
            </Text>

            {pidiendoPermiso && (
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 10, textAlign: 'center', color: '#64748B' }}>
                  {t("awrBluetoothPermissionMessage")}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Pressable
          disabled={!btListo}
          onPress={() => navigation.navigate('AWR-SCANRESULTS' as never)}
          style={{
            opacity: btListo ? 1 : 0.45,
          }}
        >
          <View
            style={{
              width: 180,
              height: 180,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#4f46e5',
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>
              {t("awrStartScan_button")}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};