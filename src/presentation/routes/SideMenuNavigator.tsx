/* eslint-disable react-native/no-inline-styles */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prettier/prettier */
import React from 'react';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, createDrawerNavigator } from '@react-navigation/drawer';
import { globalColors } from '../theme/theme';
import { Text, View, Platform, Dimensions, useWindowDimensions } from 'react-native';
import { BottomTabNavigator } from './BottomTabNavigator';
import { IonIcon } from '../components/shared/IonIcon';
import { Divider } from 'react-native-paper';
import { LoginScreen } from '../screens/login/login';
import { LanguageSettingsScreen } from '../screens/settings/Languagesettings';
import { useTranslation } from 'react-i18next';
import { FarmListNavigator } from './FarmListNavigator';
import { DebugNavigator } from './DebugNavigator';
import { MaintenaceStackNavigator } from './MaintenaceStackNavigator';
import { DRStackNavigator } from './dr_StackNavigator';
import { isDebugMode } from '../../sharedTypes/globlaVars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { AWRStackNavigator } from './AWRStackNavigator';


import { createStackNavigator } from '@react-navigation/stack';
import { AWRFlowStackNavigator } from './AWRFlowStackNavigator';
import { useAuthStore } from '../../stores/authStore';
import { LectorMaternidadScreen } from "../screens/lector/LectorMaternidadScreen";
import { LectorGestacionScreen } from "../screens/lector/LectorGestacionScreen";
import { ConfiguracionIPScreen } from "../screens/ip/ConfiguracionIPScreen";
import { ConfiguracionLecturaMaternidadScreen } from "./ConfiguracionLecturaMaternidadScreen";
import { ConfiguracionGestacionScreen } from './ConfiguracionLecturaGestacionScreen';
import { HomeScreen } from '../screens/HomeScreen/HomeScreen';



// 👇 Ajusta la ruta según tu proyecto

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const WEB_DRAWER_W = Math.min(480, Math.round(Dimensions.get('window').width * 0.65));





/** Stack que contiene los Tabs + TareasProgramadas */
function TabsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="TareasProgramadas"
        component={TareasProgramadasScreen}
        options={{ title: 'Tareas Programadas' }}
      /> */}
      {/* <Stack.Screen
        name="NoAlimentadosMaternidad"
        component={NoAlimentadosScreenMaternidad}
        options={{ title: 'Animales no Alimentados' }}
      /> */}

    </Stack.Navigator>
  );
}
// SideMenuNavigator
export const PrivateDrawerNavigator = () => {
  const { t } = useTranslation();
  const { width: winW } = useWindowDimensions();
  const isTablet = winW >= 768;
  // const logout = useAuthStore((s) => s.logout);

  // const EDGE_GUTTER = 10;         // margen mínimo visible al borde
  // const MOBILE_MIN = 320;       // opcional: sube el mínimo
  // const MOBILE_MAX = 540;       // opcional: sube el máximo


  const drawerW =
    Platform.OS === 'web'
      ? Math.min(560, Math.round(winW * 0.68)) // web: 60% (máx. 560)
      : isTablet
        ? Math.min(420, Math.round(winW * 0.45)) // tablet: 45% (máx. 420)
        : Math.min(360, Math.round(winW * 0.72)); // móvil: 72% (máx. 360)


  return (
    <Drawer.Navigator
      id="RootDrawer"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.25)',
        drawerStatusBarAnimation: 'fade',
        drawerHideStatusBarOnOpen: false,

        drawerStyle: {
          width: drawerW,
          backgroundColor: '#fff',
          ...(Platform.OS === 'web' && {
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }),
        },

        drawerActiveBackgroundColor: globalColors.primary,
        drawerActiveTintColor: 'white',
        drawerInactiveTintColor: globalColors.primary,
        drawerLabelStyle: { flexShrink: 1, marginRight: 4 },
        drawerItemStyle: { borderRadius: 100, paddingHorizontal: 0 },
      }}


    >
      {/* 👉 Ahora los Tabs van envueltos en TabsStack (que incluye TareasProgramadas) */}
      <Drawer.Screen
        name="Tabs"
        component={TabsStack}
        options={{ drawerIcon: ({ color }) => <IonIcon name="home-outline" color={color} />, title: t('common:Tabs') }}
      />
      {/* <Drawer.Screen
        name="Logout"
        component={TabsStack} // da igual, NO se usará porque prevenimos el press
        options={{
          title: "Cerrar sesión",
          drawerIcon: ({ color }) => <IonIcon name="log-out-outline" color={color} />,
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            navigation.closeDrawer();
            logout();
          },
        })}
      /> */}

      <Drawer.Screen
        name="Register"
        component={DRStackNavigator}
        options={{
          drawerIcon: ({ color }) => <IonIcon name="add-outline" color={color} />, title: t('common:DosimacRegistration'), drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }
        }
      />
      <Drawer.Screen
        name="FarmList"
        component={FarmListNavigator}
        options={{
          drawerIcon: ({ color }) => <IonIcon name="document-text-outline" color={color} />, title: t('common:Lista_instalaciones'), drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }}
      />
      <Drawer.Screen
        name="AWR-STARTSCAN"
        component={AWRFlowStackNavigator}
        options={{
          title: 'Dar de Alta AWR',
          drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }}
      />
      <Drawer.Screen
        name="ConfiguracionLectura"
        component={ConfiguracionLecturaMaternidadScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />
      <Drawer.Screen
        name="LectorMaternidad"
        component={LectorMaternidadScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />

      <Drawer.Screen
        name="LectorGestacion"
        component={LectorGestacionScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />
      <Drawer.Screen
        name="ConfiguracionGestacion"
        component={ConfiguracionGestacionScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />
      <Drawer.Screen
        name="AltaDispositivosHome"
        component={HomeScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />

      {/* Ajustes (oculto en el Drawer) */}
      <Drawer.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: t('common:settings'),
          drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }}
      />

      {/* Ruta real de Mantenimiento (oculta) */}
      <Drawer.Screen
        name="Maintenance"
        component={MaintenaceStackNavigator}
        options={{
          title: t('common:Maintenance'),
          drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }}
      />

      {/* Entrada visible que pide contraseña */}
      {/* <Drawer.Screen
        name="MaintenanceAccess"
        component={MaintenancePasswordScreen}
        options={{
          title: t('common:Maintenance'),
          drawerIcon: ({ color }) => <IonIcon name="build-outline" color={color} />
        }}
      /> */}

      <Drawer.Screen
        name="AWR-SAVED"
        component={AWRStackNavigator}
        options={{
          title: 'AWR escaneados',
          drawerItemStyle: { height: 0 },
          drawerLabel: () => null,
        }}
      />

      {/* <Drawer.Screen
        name="AnimalSearch"
        component={AnimalSearchNavigator}
        options={{
          drawerIcon: ({ color }) => <IonIcon name="search-outline" color={color} />,
          title: 'Buscar animal',
        }}
      /> */}
      <Drawer.Screen
        name="ConfigIP"
        component={ConfiguracionIPScreen}
        options={{ drawerItemStyle: { height: 0 }, drawerLabel: () => null }}
      />



      {isDebugMode && (
        <>
          <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="log-in-outline" color={color} />) }} name="Login" component={LoginScreen} />
          <Drawer.Screen options={{ drawerIcon: ({ color }) => (<IonIcon name="chatbubbles-outline" color={color} />) }} name="Language Settings" component={LanguageSettingsScreen} />
          <Drawer.Screen options={{ drawerItemStyle: { marginTop: 40, paddingHorizontal: 20, }, drawerLabel: "Debug options", drawerIcon: ({ color }) => (<IonIcon name="bug-outline" color={color} />) }} name="Debug" component={DebugNavigator} />
        </>
      )}
    </Drawer.Navigator>
  );
};

// const CustomDrawerContent = (props: DrawerContentComponentProps) => {

//   const { t } = useTranslation();
//   const insets = useSafeAreaInsets();

//   const focused = props.state.routeNames[props.state.index] === 'Settings';
//   const activeBg = globalColors.primary;
//   const activeTint = 'white';
//   const inactiveTint = globalColors.primary;
//   const [menu, setMenu] = React.useState<"main" | "alta">("main");

//   return (
//     <DrawerContentScrollView
//       {...props}
//       contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
//     >
//       <DrawerItemList {...props} />

//       <View style={{ marginTop: 'auto' }}>
//         <Text
//           style={{
//             marginLeft: 16,
//             marginBottom: 6,
//             fontSize: 12,
//             fontWeight: '600',
//             color: '#666',
//           }}
//         >
//           {t('common:softwareVersion', { defaultValue: 'softwareVersion' })} 3
//         </Text>

//         <Divider style={{ marginHorizontal: 16, marginBottom: 4 }} />

//         <DrawerItem
//           label={t('common:settings', { defaultValue: 'Ajustes' })}
//           icon={() => (
//             <IonIcon
//               name="settings-outline"
//               color={focused ? activeTint : inactiveTint}
//             />
//           )}
//           labelStyle={{ color: focused ? activeTint : inactiveTint }}
//           style={[
//             { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
//             focused && { backgroundColor: activeBg },
//           ]}
//           onPress={() => {
//             const nav = props.navigation;
//             nav.closeDrawer();
//             setTimeout(() => nav.navigate('Settings' as never), 120);
//           }}
//         />
//       </View>
//     </DrawerContentScrollView>
//   );
// };




const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const gray = "#6B7280";

  const [menu, setMenu] = React.useState<"main" | "alta">("main");
  const activeRoute = props.state.routeNames[props.state.index];
  const mostrarSubmenuAlta =
    menu === "alta" || activeRoute === "AltaDispositivosHome";

  const [awrOpen, setAwrOpen] = React.useState(false);
  const focused = props.state.routeNames[props.state.index] === "Settings";
  const activeBg = globalColors.primary;
  const activeTint = "white";
  const inactiveTint = globalColors.primary;

  const go = (name: string) => {
    const nav = props.navigation;
    nav.closeDrawer();
    setTimeout(() => nav.navigate(name as never), 120);
  };

  const itemStyle = (isActive: boolean) => ([
    { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
    isActive && { backgroundColor: activeBg },
  ]);

  const labelStyle = (isActive: boolean) => ({
    color: isActive ? activeTint : inactiveTint,
    fontWeight: "700" as const,
  });

  if (mostrarSubmenuAlta) {
    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
      >
        <DrawerItem
          label={t("common:back", { defaultValue: "Atrás" })}
          icon={() => <IonIcon name="chevron-back-outline" color={gray} />}
          labelStyle={{ color: gray, fontWeight: "700" }}
          style={{ marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 }}
          onPress={() => {
            if (activeRoute === "AltaDispositivosHome") {
              go("Tabs");
            } else {
              setMenu("main");
            }
          }}
        />

        <Divider style={{ marginHorizontal: 16, marginVertical: 8 }} />

        <DrawerItem
          label={t("common:DosimacRegistration", { defaultValue: "Alta Dosimac" })}
          icon={() => <IonIcon name="add-outline" color={inactiveTint} />}
          labelStyle={labelStyle(false)}
          style={itemStyle(false)}
          onPress={() => go("Register")}
        />

        <DrawerItem
          label={t("common:Lista_instalaciones", { defaultValue: "Instalaciones" })}
          icon={() => <IonIcon name="document-text-outline" color={inactiveTint} />}
          labelStyle={labelStyle(false)}
          style={itemStyle(false)}
          onPress={() => go("FarmList")}
        />

        <View style={{ marginTop: "auto" }}>
          <Text style={{ marginLeft: 16, marginBottom: 6, fontSize: 12, fontWeight: "600", color: "#666" }}>
            {t("common:softwareVersion", { defaultValue: "softwareVersion" })} 3
          </Text>

          <Divider style={{ marginHorizontal: 16, marginBottom: 4 }} />

          <DrawerItem
            label={t("common:settings", { defaultValue: "Ajustes" })}
            icon={() => (
              <IonIcon
                name="settings-outline"
                color={focused ? activeTint : inactiveTint}
              />
            )}
            labelStyle={{ color: focused ? activeTint : inactiveTint }}
            style={[
              { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
              focused && { backgroundColor: activeBg },
            ]}
            onPress={() => go("Settings")}
          />
        </View>
      </DrawerContentScrollView>
    );
  }

  //  Vista MAIN: drawer normal
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 12 }}
    >
      {/* Inicio (Tabs) */}
      <DrawerItem
        label={t("common:Tabs", { defaultValue: "Inicio" })}
        icon={() => <IonIcon name="home-outline" color={gray} />}
        labelStyle={{ color: gray, fontWeight: "700" }}
        style={{ marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 }}
        onPress={() => go("Tabs")}
      />
      <Divider style={{ marginHorizontal: 16, marginVertical: 6, height: 1, backgroundColor: "#E5E7EB" }} />


      {/*  Cerrar sesión */}
      {/* <DrawerItem
        label="Cerrar sesión"
        icon={() => <IonIcon name="log-out-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => {
          // dispara el mismo logout que ya tienes en Drawer.Screen Logout
          // pero mejor hacerlo aquí directo:
          props.navigation.closeDrawer();
          // usa el logout del store:
          // (IMPORTANTE: añade arriba const logout = useAuthStore((s)=>s.logout); en CustomDrawerContent)
          logout();
        }}
      /> */}

      {/*  Alta dispositivos justo debajo */}
      <DrawerItem
        label={t("common:AltaDispositivos", { defaultValue: "Alta Dispositivos" })}
        icon={() => <IonIcon name="folder-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("AltaDispositivosHome")}
      />

      <DrawerItem
        label="Lector Maternidad"
        icon={() => <IonIcon name="barcode-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("ConfiguracionLectura")}
      />

      <DrawerItem
        label="Lector Gestación"
        icon={() => <IonIcon name="barcode-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("ConfiguracionGestacion")}
      />


      {/* <DrawerItem
        label="Dar de Alta AWR"
        icon={() => <IonIcon name="search-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("AWR-STARTSCAN")}
      />

      <DrawerItem
        label="Mantenimiento"
        icon={() => <IonIcon name="build-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("MaintenanceAccess")}
      /> */}
      {/* 
      <DrawerItem
        label="AWR escaneados"
        icon={() => <IonIcon name="radio-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("AWR-SAVED")}
      /> */}

      {/* <DrawerItem
        label="Buscar animal"
        icon={() => <IonIcon name="search-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("AnimalSearch")}
      /> */}
      {/* <DrawerItem
        label="Configuración IP"
        icon={() => <IonIcon name="wifi-outline" color={inactiveTint} />}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => go("ConfigIP")}
      /> */}
      <DrawerItem
        label="Configuracion AWR"
        icon={() => (
          <IonIcon
            name={awrOpen ? "chevron-down-outline" : "chevron-forward-outline"}
            color={inactiveTint}
          />
        )}
        labelStyle={labelStyle(false)}
        style={itemStyle(false)}
        onPress={() => setAwrOpen((v) => !v)}
      />
      {awrOpen && (
        <View style={{ marginLeft: 10, marginTop: 4 }}>
          <DrawerItem
            label="Dar de Alta AWR"
            icon={() => <IonIcon name="search-outline" color={inactiveTint} />}
            labelStyle={labelStyle(false)}
            style={{ marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 }}
            onPress={() => go("AWR-STARTSCAN")}
          />

          <DrawerItem
            label="AWR escaneados"
            icon={() => <IonIcon name="radio-outline" color={inactiveTint} />}
            labelStyle={labelStyle(false)}
            style={{ marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 }}
            onPress={() => go("AWR-SAVED")}
          />
        </View>
      )}
      {/* Footer */}
      <View style={{ marginTop: "auto" }}>
        <Text
          style={{
            marginLeft: 16,
            marginBottom: 6,
            fontSize: 12,
            fontWeight: "600",
            color: "#666",
          }}
        >
          {t("common:softwareVersion", { defaultValue: "softwareVersion" })} 3
        </Text>

        <Divider style={{ marginHorizontal: 16, marginBottom: 4 }} />

        <DrawerItem
          label={t("common:settings", { defaultValue: "Ajustes" })}
          icon={() => (
            <IonIcon
              name="settings-outline"
              color={focused ? activeTint : inactiveTint}
            />
          )}
          labelStyle={{ color: focused ? activeTint : inactiveTint }}
          style={[
            { marginHorizontal: 8, borderRadius: 100, paddingHorizontal: 20 },
            focused && { backgroundColor: activeBg },
          ]}
          onPress={() => go("Settings")}
        />

        <DrawerItem
          label="Configuración IP"
          icon={() => <IonIcon name="wifi-outline" color={inactiveTint} />}
          labelStyle={labelStyle(false)}
          style={itemStyle(false)}
          onPress={() => go("ConfigIP")}
        />

        <DrawerItem
          label="Cerrar sesión"
          icon={() => <IonIcon name="log-out-outline" color={inactiveTint} />}
          labelStyle={labelStyle(false)}
          style={itemStyle(false)}
          onPress={() => {
            props.navigation.closeDrawer();
            logout();
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
};