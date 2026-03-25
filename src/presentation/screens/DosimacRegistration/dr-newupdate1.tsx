// /* eslint-disable prettier/prettier */
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Appbar, Button, MD2Theme, MD3Theme, useTheme, RadioButton, Divider, Portal, Dialog } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Link, useFocusEffect, useNavigation } from '@react-navigation/native';
import { globalStyles } from '../../theme/theme';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { CPrimaryButton } from '../../components/shared/CPrimaryButton';
import { PrimaryButton } from '../../components/shared/PrimaryButton';
import { MainButton } from '../../components/shared/MainButton ';
import { vgDoRegistration } from '../../../sharedTypes/gvarsDosimacRegistration';
import { farmStore } from '../../../stores/store';
import { globals } from '../../../sharedTypes/globlaVars';
//import {glDispenserType} from '../../../sharedTypes/globlaVars'; 



// RootStackParamList.ts
export type RootStackParamList = {
   'DR-STARTSCAN': { operacion: number };
   // otras pantallas…
};


// export const useExampleTheme = () => useTheme<MD2Theme | MD3Theme>();


export default function Drnewupdate() {
   const { t } = useTranslation();
   const navigation = useNavigation<any>();
   const theme = useTheme();
   const [visible, setVisibles] = React.useState(true);

   const sfarm = farmStore((state) => state.farm);


   const inicializeVars = () => {
      vgDoRegistration.operationType = 0;

   }

   const goNextScreen = (value: number) => {
      vgDoRegistration.operationType = value;
      navigation.navigate('DR-STARTSCAN', { operacion: value });


   }

   useEffect(() => {

      inicializeVars();
      setVisibles(true);
   }, [])

   useFocusEffect(
      React.useCallback(() => {
         setVisibles(true);
         return () => {
            setVisibles(false);
            // Do something when the screen is unfocused
            // Useful for cleanup functions
         };
      }, [])
   );

   const goToPublicHome = () => {
  // si Drnewupdate está dentro del stack "Register", su parent suele ser el Drawer (PublicDrawer)
  const parent = navigation.getParent?.();
  if (parent?.navigate) {
    parent.navigate('PublicHome'); // ✅ usa el nombre real de tu PublicDrawerNavigator
  } else {
    navigation.navigate('PublicHome');
  }
};



   const dohideDialog = () => {
      setVisibles(false);
      goToPublicHome();

   }

   return (
      <View>
         <Appbar.Header elevated>

            <Appbar.BackAction onPress={navigation.goBack} />
            <Appbar.Content title={t('common:DosimacRegistration')} />
            {/* <Appbar.Action icon="add" onPress={() => {}} /> */}
         </Appbar.Header>

         <View >

            {sfarm ? <View  >
               <View className='flex-col h-full w-full items-center bg-gray-200'>
                  <Pressable
                     className='h-28 rounded-2xl  bg-teal-700 justify-center items-center w-[80%] mt-20'

                     onPress={() => { globals.dispenserType = 1; goNextScreen(1) }}


                  >
                     <Text className='text-yellow-100 font-bold text-3xl'>{t('common:DosimacI')}</Text>
                     <Text className='text-slate-200 font-RobotoRegular text-xl font-bold'>{t('common:NewDmMaternity')}</Text>

                  </Pressable>

                  {/* <Divider style={{ marginVertical: 20 }} bold={true} /> */}

                  <Pressable
                     className='h-28 rounded-2xl  bg-teal-700 justify-center items-center w-[80%] mt-20'
                     onPress={() => { globals.dispenserType = 3; goNextScreen(3) }}
                  >
                     <Text className='text-yellow-100 font-bold text-3xl'>{t('common:DosimacG')}</Text>
                     <Text className='text-slate-200 font-RobotoRegular text-xl font-bold'>{t('common:NewDmGestation')}</Text>

                  </Pressable>


               </View>
            </View> :
               <View>
                  <Portal>
                 <Dialog visible={visible} onDismiss={dohideDialog}>
                        <Dialog.Icon icon="warning" color="red" size={60} />
                        <Dialog.Title style={{ color: 'red' }}>{t('common:Aviso')}</Dialog.Title>
                        <Dialog.Content>
                           <Text style={{ color: theme.colors.onSurface }}>

                              {t('common:configuarIntalacion')}
                           </Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                           <Button onPress={dohideDialog}>{t('common:Aceptar')}</Button>
                        </Dialog.Actions>
                     </Dialog>
                  </Portal>

                  {/* <Text>Debe seleccionar una finca</Text> */}
               </View>

            }






         </View>

      </View>
   )
}

const styles = StyleSheet.create({
   row: {
      //   flexDirection: 'row',
      //   flexWrap: 'wrap',
      paddingHorizontal: 40,
      gap: 20,
      //   alignItems: 'center',
      marginVertical: 60,
      width: '100%',


   },
   button: {
      margin: 4,
      paddingVertical: 3,
      backgroundColor: 'darkblue',

   },
   flexReverse: {
      flexDirection: 'row-reverse',
   },
   md3FontStyles: {
      lineHeight: 32,
   },
   fontStyles: {
      fontWeight: '800',
      fontSize: 24,
   },
   flexGrow1Button: {
      flexGrow: 1,
      marginTop: 10,
   },
   width100PercentButton: {
      width: '100%',
      marginTop: 10,
   },
   customRadius: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 16,
   },
   noRadius: {
      borderRadius: 0,
   },
});