import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CapturaMaternidadEntradaScreen } from './CapturaMaternidadEntradaScreen';
import { CapturaPartoScreen } from './CapturaPartoScreen';


const Stack = createStackNavigator();

export const CapturaPartoStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="CapturaPartoEntrada"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="CapturaPartoEntrada"
        component={CapturaMaternidadEntradaScreen}
      />

      <Stack.Screen
        name="CapturaPartoFormulario"
        component={CapturaPartoScreen}
      />
    </Stack.Navigator>
  );
};