import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { NoAlimentadosMaternidadScreen } from './NoAlimentadosMaternidadScreen';
import { NoAlimentadosGestacionScreen } from './NoAlimentadosGestacionScreen';

const TopTab = createMaterialTopTabNavigator();

export const AnimalesNoAlimentadosScreen = () => {
  return (
    <TopTab.Navigator
      initialRouteName="NoAlimentadosMaternidad"
      screenOptions={{
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
          shadowColor: '#000000',
          shadowOpacity: 0.04,
          shadowRadius: 4,
          shadowOffset: {
            width: 0,
            height: 2,
          },
        },

        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '900',
          textTransform: 'none',
        },

        tabBarPressColor: '#EEF2FF',
      }}
    >
      <TopTab.Screen
        name="NoAlimentadosMaternidad"
        component={NoAlimentadosMaternidadScreen}
        options={{
          title: 'Maternidad',
        }}
      />

      <TopTab.Screen
        name="NoAlimentadosGestacion"
        component={NoAlimentadosGestacionScreen}
        options={{
          title: 'Gestación',
        }}
      />
    </TopTab.Navigator>
  );
};