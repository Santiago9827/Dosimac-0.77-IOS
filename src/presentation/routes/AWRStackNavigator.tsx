/* eslint-disable prettier/prettier */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AWRSavedListScreen } from './AWRSavedListScreen';
import { AWRReadScreen } from './AWRReadScreen';
import { AWRScanResultsScreen } from './AWRScanResultsScreen';
import { AWRStartScanningScreen } from './AWRStartScanningScreen';


const Stack = createStackNavigator();

export const AWRStackNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AWR-SAVED-LIST" component={AWRSavedListScreen} />
        <Stack.Screen name="AWR-READ" component={AWRReadScreen} />
        {/* <Stack.Screen name="AWR-STARTSCAN" component={AWRStartScanningScreen} />

        <Stack.Screen name="AWR-SCANRESULTS" component={AWRScanResultsScreen} /> */}


        {/* <MaintenanceStack.Screen name="AWR-STARTSCAN" component={AWRStartScanningScreen} /> */}

        {/* <MaintenanceStack.Screen name="AWR-SCANRESULTS" component={AWRScanResultsScreen} /> */}



    </Stack.Navigator>
);