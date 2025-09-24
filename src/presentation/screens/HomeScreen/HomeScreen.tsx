import React from 'react';
// import { StyleSheet, Text, View } from 'react-native'
import { Text, TextInput, View } from 'react-native';
import { HamburgerMenu } from '../../components/shared/HamburgerMenu';
import { Input } from 'postcss';
import { farmStore } from '../../../stores/store';
import { Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';


export const HomeScreen = () => {
  const sfarm = farmStore((state) => state.farm);
  const { t } = useTranslation(['common']); // ← se suscribe a cambios de idioma


  return (
    // <View style={styles.Container}>
    <View>
      <HamburgerMenu />
      {/* <Text style={styles.headerText}>Home</Text> */}
      <View className="flex-col h-full justify-center items-center  ">
        <Text className="text-6xl text-slate-700 font-bold">DOSIMAC</Text>
        <Text className="text-3xl text-slate-700 font-bold">CTIFEED</Text>
        <View className="flex flex-row  pt-10 space-x-1 ">
          <View className=" h-[80px] w-5 rounded-t-lg bg-red-600"></View>
          <View className=" h-[80px] w-5 rounded-t-lg bg-cyan-500 "></View>
          <View className=" h-[80px] w-5 rounded-t-lg bg-cyan-600 "></View>

          <View className=" h-[80px] w-5 rounded-t-lg bg-cyan-800 "></View>
        </View>
        <View>
          <View className=" -mt-[110px] h-5 w-5 rounded-full bg-orange-400  "></View>
        </View>
        <View className="mt-10">

        </View>
        <Divider className='w-44 bg-black my-10' />
        {sfarm ? <View className="  flex flex-col  pt-6 px-6 py-4 rounded-xl border-gray-400  ">

          <Text className='text-lg mb-2 font-bold text-blue-800 text-center '>{t('common:Instalación_seleccionada')}</Text>
          <Text className='text-lg text-center text-slate-700'>{sfarm.name}</Text>
          <Text className='text-lg text-center text-slate-700'>{sfarm.location}</Text>
          
          {/* <Text className='text-lg'>WIFI: {sfarm.ssid}</Text>
          <Text className='text-lg'>Server: {sfarm.serverIp}</Text> */}

        </View> :
          <View className="  flex flex-col  pt-6 px-6 py-4 rounded-xl border-gray-400  ">

            <Text className='text-lg mb-2 font-bold text-red-800 text-center '>{t('common:NoInstalacionSeleccionada')}</Text>

          </View>
        }

      </View>

    </View>
  );
};

// const styles = StyleSheet.create({

//   headerText: {
//     color: 'black',

//     fontSize: 56,
//     fontWeight: 'bold',
//     textAlign: 'left',
//     paddingVertical: 10,

//   },
//   Container:{
//     flex: 1,
//     alignContent: 'center',
//     justifyContent: 'center',

//     alignItems: 'center',
//     //marginTop: 30,
//     //backgroundColor:'lightgrey',
//     paddingHorizontal: 10,
//   }
// });
