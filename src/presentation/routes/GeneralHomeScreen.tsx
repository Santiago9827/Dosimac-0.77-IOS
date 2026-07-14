/* eslint-disable prettier/prettier */
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TEXT = '#0F172A';
const MUTED = '#64748B';
const BG = '#F6F8FC';

function GeneralCard({
    titulo,
    descripcion,
    icono,
    color,
    fondoIcono,
    onPress,
}: {
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    fondoIcono: string;
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
                        size={28}
                        color={color}
                    />
                </View>

                <Text style={styles.cardTitle}>{titulo}</Text>
                <Text style={styles.cardDesc}>{descripcion}</Text>
            </View>
        </TouchableOpacity>
    );
}

export const GeneralHomeScreen = ({ navigation }: any) => {
    const avisoProvisional = (pantalla: string) => {
        Alert.alert(
            'Pantalla pendiente',
            `Después conectaremos esta card con: ${pantalla}`
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.cardsWrapper}>
                    <GeneralCard
                        titulo="Movimiento animal"
                        descripcion="Lector de crotales."
                        icono="radio-outline"
                        color="#0F766E"
                        fondoIcono="#DDF3EF"
                        onPress={() => navigation.navigate('GeneralLecturaAntena')}
                    />
                    <GeneralCard
                        titulo="Movimiento animal"
                        descripcion="Teclado"
                        icono="swap-horizontal-outline"
                        color="#4338CA"
                        fondoIcono="#E0E7FF"
                        onPress={() => navigation.navigate('MovimientoAnimal')}
                    />

                    <GeneralCard
                        titulo="CTIFEED"
                        descripcion="Accede al portal principal."
                        icono="enter-outline"
                        color="#2F6BFF"
                        fondoIcono="#DCE8FF"
                        onPress={() => avisoProvisional('GeneralPortal')}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 90,
    },

    cardsWrapper: {
        gap: 18,
        width: '100%',
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 9,
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
        width: 60,
        height: 60,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
        marginBottom: 5,
    },

    cardDesc: {
        fontSize: 17,
        fontWeight: '700',
        color: MUTED,
        textAlign: 'center',
        lineHeight: 23,
    },
});