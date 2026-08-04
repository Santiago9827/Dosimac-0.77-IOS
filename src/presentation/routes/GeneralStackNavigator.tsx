/* eslint-disable prettier/prettier */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GeneralHomeScreen } from './GeneralHomeScreen';
import { LecturaAntenaTopTabsNavigator } from './LecturaAntenaTopTabsNavigator';
import { AjustesEnvioMaternidadScreen } from './AjustesEnvioMaternidadScreen';
import { AjustesEnvioGestacionScreen } from './AjustesEnvioGestacionScreen';
import { LectorMaternidadScreen } from '../screens/lector/LectorMaternidadScreen';
import { AWRFlowStackNavigator } from './AWRFlowStackNavigator';
import { AWRStackNavigator } from './AWRStackNavigator';
import { MovimientoAnimalScreen } from './MovimientoAnimalScreen';
import { PortalScreen } from '../screens/HomeScreen/PortalScreen';
import { LectorGestacionScreen } from '../screens/lector/LectorGestacionScreen';
import { TareasMovimientosScreen } from './TareasMovimientosScreen';
import { TareasMovimientosDetalleScreen } from './TareasMovimientoDetalleScreen';
import { FiltrosTareasMovimientosScreen } from './FiltrosTareasMovimientosScreen';
import { FiltrosHistorialMovimientosScreen } from './FiltrosHistorialMovimientosScreen';
//import { AllflexBluetoothScreen } from './AllflexBluetoothScreen';



const Stack = createStackNavigator();

export const GeneralStackNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="GeneralHome"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="GeneralHome"
                component={GeneralHomeScreen}
            />

            <Stack.Screen
                name="GeneralLecturaAntena"
                component={LecturaAntenaTopTabsNavigator}
            />

            <Stack.Screen
                name="MovimientoAnimal"
                component={MovimientoAnimalScreen}
            />

            <Stack.Screen
                name="AjustesEnvioMaternidad"
                component={AjustesEnvioMaternidadScreen}
            />

            <Stack.Screen
                name="AjustesEnvioGestacion"
                component={AjustesEnvioGestacionScreen}
            />

            <Stack.Screen
                name="LectorMaternidad"
                component={LectorMaternidadScreen}
            />

            <Stack.Screen
                name="LectorGestacion"
                component={LectorGestacionScreen}
            />
            <Stack.Screen
                name="GeneralAwrStartScan"
                component={AWRFlowStackNavigator}
            />

            <Stack.Screen
                name="GeneralAwrSaved"
                component={AWRStackNavigator}
            />

            <Stack.Screen
                name="GeneralPortal"
                component={PortalScreen}
            />

            {/* <Stack.Screen
                name="GeneralAllflexBluetooth"
                component={AllflexBluetoothScreen}
            /> */}

            <Stack.Screen
                name="TareasMovimientos"
                component={TareasMovimientosScreen}
            />


            <Stack.Screen
                name="TareasMovimientosDetalle"
                component={TareasMovimientosDetalleScreen}
            />
            <Stack.Screen
                name="FiltrosTareasMovimientos"
                component={FiltrosTareasMovimientosScreen}
            />
            <Stack.Screen
                name="FiltrosHistorialMovimientos"
                component={FiltrosHistorialMovimientosScreen}
            />
        </Stack.Navigator>
    );
};