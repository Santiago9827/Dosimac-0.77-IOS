// navigators/AWRFlowStackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AWRReadScreen } from './AWRReadScreen';
import { AWRStartScanningScreen } from './AWRStartScanningScreen';
import { AWRScanResultsScreen } from './AWRScanResultsScreen';
const AWRFlowStack = createStackNavigator();

export function AWRFlowStackNavigator() {
    return (
        <AWRFlowStack.Navigator
            initialRouteName="AWR-STARTSCAN"
            screenOptions={{ headerShown: false }}
        >
            <AWRFlowStack.Screen name="AWR-STARTSCAN" component={AWRStartScanningScreen} />
            <AWRFlowStack.Screen name="AWR-SCANRESULTS" component={AWRScanResultsScreen} />
            <AWRFlowStack.Screen name="AWR-READ" component={AWRReadScreen} />
        </AWRFlowStack.Navigator>
    );
}