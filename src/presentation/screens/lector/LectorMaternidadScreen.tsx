/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, BackHandler, Modal } from "react-native";
import { Appbar, Switch, TextInput } from "react-native-paper";
import { useAwrConn } from "../../../stores/awrConnStore";
import { useRoute, RouteProp, useFocusEffect, useNavigation, useIsFocused } from "@react-navigation/native";
import { obtenerLecturaEspada, formatearSoloFecha, postActualizarId } from "../../routes/obtenerLecturaEspada";
import { construirEndpointEspada } from "../../../stores/apiConfig";
import { useTranslation } from "react-i18next";
import { traducirEstadoAnimal } from "../../hooks/traducirEstadoAnimal";
import { formatearCrotalVisual } from "../../hooks/formatearCrotalVisual";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import { IndicadorConexionAnimado } from "../../components/IndicadorConexionAnimado";



type LectorMaternidadParams = {
    modo?: "entrada" | "salida" | "lectura" | "busqueda";
    corral?: string;
    detectarDesconocidos?: boolean;
    confirmar?: boolean;
    tipoBusqueda?: "crotal" | "id";
    origenBusquedaCrotal?: "manual" | "espada";
    valorBusqueda?: string;
    animalEncontrado?: any;
};

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

// const ENDPOINT_MATERNITY_ENTRADA =
//     "http://192.168.11.203:6060/CtiAlimentacionAPI/api/espada/maternity";

// const ENDPOINT_MATERNITY_SALIDA =
//     "http://192.168.11.203:6060/CtiAlimentacionAPI/api/espada/maternity/exit";

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
    estado: string;
    nave: string;
};

type TipoMovimiento = "entrada" | "salida" | "lectura" | "busqueda";
// ---------- helpers ----------
const normalizarClave = (valor: string) =>
    valor.trim().toUpperCase().replace(/\s+/g, "");

const soloDigitos = (txt: string) => txt.replace(/[^0-9]/g, "");

const parseNumeroSeguro = (txt: string) => {
    const n = Number(txt);
    return Number.isFinite(n) ? n : null;
};

function incrementarCorral(valor: string) {
    const v = valor.trim();
    if (!v) return "1";

    const n = Number(v);
    if (Number.isFinite(n) && String(n) === v) return String(n + 1);

    const match = v.match(/^(.*?)(\d+)\s*$/);
    if (match) {
        const prefix = match[1];
        const num = Number(match[2]);
        if (Number.isFinite(num)) return `${prefix}${num + 1}`;
    }

    return v;
}

async function postMaternity(
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
                data = rawText;
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
    idBackend: string,
    estadoValor?: string,
    naveValor?: string
) {
    const key = normalizarClave(String(crotalValor));
    const idx = prev.findIndex((x) => normalizarClave(x.crotal) === key);

    const corralTexto = corralValor?.trim() ? corralValor : "—";

    if (idx >= 0) {
        const copia = [...prev];
        const previo = copia[idx];

        const actualizado: RegistroEnviado = {
            ...previo,
            corral: corralTexto,
            crotal: String(crotalValor),
            idBackend: idBackend || "—",
            estado: estadoValor?.trim() ? estadoValor : previo.estado || "—",
            nave: naveValor?.trim() ? naveValor : previo.nave || "—",
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
            estado: estadoValor?.trim() ? estadoValor : "—",
            nave: naveValor?.trim() ? naveValor : "—",
        },
        ...prev,
    ];
}

// ---------- UI helpers ----------
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
            borderWidth: 1,
            borderColor: "#E2E8F0",
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

const RegistroLecturaCard = ({
    registro,
    estadoTraducido,
}: {
    registro: RegistroEnviado;
    estadoTraducido: string;
}) => {
    const { t } = useTranslation();

    const idEsError = registro.idBackend === "—" || registro.idBackend === "0";

    const coloresCard = idEsError
        ? {
            fondoCard: "#FFF7F7",
            bordeCard: "#FECACA",
            fondoHeader: "#FEF2F2",
            bordeSeparador: "#FECACA",
            colorEtiqueta: "#991B1B",
            colorValorId: DANGER,
            fondoEstado: "#FEE2E2",
            colorEstado: "#991B1B",
            fondoNave: "#FFF1F2",
            colorNave: "#9F1239",
        }
        : {
            fondoCard: "#F8FAFF",
            bordeCard: "#C7D2FE",
            fondoHeader: "#EEF2FF",
            bordeSeparador: "#D7DEFF",
            colorEtiqueta: "#4F46E5",
            colorValorId: TEXT,
            fondoEstado: "#EEF2FF",
            colorEstado: "#4338CA",
            fondoNave: "#EEF2FF",
            colorNave: "#4338CA",
        };

    return (
        <View
            style={{
                backgroundColor: coloresCard.fondoCard,
                borderWidth: 1.5,
                borderColor: coloresCard.bordeCard,
                borderRadius: 18,
                padding: 14,
                gap: 12,
                ...SHADOW,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 18,
                    backgroundColor: coloresCard.fondoHeader,
                    borderRadius: 14,
                    padding: 12,
                }}
            >
                <View style={{ width: 82 }}>
                    <Text
                        style={{
                            color: coloresCard.colorEtiqueta,
                            fontSize: 11,
                            fontWeight: "800",
                            marginBottom: 4,
                        }}
                    >
                        {t("Reader_labelId")}
                    </Text>

                    <Text
                        style={{
                            color: idEsError ? DANGER : coloresCard.colorValorId,
                            fontSize: 22,
                            fontWeight: "900",
                        }}
                    >
                        {registro.idBackend}
                    </Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            color: coloresCard.colorEtiqueta,
                            fontSize: 11,
                            fontWeight: "800",
                            marginBottom: 4,
                        }}
                    >
                        {t("Reader_labelCrotal")}
                    </Text>

                    <Text
                        style={{
                            color: TEXT,
                            fontSize: 18,
                            fontWeight: "900",
                            textAlign: "left",
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                    >
                        {formatearCrotalVisual(registro.crotal)}
                    </Text>
                </View>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "stretch",
                    borderTopWidth: 1,
                    borderTopColor: coloresCard.bordeSeparador,
                    paddingTop: 12,
                }}
            >
                <View style={{ flex: 0.8, paddingHorizontal: 4 }}>
                    <Text
                        style={{
                            color: MUTED,
                            fontSize: 12,
                            fontWeight: "800",
                            marginBottom: 4,
                        }}
                    >
                        {t("Reader_labelCorral")}
                    </Text>

                    <Text
                        style={{
                            color: TEXT,
                            fontSize: 15,
                            fontWeight: "900",
                        }}
                    >
                        {registro.corral}
                    </Text>
                </View>

                <View
                    style={{
                        width: 1,
                        backgroundColor: coloresCard.bordeSeparador,
                        marginHorizontal: 10,
                    }}
                />

                <View style={{ flex: 1.5, paddingHorizontal: 4 }}>
                    <Text
                        style={{
                            color: MUTED,
                            fontSize: 12,
                            fontWeight: "800",
                            marginBottom: 4,
                        }}
                    >
                        {t("Reader_labelHouse")}
                    </Text>

                    <View
                        style={{
                            alignSelf: "flex-start",
                            backgroundColor: coloresCard.fondoNave,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 10,
                            marginTop: 2,
                            maxWidth: "100%",
                        }}
                    >
                        <Text
                            style={{
                                color: coloresCard.colorNave,
                                fontSize: 15,
                                fontWeight: "900",
                                lineHeight: 19,
                            }}
                            numberOfLines={2}
                        >
                            {registro.nave}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        width: 1,
                        backgroundColor: coloresCard.bordeSeparador,
                        marginHorizontal: 10,
                    }}
                />

                <View style={{ flex: 1.5, paddingHorizontal: 4 }}>
                    <Text
                        style={{
                            color: MUTED,
                            fontSize: 12,
                            fontWeight: "800",
                            marginBottom: 4,
                        }}
                    >
                        {t("Reader_labelState")}
                    </Text>

                    <View
                        style={{
                            alignSelf: "flex-start",
                            backgroundColor: coloresCard.fondoEstado,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 10,
                            marginTop: 2,
                            maxWidth: "100%",
                        }}
                    >
                        <Text
                            style={{
                                color: coloresCard.colorEstado,
                                fontSize: 15,
                                fontWeight: "900",
                                lineHeight: 19,
                            }}
                            numberOfLines={2}
                        >
                            {estadoTraducido}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const limpiarMensajeBackend = (mensaje?: string) => {
    if (!mensaje) return "";
    return mensaje.replace(/^Error:\s*/i, "").trim();
};

// ---------- componente ----------
export const LectorMaternidadScreen = () => {
    const ANCHO_CORRAL = 60;
    const ANCHO_ID = 56;
    const ANCHO_CROTAL_SALIDA = 150;

    const ESPACIO_CORRAL_ID_ENTRADA = 30;
    const ESPACIO_ID_CROTAL_ENTRADA = 70;

    const ESPACIO_ID_CROTAL_SALIDA = 24;
    const COLOR_LINEA_COLUMNA = "#E2E8F0";
    const PADDING_TABLA_X = 14;

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


    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const pantallaEnfocada = useIsFocused();
    const pantallaActivaRef = useRef(false);

    const lectorConectado = useAwrConn((s) => s.isConnected);
    const idLector = useAwrConn((s) => s.currentId);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    const [idRecibido, setIdRecibido] = useState("");
    const [estadoIdVisual, setEstadoIdVisual] = useState<"neutro" | "success" | "error">("neutro");

    const [mostrarActualizarId, setMostrarActualizarId] = useState(false);
    const [nuevoIdManual, setNuevoIdManual] = useState("");
    const [crotalPendienteId, setCrotalPendienteId] = useState("");
    const [corralPendienteId, setCorralPendienteId] = useState("—");
    const [actualizandoId, setActualizandoId] = useState(false);

    const [avisoVisible, setAvisoVisible] = useState(false);
    const [avisoTitulo, setAvisoTitulo] = useState("");
    const [avisoMensaje, setAvisoMensaje] = useState("");
    const [avisoTipo, setAvisoTipo] = useState<"warning" | "error" | "info">("info");

    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoEnvioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ultimoCrotalAutoRef = useRef<string | null>(null);
    const scrollRef = useRef<ScrollView | null>(null);

    const [corralInput, setCorralInput] = useState("");
    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");

    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [estaEnviando, setEstaEnviando] = useState(false);

    const [detectarDesconocidos, setDetectarDesconocidos] = useState(true);
    const [confirmar, setConfirmar] = useState(true);
    const esEntrada = tipoMovimiento === "entrada";
    const esSalida = tipoMovimiento === "salida";
    const esLectura = tipoMovimiento === "lectura";
    const esBusqueda = tipoMovimiento === "busqueda";

    const route = useRoute<RouteProp<Record<string, LectorMaternidadParams>, string>>();
    const params = route.params ?? {};

    const esTituloLectura =
        params.modo === "lectura" || params.modo === "busqueda";

    const tituloHeader = esTituloLectura
        ? t("Reader_readingTitle")
        : t("maternityReader_screenTitle");


    const valorBusquedaParam = params.valorBusqueda ?? "";
    const animalEncontradoParam = params.animalEncontrado ?? null;
    const animalBusqueda = animalEncontradoParam ?? null;

    const TAM_PAGINA = 10;
    const [pagina, setPagina] = useState(0);

    const totalPaginas = Math.max(1, Math.ceil(registrosEnviados.length / TAM_PAGINA));

    const pageItems = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosEnviados.slice(start, start + TAM_PAGINA);
    }, [registrosEnviados, pagina]);

    const requiereCorral = esEntrada;
    const usaEnvioAutomatico = !esBusqueda && (esLectura || !confirmar);
    const tiempoAutoEnvioMs = esLectura ? 300 : 1000;

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
    const limpiarAutoEnvioTimer = React.useCallback(() => {
        if (autoEnvioTimerRef.current) {
            clearTimeout(autoEnvioTimerRef.current);
            autoEnvioTimerRef.current = null;
        }
    }, []);

    //!------Para traducir-------- 
    const traducirEstadosEnMensaje = (
        mensaje: string,
        t: (clave: string) => string
    ) => {
        if (!mensaje) return "";

        return mensaje.replace(
            /\b(gestation|out_of_gestation|maternity|out_of_maternity)\b/g,
            (estado) => traducirEstadoAnimal(estado, t)
        );
    };
    //!-----Fin traduccion--------



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
        setAvisoTipo("info");

        limpiarCrotalLeido();
        ultimoCrotalAutoRef.current = null;
    };

    const mostrarIdTemporal = (valor: string, estado: "neutro" | "success" | "error") => {
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

    useEffect(() => {
        pantallaActivaRef.current = pantallaEnfocada;

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
        }
    }, [pantallaEnfocada, limpiarAutoEnvioTimer]);

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

    useEffect(() => {
        const maxPagina = Math.max(0, Math.ceil(registrosEnviados.length / TAM_PAGINA) - 1);
        if (pagina > maxPagina) setPagina(maxPagina);
    }, [registrosEnviados.length, pagina]);


    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                navigation.navigate("ConfiguracionLectura");
                return true;
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );

            return () => subscription.remove();
        }, [navigation])
    );

    useFocusEffect(
        React.useCallback(() => {
            const modoInicial: TipoMovimiento =
                params.modo === "salida"
                    ? "salida"
                    : params.modo === "lectura"
                        ? "lectura"
                        : params.modo === "busqueda"
                            ? "busqueda"
                            : "entrada";

            setTipoMovimiento(modoInicial);
            setCorralInput(
                modoInicial === "entrada" && params.corral
                    ? soloDigitos(String(params.corral))
                    : ""
            );
            setDetectarDesconocidos(params.detectarDesconocidos ?? true);
            setConfirmar(params.confirmar ?? true);

            setRegistrosEnviados([]);
            limpiarCrotalLeido();
            setIdRecibido("");
            setEstadoIdVisual("neutro");
            cerrarActualizacionId();

            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
            }

            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;

            (async () => {
                if (modoInicial === "busqueda") return;
                if (!idLector) return;
                try {
                    await iniciarLectura();
                } catch { }
            })();
            return () => {
                if (timerIdRef.current) {
                    clearTimeout(timerIdRef.current);
                }

                limpiarAutoEnvioTimer();
                ultimoCrotalAutoRef.current = null;

                detenerLectura?.().catch(() => { });
            };
        }, [
            params?.modo,
            params?.corral,
            params?.detectarDesconocidos,
            params?.confirmar,
            idLector,
            iniciarLectura,
            detenerLectura,
            limpiarCrotalLeido,
            limpiarAutoEnvioTimer,
            cerrarActualizacionId,
        ])
    );
    const volverAConfiguracionMaternidad = () => {
        navigation.navigate("ConfiguracionLectura");
    };
    const onEnviar = React.useCallback(async (crotalForzado?: string) => {
        if (!pantallaActivaRef.current) return;

        if (mostrarActualizarId || actualizandoId) {
            limpiarCrotalLeido();
            return;
        }

        const corralTxt = corralInput.trim();
        const crotalTxt = (crotalForzado ?? crotalLeido ?? "").trim();
        if (!crotalTxt) {
            Alert.alert(
                t("maternityReader_alertMissingCrotalTitle"),
                t("maternityReader_alertMissingCrotalMessage")
            );
            return;
        }

        const crotalNum = parseNumeroSeguro(crotalTxt);

        if (crotalNum === null) {
            Alert.alert(
                t("maternityReader_alertInvalidCrotalTitle"),
                t("maternityReader_alertInvalidCrotalMessage")
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
                            upsertRegistroPorCrotal(prev, "—", String(crotalNum), "—", "—", "—")
                        );
                        return;
                    }

                    const detalle =
                        (respuesta.data && (respuesta.data.message || respuesta.data.error)) ||
                        respuesta.rawText ||
                        `HTTP ${respuesta.status}`;

                    mostrarAviso(
                        t("maternityReader_alertReadErrorTitle"),
                        String(detalle),
                        "error"
                    ); return;
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

                const estadoTexto =
                    animal?.state !== null &&
                        animal?.state !== undefined &&
                        String(animal.state).trim() !== ""
                        ? String(animal.state)
                        : "—";

                const naveTexto =
                    animal?.houseName !== null &&
                        animal?.houseName !== undefined &&
                        String(animal.houseName).trim() !== ""
                        ? String(animal.houseName)
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
                    upsertRegistroPorCrotal(
                        prev,
                        corralTexto,
                        crotalTexto,
                        idBackendTexto,
                        estadoTexto,
                        naveTexto
                    )
                );

                setPagina(0);
                limpiarCrotalLeido();
                ultimoCrotalAutoRef.current = null;
                return;
            } catch {
                mostrarAviso(
                    t("maternityReader_alertNetworkError"),
                    t("maternityReader_alertNetworkErrorMessage"),
                    "error"
                );
                return;
            } finally {
                setEstaEnviando(false);
            }
        }

        if (requiereCorral && !corralTxt) {
            Alert.alert(
                t("maternityReader_alertMissingCorralTitle"),
                t("maternityReader_alertMissingCorralMessage")
            );
            return;
        }

        const corralNum = requiereCorral ? parseNumeroSeguro(corralTxt) : null;

        if (requiereCorral && corralNum === null) {
            Alert.alert(
                t("maternityReader_alertInvalidCorralTitle"),
                t("maternityReader_alertInvalidCorralMessage")
            );
            return;
        }

        try {
            setEstaEnviando(true);

            let endpointActual = "";

            try {
                endpointActual = await construirEndpointEspada(
                    esSalida ? "maternity/exit" : "maternity"
                );
            } catch (error: any) {
                Alert.alert(
                    t("maternityReader_alertError"),
                    error?.message || t("maternityReader_alertNoIpConfigured")
                );
                return;
            }

            const payload = requiereCorral
                ? { corral: corralNum as number, crotal: crotalNum }
                : { crotal: crotalNum };

            const r = await postMaternity(endpointActual, payload);

            if (!r.ok) {
                const detalle =
                    (r.data && typeof r.data === "object" && (r.data.message || r.data.error)) ||
                    r.rawText ||
                    `HTTP ${r.status}`;

                if (r.status === 400) {
                    const mensajeLimpio = limpiarMensajeBackend(String(detalle));
                    const mensajeTraducido = traducirEstadosEnMensaje(mensajeLimpio, t);

                    mostrarAviso(
                        t("maternityReader_alertWarning"),
                        mensajeTraducido,
                        "warning"
                    );
                    return;
                }

                mostrarAviso(
                    t("maternityReader_alertSendErrorTitle"),
                    String(detalle),
                    "error"
                );
                return;
            }

            const idBackendRaw =
                r.data?.animalId ??
                r.data?.idAnimal ??
                r.data?.identificador ??
                r.data?.id ??
                (r.rawText ? r.rawText.replace(/^id\s*/i, "").trim() : null);

            const idBackendTexto =
                idBackendRaw !== null &&
                    idBackendRaw !== undefined &&
                    String(idBackendRaw).trim() !== ""
                    ? String(idBackendRaw)
                    : "—";

            const esIdDesconocido = idBackendTexto === "0";

            if (esIdDesconocido) {
                mostrarIdTemporal("0", "error");
                abrirActualizacionId(
                    String(crotalNum),
                    corralNum !== null ? String(corralNum) : "—"
                );
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

            if (esEntrada) {
                setCorralInput((prev) => incrementarCorral(prev));
            }

            setPagina(0);
            limpiarCrotalLeido();
            ultimoCrotalAutoRef.current = null;
        } catch {
            Alert.alert(
                t("maternityReader_alertNetworkError"),
                t("maternityReader_alertNetworkErrorMessage")
            );
        } finally {
            setEstaEnviando(false);
        }
    }, [corralInput, crotalLeido, requiereCorral, esEntrada, esSalida, esLectura, limpiarCrotalLeido, mostrarActualizarId,
        actualizandoId,
        limpiarCrotalLeido,]);

    const actualizarIdAnimal = React.useCallback(async () => {
        const idManual = nuevoIdManual.trim();
        const crotalTxt = crotalPendienteId.trim();

        if (!idManual) {
            Alert.alert(
                t("maternityReader_alertMissingIdTitle"),
                t("maternityReader_alertMissingIdMessage")
            );
            return;
        }

        if (!crotalTxt) {
            Alert.alert(
                t("maternityReader_alertMissingAssociatedCrotalTitle"),
                t("maternityReader_alertMissingAssociatedCrotalMessage")
            );
            return;
        }

        const crotalNum = parseNumeroSeguro(crotalTxt);

        if (crotalNum === null) {
            Alert.alert(
                t("maternityReader_alertInvalidAssociatedCrotalTitle"),
                t("maternityReader_alertInvalidAssociatedCrotalMessage")
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
                    (respuesta.data &&
                        (respuesta.data.message ||
                            respuesta.data.error ||
                            respuesta.data.mensaje)) ||
                    respuesta.rawText ||
                    `HTTP ${respuesta.status}`;

                mostrarAviso(
                    t("maternityReader_alertUpdateIdErrorTitle"),
                    String(detalle),
                    "error"
                ); return;
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
                t("maternityReader_alertNetworkError"),
                t("maternityReader_alertNetworkErrorMessage")
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

        if (mostrarActualizarId || actualizandoId) {
            limpiarAutoEnvioTimer();

            if (crotalActual) {
                limpiarCrotalLeido();
            }

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
            onEnviar(crotalActual);
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
        onEnviar,
        limpiarAutoEnvioTimer,
        mostrarActualizarId,
        actualizandoId,
        limpiarCrotalLeido,
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
                colorTexto: "#DC2626",
                colorSubtexto: "#B91C1C",
                icono: "alert-circle-outline" as const,
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
                <Appbar.BackAction color={TEXT} onPress={volverAConfiguracionMaternidad} />
                <Appbar.Content title={tituloHeader} titleStyle={{ color: TEXT }} />
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
                                {t("maternityReader_animalInfoTitle")}
                            </Text>
                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {t("maternityReader_animalInfoDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 14 }}>
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
                                <Text style={{ color: BRAND, fontWeight: "900", fontSize: 15 }}>
                                    {t("maternityReader_animalCardTitle")}
                                </Text>

                                <Text
                                    style={{
                                        color: TEXT,
                                        fontSize: 28,
                                        fontWeight: "900",
                                    }}
                                >
                                    {t("maternityReader_animalIdLabel")}  {String(animalBusqueda?.animalId ?? "—")}
                                </Text>

                                <Text
                                    style={{
                                        color: MUTED,
                                        fontSize: 15,
                                        fontWeight: "700",
                                    }}
                                >
                                    {t("maternityReader_animalCrotalLabel")} {formatearCrotalVisual(animalBusqueda?.crotal)}
                                </Text>
                            </View>

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
                                    titulo={t("maternityReader_fieldCorral")}
                                    valor={String(animalBusqueda?.corralName ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="business-outline"
                                    titulo={t("maternityReader_fieldHouse")}
                                    valor={String(animalBusqueda?.houseName ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="git-branch-outline"
                                    titulo={t("maternityReader_fieldState")}
                                    valor={traducirEstadoAnimal(animalBusqueda?.state, t)}
                                />

                                <FichaDatoAnimal
                                    icon="fitness-outline"
                                    titulo={t("maternityReader_fieldBodyCondition")}
                                    valor={String(animalBusqueda?.bodyConditionCorrection ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="refresh-outline"
                                    titulo={t("maternityReader_fieldCycle")}
                                    valor={String(animalBusqueda?.cycle ?? "—")}
                                />

                                <FichaDatoAnimal
                                    icon="time-outline"
                                    titulo={t("maternityReader_fieldSystemEntryDate")}
                                    valor={formatearSoloFecha(animalBusqueda?.systemEntryDate)}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => navigation.navigate("ConfiguracionLecturaMaternidad")}
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
                                    {t("maternityReader_newSearch")}
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
                            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}> {t("maternityReader_summaryTitle")}</Text>
                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {t("maternityReader_summaryDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <MiniResumenCard
                                    icon="swap-horizontal-outline"
                                    titulo={t("maternityReader_mode")}
                                    valor={
                                        tipoMovimiento === "entrada"
                                            ? t("maternityReader_modeEntry")
                                            : tipoMovimiento === "salida"
                                                ? t("maternityReader_modeExit")
                                                : t("maternityReader_modeReading")
                                    }
                                />

                                {esEntrada && (
                                    <MiniResumenCard
                                        icon="home-outline"
                                        titulo="Corral"
                                        valor={corralInput || "—"}
                                    />
                                )}
                            </View>

                            <View style={{ height: 1, backgroundColor: "#F1F5F9" }} />

                            <SwitchRowReadonly
                                title={t("maternityReader_detectUnknownTitle")}
                                description={t("maternityReader_detectUnknownDescription")}
                                value={detectarDesconocidos}
                            />

                            <SwitchRowReadonly
                                title={t("maternityReader_confirmSendTitle")}
                                description={t("maternityReader_confirmSendDescription")}
                                value={confirmar}
                            />

                            <TouchableOpacity
                                onPress={() => navigation.navigate("ConfiguracionLectura")}
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
                                    {t("maternityReader_changeSettings")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Lectura actual */}
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
                                    {t("maternityReader_currentReadingTitle")}
                                </Text>
                                <Text style={{ color: MUTED, marginTop: 4 }}>
                                    {t("maternityReader_currentReadingDescription")}
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
                                            {t("maternityReader_awrDisconnected")}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <CajaDatoLectura
                                icon="barcode-outline"
                                titulo={t("maternityReader_readCrotal")}
                                valor={crotalLeido ? formatearCrotalVisual(crotalLeido) : "—"}
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
                                titulo={t("maternityReader_readId")}
                                valor={idRecibido ? String(idRecibido) : "—"}
                                fondo={estilosCajaId.backgroundColor}
                                borde={estilosCajaId.borderColor}
                                colorTitulo={estilosCajaId.colorSubtexto}
                                colorValor={estilosCajaId.colorTexto}
                                textoSecundario={
                                    mostrarActualizarId
                                        ? t("maternityReader_animalWithoutAssignedId")
                                        : estadoIdVisual === "error"
                                            ? t("maternityReader_unknownAnimal")
                                            : undefined
                                }
                            />
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
                                {t("maternityReader_animalWithoutIdTitle")}
                            </Text>
                            <Text style={{ color: "#B91C1C", marginTop: 4 }}>
                                {t("maternityReader_animalWithoutIdDescription")}
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <Text style={{ color: MUTED, fontWeight: "800" }}>
                                {t("maternityReader_animalCrotalLabel")}: {crotalPendienteId || "—"}
                            </Text>

                            <TextInput
                                mode="outlined"
                                label={t("maternityReader_newIdLabel")}
                                value={nuevoIdManual}
                                onChangeText={setNuevoIdManual}
                                placeholder={t("maternityReader_newIdPlaceholder")}
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
                                    {actualizandoId ?
                                        t("maternityReader_updatingId")
                                        : t("maternityReader_updateId")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

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
                                    {t("maternityReader_sentRecordsTitle")}
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
                                            {t("maternityReader_awrDisconnected")}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {esLectura ? (
                                <View
                                    style={{
                                        paddingVertical: 6,
                                        paddingHorizontal: 12,
                                        borderRadius: 999,
                                        backgroundColor: "#EEF2FF",
                                        borderWidth: 1,
                                        borderColor: "#C7D2FE",
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: BRAND,
                                            fontWeight: "900",
                                            fontSize: 12,
                                        }}
                                    >
                                        {t("Reader_autoReadingBadge")}
                                    </Text>
                                </View>
                            ) : registrosEnviados.length > TAM_PAGINA && (
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
                            {!esLectura && esEntrada && (
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
                                <View style={{ padding: 14, gap: 12 }}>
                                    {registrosEnviados.length === 0 ? (
                                        <Text style={{ color: MUTED }}>
                                            {t("maternityReader_noRecords")}
                                        </Text>
                                    ) : (
                                        registrosEnviados.map((r) => (
                                            <RegistroLecturaCard
                                                key={r.localId}
                                                registro={r}
                                                estadoTraducido={traducirEstadoAnimal(r.estado, t)}
                                            />
                                        ))
                                    )}
                                </View>
                            ) : esSalida ? (
                                <>
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
                                            {t("maternityReader_tableHeaderId")}
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
                                                {t("maternityReader_tableHeaderCrotal")}
                                            </Text>
                                        </View>
                                    </View>

                                    {registrosEnviados.length === 0 ? (
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ color: MUTED }}>{t("maternityReader_noRecords")}</Text>
                                        </View>
                                    ) : (
                                        pageItems.map((r, idx) => (
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
                                        ))
                                    )}
                                </>
                            ) : (
                                <>
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
                                            {t("maternityReader_tableHeaderCorral")}
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
                                            {t("maternityReader_tableHeaderId")}
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
                                                {t("maternityReader_tableHeaderCrotal")}
                                            </Text>
                                        </View>
                                    </View>

                                    {registrosEnviados.length === 0 ? (
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ color: MUTED }}>{t("maternityReader_noRecords")}</Text>
                                        </View>
                                    ) : (
                                        pageItems.map((r, idx) => (
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
                                        ))
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Enviar */}
                {!esBusqueda && !esLectura && (

                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity
                            onPress={() => {
                                if (esLectura || !confirmar) return;
                                onEnviar();
                            }}
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
                                    ? t("maternityReader_buttonAutoReading")
                                    : !confirmar
                                        ? t("maternityReader_buttonAutoSending")
                                        : estaEnviando
                                            ? t("maternityReader_buttonSending")
                                            : t("maternityReader_buttonSend")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
                            maxWidth: 420,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 24,
                            padding: 22,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
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
                                    size={24}
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
                                    fontSize: 24,
                                    fontWeight: "900",
                                    color: TEXT,
                                }}
                            >
                                {avisoTitulo}
                            </Text>
                        </View>

                        <Text
                            style={{
                                fontSize: 16,
                                lineHeight: 24,
                                color: MUTED,
                                textAlign: "center",
                            }}
                        >
                            {avisoMensaje}
                        </Text>

                        <TouchableOpacity
                            onPress={cerrarAviso}
                            activeOpacity={0.9}
                            style={{
                                marginTop: 22,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: BRAND,
                                alignItems: "center",
                                justifyContent: "center",
                                alignSelf: "center",
                                paddingHorizontal: 36,
                                minWidth: 140,
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