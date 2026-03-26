import React from 'react';
import { View, Text, useWindowDimensions, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { IonIcon } from '../components/shared/IonIcon';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';
//import { MaternityStackNavigator } from './Mat-StackNavigator';
//import { GestationStackNavigator } from './GestationStackNavigator';
import { globalColors } from '../theme/theme';
import { DrawerActions } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PortalScreen } from '../screens/HomeScreen/PortalScreen';


const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#3F0BAE';
const INACTIVE_COLOR = '#94A3B8';

function TabStacked({
  icon,
  label,
  color,
  focused,
  small,
}: {
  icon: string;
  label: string;
  color: string;
  focused: boolean;
  small: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <IonIcon name={icon} color={color} size={small ? 20 : 22} />
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={{
          marginTop: 2,
          fontSize: small ? 10 : 11,
          fontWeight: focused ? '700' : '600',
          color,
          includeFontPadding: false,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          height: 3,
          width: 20,
          borderRadius: 2,
          marginTop: 6,
          backgroundColor: focused ? ACTIVE_COLOR : 'transparent',
        }}
      />
    </View>
  );
}

export const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();

  const isSmall = width < 380;
  const superTight = width < 360 || fontScale > 1.15;

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: globalColors.background }}
      screenOptions={({ route }) => {
        const META: Record<string, { icon: string; label: string }
        > = {
          Tab1: { icon: 'home-outline', label: 'Inicio' },
          MaternidadTab: { icon: 'female-outline', label: 'Maternidad' },
          GestacionTab: { icon: 'people-outline', label: 'Gestación' },
          Tab4: { icon: 'globe-outline', label: 'CTIFEED' },
        };
        const meta = META[route.name] ?? { icon: 'ellipse-outline', label: route.name };

        return {
          headerShown: true,
          // barra limpia
          tabBarStyle: {
            height: 56 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, superTight ? 4 : 6),
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: globalColors.background,
            elevation: 8,
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: -2 },
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 0,
            marginHorizontal: superTight ? 0 : isSmall ? 2 : 4,
          },
          // usamos nuestro propio layout (icono+texto en columna)
          tabBarShowLabel: false,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarIcon: ({ color, focused }) => (
            <TabStacked
              icon={meta.icon}
              label={meta.label}
              color={color}
              focused={focused ?? false}
              small={superTight}
            />
          ),
          tabBarHideOnKeyboard: true,
        };
      }}
    >
      {/* <Tab.Screen
        name="Tab1"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      /> */}
      {/* 
      <Tab.Screen
        name="MaternidadTab"
        component={MaternityStackNavigator}
        options={{
          title: 'Maternidad',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="GestacionTab"
        component={GestationStackNavigator}
        options={({ route }) => {
          const nested = getFocusedRouteNameFromRoute(route) ?? 'GES-HOME';
          // si quieres ocultar header en subrutas, ajusta aquí
          return {
            title: 'Gestación',
            headerShown: false,
          };
        }}
      /> */}

      <Tab.Screen
        name="Tab4"
        component={PortalScreen}
        options={({ navigation }) => ({
          title: "CTIFEED",

          // ✅ Botón hamburguesa en el header (NO dentro del WebView)
          headerLeft: () => (
            <Pressable
              onPress={() =>
                // Si tu Drawer tiene id="RootDrawer", mejor así:
                navigation.getParent("RootDrawer")?.dispatch(DrawerActions.toggleDrawer())
                // Si no tienes id, usa esto:
                // navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())
              }
              style={{ marginLeft: 14, padding: 6 }}
            >
              <Ionicons name="menu-outline" size={28} color={globalColors.primary} />
            </Pressable>
          ),

          // (opcional) si quieres separar un poco el título
          headerTitleStyle: { fontWeight: "700" },
        })}
      />
    </Tab.Navigator>
  );
};