/* eslint-disable prettier/prettier */
//cambio a 0.77
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Keyboard,
    TouchableOpacity,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
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
import { useAjustesEnvioGestacionStore } from "../../stores/ajustesEnvioGestacionStore";

type Modo = "entrada" | "salida" | "lectura" | "busqueda";

const BRAND = "#0F766E";
const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const ERROR = "#B91C1C";

const CONFIG_BG = "#F1F5F9";
const CONFIG_BORDER = "#CBD5E1";
const CONFIG_DIVIDER = "#CBD5E1";

const CORRAL_BG = "#FFFFFF";
const CORRAL_BORDER = "#E2E8F0";
const CORRAL_ICON_BG = "#F8FAFC";
const CORRAL_ICON_BORDER = "#CBD5E1";
const CORRAL_ICON_COLOR = "#475569";
const SWITCH_SCALE = Platform.OS === "ios" ? 0.75 : 0.70;

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

const CONFIG_CARD_STYLE = {
    borderRadius: 18,
    backgroundColor: CONFIG_BG,
    borderWidth: 1.5,
    borderColor: CONFIG_BORDER,
    ...SHADOW_CARD,
};

const CORRAL_CARD_STYLE = {
    borderRadius: 18,
    backgroundColor: CORRAL_BG,
    borderWidth: 1.5,
    borderColor: CORRAL_BORDER,
    ...SHADOW_CARD,
};

const SECTION_DIVIDER = {
    height: 1,
    backgroundColor: CONFIG_DIVIDER,
    marginVertical: 14,
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
                backgroundColor: "#FFFFFF",
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

            <View
                style={{
                    width: 48,
                    height: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                }}
            >
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    color={BRAND}
                    style={{
                        transform: [
                            { scaleX: SWITCH_SCALE },
                            { scaleY: SWITCH_SCALE },
                        ],
                    }}
                />
            </View>
        </View>
    );
}

const limpiarMensajeBackend = (mensaje?: string) => {
    if (!mensaje) return "";
    return mensaje.replace(/^Error:\s*/i, "").trim();
};

export const ConfiguracionGestacionScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();

    const lectorConectado = useAwrConn((s) => s.isConnected);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    const conectarEspada = useAwrConn((s) => s.connect);
    const currentAwrId = useAwrConn((s) => s.currentId);
    const awrConnecting = useAwrConn((s) => s.connecting);

    const espadasGuardadas = awrStore((s) => s.devices);
    const hayEspadasGuardadas = espadasGuardadas.length > 0;

    const [modalEspadasVisible, setModalEspadasVisible] = useState(false);
    const [espadaConectandoId, setEspadaConectandoId] = useState<string | null>(null);
    const [modo, setModo] = useState<Modo>("entrada");
    const [corral, setCorral] = useState("");
    const detectarDesconocidos = useAjustesEnvioGestacionStore(
        (s) => s.detectarDesconocidos
    );

    const confirmar = useAjustesEnvioGestacionStore(
        (s) => s.confirmar
    );

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

    const scrollRef = useRef<ScrollView | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [animalPendiente, setAnimalPendiente] = useState<any | null>(null);
    const [crotalEsperado, setCrotalEsperado] = useState("");

    const requiereCorral = modo === "entrada";
    const requiereBusqueda = modo === "busqueda";

    const irAConfiguracionAwr = () => {
        if (hayEspadasGuardadas) {
            setModalEspadasVisible(true);
            return;
        }

        const topTabsNavigation = navigation.getParent?.();
        const stackNavigation = topTabsNavigation?.getParent?.();

        if (stackNavigation?.navigate) {
            stackNavigation.navigate("GeneralAwrStartScan");
            return;
        }

        navigation.navigate("GeneralAwrStartScan");
    };

    const conectarEspadaGuardada = async (id: string) => {
        try {
            setEspadaConectandoId(id);

            await conectarEspada(id);
            await iniciarLectura?.();

            setModalEspadasVisible(false);

            mostrarAviso(
                "Conectado",
                "La espada se ha conectado correctamente.",
                "info"
            );
        } catch {
            mostrarAviso(
                "Error",
                "No se pudo conectar con la espada seleccionada.",
                "error"
            );
        } finally {
            setEspadaConectandoId(null);
        }
    };

    const [lecturaNoCoincidente, setLecturaNoCoincidente] = useState<{
        crotal: string;
        id: string;
    } | null>(null);

    const ultimoCrotalProcesadoRef = useRef<string>("");

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
        limpiarCrotalLeido();
        setLecturaNoCoincidente(null);
        ultimoCrotalProcesadoRef.current = "";

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
            mostrarAviso(
                t("gestacionConfig_alerts_notice"),
                t("gestacionConfig_alerts_invalidCrotalFromBackend"),
                "warning"
            );
            return false;
        }

        if (!lectorConectado) {
            mostrarAviso(
                t("gestacionConfig_alerts_awrNotConnected"),
                t("gestacionConfig_alerts_connectSwordBeforeContinue"),
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
                t("gestacionConfig_alerts_error"),
                t("gestacionConfig_alerts_couldNotStartReading"),
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
                        Alert.alert(
                            t("gestacionConfig_alerts_awrNotConnected"),
                            t("gestacionConfig_alerts_connectSwordBeforeContinue")
                        );
                        return;
                    }

                    setLeyendoBusquedaEspada(true);
                    limpiarCrotalLeido();

                    try {
                        await iniciarLectura();
                    } catch {
                        Alert.alert(
                            t("gestacionConfig_alerts_error"),
                            t("gestacionConfig_alerts_couldNotStartReading")
                        );
                        setLeyendoBusquedaEspada(false);
                    }

                    return;
                }

                const valor = valorBusqueda.trim();

                if (!valor) {
                    mostrarAviso(
                        t("gestacionConfig_alerts_notice"),
                        tipoBusqueda === "crotal"
                            ? t("gestacionConfig_alerts_writeCrotalToSearch")
                            : t("gestacionConfig_alerts_writeIdToSearch"),
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
                            t("gestacionConfig_alerts_notFound"),
                            tipoBusqueda === "crotal"
                                ? t("gestacionConfig_alerts_animalNotFoundByCrotal")
                                : t("gestacionConfig_alerts_animalNotFoundById"),
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
                            t("gestacionConfig_alerts_warning"),
                            limpiarMensajeBackend(String(detalle)),
                            "warning"
                        );
                        return;
                    }

                    mostrarAviso(
                        t("gestacionConfig_alerts_searchError"),
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );
                    return;
                }

                const animalEncontrado = r.data ?? null;

                if (!animalEncontrado) {
                    Alert.alert(
                        t("gestacionConfig_alerts_notFound"),
                        tipoBusqueda === "crotal"
                            ? t("gestacionConfig_alerts_animalNotFoundByCrotal")
                            : t("gestacionConfig_alerts_animalNotFoundById")
                    );
                    return;
                }

                const ok = await prepararEsperaCoincidencia(animalEncontrado);
                if (!ok) return;

                return;
            } catch {
                mostrarAviso(
                    t("gestacionConfig_alerts_networkError"),
                    t("gestacionConfig_alerts_networkErrorMessage"),
                    "error"
                );
                return;
            } finally {
                setBuscandoAnimal(false);
            }
        }

        Keyboard.dismiss();

        setTimeout(() => {
            navigation.navigate("LectorGestacion", {
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
                            t("gestacionConfig_alerts_notFound"),
                            t("gestacionConfig_alerts_animalNotFoundByCrotal"),
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
                            t("gestacionConfig_alerts_warning"),
                            limpiarMensajeBackend(String(detalle)),
                            "warning"
                        );
                        return;
                    }

                    mostrarAviso(
                        t("gestacionConfig_alerts_searchError"),
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );
                    return;
                }

                const animalEncontrado = r.data ?? null;

                if (!animalEncontrado) {
                    setLeyendoBusquedaEspada(false);
                    Alert.alert(
                        t("gestacionConfig_alerts_notFound"),
                        t("gestacionConfig_alerts_animalNotFoundByCrotal")
                    );
                    return;
                }

                setLeyendoBusquedaEspada(false);
                limpiarCrotalLeido();
                detenerLectura?.().catch(() => { });

                navigation.navigate("LectorGestacion", {
                    modo: "busqueda",
                    tipoBusqueda: "crotal",
                    origenBusquedaCrotal: "espada",
                    valorBusqueda: String(animalEncontrado?.crotal ?? crotalActual),
                    animalEncontrado,
                });
            } catch {
                if (cancelado) return;

                setLeyendoBusquedaEspada(false);
                Alert.alert(
                    t("gestacionConfig_alerts_networkError"),
                    t("gestacionConfig_alerts_networkErrorMessage")
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

            navigation.navigate("LectorGestacion", {
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
                <Card mode="contained" style={CONFIG_CARD_STYLE}>
                    <Card.Content style={{ paddingVertical: 12 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        color: "#334155",
                                        fontSize: 13,
                                        fontWeight: "900",
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    {t("gestacionConfig_flowSectionTitle")}
                                </Text>

                                <Text
                                    style={{
                                        color: TEXT,
                                        fontSize: 18,
                                        fontWeight: "900",
                                        marginTop: 2,
                                    }}
                                >
                                    {t("gestacionConfig_workModeTitle")}
                                </Text>

                                <Text
                                    style={{
                                        color: MUTED,
                                        marginTop: 4,
                                        lineHeight: 19,
                                    }}
                                >
                                    {t("gestacionConfig_workModeDescription")}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    const topTabsNavigation = navigation.getParent?.();
                                    const stackNavigation = topTabsNavigation?.getParent?.();

                                    if (stackNavigation?.navigate) {
                                        stackNavigation.navigate("AjustesEnvioGestacion");
                                        return;
                                    }

                                    navigation.navigate("AjustesEnvioGestacion");
                                }}
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 14,
                                    backgroundColor: "#FFFFFF",
                                    borderWidth: 1,
                                    borderColor: "#CBD5E1",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    ...SHADOW_SOFT,
                                }}
                            >
                                <Ionicons
                                    name="settings-outline"
                                    size={21}
                                    color={BRAND}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <ModoCard
                                titulo={t("gestacionConfig_entry")}
                                descripcion={t("gestacionConfig_entryDescription")}
                                active={modo === "entrada"}
                                onPress={() => setModo("entrada")}
                            />

                            <ModoCard
                                titulo={t("gestacionConfig_exit")}
                                descripcion={t("gestacionConfig_exitDescription")}
                                active={modo === "salida"}
                                onPress={() => setModo("salida")}
                            />
                        </View>

                        <View style={{ height: 8 }} />

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <ModoCard
                                titulo={t("gestacionConfig_reading")}
                                descripcion={t("gestacionConfig_readingDescription")}
                                active={modo === "lectura"}
                                onPress={() => setModo("lectura")}
                            />

                            <ModoCard
                                titulo={t("gestacionConfig_search")}
                                descripcion={t("gestacionConfig_searchDescription")}
                                active={modo === "busqueda"}
                                onPress={() => setModo("busqueda")}
                            />
                        </View>


                    </Card.Content>
                </Card>

                {modo === "entrada" && (
                    <Card mode="contained" style={CORRAL_CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 10,
                                    marginBottom: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 19,
                                        backgroundColor: corral.trim().length === 0 ? "#FEE2E2" : CORRAL_ICON_BG,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: corral.trim().length === 0 ? "#FECACA" : CORRAL_ICON_BORDER,
                                    }}
                                >
                                    <Ionicons
                                        name="home-outline"
                                        size={21}
                                        color={corral.trim().length === 0 ? ERROR : CORRAL_ICON_COLOR}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            color: TEXT,
                                            fontSize: 17,
                                            fontWeight: "900",
                                        }}
                                    >
                                        {t("gestacionConfig_corralSectionTitle")}
                                    </Text>

                                    <Text
                                        style={{
                                            color: MUTED,
                                            marginTop: 2,
                                            fontSize: 12,
                                            lineHeight: 16,
                                        }}
                                    >
                                        {t("gestacionConfig_corralSectionDescription")}
                                    </Text>
                                </View>
                            </View>

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
                                    label={t("gestacionConfig_corralLabel")}
                                    value={corral}
                                    onChangeText={setCorral}
                                    placeholder={t("gestacionConfig_corralPlaceholder")}
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
                                        borderWidth: corral.trim().length === 0 ? 2 : 1.5,
                                    }}
                                    contentStyle={{
                                        fontWeight: "800",
                                        fontSize: 16,
                                    }}
                                    onFocus={() => {
                                        if (Platform.OS === "android") {
                                            setTimeout(() => {
                                                scrollRef.current?.scrollToEnd({ animated: true });
                                            }, 250);
                                        }
                                    }}
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
                                    {t("gestacionConfig_corralRequired")}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {modo === "busqueda" && (
                    <Card mode="contained" style={CARD_STYLE}>
                        <Card.Content style={{ paddingVertical: 12 }}>
                            <Text style={{ fontSize: 17, fontWeight: "900", color: TEXT }}>
                                {t("gestacionConfig_animalSearchTitle")}
                            </Text>

                            <Text style={{ marginTop: 4, color: MUTED, lineHeight: 19 }}>
                                {t("gestacionConfig_animalSearchDescription")}
                            </Text>

                            <View style={{ height: 10 }} />

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <OpcionCompacta
                                    label={t("gestacionConfig_searchByCrotal")}
                                    active={tipoBusqueda === "crotal"}
                                    onPress={() => {
                                        setTipoBusqueda("crotal");
                                        setValorBusqueda("");
                                    }}
                                />

                                <OpcionCompacta
                                    label={t("gestacionConfig_searchById")}
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
                                            label={t("gestacionConfig_manual")}
                                            active={origenBusquedaCrotal === "manual"}
                                            onPress={() => {
                                                setOrigenBusquedaCrotal("manual");
                                                setValorBusqueda("");
                                            }}
                                        />

                                        <OpcionCompacta
                                            label={t("gestacionConfig_withSword")}
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
                                                    ? t("gestacionConfig_crotalLabelSearch")
                                                    : t("gestacionConfig_idLabelSearch")
                                            }
                                            value={valorBusqueda}
                                            onChangeText={setValorBusqueda}
                                            placeholder={
                                                tipoBusqueda === "crotal"
                                                    ? t("gestacionConfig_crotalPlaceholderSearch")
                                                    : t("gestacionConfig_idPlaceholderSearch")
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
                                                ? t("gestacionConfig_crotalRequiredSearch")
                                                : t("gestacionConfig_idRequiredSearch")}
                                        </Text>
                                    )}
                                </>
                            )}

                            {tipoBusqueda === "crotal" && origenBusquedaCrotal === "espada" && (
                                <Text style={{ color: MUTED, marginTop: 12 }}>
                                    {t("gestacionConfig_searchWithSwordHelp")}
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
                                        ? t("gestacionConfig_readingSword")
                                        : esperandoCoincidencia
                                            ? t("gestacionConfig_waitingMatch")
                                            : t("gestacionConfig_searchingAnimal")}
                                </Text>
                            </View>

                            <Text style={{ marginTop: 8, color: MUTED }}>
                                {leyendoBusquedaEspada
                                    ? t("gestacionConfig_readingSwordDescription")
                                    : esperandoCoincidencia
                                        ? t("gestacionConfig_waitingMatchDescription", { crotal: crotalEsperado })
                                        : t("gestacionConfig_searchingAnimalDescription")}
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
                                            {t("gestacionConfig_awrDisconnectedTitle")}
                                        </Text>

                                        <Text
                                            style={{
                                                color: "#B91C1C",
                                                marginTop: 3,
                                                fontSize: 12,
                                            }}
                                        >
                                            {hayEspadasGuardadas
                                                ? t("gestacionConfig_awrSavedDescription")
                                                : t("gestacionConfig_awrNotSavedDescription")}
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
                            ? t("gestacionConfig_scan")
                            : t("gestacionConfig_continue")}
                    </Button>
                </View>
            </ScrollView>

            <Modal
                visible={modalEspadasVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalEspadasVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 20,
                    }}
                >
                    <View
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 24,
                            paddingHorizontal: 18,
                            paddingVertical: 18,
                            ...SHADOW_CARD,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 12,
                                marginBottom: 14,
                            }}
                        >
                            <View
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 27,
                                    backgroundColor: "#ECFDF5",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons
                                    name="bluetooth-outline"
                                    size={28}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: "900",
                                        color: TEXT,
                                    }}
                                >
                                    Espadas guardadas
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: MUTED,
                                        marginTop: 2,
                                        fontWeight: "600",
                                    }}
                                >
                                    Selecciona una espada para conectarla.
                                </Text>
                            </View>
                        </View>

                        <ScrollView
                            style={{ maxHeight: 320 }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10 }}
                        >
                            {espadasGuardadas.map((item) => {
                                const titulo = item.name || item.label || item.id;

                                const esActual =
                                    currentAwrId &&
                                    currentAwrId.toLowerCase() === item.id.toLowerCase();

                                const conectada = esActual && lectorConectado;
                                const conectando = espadaConectandoId === item.id || awrConnecting;

                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        activeOpacity={0.9}
                                        onPress={() => conectarEspadaGuardada(item.id)}
                                        disabled={conectando}
                                        style={{
                                            borderRadius: 18,
                                            borderWidth: conectada ? 1.5 : 1,
                                            borderColor: conectada ? "#86EFAC" : "#E2E8F0",
                                            backgroundColor: conectada ? "#F0FDF4" : "#F8FAFC",
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
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: 26,
                                                    backgroundColor: conectada ? "#DCFCE7" : "#E5E7EB",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Ionicons
                                                    name={conectada ? "bluetooth" : "bluetooth-outline"}
                                                    size={26}
                                                    color={conectada ? "#16A34A" : "#475569"}
                                                />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 20,
                                                        fontWeight: "900",
                                                        color: TEXT,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {titulo}
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: MUTED,
                                                        marginTop: 2,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {item.id}
                                                </Text>

                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: "800",
                                                        color: conectada ? "#166534" : "#64748B",
                                                        marginTop: 5,
                                                    }}
                                                >
                                                    {conectando
                                                        ? "Conectando..."
                                                        : conectada
                                                            ? "Conectado"
                                                            : "Toca para conectar"}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name={conectada ? "checkmark-circle" : "chevron-forward-outline"}
                                                size={28}
                                                color={conectada ? "#16A34A" : "#94A3B8"}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={{ marginTop: 18 }}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setModalEspadasVisible(false)}
                                style={{
                                    height: 50,
                                    borderRadius: 14,
                                    backgroundColor: BRAND,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    ...SHADOW_ACTIVE,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontWeight: "900",
                                        fontSize: 17,
                                    }}
                                >
                                    Salir
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                                {t("common_accept")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};