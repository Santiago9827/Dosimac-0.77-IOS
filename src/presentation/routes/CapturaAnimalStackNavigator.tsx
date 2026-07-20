import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { CapturaAnimalHomeScreen } from './CapturaAnimalHomeScreen';
import { AnimalesNoAlimentadosScreen } from './AnimalesNoAlimentadosScreen';
import { CambioPiensoMaternidadScreen } from './CambioPiensoMaternidadScreen';
import { EstadoAnimalScreen } from './EstadoAnimalScreen';
import { EstadoAnimalDetalleScreen } from './EstadoAnimalDetalleScreen';
import { CapturaMaternidadTopTabsNavigator } from './CapturaMaternidadTopTabsNavigator';
import { GestCorralDetail } from '../../stores/GestCorralDetail';

const Stack = createStackNavigator();

export const CapturaAnimalStackNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="CapturaAnimalHome"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="CapturaAnimalHome"
                component={CapturaAnimalHomeScreen}
            />

            <Stack.Screen
                name="AnimalesNoAlimentados"
                component={AnimalesNoAlimentadosScreen}
            />
            <Stack.Screen
                name="CambioPiensoMaternidad"
                component={CambioPiensoMaternidadScreen}
            />
            <Stack.Screen
                name="EstadoAnimal"
                component={EstadoAnimalScreen}
            />
            <Stack.Screen
                name="EstadoAnimalDetalle"
                component={EstadoAnimalDetalleScreen}
            />
            <Stack.Screen
                name="CapturaDatosMaternidad"
                component={CapturaMaternidadTopTabsNavigator}
            />
            <Stack.Screen
                name="GestCorralDetail"
                component={GestCorralDetail}
            />

        </Stack.Navigator>
    );
};