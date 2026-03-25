import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../stores/authStore'; // ajusta ruta real

import { PublicDrawerNavigator } from './PublicDrawerNavigator';
import { PrivateDrawerNavigator } from './SideMenuNavigator'; // o donde lo tengas

export const RootNavigator = () => {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return token ? <PrivateDrawerNavigator /> : <PublicDrawerNavigator />;
};