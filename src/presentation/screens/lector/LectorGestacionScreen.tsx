/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, } from "react-native";
import { useAwrConn } from "../../../stores/awrConnStore";
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Appbar, Switch, TextInput } from "react-native-paper";
import { IndicadorConexionAnimado } from "../../components/IndicadorConexionAnimado";
import { obtenerLecturaEspada, formatearSoloFecha, postActualizarId } from "../../routes/obtenerLecturaEspada";
import { construirEndpointEspada } from "../../../stores/apiConfig";
import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";


const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BRAND = "#4F46E5";
const SOFT = "#EEF2FF";
const SOFT_BORDER = "#C7D2FE";
const DANGER = "#DC2626";
const SUCCESS = "#16A34A";

const SHADOW = {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
};

type RegistroEnviado = {
    localId: string;
    corral: string;
    idBackend: string;
    crotal: string;
};

type TipoMovimiento = "entrada" | "salida" | "lectura" | "busqueda";
type EstadoIdVisual = "neutro" | "success" | "error";

// ---------- helpers ----------
const normalizarClave = (valor: string) =>
    valor.trim().toUpperCase().replace(/\s+/g, "");

const parseNumeroSeguro = (txt: string) => {
    const n = Number(txt);
    return Number.isFinite(n) ? n : null;
};



async function postGestation(
    endpoint: string,
    payload: { corral?: number; crotal: number }
) {
    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await res.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = null;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return { ok: res.ok, status: res.status, data, rawText };
}
function upsertRegistroPorCrotal(
    prev: RegistroEnviado[],
    corralValor: string,
    crotalValor: string,
    idBackend: string
) {
    const key = normalizarClave(String(crotalValor));
    const idx = prev.findIndex((x) => normalizarClave(x.crotal) === key);

    const corralTexto = corralValor?.trim() ? corralValor : "—";

    if (idx >= 0) {
        const copia = [...prev];
        const actualizado: RegistroEnviado = {
            ...copia[idx],
            corral: corralTexto,
            crotal: String(crotalValor),
            idBackend: idBackend || "—",
        };
        copia.splice(idx, 1);
        return [actualizado, ...copia];
    }

    return [
        {
            localId: String(Date.now()),
            corral: corralTexto,
            idBackend: idBackend || "—",
            crotal: String(crotalValor),
        },
        ...prev,
    ];
}
// ---------- UI helpers ----------
// const InfoRow = ({
//     icon,
//     label,
//     value,
// }: {
//     icon: any;
//     label: string;
//     value: string;
// }) => (
//     <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
//         <Ionicons name={icon} size={18} color={MUTED} />
//         <Text style={{ color: MUTED, fontWeight: "800", width: 160 }}>{label}</Text>
//         <Text style={{ color: TEXT, fontWeight: "900", flex: 1, textAlign: "right" }}>{value}</Text>
//     </View>
// );

const SwitchRowReadonly = ({
    title,
    description,
    value,
}: {
    title: string;
    description: string;
    value: boolean;
}) => (
    <View
        style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
        }}
    >
        <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: TEXT, fontWeight: "800" }}>{title}</Text>
            <Text style={{ color: MUTED, marginTop: 2, fontSize: 12 }}>
                {description}
            </Text>
        </View>

        <View pointerEvents="none">
            <Switch value={value} onValueChange={() => { }} />
        </View>
    </View>
);

const MiniResumenCard = ({
    icon,
    titulo,
    valor,
}: {
    icon: any;
    titulo: string;
    valor: string;
}) => (
    <View
        style={{
            flex: 1,
            backgroundColor: "#F8FAFF",
            borderWidth: 1,
            borderColor: "#E0E7FF",
            borderRadius: 14,
            padding: 12,
            gap: 8,
        }}
    >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name={icon} size={16} color={BRAND} />
            <Text style={{ color: MUTED, fontWeight: "800", fontSize: 12 }}>
                {titulo}
            </Text>
        </View>

        <Text
            style={{
                color: TEXT,
                fontWeight: "900",
                fontSize: 16,
            }}
            numberOfLines={1}
        >
            {valor}
        </Text>
    </View>
);

const CajaDatoLectura = ({
    icon,
    usarFeather = false,
    titulo,
    valor,
    fondo,
    borde,
    colorTitulo,
    colorValor,
    textoSecundario,
}: {
    icon?: string;
    usarFeather?: boolean;
    titulo: string;
    valor: string;
    fondo: string;
    borde: string;
    colorTitulo: string;
    colorValor: string;
    textoSecundario?: string;
}) => (
    <View
        style={{
            borderRadius: 18,
            borderWidth: 1,
            borderColor: borde,
            backgroundColor: fondo,
            paddingVertical: 18,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 130,
        }}
    >
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
            }}
        >
            {icon ? (
                usarFeather ? (
                    <Feather name={icon as any} size={16} color={colorTitulo} />
                ) : (
                    <Ionicons name={icon as any} size={18} color={colorTitulo} />
                )
            ) : null}

            <Text style={{ color: colorTitulo, fontWeight: "800", fontSize: 16 }}>
                {titulo}
            </Text>
        </View>

        <Text
            style={{
                color: colorValor,
                fontSize: 30,
                fontWeight: "900",
                letterSpacing: 1,
            }}
            numberOfLines={1}
            ellipsizeMode="middle"
        >
            {valor}
        </Text>

        {!!textoSecundario && (
            <Text
                style={{
                    marginTop: 8,
                    color: colorTitulo,
                    fontSize: 13,
                    fontWeight: "700",
                    textAlign: "center",
                }}
            >
                {textoSecundario}
            </Text>
        )}
    </View>
);

const FichaDatoAnimal = ({
    icon,
    titulo,
    valor,
    anchoCompleto = false,
}: {
    icon: any;
    titulo: string;
    valor: string;
    anchoCompleto?: boolean;
}) => (
    <View
        style={{
            width: anchoCompleto ? "100%" : "48%",
            backgroundColor: "#F8FAFF",
            borderWidth: 1.5,
            borderColor: "#CBD5E1",
            borderRadius: 16,
            padding: 14,
        }}
    >
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
            }}
        >
            <Ionicons name={icon} size={16} color={BRAND} />
            <Text
                style={{
                    color: MUTED,
                    fontWeight: "800",
                    fontSize: 12,
                }}
            >
                {titulo}
            </Text>
        </View>

        <Text
            style={{
                color: TEXT,
                fontWeight: "900",
                fontSize: 16,
            }}
            numberOfLines={anchoCompleto ? 2 : 1}
            ellipsizeMode="tail"
        >
            {valor}
        </Text>
    </View>
);


const formatearFecha = (fecha?: string) => {
    if (!fecha) return "—";

    try {
        const fechaLimpia = fecha.replace("[UTC]", "");
        const d = new Date(fechaLimpia);

        if (Number.isNaN(d.getTime())) return fecha;

        return d.toLocaleString("es-ES");
    } catch {
        return fecha;
    }
};

// ---------- componente ----------
export const LectorGestacionScreen = () => {

    const ANCHO_CORRAL = 60;
    const ANCHO_ID = 56;
    const ANCHO_CROTAL_SALIDA = 150;

    const ESPACIO_CORRAL_ID_ENTRADA = 30;
    const ESPACIO_ID_CROTAL_ENTRADA = 70;

    const ESPACIO_ID_CROTAL_SALIDA = 24;
    const COLOR_LINEA_COLUMNA = "#E2E8F0";
    const PADDING_TABLA_X = 14;

    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const pantallaEnfocada = useIsFocused();
    const pantallaActivaRef = useRef(false);

    // AWR store
    const lectorConectado = useAwrConn((s) => s.isConnected);
    const idLector = useAwrConn((s) => s.currentId);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    const [detectarDesconocidos, setDetectarDesconocidos] = useState(true);
    const [confirmar, setConfirmar] = useState(true);


    // UI state
    const [corralInput, setCorralInput] = useState("");
    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");
    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [estaEnviando, setEstaEnviando] = useState(false);

    const [idRecibido, setIdRecibido] = useState("");
    const [estadoIdVisual, setEstadoIdVisual] = useState<EstadoIdVisual>("neutro");

    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoEnvioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ultimoCrotalAutoRef = useRef<string | null>(null);

    const route = useRoute<any>();
    const modoParam = route.params?.modo ?? "entrada";
    const corralParam = route.params?.corral ?? "";
    const detectarParam = route.params?.detectarDesconocidos ?? true;
    const confirmarParam = route.params?.confirmar ?? true;
    const valorBusquedaParam = route.params?.valorBusqueda ?? "";
    const animalEncontradoParam = route.params?.animalEncontrado ?? null;
    const animalBusqueda = animalEncontradoParam ?? null;
    // const tipoBusquedaParam = route.params?.tipoBusqueda ?? "crotal";

    const fechaCambioEstado = formatearFecha(animalBusqueda?.stateChangeDate);
    const fechaEntradaSistema = formatearFecha(animalBusqueda?.systemEntryDate);

    // paginación
    const TAM_PAGINA = 10;
    const [pagina, setPagina] = useState(0);

    const [mostrarActualizarId, setMostrarActualizarId] = useState(false);
    const [nuevoIdManual, setNuevoIdManual] = useState("");
    const [crotalPendienteId, setCrotalPendienteId] = useState("");
    const [corralPendienteId, setCorralPendienteId] = useState("—");
    const [actualizandoId, setActualizandoId] = useState(false);

    const totalPaginas = Math.max(1, Math.ceil(registrosEnviados.length / TAM_PAGINA));


    const esEntrada = tipoMovimiento === "entrada";
    const esSalida = tipoMovimiento === "salida";
    const esLectura = tipoMovimiento === "lectura";
    const esBusqueda = tipoMovimiento === "busqueda";
    const scrollRef = useRef<ScrollView | null>(null);

    const requiereCorral = esEntrada;
    const usaEnvioAutomatico = !esBusqueda && (esLectura || !confirmar);
    const tiempoAutoEnvioMs = esLectura ? 300 : 1000;

    const itemsPagina = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosEnviados.slice(start, start + TAM_PAGINA);
    }, [registrosEnviados, pagina]);
    const limpiarAutoEnvioTimer = React.useCallback(() => {
        if (autoEnvioTimerRef.current) {
            clearTimeout(autoEnvioTimerRef.current);
            autoEnvioTimerRef.current = null;
        }
    }, []);
    const LineaVerticalTabla = ({ left }: { left: number }) => (
        <View
            pointerEvents="none"
            style={{
                position: "absolute",
                left,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: COLOR_LINEA_COLUMNA,
                zIndex: 1,
            }}
        />
    );

    const abrirActualizacionId = React.useCallback((crotal: string, corral: string) => {
        if (!detectarDesconocidos) return;

        setMostrarActualizarId(true);
        setNuevoIdManual("");
        setCrotalPendienteId(String(crotal));
        setCorralPendienteId(corral?.trim() ? corral : "—");
    }, [detectarDesconocidos]);

    const cerrarActualizacionId = React.useCallback(() => {
        setMostrarActualizarId(false);
        setNuevoIdManual("");
        setCrotalPendienteId("");
        setCorralPendienteId("—");
    }, []);

    useEffect(() => {
        pantallaActivaRef.current = pantallaEnfocada;

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
        }
    }, [pantallaEnfocada, limpiarAutoEnvioTimer]);


    useEffect(() => {
        const maxPagina = Math.max(0, Math.ceil(registrosEnviados.length / TAM_PAGINA) - 1);
        if (pagina > maxPagina) setPagina(maxPagina);
    }, [registrosEnviados.length, pagina]);

    useEffect(() => {
        return () => {
            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
            }
            if (autoEnvioTimerRef.current) {
                clearTimeout(autoEnvioTimerRef.current);
            }
        };
    }, []);
    const mostrarIdTemporal = (valor: string, estado: EstadoIdVisual) => {
        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
        }

        setIdRecibido(valor);
        setEstadoIdVisual(estado);

        timerIdRef.current = setTimeout(() => {
            setIdRecibido("");
            setEstadoIdVisual("neutro");
        }, 3000);
    };

    // al entrar/salir
    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            setRegistrosEnviados([]);
            limpiarCrotalLeido();
            setDetectarDesconocidos(detectarParam);
            setConfirmar(confirmarParam);
            setIdRecibido("");
            setEstadoIdVisual("neutro");
            cerrarActualizacionId();

            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
            }

            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;

            const mov: TipoMovimiento =
                modoParam === "salida"
                    ? "salida"
                    : modoParam === "lectura"
                        ? "lectura"
                        : modoParam === "busqueda"
                            ? "busqueda"
                            : "entrada";

            setTipoMovimiento(mov);
            setCorralInput(mov === "entrada" ? String(corralParam) : "");

            (async () => {
                if (mov === "busqueda") return;
                if (!idLector) return;

                try {
                    await iniciarLectura();
                } catch {
                    if (!mounted) return;
                }
            })();

            return () => {
                mounted = false;

                if (timerIdRef.current) {
                    clearTimeout(timerIdRef.current);
                }

                limpiarAutoEnvioTimer();
                ultimoCrotalAutoRef.current = null;

                detenerLectura?.().catch(() => { });
            };
        }, [
            idLector,
            iniciarLectura,
            detenerLectura,
            limpiarCrotalLeido,
            modoParam,
            corralParam,
            detectarParam,
            confirmarParam,
            limpiarAutoEnvioTimer,
            cerrarActualizacionId,
        ])
    );
    const volverACtiFeed = () => {
        const parent = navigation.getParent?.();
        if (parent?.navigate) parent.navigate("Tabs");
        else navigation.navigate("Tabs");
    };

    const enviarRegistro = React.useCallback(async (crotalForzado?: string) => {
        if (!pantallaActivaRef.current) return;

        const requiereCorral = esEntrada;
        const corralTxt = corralInput.trim();
        const crotalTxt = (crotalForzado ?? crotalLeido ?? "").trim();

        if (!crotalTxt) {
            Alert.alert(
                t("gestationReader_alertMissingCrotalTitle"),
                t("gestationReader_alertMissingCrotalMessage")
            );
            return;
        }

        const crotalNum = parseNumeroSeguro(crotalTxt);

        if (crotalNum === null) {
            Alert.alert(
                t("gestationReader_alertInvalidCrotalTitle"),
                t("gestationReader_alertInvalidCrotalMessage")
            );
            return;
        }

        if (esLectura) {
            try {
                setEstaEnviando(true);

                const respuesta = await obtenerLecturaEspada(String(crotalNum));
                if (!respuesta.ok) {
                    if (respuesta.status === 404) {
                        mostrarIdTemporal("—", "error");
                        setRegistrosEnviados((prev) =>
                            upsertRegistroPorCrotal(prev, "—", String(crotalNum), "—")
                        );
                        return;
                    }

                    const detalle =
                        (respuesta.data && (respuesta.data.message || respuesta.data.error)) ||
                        respuesta.rawText ||
                        `HTTP ${respuesta.status}`;

                    Alert.alert(t("gestationReader_alertReadErrorTitle"), String(detalle));
                    return;
                }

                const animal = respuesta.data ?? {};

                const idBackendTexto =
                    animal?.animalId !== null &&
                        animal?.animalId !== undefined &&
                        String(animal.animalId).trim() !== ""
                        ? String(animal.animalId)
                        : "—";
                const esIdDesconocido = idBackendTexto === "0";

                const crotalTexto =
                    animal?.crotal !== null &&
                        animal?.crotal !== undefined &&
                        String(animal.crotal).trim() !== ""
                        ? String(animal.crotal)
                        : String(crotalNum);

                const corralTexto =
                    animal?.corralName !== null &&
                        animal?.corralName !== undefined &&
                        String(animal.corralName).trim() !== ""
                        ? String(animal.corralName)
                        : "—";

                if (esIdDesconocido) {
                    mostrarIdTemporal("0", "error");
                    abrirActualizacionId(crotalTexto, corralTexto);
                } else if (idBackendTexto !== "—") {
                    mostrarIdTemporal(idBackendTexto, "success");
                    cerrarActualizacionId();
                } else {
                    mostrarIdTemporal("—", "error");
                }

                setRegistrosEnviados((prev) =>
                    upsertRegistroPorCrotal(prev, corralTexto, crotalTexto, idBackendTexto)
                );

                setPagina(0);
                limpiarCrotalLeido();
                ultimoCrotalAutoRef.current = null;
                return;
            } catch {
                Alert.alert(
                    t("gestationReader_alertNetworkError"),
                    t("gestationReader_alertNetworkErrorMessage")
                );
                return;
            } finally {
                setEstaEnviando(false);
            }
        }
        if (requiereCorral && !corralTxt) {
            Alert.alert(
                t("gestationReader_alertMissingCorralTitle"),
                t("gestationReader_alertMissingCorralMessage")
            );
            return;
        }

        const corralNum = requiereCorral ? parseNumeroSeguro(corralTxt) : null;

        if (requiereCorral && corralNum === null) {
            Alert.alert(
                t("gestationReader_alertMissingCorralTitle"),
                t("gestationReader_alertMissingCorralMessage")
            );
            return;
        }

        try {
            setEstaEnviando(true);

            const payload = requiereCorral
                ? { corral: corralNum as number, crotal: crotalNum }
                : { crotal: crotalNum };

            let endpointActual = "";

            try {
                endpointActual = await construirEndpointEspada(
                    esSalida ? "gestation/exit" : "gestation"
                );
            } catch (error: any) {
                Alert.alert(
                    t("gestationReader_alertError"),
                    error?.message || t("gestationReader_alertNoIpConfigured")
                );
                return;
            }

            const respuesta = await postGestation(endpointActual, payload);

            if (!respuesta.ok) {
                const detalle =
                    (respuesta.data &&
                        (respuesta.data.message ||
                            respuesta.data.error ||
                            respuesta.data.mensaje)) ||
                    respuesta.rawText ||
                    `HTTP ${respuesta.status}`;

                if (respuesta.status === 400) {
                    Alert.alert(t("gestationReader_alertWarning"), String(detalle));
                    return;
                }

                Alert.alert(t("gestationReader_alertSendErrorTitle"), String(detalle));

                return;
            }

            const idBackendRaw =
                respuesta.data?.animalId ??
                respuesta.data?.idAnimal ??
                respuesta.data?.identificador ??
                respuesta.data?.id ??
                (respuesta.rawText ? respuesta.rawText.replace(/^id\s*/i, "").trim() : null);

            const idBackendTexto =
                idBackendRaw !== null &&
                    idBackendRaw !== undefined &&
                    String(idBackendRaw).trim() !== ""
                    ? String(idBackendRaw)
                    : "—";

            const esIdDesconocido = idBackendTexto === "0";

            if (esIdDesconocido) {
                mostrarIdTemporal("0", "error");
                abrirActualizacionId(String(crotalNum), corralNum !== null ? String(corralNum) : "—");
            } else if (idBackendTexto !== "—") {
                mostrarIdTemporal(idBackendTexto, "success");
                cerrarActualizacionId();
            } else {
                mostrarIdTemporal("—", "error");
            }

            setRegistrosEnviados((prev) =>
                upsertRegistroPorCrotal(
                    prev,
                    corralNum !== null ? String(corralNum) : "—",
                    String(crotalNum),
                    idBackendTexto
                )
            );

            setPagina(0);
            limpiarCrotalLeido();
            ultimoCrotalAutoRef.current = null;
        } catch {
            Alert.alert(
                t("gestationReader_alertNetworkError"),
                t("gestationReader_alertNetworkErrorMessage")
            );
        } finally {
            setEstaEnviando(false);
        }
    }, [esEntrada, esLectura, esSalida, corralInput, crotalLeido, limpiarCrotalLeido]);

    const onEnviar = () => {
        if (esLectura || !confirmar) return;
        enviarRegistro();
    };

    const actualizarIdAnimal = React.useCallback(async () => {
        const idManual = nuevoIdManual.trim();
        const crotalTxt = crotalPendienteId.trim();

        if (!idManual) {
            Alert.alert(
                t("gestationReader_alertMissingIdTitle"),
                t("gestationReader_alertMissingIdMessage")
            );
            return;
        }

        if (!crotalTxt) {
            Alert.alert(
                t("gestationReader_alertMissingAssociatedCrotalTitle"),
                t("gestationReader_alertMissingAssociatedCrotalMessage")
            );
            return;
        }

        const crotalNum = parseNumeroSeguro(crotalTxt);

        if (crotalNum === null) {
            Alert.alert(
                t("gestationReader_alertInvalidAssociatedCrotalTitle"),
                t("gestationReader_alertInvalidAssociatedCrotalMessage")
            );
            return;
        }

        try {
            setActualizandoId(true);

            const respuesta = await postActualizarId({
                crotal: crotalNum,
                id: idManual,
            });

            if (!respuesta.ok) {
                const detalle =
                    (respuesta.data && (respuesta.data.message || respuesta.data.error || respuesta.data.mensaje)) ||
                    respuesta.rawText ||
                    `HTTP ${respuesta.status}`;

                Alert.alert(t("gestationReader_alertUpdateIdErrorTitle"), String(detalle));
                return;
            }

            const idActualizado =
                respuesta.data?.animalId ??
                respuesta.data?.idAnimal ??
                respuesta.data?.identificador ??
                respuesta.data?.id ??
                idManual;

            const idActualizadoTexto =
                idActualizado !== null &&
                    idActualizado !== undefined &&
                    String(idActualizado).trim() !== ""
                    ? String(idActualizado)
                    : idManual;

            mostrarIdTemporal(idActualizadoTexto, "success");

            setRegistrosEnviados((prev) =>
                upsertRegistroPorCrotal(
                    prev,
                    corralPendienteId,
                    crotalPendienteId,
                    idActualizadoTexto
                )
            );

            cerrarActualizacionId();
        } catch {
            Alert.alert(
                t("gestationReader_alertNetworkError"),
                t("gestationReader_alertNetworkErrorMessage")
            );
        } finally {
            setActualizandoId(false);
        }
    }, [nuevoIdManual, crotalPendienteId, corralPendienteId, cerrarActualizacionId]);


    useEffect(() => {
        const crotalActual = (crotalLeido ?? "").trim();

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }

        if (!usaEnvioAutomatico) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }

        if (!crotalActual) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }

        if (estaEnviando) return;

        if (ultimoCrotalAutoRef.current === crotalActual) return;

        limpiarAutoEnvioTimer();
        ultimoCrotalAutoRef.current = crotalActual;

        autoEnvioTimerRef.current = setTimeout(() => {
            if (!pantallaActivaRef.current) return;
            enviarRegistro(crotalActual);
        }, tiempoAutoEnvioMs);

        return () => {
            limpiarAutoEnvioTimer();
        };
    }, [
        pantallaEnfocada,
        usaEnvioAutomatico,
        tiempoAutoEnvioMs,
        crotalLeido,
        estaEnviando,
        enviarRegistro,
        limpiarAutoEnvioTimer,
    ]);

    const estilosCajaId = useMemo(() => {
        if (estadoIdVisual === "success") {
            return {
                backgroundColor: "#ECFDF5",
                borderColor: "#BBF7D0",
                colorTexto: SUCCESS,
                colorSubtexto: "#15803D",
                icono: "checkmark-circle-outline" as const,
            };
        }

        if (estadoIdVisual === "error") {
            return {
                backgroundColor: "#FEF2F2",
                borderColor: "#FECACA",
                colorTexto: DANGER,
                colorSubtexto: "#B91C1C",
                icono: "close-circle-outline" as const,
            };
        }

        return {
            backgroundColor: "#F1F5F9",
            borderColor: BORDER,
            colorTexto: TEXT,
            colorSubtexto: MUTED,
            icono: "id-card-outline" as const,
        };
    }, [estadoIdVisual]);


    return (

        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={90}
        >
            <Appbar.Header
                elevated
                style={{
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderBottomColor: BORDER,
                }}
            >
                <Appbar.BackAction color={TEXT} onPress={volverACtiFeed} />
                <Appbar.Content title={t("gestationReader_screenTitle")} titleStyle={{ color: TEXT }} />
            </Appbar.Header>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 140,
                    gap: 14,
                    flexGrow: 1,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {esBusqueda && (
                    <View
                        style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: BORDER,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: SOFT,
                                padding: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: SOFT_BORDER,
                            }}
                        >
                            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
                                {t("gestationReader_animalInfoTitle")}
                            </Text>
                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {t("gestationReader_animalInfoDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 14 }}>
                            {/* Bloque principal */}
                            <View
                                style={{
                                    backgroundColor: "#EEF2FF",
                                    borderWidth: 1,
                                    borderColor: "#C7D2FE",
                                    borderRadius: 18,
                                    padding: 16,
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        {/* <Ionicons name="paw-outline" size={18} color={BRAND} /> */}
                                        <Text style={{ color: BRAND, fontWeight: "900", fontSize: 15 }}>
                                            {t("gestationReader_animalCardTitle")}
                                        </Text>
                                    </View>
                                </View>

                                <Text
                                    style={{
                                        color: TEXT,
                                        fontSize: 28,
                                        fontWeight: "900",
                                    }}
                                >
                                    {t("gestationReader_animalIdLabel")} {String(animalBusqueda?.animalId ?? "—")}
                                </Text>

                                <Text
                                    style={{
                                        color: MUTED,
                                        fontSize: 15,
                                        fontWeight: "700",
                                    }}
                                >
                                    {t("gestationReader_animalCrotalLabel")} {String(animalBusqueda?.crotal ?? "—")}
                                </Text>

                                {/* <View
                                    style={{
                                        alignSelf: "flex-start",
                                        marginTop: 4,
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 999,
                                        backgroundColor: "#FFFFFF",
                                        borderWidth: 1,
                                        borderColor: "#D1D5DB",
                                    }}
                                >
                                    <Text style={{ color: TEXT, fontWeight: "800", fontSize: 12 }}>
                                        Estado: {String(animalBusqueda?.state ?? "—")}
                                    </Text>
                                </View> */}
                            </View>

                            {/* Grid de datos */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    justifyContent: "space-between",
                                    gap: 12,
                                }}
                            >
                                <FichaDatoAnimal
                                    icon="home-outline"
                                    titulo={t("gestationReader_fieldCorral")}
                                    valor={String(animalBusqueda?.corralName ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="business-outline"
                                    titulo={t("gestationReader_fieldHouse")}
                                    valor={String(animalBusqueda?.houseName ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="git-branch-outline"
                                    titulo={t("gestationReader_fieldState")}
                                    valor={String(animalBusqueda?.state ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="fitness-outline"
                                    titulo={t("gestationReader_fieldBodyCondition")}
                                    valor={String(animalBusqueda?.bodyConditionCorrection ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="refresh-outline"
                                    titulo={t("gestationReader_fieldCycle")}
                                    valor={String(animalBusqueda?.cycle ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="time-outline"
                                    titulo={t("gestationReader_fieldSystemEntryDate")}
                                    valor={formatearSoloFecha(animalBusqueda?.systemEntryDate)}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => navigation.navigate("ConfiguracionGestacion")}
                                activeOpacity={0.9}
                                style={{
                                    marginTop: 4,
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#E5E7EB",
                                }}
                            >
                                <Text style={{ color: TEXT, fontWeight: "900", fontSize: 15 }}>
                                    {t("gestationReader_newSearch")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Resumen */}
                {!esLectura && !esBusqueda && (
                    <View
                        style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: BORDER,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: SOFT,
                                padding: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: SOFT_BORDER,
                            }}
                        >
                            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}> {t("gestationReader_summaryTitle")}</Text>
                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {t("gestationReader_summaryDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <MiniResumenCard
                                    icon="swap-horizontal-outline"
                                    titulo={t("gestationReader_mode")}
                                    valor={
                                        tipoMovimiento === "entrada"
                                            ? t("gestationReader_modeEntry")
                                            : tipoMovimiento === "salida"
                                                ? t("gestationReader_modeExit")
                                                : tipoMovimiento === "lectura"
                                                    ? t("gestationReader_modeReading")
                                                    : t("gestationReader_modeSearch")
                                    }
                                />

                                <MiniResumenCard
                                    icon="home-outline"
                                    titulo={t("gestationReader_corral")}
                                    valor={corralInput || "—"}
                                />
                            </View>

                            <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />

                            <SwitchRowReadonly
                                title={t("gestationReader_detectUnknownTitle")}
                                description={t("gestationReader_detectUnknownDescription")}
                                value={detectarDesconocidos}
                            />

                            <SwitchRowReadonly
                                title={t("gestationReader_confirmSendTitle")}
                                description={t("gestationReader_confirmSendDescription")}
                                value={confirmar}
                            />

                            <TouchableOpacity
                                onPress={() => navigation.navigate("ConfiguracionGestacion")}
                                activeOpacity={0.9}
                                style={{
                                    marginTop: 6,
                                    height: 42,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#E5E7EB",
                                }}
                            >
                                <Text style={{ color: TEXT, fontWeight: "900" }}>
                                    {t("gestationReader_changeSettings")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Card lectura */}
                {!esLectura && !esBusqueda && (
                    <View
                        style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: BORDER,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: "#F8FAFF",
                                padding: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: "#E0E7FF",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: TEXT, fontSize: 19, fontWeight: "900" }}>
                                    {t("gestationReader_currentReadingTitle")}
                                </Text>
                                <Text style={{ color: MUTED, marginTop: 4 }}>
                                    {t("gestationReader_currentReadingDescription")}
                                </Text>
                            </View>
                            <View style={{ alignSelf: "flex-start", marginTop: -2 }}>
                                {lectorConectado ? (
                                    <IndicadorConexionAnimado />
                                ) : (
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 6,
                                            paddingVertical: 6,
                                            paddingHorizontal: 10,
                                            borderRadius: 999,
                                            backgroundColor: "#FEF2F2",
                                            borderWidth: 1,
                                            borderColor: "#FECACA",
                                        }}
                                    >
                                        <Ionicons name="alert-circle-outline" size={16} color={DANGER} />
                                        <Text style={{ color: DANGER, fontWeight: "900", fontSize: 12 }}>
                                            {t("gestationReader_awrDisconnected")}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={{ padding: 14, gap: 12 }}>
                            <CajaDatoLectura
                                icon="barcode-outline"
                                titulo={t("gestationReader_readCrotal")}
                                valor={crotalLeido ? String(crotalLeido) : "—"}
                                fondo="#F8FAFF"
                                borde="#E2E8F0"
                                colorTitulo="#64748B"
                                colorValor={TEXT}
                            />

                            <CajaDatoLectura
                                icon={
                                    estadoIdVisual === "success"
                                        ? "checkmark-circle-outline"
                                        : estadoIdVisual === "error"
                                            ? "alert-circle-outline"
                                            : "hash"
                                }
                                usarFeather={estadoIdVisual === "neutro"}
                                titulo={t("gestationReader_readId")}
                                valor={idRecibido ? String(idRecibido) : "—"}
                                fondo={estilosCajaId.backgroundColor}
                                borde={estilosCajaId.borderColor}
                                colorTitulo={estilosCajaId.colorSubtexto}
                                colorValor={estilosCajaId.colorTexto}
                                textoSecundario={
                                    mostrarActualizarId
                                        ? t("gestationReader_animalWithoutAssignedId")
                                        : estadoIdVisual === "error"
                                            ? t("gestationReader_unknownAnimal")
                                            : undefined
                                } />
                        </View>
                    </View>
                )}

                {!esBusqueda && mostrarActualizarId && (
                    <View
                        style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: BORDER,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: "#FEF2F2",
                                padding: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: "#FECACA",
                            }}
                        >
                            <Text style={{ color: DANGER, fontSize: 18, fontWeight: "900" }}>
                                {t("gestationReader_animalWithoutIdTitle")}
                            </Text>
                            <Text style={{ color: "#B91C1C", marginTop: 4 }}>
                                {t("gestationReader_animalWithoutIdDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <Text style={{ color: MUTED, fontWeight: "800" }}>
                                {t("gestationReader_animalCrotalLabel")}: {crotalPendienteId || "—"}
                            </Text>

                            <TextInput
                                mode="outlined"
                                label={t("gestationReader_newIdLabel")}
                                value={nuevoIdManual}
                                onChangeText={setNuevoIdManual}
                                placeholder={t("gestationReader_newIdPlaceholder")}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                outlineColor={BORDER}
                                activeOutlineColor={BRAND}
                            />

                            <TouchableOpacity
                                onPress={actualizarIdAnimal}
                                disabled={actualizandoId}
                                activeOpacity={0.9}
                                style={{
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: actualizandoId ? "#A5B4FC" : BRAND,
                                }}
                            >
                                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                                    {actualizandoId ? t("gestationReader_updatingId")
                                        : t("gestationReader_updateId")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Tabla */}
                {!esBusqueda && (
                    <View
                        style={{
                            marginTop: 12,
                            backgroundColor: CARD,
                            borderRadius: 18,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: BORDER,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                backgroundColor: "#F8FAFF",
                                borderBottomWidth: 1,
                                borderBottomColor: "#E0E7FF",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
                                    {t("gestationReader_sentRecordsTitle")}
                                </Text>

                                {esLectura && !lectorConectado && (
                                    <View
                                        style={{
                                            marginTop: 8,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            alignSelf: "flex-start",
                                            gap: 6,
                                            paddingVertical: 6,
                                            paddingHorizontal: 10,
                                            borderRadius: 999,
                                            backgroundColor: "#FEF2F2",
                                            borderWidth: 1,
                                            borderColor: "#FECACA",
                                        }}
                                    >
                                        <Ionicons name="alert-circle-outline" size={16} color={DANGER} />
                                        <Text style={{ color: DANGER, fontWeight: "900", fontSize: 12 }}>
                                            {t("gestationReader_awrDisconnected")}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {registrosEnviados.length > TAM_PAGINA && (
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => setPagina((p) => Math.max(0, p - 1))}
                                        disabled={pagina === 0}
                                        activeOpacity={0.9}
                                        style={{
                                            paddingVertical: 12,
                                            paddingHorizontal: 18,
                                            borderRadius: 12,
                                            backgroundColor: pagina === 0 ? "#E5E7EB" : BRAND,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: pagina === 0 ? "#6B7280" : "white",
                                                fontWeight: "900",
                                            }}
                                        >
                                            {"<"}
                                        </Text>
                                    </TouchableOpacity>

                                    <Text style={{ color: MUTED, fontWeight: "900" }}>
                                        {pagina + 1}/{totalPaginas}
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                                        disabled={pagina >= totalPaginas - 1}
                                        activeOpacity={0.9}
                                        style={{
                                            paddingVertical: 12,
                                            paddingHorizontal: 18,
                                            borderRadius: 12,
                                            backgroundColor: pagina >= totalPaginas - 1 ? "#E5E7EB" : BRAND,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: pagina >= totalPaginas - 1 ? "#6B7280" : "white",
                                                fontWeight: "900",
                                            }}
                                        >
                                            {">"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={{ position: "relative" }}>
                            {!esLectura && !esSalida && (
                                <>
                                    <LineaVerticalTabla
                                        left={PADDING_TABLA_X + ANCHO_CORRAL + ESPACIO_CORRAL_ID_ENTRADA / 2}
                                    />
                                    <LineaVerticalTabla
                                        left={
                                            PADDING_TABLA_X +
                                            ANCHO_CORRAL +
                                            ESPACIO_CORRAL_ID_ENTRADA +
                                            ANCHO_ID +
                                            ESPACIO_ID_CROTAL_ENTRADA / 2
                                        }
                                    />
                                </>
                            )}

                            {esSalida && (
                                <LineaVerticalTabla
                                    left={PADDING_TABLA_X + ANCHO_ID + ESPACIO_ID_CROTAL_SALIDA / 2}
                                />
                            )}

                            {esLectura ? (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: 10,
                                        paddingHorizontal: 14,
                                        borderBottomWidth: 1,
                                        borderBottomColor: BORDER,
                                        backgroundColor: "#FFFFFF",
                                    }}
                                >
                                    <Text
                                        style={{
                                            width: ANCHO_CORRAL,
                                            color: MUTED,
                                            fontWeight: "900",
                                        }}
                                        numberOfLines={1}
                                    >
                                        {t("gestationReader_tableHeaderCorral")}
                                    </Text>

                                    <View style={{ width: ESPACIO_CORRAL_ID_ENTRADA }} />

                                    <Text
                                        style={{
                                            width: ANCHO_ID,
                                            color: MUTED,
                                            fontWeight: "900",
                                            textAlign: "center",
                                        }}
                                        numberOfLines={1}
                                    >
                                        {t("gestationReader_tableHeaderId")}
                                    </Text>

                                    <View style={{ width: ESPACIO_ID_CROTAL_ENTRADA }} />

                                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                                        <Text
                                            style={{
                                                color: MUTED,
                                                fontWeight: "900",
                                                textAlign: "left",
                                            }}
                                            numberOfLines={1}
                                        >
                                            {t("gestationReader_tableHeaderCrotal")}
                                        </Text>
                                    </View>
                                </View>
                            ) : esSalida ? (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: 10,
                                        paddingHorizontal: 14,
                                        borderBottomWidth: 1,
                                        borderBottomColor: BORDER,
                                        backgroundColor: "#FFFFFF",
                                    }}
                                >
                                    <Text
                                        style={{
                                            width: ANCHO_ID,
                                            color: MUTED,
                                            fontWeight: "900",
                                            textAlign: "center",
                                        }}
                                        numberOfLines={1}
                                    >
                                        {t("gestationReader_tableHeaderId")}
                                    </Text>

                                    <View style={{ width: ESPACIO_ID_CROTAL_SALIDA }} />

                                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                                        <Text
                                            style={{
                                                width: ANCHO_CROTAL_SALIDA,
                                                color: MUTED,
                                                fontWeight: "900",
                                                textAlign: "left",
                                            }}
                                            numberOfLines={1}
                                        >
                                            {t("gestationReader_tableHeaderCrotal")}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: 10,
                                        paddingHorizontal: 14,
                                        borderBottomWidth: 1,
                                        borderBottomColor: BORDER,
                                        backgroundColor: "#FFFFFF",
                                    }}
                                >
                                    <Text
                                        style={{
                                            width: ANCHO_CORRAL,
                                            color: MUTED,
                                            fontWeight: "900",
                                        }}
                                        numberOfLines={1}
                                    >
                                        {t("gestationReader_tableHeaderCorral")}
                                    </Text>

                                    <View style={{ width: ESPACIO_CORRAL_ID_ENTRADA }} />

                                    <Text
                                        style={{
                                            width: ANCHO_ID,
                                            color: MUTED,
                                            fontWeight: "900",
                                            textAlign: "center",
                                        }}
                                        numberOfLines={1}
                                    >
                                        {t("gestationReader_tableHeaderId")}
                                    </Text>

                                    <View style={{ width: ESPACIO_ID_CROTAL_ENTRADA }} />

                                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                                        <Text
                                            style={{
                                                color: MUTED,
                                                fontWeight: "900",
                                                textAlign: "left",
                                            }}
                                            numberOfLines={1}
                                        >
                                            {t("gestationReader_tableHeaderCrotal")}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {registrosEnviados.length === 0 ? (
                                <View style={{ padding: 14 }}>
                                    <Text style={{ color: MUTED }}>{t("gestationReader_noRecords")}</Text>
                                </View>
                            ) : (
                                itemsPagina.map((r, idx) =>
                                    esLectura ? (
                                        <View
                                            key={r.localId}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "flex-start",
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                borderTopWidth: 1,
                                                borderTopColor: "#F1F5F9",
                                                backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFF",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    width: ANCHO_CORRAL,
                                                    color: TEXT,
                                                    fontWeight: "700",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {r.corral}
                                            </Text>

                                            <View style={{ width: ESPACIO_CORRAL_ID_ENTRADA }} />

                                            <Text
                                                style={{
                                                    width: ANCHO_ID,
                                                    color: r.idBackend === "—" || r.idBackend === "0" ? DANGER : TEXT,
                                                    fontWeight: "700",
                                                    textAlign: "center",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {r.idBackend}
                                            </Text>

                                            <View style={{ width: ESPACIO_ID_CROTAL_ENTRADA }} />

                                            <View style={{ flex: 1, alignItems: "flex-start" }}>
                                                <Text
                                                    style={{
                                                        color: TEXT,
                                                        fontWeight: "700",
                                                        textAlign: "left",
                                                        fontSize: 14,
                                                        flexShrink: 1,
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="middle"
                                                >
                                                    {r.crotal}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : esSalida ? (
                                        <View
                                            key={r.localId}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                borderTopWidth: 1,
                                                borderTopColor: "#F1F5F9",
                                                backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFF",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    width: ANCHO_ID,
                                                    color: r.idBackend === "—" ? DANGER : TEXT,
                                                    fontWeight: "700",
                                                    textAlign: "center",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {r.idBackend}
                                            </Text>

                                            <View style={{ width: ESPACIO_ID_CROTAL_SALIDA }} />

                                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                                                <Text
                                                    style={{
                                                        width: ANCHO_CROTAL_SALIDA,
                                                        color: TEXT,
                                                        fontWeight: "700",
                                                        textAlign: "left",
                                                        fontSize: 15,
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="middle"
                                                >
                                                    {r.crotal}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View
                                            key={r.localId}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "flex-start",
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                borderTopWidth: 1,
                                                borderTopColor: "#F1F5F9",
                                                backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFF",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    width: ANCHO_CORRAL,
                                                    color: TEXT,
                                                    fontWeight: "700",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {r.corral}
                                            </Text>

                                            <View style={{ width: ESPACIO_CORRAL_ID_ENTRADA }} />

                                            <Text
                                                style={{
                                                    width: ANCHO_ID,
                                                    color: r.idBackend === "—" ? DANGER : TEXT,
                                                    fontWeight: "700",
                                                    textAlign: "center",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {r.idBackend}
                                            </Text>

                                            <View style={{ width: ESPACIO_ID_CROTAL_ENTRADA }} />

                                            <View style={{ flex: 1, alignItems: "flex-start" }}>
                                                <Text
                                                    style={{
                                                        color: TEXT,
                                                        fontWeight: "700",
                                                        textAlign: "left",
                                                        fontSize: 14,
                                                        flexShrink: 1,
                                                    }}
                                                >
                                                    {r.crotal}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                )
                            )}
                        </View>
                    </View>
                )}
                {/* Enviar */}
                {!esBusqueda && (

                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity
                            onPress={onEnviar}
                            disabled={estaEnviando || !confirmar || esLectura}
                            activeOpacity={0.9}
                            style={{
                                height: 46,
                                borderRadius: 14,
                                backgroundColor: esLectura
                                    ? "#CBD5E1"
                                    : !confirmar
                                        ? "#CBD5E1"
                                        : estaEnviando
                                            ? "#A5B4FC"
                                            : BRAND,
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 10,
                                shadowColor: "#000",
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 3 },
                                elevation: 2,
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                                {esLectura
                                    ? t("gestationReader_buttonAutoReading")
                                    : !confirmar
                                        ? t("gestationReader_buttonAutoSending")
                                        : estaEnviando
                                            ? t("gestationReader_buttonSending")
                                            : t("gestationReader_buttonSend")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};