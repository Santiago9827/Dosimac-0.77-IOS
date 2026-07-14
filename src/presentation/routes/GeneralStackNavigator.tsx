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
                name="GeneralAwrStartScan"
                component={AWRFlowStackNavigator}
            />

            <Stack.Screen
                name="GeneralAwrSaved"
                component={AWRStackNavigator}
            />

        </Stack.Navigator>
    );
};