import React from 'react';
import { View, Text } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CapturaPartoStackNavigator } from './CapturaPartoStackNavigator';
import { AltaBajaStackNavigator } from './AltaBajaStackNavigator';



const TopTab = createMaterialTopTabNavigator();

function PantallaSinDatos() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F6F7FB',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: '900',
          color: '#0F172A',
          textAlign: 'center',
        }}
      >
        Pantalla sin datos
      </Text>
    </View>
  );
}

export const CapturaMaternidadTopTabsNavigator = () => {
  return (
    <TopTab.Navigator
      initialRouteName="CapturaPartoTab"
      screenOptions={{
        tabBarShowIcon: false,
        tabBarActiveTintColor: '#4C1D95',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIndicatorStyle: {
          backgroundColor: '#4C1D95',
          height: 3,
          borderRadius: 999,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 48,
        },
        tabBarItemStyle: {
          height: 48,
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '900',
          textTransform: 'none',
        },
        tabBarPressColor: '#EEF2FF',
      }}
    >
      <TopTab.Screen
        name="CapturaPartoTab"
        component={CapturaPartoStackNavigator}
        options={{
          title: 'Captura parto',
        }}
      />
<TopTab.Screen
  name="AltaBajaTab"
  component={AltaBajaStackNavigator}
  options={{
    title: 'Alta/baja',
  }}
/>

      <TopTab.Screen
        name="TratamientoTab"
        component={PantallaSinDatos}
        options={{
          title: 'Tratamiento',
        }}
      />
    </TopTab.Navigator>
  );
};