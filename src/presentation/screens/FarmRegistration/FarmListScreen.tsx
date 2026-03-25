/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appbar, Button, Caption, Divider, List, RadioButton, Switch } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native-gesture-handler';
import { FarmScreen } from './FarmScreen';
import { farmFacility } from '../../../sharedTypes/farmInterface';
import { GetFarmsList, InicialiceFarmDataTable } from '../../../FarmDB/farmsDB';
import { farmStore } from '../../../stores/store';
import { vglobal } from '../../../sharedTypes/globlaVars';
import { useAuthStore } from '../../../stores/authStore';
import Ionicons from 'react-native-vector-icons/Ionicons';




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

  const token = useAuthStore((s) => s.token);

  const goToHome = () => {
    const parent = navigation.getParent?.();

    if (token) {
      // ✅ sesión iniciada -> drawer privado
      if (parent?.navigate) parent.navigate('Tabs');
      else navigation.navigate('Tabs');
    } else {
      // ✅ sin sesión -> drawer público
      if (parent?.navigate) parent.navigate('PublicHome');
      else navigation.navigate('PublicHome');
    }
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



  useEffect(() => {
    // const fetchFarms = async () => {
    //   const farmsList = await GetFarmsList();
    //   setFarms(farmsList);
    // };


    // fetchFarms();
    console.log('reder farmlist', sfarm);

    // (if farms.length===0)

    if (sfarm)
      setValue(sfarm.id.toString());
    else {
      setValue('1');
      if (farms.length > 0)
        UseSetNewFarm(farms[0].id);
    }

    console.log('use efect de farmlist');

  }, []);

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
  //     // if (farmDataChange)
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
        right={() => <RadioButton value={item.id.toString()} />}
        onPress={() => navigation.navigate('Farm detalils', { id: item.id, isNewFarm: false, SetectedValue: Number(value) })}
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

  return (


    <ScrollView>

      <Appbar.Header elevated>

        <Appbar.BackAction onPress={goToHome} />
        <Appbar.Content title={t('common:Lista_instalaciones')} />
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
        onValueChange={nv => { setValue(nv); UseSetNewFarm(Number(nv)); }}
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
  }


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