/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prettier/prettier */
import React from 'react';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
import { globalColors } from '../theme/theme';
import { Linking, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { IonIcon } from '../components/shared/IonIcon';
import { Divider } from 'react-native-paper';
import { LoginScreen } from '../screens/login/login';
import { LanguageSettingsScreen } from '../screens/settings/Languagesettings';
import { useTranslation } from 'react-i18next';
import { FarmListNavigator } from './FarmListNavigator';
import { DebugNavigator } from './DebugNavigator';
import { MaintenaceStackNavigator } from './MaintenaceStackNavigator';
import { DRStackNavigator } from './dr_StackNavigator';
import { isDebugMode } from '../../sharedTypes/globlaVars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { Text } from 'react-native'; // <-- asegúrate de tenerlo importado
import { SettingsStackNavigator } from './SettingsStackNavigator';





const Drawer = createDrawerNavigator();


export const SideMenuNavigator = () => {

   const dimensions = useWindowDimensions();
   const { t } = useTranslation();




   return (
      <Drawer.Navigator


         drawerContent={(props) => <CustomDrawerContent {...props} />}
         // initialRouteName={'Debug'}



         screenOptions={{
            headerShown: false,
            drawerType: 'slide',


            drawerActiveBackgroundColor: globalColors.primary,
            drawerActiveTintColor: 'white',
            drawerInactiveTintColor: globalColors.primary,

            drawerStyle: {
               marginTop: 30,
               //flex:1,
               //flexDirection:'row-reverse',


            },

            drawerItemStyle: {
               borderRadius: 100,
               paddingHorizontal: 20,
               // marginTop:5,
            }
         }}

      >

         {/* drawerContent={ (props)=><CustomDrawerContent {...props} /> } */}

         {/* <Drawer.Screen name="Home" component={StackNavigator} /> */}
         {/* <Drawer.Screen options={{ drawerIcon:({color})=>(<IonIcon name="folder-open" color={color}/>)}} name="Tabs" component={BottomTabNavigator} /> */}

         {/* <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="home-outline" color={color} />) }} name={t('common:Tabs')} component={BottomTabNavigator} /> */}

         {/* <Drawer.Screen options={{drawerIcon:({color})=>(<IonIcon name="bluetooth" color={color}/>)}} name="BLE Testing" component={BLETestingScreen} /> */}

         {/* <Drawer.Screen options={{drawerIcon:({color})=>(<IonIcon name="airplane" color={color}/>)}} name="Farm List" component={FarmListScreen} /> */}

         <Drawer.Screen
            name="Tabs"
            component={BottomTabNavigator}
            options={{ drawerIcon: ({ color }) => <IonIcon name="home-outline" color={color} />, title: t('common:Tabs') }}
         />
         <Drawer.Screen
            name="Register"
            component={DRStackNavigator}
            options={{ drawerIcon: ({ color }) => <IonIcon name="add-outline" color={color} />, title: t('common:DosimacRegistration') }}
         />
         <Drawer.Screen
            name="FarmList"
            component={FarmListNavigator}
            options={{ drawerIcon: ({ color }) => <IonIcon name="document-text-outline" color={color} />, title: t('common:Lista_instalaciones') }}
         />
         <Drawer.Screen
            name="Settings"                         // ← FIJO
            component={SettingsStackNavigator}
            options={{
               title: t('common:settings'),
               drawerItemStyle: { height: 0 },       // lo oculta visualmente
               drawerLabel: () => null,
            }}
         />


         {/* <Drawer.Screen options={{drawerIcon:({color})=>(<IonIcon name="airplane" color={color}/>)}} name="Farm Settings" component={FarmScreen} /> */}
         {isDebugMode && (
            <>
               <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="log-in-outline" color={color} />) }} name="Login" component={LoginScreen} />

               <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="chatbubbles-outline" color={color} />) }} name="Language Settings" component={LanguageSettingsScreen} />
            </>
         )}
         {isDebugMode && (
            <>
               <Drawer.Screen options={{ drawerItemStyle: { marginTop: 40, paddingHorizontal: 20, }, drawerLabel: "Debug options", drawerIcon: ({ color }) => (<IonIcon name="bug-outline" color={color} />) }} name="Debug" component={DebugNavigator} />
               <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="build-outline" color={color} />) }} name={t('common:Maintenance')} component={MaintenaceStackNavigator} />
            </>
         )}



      </Drawer.Navigator>
   );
};
const CustomDrawerContent = (props: DrawerContentComponentProps) => {
   const { t } = useTranslation();
   const insets = useSafeAreaInsets();
   const focused = props.state.routeNames[props.state.index] === 'Settings';
   const activeBg = globalColors.primary;
   const activeTint = 'white';
   const inactiveTint = globalColors.primary;

   return (
      <DrawerContentScrollView
         {...props}
         contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
      >
         {/* Lista completa. Settings no se verá por las options de arriba */}
         <DrawerItemList {...props} />

         {/* Footer abajo */}
         <View style={{ marginTop: 'auto' }}>
            <Text
               style={{
                  marginLeft: 16,
                  marginBottom: 6, // un pequeño margen antes de la línea
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#666',
               }}
            >
               {/* Si tienes la clave en i18n, úsala; si no, caerá en 'softwareVersion' */}
               {t('common:softwareVersion', { defaultValue: 'softwareVersion' })} 2
            </Text>

            <Divider style={{ marginHorizontal: 16, marginBottom: 4 }} />


            <DrawerItem
               label={t('common:settings', { defaultValue: 'Ajustes' })}
               icon={() => (
                  <IonIcon
                     name="settings-outline"
                     color={focused ? activeTint : inactiveTint}
                  />
               )}
               labelStyle={{ color: focused ? activeTint : inactiveTint }}
               style={[
                  { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
                  focused && { backgroundColor: activeBg },
               ]}
               onPress={() => {
                  const nav = props.navigation;
                  nav.closeDrawer();
                  setTimeout(() => nav.navigate('Settings' as never), 120);
               }}
            />

         </View>
      </DrawerContentScrollView>
   );
};