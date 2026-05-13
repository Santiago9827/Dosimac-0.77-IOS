/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Modal,
    Keyboard,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
    Divider,
    Switch,
    Text,
    TextInput,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { awrStore } from "../../stores/awrStore";
import { useAwrConn } from "../../stores/awrConnStore";
import { obtenerLecturaEspada, obtenerAnimalPorId } from "../routes/obtenerLecturaEspada";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";

type Modo = "entrada" | "salida" | "lectura" | "busqueda";

const BRAND = "#0F766E";
const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const ERROR = "#B91C1C";

const SHADOW_CARD = {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
};

const SHADOW_SOFT = {
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
};

const SHADOW_ACTIVE = {
    shadowColor: BRAND,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
};

const CARD_STYLE = {
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    ...SHADOW_CARD,
};

function ModoCard({
    titulo,
    descripcion,
    active,
    onPress,
}: {
    titulo: string;
    descripcion: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={{
                flex: 1,
                minHeight: 64,
                borderRadius: 14,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? BRAND : BORDER,
                backgroundColor: active ? "#F0FDFA" : "#FFFFFF",
                paddingVertical: 9,
                paddingHorizontal: 10,
                justifyContent: "space-between",
                ...(active ? SHADOW_ACTIVE : SHADOW_SOFT),
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                <Text
                    style={{
                        color: TEXT,
                        fontWeight: "900",
                        fontSize: 15,
                    }}
                    numberOfLines={1}
                >
                    {titulo}
                </Text>

                <View
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: active ? BRAND : "#CBD5E1",
                    }}
                />
            </View>

            <Text
                style={{
                    color: active ? BRAND : MUTED,
                    fontSize: 11,
                    lineHeight: 14,
                    fontWeight: active ? "700" : "500",
                    marginTop: 3,
                }}
                numberOfLines={2}
            >
                {descripcion}
            </Text>
        </TouchableOpacity>
    );
}

function OpcionCompacta({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                borderWidth: active ? 1.5 : 1,
                borderColor: active ? BRAND : BORDER,
                backgroundColor: active ? "#F0FDFA" : "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                ...(active ? SHADOW_ACTIVE : SHADOW_SOFT),
            }}
        >
            <Text
                style={{
                    color: active ? BRAND : TEXT,
                    fontWeight: "900",
                    fontSize: 13,
                }}
                numberOfLines={1}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SwitchLine({
    title,
    description,
    value,
    onValueChange,
}: {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    return (
        <View
            style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                backgroundColor: "#F8FAFC",
                paddingVertical: 9,
                paddingHorizontal: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                ...SHADOW_SOFT,
            }}
        >
            <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                    style={{
                        color: TEXT,
                        fontWeight: "900",
                        fontSize: 14,
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        color: MUTED,
                        marginTop: 2,
                        fontSize: 11,
                        lineHeight: 15,
                    }}
                >
                    {description}
                </Text>
            </View>

            <Switch value={value} onValueChange={onValueChange} />
        </View>
    );
}

const limpiarMensajeBackend = (mensaje?: string) => {
    if (!mensaje) return "";
    return mensaje.replace(/^Error:\s*/i, "").trim();
};

export const ConfiguracionLecturaMaternidadScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();

    const lectorConectado = useAwrConn((s) => s.isConnected);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    const espadasGuardadas = awrStore((s) => s.devices);
    const hayEspadasGuardadas = espadasGuardadas.length > 0;

    const [modo, setModo] = useState<Modo>("entrada");
    const [corral, setCorral] = useState("");
    const [detectarDesconocidos, setDetectarDesconocidos] = useState(true);
    const [confirmar, setConfirmar] = useState(false);

    const [tipoBusqueda, setTipoBusqueda] = useState<"crotal" | "id">("crotal");
    const [origenBusquedaCrotal, setOrigenBusquedaCrotal] = useState<"manual" | "espada">("manual");
    const [valorBusqueda, setValorBusqueda] = useState("");

    const [buscandoAnimal, setBuscandoAnimal] = useState(false);
    const [leyendoBusquedaEspada, setLeyendoBusquedaEspada] = useState(false);
    const [esperandoCoincidencia, setEsperandoCoincidencia] = useState(false);

    const [avisoVisible, setAvisoVisible] = useState(false);
    const [avisoTitulo, setAvisoTitulo] = useState("");
    const [avisoMensaje, setAvisoMensaje] = useState("");
    const [avisoTipo, setAvisoTipo] = useState<"warning" | "error" | "info">("info");

    const [animalPendiente, setAnimalPendiente] = useState<any | null>(null);
    const [crotalEsperado, setCrotalEsperado] = useState("");

    const [lecturaNoCoincidente, setLecturaNoCoincidente] = useState<{
        crotal: string;
        id: string;
    } | null>(null);

    const ultimoCrotalProcesadoRef = useRef<string>("");
    const scrollRef = useRef<ScrollView | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const requiereCorral = modo === "entrada";
    const requiereBusqueda = modo === "busqueda";

    const irAConfiguracionAwr = () => {
        navigation.navigate(hayEspadasGuardadas ? "AWR-SAVED" : "AWR-STARTSCAN");
    };

    const moverScrollAlFinal = React.useCallback(() => {
        if (Platform.OS === "android") {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 250);
        }
    }, []);

    const mostrarAviso = (
        titulo: string,
        mensaje: string,
        tipo: "warning" | "error" | "info" = "info"
    ) => {
        setAvisoTitulo(titulo);
        setAvisoMensaje(mensaje);
        setAvisoTipo(tipo);
        setAvisoVisible(true);
    };

    const cerrarAviso = () => {
        setAvisoVisible(false);
        setAvisoTitulo("");
        setAvisoMensaje("");
    };

    const resetEstadoBusqueda = async () => {
        setBuscandoAnimal(false);
        setLeyendoBusquedaEspada(false);
        setEsperandoCoincidencia(false);
        setAnimalPendiente(null);
        setCrotalEsperado("");
        setLecturaNoCoincidente(null);
        ultimoCrotalProcesadoRef.current = "";
        limpiarCrotalLeido();

        try {
            await detenerLectura?.();
        } catch { }
    };

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        return () => {
            detenerLectura?.().catch(() => { });
        };
    }, [detenerLectura]);

    useEffect(() => {
        resetEstadoBusqueda();
    }, [modo, tipoBusqueda, origenBusquedaCrotal]);

    const puedeContinuar = useMemo(() => {
        if (requiereCorral) return corral.trim().length > 0;

        if (requiereBusqueda) {
            if (tipoBusqueda === "crotal" && origenBusquedaCrotal === "espada") {
                return lectorConectado;
            }

            return valorBusqueda.trim().length > 0;
        }

        return true;
    }, [
        requiereCorral,
        requiereBusqueda,
        corral,
        valorBusqueda,
        tipoBusqueda,
        origenBusquedaCrotal,
        lectorConectado,
    ]);

    const prepararEsperaCoincidencia = async (animal: any) => {
        const crotalAnimal =
            animal?.crotal !== null &&
                animal?.crotal !== undefined &&
                String(animal.crotal).trim() !== ""
                ? String(animal.crotal).trim()
                : "";

        if (!crotalAnimal) {
            mostrarAviso("Error", "El backend no devolvió un crotal válido para comparar.", "error");
            return false;
        }

        if (!lectorConectado) {
            mostrarAviso(
                t("maternidadConfig_alert_awrNotConnected"),
                t("maternidadConfig_alert_connectSwordBeforeContinue"),
                "warning"
            );
            return false;
        }

        try {
            setAnimalPendiente(animal);
            setCrotalEsperado(crotalAnimal);
            setEsperandoCoincidencia(true);

            setLecturaNoCoincidente(null);
            ultimoCrotalProcesadoRef.current = "";

            limpiarCrotalLeido();
            await iniciarLectura();

            return true;
        } catch {
            mostrarAviso(
                t("maternidadConfig_alert_error"),
                t("maternidadConfig_alert_couldNotStartReading"),
                "error"
            );

            setEsperandoCoincidencia(false);
            setAnimalPendiente(null);
            setCrotalEsperado("");
            return false;
        }
    };

    const onContinuar = async () => {
        if (modo === "busqueda") {
            try {
                setBuscandoAnimal(true);

                if (tipoBusqueda === "crotal" && origenBusquedaCrotal === "espada") {
                    if (!lectorConectado) {
                        mostrarAviso(
                            t("maternidadConfig_alert_awrNotConnected"),
                            t("maternidadConfig_alert_connectSwordBeforeContinue"),
                            "warning"
                        );
                        return;
                    }

                    setLeyendoBusquedaEspada(true);
                    limpiarCrotalLeido();

                    try {
                        await iniciarLectura();
                    } catch {
                        Alert.alert(
                            t("maternidadConfig_alert_error"),
                            t("maternidadConfig_alert_couldNotStartReading")
                        );
                        setLeyendoBusquedaEspada(false);
                    }

                    return;
                }

                const valor = valorBusqueda.trim();

                if (!valor) {
                    mostrarAviso(
                        t("maternidadConfig_alert_missingData"),
                        tipoBusqueda === "crotal"
                            ? t("maternidadConfig_alert_writeCrotalToSearch")
                            : t("maternidadConfig_alert_writeIdToSearch"),
                        "warning"
                    );
                    return;
                }

                const r =
                    tipoBusqueda === "crotal"
                        ? await obtenerLecturaEspada(valor)
                        : await obtenerAnimalPorId(valor);

                if (!r.ok) {
                    if (r.status === 404) {
                        mostrarAviso(
                            t("maternidadConfig_alert_notFound"),
                            tipoBusqueda === "crotal"
                                ? t("maternidadConfig_alert_noAnimalWithCrotal")
                                : t("maternidadConfig_alert_noAnimalWithId"),
                            "warning"
                        );
                        return;
                    }

                    const detalle =
                        typeof r.data === "string"
                            ? r.data
                            : r.data?.message ||
                            r.data?.error ||
                            r.data?.mensaje ||
                            r.rawText ||
                            `HTTP ${r.status}`;

                    if (r.status === 400) {
                        mostrarAviso(
                            t("maternidadConfig_alert_warning"),
                            limpiarMensajeBackend(String(detalle)),
                            "warning"
                        );
                        return;
                    }

                    mostrarAviso(
                        t("maternidadConfig_alert_searchError"),
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );
                    return;
                }

                const animalEncontrado = r.data ?? null;

                if (!animalEncontrado) {
                    Alert.alert(
                        t("maternidadConfig_alert_notFound"),
                        tipoBusqueda === "crotal"
                            ? t("maternidadConfig_alert_noAnimalWithCrotal")
                            : t("maternidadConfig_alert_noAnimalWithId")
                    );
                    return;
                }

                const ok = await prepararEsperaCoincidencia(animalEncontrado);
                if (!ok) return;

                return;
            } catch {
                mostrarAviso(
                    t("maternidadConfig_alert_networkError"),
                    t("maternidadConfig_alert_networkErrorMessage"),
                    "error"
                );
                return;
            } finally {
                setBuscandoAnimal(false);
            }
        }

        Keyboard.dismiss();

        setTimeout(() => {
            navigation.navigate("LectorMaternidad", {
                modo,
                corral: corral.trim(),
                detectarDesconocidos,
                confirmar,
            });
        }, Platform.OS === "android" ? 80 : 0);
    };

    useEffect(() => {
        const crotalActual = String(crotalLeido ?? "").trim();

        if (!leyendoBusquedaEspada || !crotalActual) return;

        let cancelado = false;

        const ejecutarBusqueda = async () => {
            try {
                const r = await obtenerLecturaEspada(crotalActual);

                if (cancelado) return;

                if (!r.ok) {
                    setLeyendoBusquedaEspada(false);

                    if (r.status === 404) {
                        mostrarAviso(
                            t("maternidadConfig_alert_notFound"),
                            t("maternidadConfig_alert_noAnimalWithCrotal"),
                            "warning"
                        );
                        return;
                    }

                    const detalle =
                        typeof r.data === "string"
                            ? r.data
                            : r.data?.message ||
                            r.data?.error ||
                            r.data?.mensaje ||
                            r.rawText ||
                            `HTTP ${r.status}`;

                    if (r.status === 400) {
                        mostrarAviso(
                            t("maternidadConfig_alert_warning"),
                            limpiarMensajeBackend(String(detalle)),
                            "warning"
                        );
                        return;
                    }

                    mostrarAviso(
                        t("maternidadConfig_alert_searchError"),
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );
                    return;
                }

                const animalEncontrado = r.data ?? null;

                if (!animalEncontrado) {
                    setLeyendoBusquedaEspada(false);
                    mostrarAviso(
                        t("maternidadConfig_alert_notFound"),
                        t("maternidadConfig_alert_noAnimalWithCrotal"),
                        "warning"
                    );
                    return;
                }

                setLeyendoBusquedaEspada(false);
                limpiarCrotalLeido();
                detenerLectura?.().catch(() => { });

                navigation.navigate("LectorMaternidad", {
                    modo: "busqueda",
                    tipoBusqueda: "crotal",
                    origenBusquedaCrotal: "espada",
                    valorBusqueda: String(animalEncontrado?.crotal ?? crotalActual),
                    animalEncontrado,
                });
            } catch {
                if (cancelado) return;

                setLeyendoBusquedaEspada(false);
                mostrarAviso(
                    t("maternidadConfig_alert_networkError"),
                    t("maternidadConfig_alert_networkErrorMessage"),
                    "error"
                );
            }
        };

        ejecutarBusqueda();

        return () => {
            cancelado = true;
        };
    }, [leyendoBusquedaEspada, crotalLeido, navigation, limpiarCrotalLeido, detenerLectura]);

    useEffect(() => {
        const leido = String(crotalLeido ?? "").trim();
        const esperado = String(crotalEsperado ?? "").trim();

        if (!esperandoCoincidencia || !animalPendiente || !leido || !esperado) return;

        if (ultimoCrotalProcesadoRef.current === leido) return;
        ultimoCrotalProcesadoRef.current = leido;

        if (leido === esperado) {
            setLecturaNoCoincidente(null);
            setEsperandoCoincidencia(false);
            limpiarCrotalLeido();
            detenerLectura?.().catch(() => { });

            navigation.navigate("LectorMaternidad", {
                modo: "busqueda",
                tipoBusqueda,
                origenBusquedaCrotal,
                valorBusqueda,
                animalEncontrado: animalPendiente,
            });
            return;
        }

        let cancelado = false;

        const cargarLecturaNoCoincidente = async () => {
            try {
                const r = await obtenerLecturaEspada(leido);

                if (cancelado) return;

                if (r.ok) {
                    const animalLeido = r.data ?? {};

                    const crotalTexto =
                        animalLeido?.crotal !== null &&
                            animalLeido?.crotal !== undefined &&
                            String(animalLeido.crotal).trim() !== ""
                            ? String(animalLeido.crotal)
                            : leido;

                    const idTexto =
                        animalLeido?.animalId !== null &&
                            animalLeido?.animalId !== undefined &&
                            String(animalLeido.animalId).trim() !== ""
                            ? String(animalLeido.animalId)
                            : "—";

                    setLecturaNoCoincidente({
                        crotal: crotalTexto,
                        id: idTexto,
                    });
                    return;
                }

                setLecturaNoCoincidente({
                    crotal: leido,
                    id: "—",
                });
            } catch {
                if (!cancelado) {
                    setLecturaNoCoincidente({
                        crotal: leido,
                        id: "—",
                    });
                }
            }
        };

        cargarLecturaNoCoincidente();

        return () => {
            cancelado = true;
        };
    }, [
        esperandoCoincidencia,
        animalPendiente,
        crotalLeido,
        crotalEsperado,
        navigation,
        limpiarCrotalLeido,
        detenerLectura,
        tipoBusqueda,
        origenBusquedaCrotal,
        valorBusqueda,
    ]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <Appbar.Header elevated style={{ backgroundColor: BRAND }}>
                <Appbar.BackAction color="white" onPress={() => navigation.goBack()} />

                <Appbar.Content
                    title={t("maternidadConfig_screenTitle")}
                    titleStyle={{ color: "white", fontWeight: "700" }}
                />
            </Appbar.Header>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                    flexGrow: 1,
                    padding: 12,
                    gap: 8,
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 14,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Card mode="contained" style={CARD_STYLE}>
                    <Card.Content style={{ paddingVertical: 12 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 10,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: TEXT,
                                        fontSize: 18,
                                        fontWeight: "900",
                                    }}
                                >
                                    Modo de trabajo
                                </Text>

                                <Text
                                    style={{
                                        color: MUTED,
                                        marginTop: 4,
                                        lineHeight: 19,
                                    }}
                                >
                                    Selecciona qué hará el lector.
                                </Text>
                            </View>

                            <View
                                style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 999,
                                    backgroundColor: "#ECFDF5",
                                    borderWidth: 1,
                                    borderColor: "#CCFBF1",
                                    ...SHADOW_SOFT,
                                }}
                            >
                                <Text
                                    style={{
                                        color: BRAND,
                                        fontWeight: "900",
                                        fontSize: 12,
                                    }}
                                >
                                    {modo === "entrada"
                                        ? t("maternidadConfig_entry")
                                        : modo === "salida"
                                            ? t("maternidadConfig_exit")
                                            : modo === "lectura"
                                                ? t("maternidadConfig_reading")
                                                : t("maternidadConfig_search")}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <ModoCard
                                titulo={t("maternidadConfig_entry")}
                                descripcion="Registrar entrada"
                                active={modo === "entrada"}
                                onPress={() => setModo("entrada")}
                            />

                            <ModoCard
                                titulo={t("maternidadConfig_exit")}
                                descripcion="Registrar salida"
                                active={modo === "salida"}
                                onPress={() => setModo("salida")}
                            />
                        </View>

                        <View style={{ height: 8 }} />

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <ModoCard
                                titulo={t("maternidadConfig_reading")}
                                descripcion="Solo consultar"
                                active={modo === "lectura"}
                                onPress={() => setModo("lectura")}
                            />

                            <ModoCard
                                titulo={t("maternidadConfig_search")}
                                descripcion="Buscar animal"
                                active={modo === "busqueda"}
                                onPress={() => setModo("busqueda")}
                            />
                        </View>
                    </Card.Content>
                </Card>

                {(modo === "entrada" || modo === "salida") && (
                    <Card mode="contained" style={CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <Text style={{ fontSize: 17, fontWeight: "900", color: TEXT }}>
                                Ajustes del envío
                            </Text>

                            <Text style={{ marginTop: 4, color: MUTED, lineHeight: 19 }}>
                                Configura cómo se comporta el flujo al leer animales.
                            </Text>

                            <View style={{ height: 10 }} />

                            <SwitchLine
                                title={t("maternidadConfig_detectUnknownTitle")}
                                description={t("maternidadConfig_detectUnknownDescription")}
                                value={detectarDesconocidos}
                                onValueChange={setDetectarDesconocidos}
                            />

                            <View style={{ height: 8 }} />

                            <SwitchLine
                                title={t("maternidadConfig_confirmTitle") || "Confirmar envío"}
                                description={t("maternidadConfig_confirmDescription")}
                                value={confirmar}
                                onValueChange={setConfirmar}
                            />

                            {modo === "entrada" && (
                                <>
                                    <View style={{ height: 14 }} />

                                    <Divider
                                        style={{
                                            height: 1,
                                            backgroundColor: "#E2E8F0",
                                        }}
                                    />

                                    <View style={{ height: 10 }} />

                                    <Text
                                        style={{
                                            color: TEXT,
                                            fontSize: 16,
                                            fontWeight: "900",
                                            marginBottom: 8,
                                        }}
                                    >
                                        Corral de entrada
                                    </Text>

                                    <View
                                        style={{
                                            borderRadius: 12,
                                            backgroundColor: "#FFFFFF",
                                            ...(corral.trim().length === 0 ? {} : SHADOW_SOFT),
                                        }}
                                    >
                                        <TextInput
                                            mode="outlined"
                                            dense
                                            label={t("maternidadConfig_corralLabel")}
                                            value={corral}
                                            onChangeText={setCorral}
                                            placeholder="Ej: 1"
                                            keyboardType="number-pad"
                                            outlineColor={corral.trim().length === 0 ? ERROR : BORDER}
                                            activeOutlineColor={corral.trim().length === 0 ? ERROR : BRAND}
                                            textColor={TEXT}
                                            style={{
                                                backgroundColor: "#FFFFFF",
                                                height: 44,
                                            }}
                                            outlineStyle={{
                                                borderRadius: 12,
                                                borderWidth: corral.trim().length === 0 ? 2 : 1,
                                            }}
                                            contentStyle={{
                                                fontWeight: "800",
                                                fontSize: 16,
                                            }}
                                            onFocus={moverScrollAlFinal}
                                        />
                                    </View>

                                    {!puedeContinuar && (
                                        <Text
                                            style={{
                                                color: ERROR,
                                                fontWeight: "800",
                                                marginTop: 6,
                                                fontSize: 13,
                                            }}
                                        >
                                            {t("maternidadConfig_corralRequired")}
                                        </Text>
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {modo === "busqueda" && (
                    <Card mode="contained" style={CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <Text style={{ fontSize: 17, fontWeight: "900", color: TEXT }}>
                                {t("maternidadConfig_animalSearchTitle")}
                            </Text>

                            <Text style={{ marginTop: 4, color: MUTED, lineHeight: 19 }}>
                                {t("maternidadConfig_animalSearchDescription")}
                            </Text>

                            <View style={{ height: 10 }} />

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <OpcionCompacta
                                    label={t("maternidadConfig_searchByCrotal")}
                                    active={tipoBusqueda === "crotal"}
                                    onPress={() => {
                                        setTipoBusqueda("crotal");
                                        setValorBusqueda("");
                                    }}
                                />

                                <OpcionCompacta
                                    label={t("maternidadConfig_searchById")}
                                    active={tipoBusqueda === "id"}
                                    onPress={() => {
                                        setTipoBusqueda("id");
                                        setValorBusqueda("");
                                    }}
                                />
                            </View>

                            {tipoBusqueda === "crotal" && (
                                <>
                                    <View style={{ height: 8 }} />

                                    <View style={{ flexDirection: "row", gap: 10 }}>
                                        <OpcionCompacta
                                            label={t("maternidadConfig_manual")}
                                            active={origenBusquedaCrotal === "manual"}
                                            onPress={() => {
                                                setOrigenBusquedaCrotal("manual");
                                                setValorBusqueda("");
                                            }}
                                        />

                                        <OpcionCompacta
                                            label={t("maternidadConfig_withSword")}
                                            active={origenBusquedaCrotal === "espada"}
                                            onPress={() => {
                                                setOrigenBusquedaCrotal("espada");
                                                setValorBusqueda("");
                                            }}
                                        />
                                    </View>
                                </>
                            )}

                            {!(tipoBusqueda === "crotal" && origenBusquedaCrotal === "espada") && (
                                <>
                                    <View style={{ height: 10 }} />

                                    <View style={{ borderRadius: 12, backgroundColor: "#FFFFFF", ...SHADOW_SOFT }}>
                                        <TextInput
                                            mode="outlined"
                                            label={
                                                tipoBusqueda === "crotal"
                                                    ? t("maternidadConfig_crotalLabelSearch")
                                                    : t("maternidadConfig_idLabelSearch")
                                            }
                                            value={valorBusqueda}
                                            onChangeText={setValorBusqueda}
                                            placeholder={
                                                tipoBusqueda === "crotal"
                                                    ? t("maternidadConfig_crotalPlaceholderSearch")
                                                    : t("maternidadConfig_idPlaceholderSearch")
                                            }
                                            keyboardType={tipoBusqueda === "crotal" ? "number-pad" : "default"}
                                            autoCapitalize={tipoBusqueda === "id" ? "characters" : "none"}
                                            autoCorrect={false}
                                            outlineColor={BORDER}
                                            activeOutlineColor={BRAND}
                                            style={{ backgroundColor: "#FFFFFF" }}
                                            outlineStyle={{ borderRadius: 12 }}
                                        />
                                    </View>

                                    {valorBusqueda.trim().length === 0 && (
                                        <Text style={{ color: "#DC2626", fontWeight: "700", marginTop: 8 }}>
                                            {tipoBusqueda === "crotal"
                                                ? t("maternidadConfig_crotalRequiredSearch")
                                                : t("maternidadConfig_idRequiredSearch")}
                                        </Text>
                                    )}
                                </>
                            )}

                            {tipoBusqueda === "crotal" && origenBusquedaCrotal === "espada" && (
                                <Text style={{ color: MUTED, marginTop: 12 }}>
                                    {t("maternidadConfig_searchWithSwordHelp")}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {(buscandoAnimal || leyendoBusquedaEspada || esperandoCoincidencia) && (
                    <Card mode="contained" style={CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                <Ionicons name="scan-outline" size={22} color={BRAND} />

                                <Text style={{ fontSize: 16, fontWeight: "900", color: TEXT }}>
                                    {leyendoBusquedaEspada
                                        ? t("maternidadConfig_readingSword")
                                        : esperandoCoincidencia
                                            ? t("maternidadConfig_waitingMatch")
                                            : t("maternidadConfig_searchingAnimal")}
                                </Text>
                            </View>

                            <Text style={{ marginTop: 8, color: MUTED }}>
                                {leyendoBusquedaEspada
                                    ? t("maternidadConfig_readingSwordDescription")
                                    : esperandoCoincidencia
                                        ? t("maternidadConfig_waitingMatchDescription", { crotal: crotalEsperado })
                                        : t("maternidadConfig_searchingAnimalDescription")}
                            </Text>

                            {esperandoCoincidencia && lecturaNoCoincidente && (
                                <View
                                    style={{
                                        marginTop: 14,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: "#FECACA",
                                        backgroundColor: "#FEF2F2",
                                        padding: 12,
                                        ...SHADOW_SOFT,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#991B1B",
                                            fontWeight: "900",
                                            fontSize: 14,
                                        }}
                                    >
                                        {t("Config_lastReadMismatchTitle")}
                                    </Text>

                                    <Text
                                        style={{
                                            marginTop: 6,
                                            color: "#B91C1C",
                                            fontSize: 13,
                                            fontWeight: "700",
                                        }}
                                    >
                                        {t("Config_lastReadMismatchCrotal")}: {lecturaNoCoincidente.crotal} · {t("Config_lastReadMismatchId")}: {lecturaNoCoincidente.id}
                                    </Text>
                                </View>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {!lectorConectado && (
                    <Card mode="contained" style={CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={irAConfiguracionAwr}
                                style={{
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: "#FECACA",
                                    backgroundColor: "#FEF2F2",
                                    padding: 14,
                                    ...SHADOW_SOFT,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 999,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#FEE2E2",
                                        }}
                                    >
                                        <Ionicons
                                            name="alert-circle-outline"
                                            size={20}
                                            color="#DC2626"
                                        />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                color: "#991B1B",
                                                fontWeight: "900",
                                                fontSize: 15,
                                            }}
                                        >
                                            {t("maternidadConfig_awrDisconnectedTitle")}
                                        </Text>

                                        <Text
                                            style={{
                                                color: "#B91C1C",
                                                marginTop: 3,
                                                fontSize: 12,
                                            }}
                                        >
                                            {hayEspadasGuardadas
                                                ? t("maternidadConfig_awrSavedDescription")
                                                : t("maternidadConfig_awrNotSavedDescription")}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name="chevron-forward-outline"
                                        size={22}
                                        color="#DC2626"
                                    />
                                </View>
                            </TouchableOpacity>
                        </Card.Content>
                    </Card>
                )}

                <View style={{ marginTop: 8, marginBottom: 6 }}>
                    <Button
                        mode="contained"
                        onPress={onContinuar}
                        disabled={
                            !puedeContinuar ||
                            buscandoAnimal ||
                            leyendoBusquedaEspada ||
                            esperandoCoincidencia
                        }
                        style={{
                            borderRadius: 16,
                            backgroundColor: puedeContinuar ? BRAND : "#94A3B8",
                            ...SHADOW_CARD,
                        }}
                        contentStyle={{ height: 46 }}
                        labelStyle={{ fontSize: 16, fontWeight: "900" }}
                    >
                        {modo === "busqueda"
                            ? t("maternidadConfig_scan")
                            : t("maternidadConfig_continue")}
                    </Button>
                </View>
            </ScrollView>

            <Modal
                visible={avisoVisible}
                transparent
                animationType="fade"
                onRequestClose={cerrarAviso}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                >
                    <View
                        style={{
                            width: "100%",
                            maxWidth: 390,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 24,
                            paddingHorizontal: 20,
                            paddingVertical: 18,
                            ...SHADOW_CARD,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 14,
                                alignSelf: "flex-start",
                                marginLeft: 4,
                            }}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor:
                                        avisoTipo === "error"
                                            ? "#FEF2F2"
                                            : avisoTipo === "warning"
                                                ? "#FFF7ED"
                                                : "#EEF2FF",
                                }}
                            >
                                <Ionicons
                                    name={
                                        avisoTipo === "error"
                                            ? "alert-circle-outline"
                                            : avisoTipo === "warning"
                                                ? "warning-outline"
                                                : "information-circle-outline"
                                    }
                                    size={22}
                                    color={
                                        avisoTipo === "error"
                                            ? "#DC2626"
                                            : avisoTipo === "warning"
                                                ? "#EA580C"
                                                : BRAND
                                    }
                                />
                            </View>

                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "900",
                                    color: TEXT,
                                }}
                            >
                                {avisoTitulo}
                            </Text>
                        </View>

                        <Text
                            style={{
                                fontSize: 17,
                                lineHeight: 25,
                                color: MUTED,
                                textAlign: "center",
                                marginBottom: 18,
                            }}
                        >
                            {avisoMensaje}
                        </Text>

                        <TouchableOpacity
                            onPress={cerrarAviso}
                            activeOpacity={0.9}
                            style={{
                                height: 42,
                                borderRadius: 14,
                                backgroundColor: BRAND,
                                alignItems: "center",
                                justifyContent: "center",
                                alignSelf: "center",
                                paddingHorizontal: 34,
                                minWidth: 130,
                                ...SHADOW_ACTIVE,
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
                                {t("Aceptar")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};