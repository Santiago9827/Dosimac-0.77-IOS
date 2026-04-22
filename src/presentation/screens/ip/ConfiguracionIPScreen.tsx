/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Appbar, Button, Text, TextInput, useTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../../stores/authStore";
import { validarServidorPorIp } from "../../../stores/validarServidorIp";
import { useTranslation } from "react-i18next";
import {
    STORAGE_KEY,
    isValidIpOrHost,
    toInputHost,
} from "../../../stores/ipConfig";

function interpretarRespuestaValidacionIp(status: number) {
    if (status === 401) {
        return {
            guardar: true,
            titulo: "Correcto",
            mensaje: "IP correcta",
        };
    }

    if (status === 404) {
        return {
            guardar: true,
            titulo: "Aviso",
            mensaje:
                "Para poder iniciar sesión, primero tiene que actualizar el portal. Después verifique la IP aquí de nuevo.",
        };
    }

    return {
        guardar: false,
        titulo: "Error",
        mensaje: "IP no válida",
    };
}

export const ConfiguracionIPScreen = () => {
    const { t } = useTranslation();

    const navigation = useNavigation<any>();
    const token = useAuthStore((s) => s.token);
    const theme = useTheme();

    const [valor, setValor] = useState("");
    const [guardado, setGuardado] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const invalido = useMemo(
        () => valor.length > 0 && !isValidIpOrHost(valor),
        [valor]
    );

    const goBackCorrecto = () => {
        const parent = navigation.getParent?.();

        if (token) {
            if (parent?.navigate) parent.navigate("Tabs");
            else navigation.navigate("Tabs");
        } else {
            if (parent?.navigate) parent.navigate("Login");
            else navigation.navigate("Login");
        }
    };

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);

            if (saved) {
                setGuardado(saved);
                setValor(toInputHost(saved));
            }
        })();
    }, []);

    const onGuardar = async () => {
    if (!valor.trim() || invalido) return;

    try {
        setLoading(true);

        const hostLimpio = toInputHost(valor);

        let respuesta = await validarServidorPorIp(hostLimpio);

        if (respuesta.status === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            respuesta = await validarServidorPorIp(hostLimpio);
        }

        const resultado = interpretarRespuestaValidacionIp(respuesta.status);

        if (resultado.guardar) {
            await AsyncStorage.setItem(STORAGE_KEY, respuesta.baseUrl);
            setGuardado(respuesta.baseUrl);
            setValor(hostLimpio);
        }

        Alert.alert(resultado.titulo, resultado.mensaje);
    } finally {
        setLoading(false);
    }
};

    const onReset = async () => {
        try {
            setLoading(true);
            await AsyncStorage.removeItem(STORAGE_KEY);
            setValor("");
            setGuardado(null);
        } finally {
            setLoading(false);
        }
    };

    const primary = theme.colors.primary;
    const soft = "#EEF2FF";
    const softBorder = "#C7D2FE";
    const danger = "#EF4444";

    return (
        <View style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={goBackCorrecto} />
                <Appbar.Content title={t("ipConfig_title")} />
            </Appbar.Header>

            <KeyboardAvoidingView
                style={{ flex: 1, padding: 16 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View
                    style={{
                        backgroundColor: "white",
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 3,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: soft,
                            padding: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: softBorder,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: "900",
                                color: "#111827",
                            }}
                        >
                            {t("ipConfig_cardTitle")}
                        </Text>
                        <Text style={{ marginTop: 4, color: "#4B5563" }}>
                            {t("ipConfig_cardDescription")}
                        </Text>
                    </View>

                    <View style={{ padding: 14 }}>
                        <TextInput
                            mode="outlined"
                            label="IP (solo la IP)"
                            value={valor}
                            onChangeText={(txt) => setValor(toInputHost(txt))}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            left={
                                <TextInput.Icon
                                    icon="wifi"
                                    color={invalido ? danger : primary}
                                />
                            }
                        />

                        {guardado && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ color: "#10B981", fontWeight: "900" }}>
                                    {t("ipConfig_saved")}
                                </Text>
                                <Text style={{ color: "#374151", marginTop: 4 }}>
                                    {toInputHost(guardado)}
                                </Text>
                            </View>
                        )}

                        <View style={{ height: 14 }} />

                        <Button
                            mode="contained"
                            onPress={onGuardar}
                            loading={loading}
                            disabled={!valor.trim() || invalido || loading}
                            style={{ borderRadius: 14 }}
                            contentStyle={{ paddingVertical: 2 }}
                        >
                            {t("Guardar")}
                        </Button>

                        {/* <Button
                            mode="text"
                            onPress={onReset}
                            disabled={loading}
                            textColor="#6B7280"
                            style={{ marginTop: 6 }}
                        >
                            Restablecer
                        </Button> */}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};