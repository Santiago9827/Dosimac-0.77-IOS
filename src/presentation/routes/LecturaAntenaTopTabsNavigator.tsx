import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ConfiguracionLecturaMaternidadScreen } from './ConfiguracionLecturaMaternidadScreen';
import { ConfiguracionGestacionScreen } from './ConfiguracionLecturaGestacionScreen';

const TopTab = createMaterialTopTabNavigator();

const TEXT = '#0F172A';
const MUTED = '#64748B';
const BG = '#EEF3FB';

function CardLector({
    color,
    fondoIcono,
    icono,
    titulo,
    descripcion,
    onPress,
}: {
    color: string;
    fondoIcono: string;
    icono: string;
    titulo: string;
    descripcion: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.card}
        >
            <View style={[styles.cardTopLine, { backgroundColor: color }]} />

            <View style={styles.cardBody}>
                <View style={[styles.iconCircle, { backgroundColor: fondoIcono }]}>
                    <Ionicons
                        name={icono}
                        size={32}
                        color={color}
                    />
                </View>

                <Text style={styles.cardTitle}>{titulo}</Text>

                <Text style={styles.cardDescription}>
                    {descripcion}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

function ConfiguracionAwrTemporal({ navigation }: any) {
    const navegarAStack = (screenName: string) => {
        const topTabsNavigation = navigation.getParent?.();
        const stackNavigation = topTabsNavigation?.getParent?.();

        if (stackNavigation?.navigate) {
            stackNavigation.navigate(screenName);
            return;
        }

        navigation.navigate(screenName);
    };

    const avisoPendiente = (pantalla: string) => {
        Alert.alert(
            'Pendiente',
            `Después conectaremos esta opción con: ${pantalla}`
        );
    };

    return (
        <View style={styles.screen}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.descriptionTop}>
                    Configura o consulta tus lectores de crotales
                </Text>

                <CardLector
                    color="#0F766E"
                    fondoIcono="#DDF3EF"
                    icono="scan-outline"
                    titulo="Conexión directa"
                    descripcion="Buscar y dar de alta un nuevo lector de crotales."
                    onPress={() => navegarAStack('GeneralAwrStartScan')}
                />

                <CardLector
                    color="#4338CA"
                    fondoIcono="#E0E7FF"
                    icono="radio-outline"
                    titulo="Lectores guardados"
                    descripcion="Ver las espadas o lectores ya configurados."
                    onPress={() => navegarAStack('GeneralAwrSaved')}
                />

                {/* <CardLector
                    color="#0284C7"
                    fondoIcono="#E0F2FE"
                    icono="bluetooth-outline"
                    titulo="Conectar por Bluetooth"
                    descripcion="Conectar con lector Allflex LPR por Bluetooth."
                    onPress={() => avisoPendiente('GeneralAllflexBluetooth')}
                /> */}
            </ScrollView>
        </View>
    );
}

export const LecturaAntenaTopTabsNavigator = () => {
    return (
        <TopTab.Navigator
            initialRouteName="LectorMaternidadTab"
            screenOptions={{
                tabBarShowIcon: false,
                tabBarActiveTintColor: '#4C1D95',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarIndicatorStyle: {
                    backgroundColor: '#4C1D95',
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
                    fontSize: 13,
                    fontWeight: '900',
                    textTransform: 'none',
                },
                tabBarPressColor: '#EEF2FF',
            }}
        >
            <TopTab.Screen
                name="LectorMaternidadTab"
                component={ConfiguracionLecturaMaternidadScreen}
                options={{
                    title: 'Maternidad',
                }}
            />

            <TopTab.Screen
                name="LectorGestacionTab"
                component={ConfiguracionGestacionScreen}
                options={{
                    title: 'Gestación',
                }}
            />

            <TopTab.Screen
                name="ConfiguracionAwrTab"
                component={ConfiguracionAwrTemporal}
                options={{
                    title: 'Config. lector',
                }}
            />
        </TopTab.Navigator>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 110,
        gap: 18,
    },

    descriptionTop: {
        fontSize: 17,
        color: MUTED,
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '800',
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    cardTopLine: {
        height: 6,
    },

    cardBody: {
        paddingVertical: 26,
        paddingHorizontal: 18,
        alignItems: 'center',
    },

    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
        marginBottom: 8,
    },

    cardDescription: {
        fontSize: 16,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '700',
    },
});