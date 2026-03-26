/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { Appbar, Button, Divider, Text, TextInput, useTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../../stores/authStore";

const STORAGE_KEY = "@cti_portal_base_url";
const DEFAULT_PATH = "/CtiAlimentacion/";
const DEFAULT_PORT = "8080";

function stripDefaultPort(host: string) {
    // si es host:8080 -> mostrar solo host
    const [h, p] = host.split(":");
    if (p === DEFAULT_PORT) return h;
    return host;
}

function toInputHost(raw: string) {
    const v = raw.trim();
    if (!v) return "";

    // Si viene URL completa -> extraemos host:puerto
    if (/^https?:\/\//i.test(v)) {
        try {
            const u = new URL(v);
            return stripDefaultPort(u.host); // ✅ aquí quitamos :8080 si es el puerto por defecto
        } catch {
            return v;
        }
    }

    // Si viene tipo "192.168.1.2/Cti..." -> cortar path
    const hostOnly = v.split("/")[0];
    return stripDefaultPort(hostOnly);
}

function normalizeToUrl(inputRaw: string) {
    const input = inputRaw.trim();

    if (/^https?:\/\//i.test(input)) return input;

    const hasPort = input.includes(":");
    const base = hasPort ? input : `${input}:${DEFAULT_PORT}`;
    return `http://${base}${DEFAULT_PATH}`;
}

function isValidIpOrHost(inputRaw: string) {
    const input = inputRaw.trim();
    if (!input) return false;

    if (/^https?:\/\//i.test(input)) {
        try {
            new URL(input);
            return true;
        } catch {
            return false;
        }
    }

    const [host, port] = input.split(":");

    const ipRegex =
        /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

    const hostRegex = /^[a-zA-Z0-9.-]+$/;

    const okHost = ipRegex.test(host) || hostRegex.test(host);
    if (!okHost) return false;

    if (port) {
        const p = Number(port);
        if (!Number.isFinite(p) || p < 1 || p > 65535) return false;
    }

    return true;
}

export const ConfiguracionIPScreen = () => {
    const navigation = useNavigation<any>();
    const token = useAuthStore((s) => s.token);
    const theme = useTheme();

    const [valor, setValor] = useState("");
    const [guardado, setGuardado] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const invalido = useMemo(() => valor.length > 0 && !isValidIpOrHost(valor), [valor]);

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
                setValor(saved);
            }
        })();
    }, []);

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
        const finalUrl = normalizeToUrl(valor);

        try {
            setLoading(true);
            await AsyncStorage.setItem(STORAGE_KEY, finalUrl);
            setGuardado(finalUrl);
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

    const primary = theme.colors.primary; // tu morado del tema si lo tienes
    const soft = "#EEF2FF";               // morado suave
    const softBorder = "#C7D2FE";
    const danger = "#EF4444";

    return (
        <View style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={goBackCorrecto} />
                <Appbar.Content title="Configuración IP" />
            </Appbar.Header>

            <KeyboardAvoidingView
                style={{ flex: 1, padding: 16 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* CARD */}
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
                    {/* HEADER COLOR DENTRO DE LA CARD */}
                    <View style={{ backgroundColor: soft, padding: 14, borderBottomWidth: 1, borderBottomColor: softBorder }}>
                        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
                            Servidor CTIFEED
                        </Text>
                        <Text style={{ marginTop: 4, color: "#4B5563" }}>
                            Introduce la IP del servidor donde se abrirá el portal.
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
                            left={<TextInput.Icon icon="wifi" color={invalido ? danger : primary} />}
                        />

                        {/* MENSAJE CORTO (CLARO)
                        <Text style={{ marginTop: 8, color: invalido ? danger : "#6B7280", fontSize: 12 }}>
                            {invalido
                                ? "Formato inválido. Usa una IP (con o sin puerto) o una URL completa http/https."
                                : "Si escribes solo la IP, la app construye la URL automáticamente."}
                        </Text> */}

                        {/* PREVIEW */}
                        {/* {!!urlPreview && (
                            <View
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderRadius: 14,
                                    backgroundColor: "#F9FAFB",
                                    borderWidth: 1,
                                    borderColor: "#E5E7EB",
                                }}
                            >
                                <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "800" }}>Se guardará como</Text>
                                <Text style={{ marginTop: 4, color: "#111827", fontWeight: "700" }}>{urlPreview}</Text>
                            </View>
                        )} */}

                        {/* GUARDADO */}
                        {guardado && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ color: "#10B981", fontWeight: "900" }}>Guardado </Text>
                                <Text style={{ color: "#374151", marginTop: 4 }}>{guardado}</Text>
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
                            Guardar
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

                {/* CONSEJO (CLARO Y VISIBLE) */}
                {/* <View
                    style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: "#FFF7ED",     // naranja suave
                        borderWidth: 1,
                        borderColor: "#FDBA74",
                    }}
                >
                    <Text style={{ fontWeight: "900", color: "#9A3412" }}>Importante</Text>
                    <Text style={{ marginTop: 4, color: "#7C2D12" }}>
                        • Conéctate a la misma Wi-Fi que el servidor.{"\n"}
                        • Si estás en datos móviles o en otra red, no cargará.{"\n"}
                        • Después abre CTIFEED y recarga el portal.
                    </Text>
                </View> */}
            </KeyboardAvoidingView>
        </View>
    );
};