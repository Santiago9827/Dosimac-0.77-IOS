import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { CapturaMaternidadEntradaScreen } from './CapturaMaternidadEntradaScreen';
import { AltaBajaLechonesScreen } from './AltaBajaLechonesScreen';

const Stack = createStackNavigator();

export const AltaBajaStackNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="AltaBajaEntrada"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="AltaBajaEntrada"
        component={CapturaMaternidadEntradaScreen}
        initialParams={{
          tituloPantalla: t('altaBajaStack.tituloPantalla', {
            defaultValue: 'Alta/Baja de lechones',
          }),
          descripcionPantalla: t('altaBajaStack.descripcionPantalla', {
            defaultValue:
              'Busca la madre por corral o ID para registrar altas o bajas de lechones.',
          }),
          siguientePantalla: 'AltaBajaFormulario',
        }}
      />

      <Stack.Screen
        name="AltaBajaFormulario"
        component={AltaBajaLechonesScreen}
      />
    </Stack.Navigator>
  );
};