import React from 'react'
import { Pressable, View } from 'react-native'
import { Appbar, Text, Button, useTheme, RadioButton, Card } from 'react-native-paper';
import { MainButton } from '../../components/shared/MainButton '
import { useTranslation } from 'react-i18next'
import { globalStyles } from '../../theme/theme';

export const DRstartscanningScreen = ({ navigation, route }) => {

   const { t } = useTranslation();
   return (
      <View>

         <Appbar.Header elevated>

            <Appbar.BackAction onPress={navigation.goBack} />
            <Appbar.Content title={t('common:StartScan')} />
            {/* <Appbar.Action icon="add" onPress={() => {}} /> */}
         </Appbar.Header>

         <View style={{ marginHorizontal: 30, marginTop: 40, borderWidth: 1, borderRadius: 10, borderColor: 'lightgrey' }}>

            <Card
               mode='contained'

            >
               <Card.Content >
                  {/* <Text style={{fontSize:18}}>Presione sobre el boton para buscar dispositivos DOSIMAC</Text>                   */}
                  <Text className='font-RobotoRegular  text-[20px] text-center'>{t("TestoPresioneAlta")}</Text>

               </Card.Content>
            </Card>
         </View>


         <View style={{ ...globalStyles.row, alignItems: 'center' }}>
            <Pressable
               onPress={() => navigation.navigate('DR-SCANRESULTS', { operacion: route.params.operacion })}
            >
            <View className='flex-row   items-center justify-center w-[180px] h-[180px] bg-teal-700 rounded-full border-1 border-gray-800'>
               <Text className='text-white text-2xl font-medium'>{t("PressToScan")}</Text>
               


            </View>

            </Pressable>

            {/* <View style={{ width: 180, height: 180 }}>

               <Button mode="contained" onPress={() => navigation.navigate('DR-SCANRESULTS', { operacion: route.params.operacion })}
                  contentStyle={{ height: 180, width: 180, borderRadius: 2, borderColor: 'red', elevation: 1 }}
                  className='bg-teal-700  border-gray-500'

                  theme={{ roundness: 100 }}
                  rippleColor={'white'}


                  labelStyle={{ color: 'white', fontSize: 16, fontWeight: '600' }}
               >
                  {t('common:PressToScan')}
               </Button>
            </View> */}


            {/* <Pressable 
           >
               <Text
                  style={{backgroundColor:'blue',
                  width:100, height:100,
                  borderRadius:100,
                  elevation:3,
                  textAlign:'center',
                  textAlignVertical:'center',
                  color:'white',
      
                  }}
               >hola</Text>
            </Pressable> */}





         </View>
      </View>

   )
}
