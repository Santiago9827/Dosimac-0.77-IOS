/* eslint-disable prettier/prettier */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Tab1Screen } from '../screens/tabs/Tab1Screen';
import { Tab2Screen } from '../screens/tabs/Tab2Screen';
import { Tab3Screen } from '../screens/tabs/Tab3Screen';
import { globalColors } from '../theme/theme';
import { Text } from 'react-native';
import { TopTabsNavigator } from './TopTabsNavigator';

import { HomeDebugScreen } from '../screens/Debug/HomeDebugScreen/HomeDebugScreen';
import { IonIcon } from '../components/shared/IonIcon';
import { DebugNavigator } from './DebugNavigator';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { GestationScreen } from '../screens/Gestation/Gestation';
import { MaternityScreen } from '../screens/Maternity/Maternity';
import { MaternityStackNavigator } from './Mat-StackNavigator';
import { isDebugMode } from '../../sharedTypes/globlaVars';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { t } = useTranslation('common'); 
  return (
    <Tab.Navigator
      sceneContainerStyle={{
        backgroundColor: globalColors.background,
      }}

      screenOptions={{
        tabBarActiveTintColor: globalColors.primary, //color del icono del tab seleccionado
        headerShown: true,
        tabBarLabelStyle: {
          marginBottom: 5,
        },
        headerStyle: {
          elevation: 0,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          elevation: 5,
          borderStyle: 'solid',
          borderColor: '#f1f1f1',
          shadowColor: 'transparent',
          // backgroundColor:'#9FFFFf',
          // marginTop:15,
          height: 70,



        }
      }}


    >
      {/* <Tab.Screen name="Tab1" options={{title:"Inicio",tabBarIcon:({color})=>(<IonIcon name="home-outline" color={color}/>)}} component={Tab1Screen} /> */}
      {/* <Tab.Screen name="Tab1" options={{ title: "Inicio", tabBarIcon: ({ color }) => (<IonIcon name="home-outline" color={color} />) }} component={HomeScreen} /> */}
    <Tab.Screen
        name="Tab1"
        component={HomeScreen}
        options={{
          tabBarLabel: t('Tabs'),    
          title: t('Tabs'),
          tabBarIcon: ({ color }) => <IonIcon name="home-outline" color={color} />,
        }}
      />

      {isDebugMode && (
        <>
          <Tab.Screen name="Tab2" options={{ title: "Gestación", tabBarIcon: ({ color }) => (<IonIcon name="people-circle-outline" color={color} />) }} component={GestationScreen} />

          <Tab.Screen name="Tab3" options={{ title: "Maternidad", tabBarIcon: ({ color }) => (<IonIcon name="person-circle-outline" color={color} />) }} component={MaternityStackNavigator} />
        </>
      )}


      {/* <Tab.Screen name="Tab2" options={{title:"Gestacion"}}component={Tab2Screen} /> */}


      {/* <Tab.Screen name="Tab3" options={{title:"Maternidad"}}component={StackNavigator} /> */}
      {/* <Tab.Screen name="Tab3" options={{title:"Maternidad",tabBarIcon:({color})=>(<IonIcon name="person-circle-outline" color={color}/>)}}component={Tab3Screen} /> */}
      {/* <Tab.Screen name="Tab3" options={{title:"Maternidad",tabBarIcon:({color})=>(<IonIcon name="person-circle-outline" color={color}/>)}}component={HomeDebugScreen} /> */}


    </Tab.Navigator>
  );
};

