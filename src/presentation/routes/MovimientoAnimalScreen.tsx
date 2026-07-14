/* eslint-disable prettier/prettier */
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MovimientoAnimalGestacionScreen } from './MovimientoAnimalGestacionScreen';
import { MovimientoAnimalMaternidadScreen } from './MovimientoAnimalMaternidadScreen';

const TopTab = createMaterialTopTabNavigator();

const PURPLE = '#4C1D95';

export const MovimientoAnimalScreen = () => {
    return (
        <TopTab.Navigator
            initialRouteName="MovimientoAnimalMaternidad"
            screenOptions={{
                tabBarActiveTintColor: PURPLE,
                tabBarInactiveTintColor: '#94A3B8',
                tabBarIndicatorStyle: {
                    backgroundColor: PURPLE,
                    height: 3,
                    borderRadius: 999,
                },
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    height: 48,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                },
                tabBarItemStyle: {
                    height: 48,
                    paddingVertical: 0,
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
                name="MovimientoAnimalMaternidad"
                component={MovimientoAnimalMaternidadScreen}
                options={{
                    title: 'Maternidad',
                }}
            />

            <TopTab.Screen
                name="MovimientoAnimalGestacion"
                component={MovimientoAnimalGestacionScreen}
                options={{
                    title: 'Gestación',
                }}
            />
        </TopTab.Navigator>
    );
};