/// <reference types="nativewind/types" />

/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { SideMenuNavigator } from './presentation/routes/SideMenuNavigator';

import { InicialiceFarmDataTable } from './FarmDB/farmsDB';
import { InicializeProgram } from './sharedTypes/globlaVars';
import { RequestBluetoothPermissions } from './libraries/permissions/permissions';
import i18n from './localization/i18n';

const theme = {
   ...MD3LightTheme,
   colors: {
      ...MD3LightTheme.colors,
      primary: 'rgb(0, 104, 116)',
      secondary: '#f1c40f',
      tertiary: '#a1b2c3',
      brandPrimary: '#fefefe',
      brandSecondary: 'red',
      primaryContainer: 'rgb(120, 69, 172)',
   },
};

// ✅ Gate que aplica el idioma guardado ANTES de renderizar la app
function LanguageGate({ children }: { children: React.ReactNode }) {
   const [ready, setReady] = useState(false);

   useEffect(() => {
      (async () => {
         try {
            const saved = await AsyncStorage.getItem('@lang');
            await i18n.changeLanguage(saved || 'es'); // idioma por defecto si no hay guardado
         } finally {
            setReady(true);
         }
      })();
   }, []);

   if (!ready) {
      return (
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator />
         </View>
      );
   }
   return <>{children}</>;
}

export const App3 = () => {
   // Inicializaciones que quieres ejecutar una vez
   InicialiceFarmDataTable();
   RequestBluetoothPermissions();

   return (
      <LanguageGate>
         <NavigationContainer>
            <PaperProvider
               theme={theme}
               settings={{ icon: (props) => <Icon {...props} /> }}
            >
               <SafeAreaView style={{ flex: 1 }}>
                  <InicializeProgram />
                  <SideMenuNavigator />
               </SafeAreaView>
            </PaperProvider>
         </NavigationContainer>
      </LanguageGate>
   );
};