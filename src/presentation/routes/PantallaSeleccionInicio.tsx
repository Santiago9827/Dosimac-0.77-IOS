import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    SafeAreaView,
    Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
const LOGO_CTICONTROL = require("../../assets/images/logo-cti.png");


export const PublicStartScreen = ({ navigation }: any) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#EEF4FF" />

            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={LOGO_CTICONTROL}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.textosContainer}>
                        <Text style={styles.titulo}>Bienvenido</Text>
                        <Text style={styles.subtitulo}>
                            Selecciona cómo quieres acceder
                        </Text>

                        <View style={styles.badge}>
                            <Text style={styles.badgeTexto}>DOSIMAC</Text>
                        </View>
                    </View>
                </View>



                <View style={styles.contenido}>
                    <View style={styles.bloque}>
                        <TouchableOpacity
                            activeOpacity={0.92}
                            style={styles.tarjeta}
                            onPress={() => navigation.navigate("PublicHome")}
                        >
                            <View style={styles.lineaSuperiorAzul} />

                            <View style={styles.iconoWrapAzul}>
                                <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
                            </View>

                            <Text style={styles.tituloBoton}>Alta Dosimac</Text>
                            <Text style={styles.descripcionBoton}>
                                Dar de alta a los dispositivos Dosimac.
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bloque}>
                        <TouchableOpacity
                            activeOpacity={0.92}
                            style={styles.tarjeta}
                            onPress={() => navigation.navigate("Login")}
                        >
                            <View style={styles.lineaSuperiorVerde} />

                            <View style={styles.iconoWrapVerde}>
                                <Ionicons name="log-in-outline" size={28} color="#0F766E" />
                            </View>

                            <Text style={styles.tituloBoton}>CTIFEED</Text>
                            <Text style={styles.descripcionBoton}>
                                Aquí podrás iniciar sesión y ver tu CTIFEED.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF4FF",
    },
    safe: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 72,
        alignItems: "center",
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
        marginTop: 14,
    },
    badgeTexto: {
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 1.4,
        color: "#2563EB",
    },
    logoContainer: {
        marginTop: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: 240,
        height: 90,
    },
    textosContainer: {
        marginTop: 18,
        alignItems: "center",
    },
    titulo: {
        fontSize: 30,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
    },
    subtitulo: {
        marginTop: 8,
        fontSize: 15,
        color: "#64748B",
        textAlign: "center",
    },
    contenido: {
        flex: 1,
        justifyContent: "center",
        gap: 22,
        marginTop: -70,
    },
    bloque: {
        alignItems: "center",
    },
    tarjeta: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
        overflow: "hidden",
    },
    lineaSuperiorAzul: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        backgroundColor: "#2563EB",
    },
    lineaSuperiorVerde: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 5,
        backgroundColor: "#0F766E",
    },
    iconoWrapAzul: {
        width: 58,
        height: 58,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#DBEAFE",
        marginBottom: 14,
    },
    iconoWrapVerde: {
        width: 58,
        height: 58,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D1FAE5",
        marginBottom: 14,
    },
    tituloBoton: {
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
        textAlign: "center",
    },
    descripcionBoton: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 21,
        color: "#64748B",
        textAlign: "center",
        maxWidth: 310,
        fontWeight: "600",
    },
});