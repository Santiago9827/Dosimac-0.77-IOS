/* eslint-disable prettier/prettier */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DrawerActions, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
import { FarmListNavigator } from './FarmListNavigator';
import { GeneralHomeScreen } from './GeneralHomeScreen';
import { GeneralStackNavigator } from './GeneralStackNavigator';
import { CapturaAnimalStackNavigator } from './CapturaAnimalStackNavigator';

const Tab = createBottomTabNavigator();
const AltaDispositivosStack = createStackNavigator();

const AltaDispositivosStackNavigator = () => {
  return (
    <AltaDispositivosStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AltaDispositivosStack.Screen
        name="AltaDispositivosHome"
        component={HomeScreen}
      />

      <AltaDispositivosStack.Screen
        name="FarmList"
        component={FarmListNavigator}
      />
    </AltaDispositivosStack.Navigator>
  );
};

const primary = '#4C1D95';

function HeaderMenuButton({ navigation }: any) {
  return (
    <Pressable
      onPress={() => {
        navigation.getParent()?.dispatch(DrawerActions.toggleDrawer());
      }}
      style={{
        marginLeft: 14,
        padding: 6,
      }}
    >
      <Ionicons
        name="menu-outline"
        size={30}
        color={primary}
      />
    </Pressable>
  );
}



export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="AltaDispositivosTab"
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerLeft: () => <HeaderMenuButton navigation={navigation} />,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse-outline';

          if (route.name === 'AltaDispositivosTab') {
            iconName = 'add-circle-outline';
          }

          if (route.name === 'GeneralTab') {
            iconName = 'grid-outline';
          }

          if (route.name === 'CapturaAnimalTab') {
            iconName = 'paw-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="AltaDispositivosTab"
        component={AltaDispositivosStackNavigator}
        options={{
          title: 'Alta dispositivos',
          tabBarLabel: 'Alta Dispositivos',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="GeneralTab"
        component={GeneralStackNavigator}
        options={({ route }) => {
          const rutaActual = getFocusedRouteNameFromRoute(route) ?? 'GeneralHome';

          const ocultarHeader =
            rutaActual === 'LectorMaternidad' ||
            rutaActual === 'LectorGestacion';

          return {
            title: 'Movimientos',
            tabBarLabel: 'Movimientos',
            headerShown: !ocultarHeader,
          };
        }}
      />
      <Tab.Screen
  name="CapturaAnimalTab"
  component={CapturaAnimalStackNavigator}
  options={{
    title: 'Funcionalidades',
    tabBarLabel: 'Funcionalidades',
  }}
/>
    </Tab.Navigator>
  );
};