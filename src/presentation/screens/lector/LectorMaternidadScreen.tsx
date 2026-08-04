/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    BackHandler,
    Modal,
    Keyboard,
} from "react-native";
import { Appbar, Switch, TextInput } from "react-native-paper";
import { useAwrConn } from "../../../stores/awrConnStore";
import {
    useRoute,
    RouteProp,
    useFocusEffect,
    useNavigation,
    useIsFocused,
    DrawerActions,
} from "@react-navigation/native";
import {
    obtenerLecturaEspada,
    formatearSoloFecha,
    postActualizarId,
    obtenerAnimalPorId,
    obtenerCorralMaternidad,
    putActualizarCrotal,
    comprobarCrotalLibre,
    postMaternityPorId,
    postMaternitySalidaPorId,
} from "../../routes/obtenerLecturaEspada";
import { construirEndpointEspada } from "../../../stores/apiConfig";
import { useTranslation } from "react-i18next";
import { traducirEstadoAnimal } from "../../hooks/traducirEstadoAnimal";
import { formatearCrotalVisual } from "../../hooks/formatearCrotalVisual";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import { IndicadorConexionAnimado } from "../../components/IndicadorConexionAnimado";
import { useLectorCrotales } from "../../../stores/useLectorCrotales";

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
type ModoCaptura = "lector" | "teclado";
type TipoTeclado = "crotal" | "id";

type RegistroPendienteEnvio = RegistroEnviado & {
    idPreparado?: string;
    necesitaActualizarIdDespuesAlta?: boolean;
    necesitaActualizarCrotalDespuesAlta?: boolean;
    enviarPorId?: boolean;
    tipoMovimiento: TipoMovimiento;
};
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

const normalizarTextoBackend = (valor: any) => {
    return String(valor ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .trim();
};

const obtenerMensajeErrorBackend = (respuesta: any) => {
    if (typeof respuesta?.data === "string") {
        return respuesta.data;
    }

    return (
        respuesta?.data?.message ||
        respuesta?.data?.mensaje ||
        respuesta?.data?.error ||
        respuesta?.rawText ||
        `HTTP ${respuesta?.status}`
    );
};

const respuestaEsCorralLibre = (respuesta: any) => {
    const texto = normalizarTextoBackend(obtenerMensajeErrorBackend(respuesta));

    return (
        respuesta?.status === 404 ||
        texto.includes("corralvacio") ||
        texto.includes("corralempty") ||
        texto.includes("emptycorral") ||
        texto.includes("penempty") ||
        texto.includes("emptypen") ||
        texto.includes("corralnoencontrado") ||
        texto.includes("pennoencontrado") ||
        texto.includes("noencontrado") ||
        texto.includes("notfound")
    );
};

const respuestaEsCorralNoExiste = (respuesta: any) => {
    const texto = normalizarTextoBackend(
        obtenerMensajeErrorBackend(respuesta),
    );

    return (
        texto.includes("thecorraldoesnotexist") ||
        texto.includes("numerodecorralnotvalid") ||
        texto.includes("numerodecorral") ||
        texto.includes("corralnoexiste") ||
        texto.includes("corraldoesnotexist") ||
        texto.includes("notvalid")
    );
};

const obtenerDetalleCorralOcupado = (respuesta: any, corral: string) => {
    const animal = respuesta?.data ?? {};

    const id =
        animal?.animalId ??
        animal?.idAnimal ??
        animal?.identificador ??
        animal?.id ??
        "—";

    return `El corral ${corral} ya está ocupado.\n\nID: ${id}`;
};

const respuestaEsNoEncontrado = (respuesta: any) => {
    const texto = normalizarTextoBackend(obtenerMensajeErrorBackend(respuesta));

    return (
        respuesta?.status === 404 ||
        texto.includes("animalnoencontrado") ||
        texto.includes("noencontrado") ||
        texto.includes("notfound")
    );
};
export const LectorMaternidadScreen = () => {
    const ANCHO_CORRAL = 60;
    const ANCHO_ID = 56;
    const ANCHO_CROTAL_SALIDA = 150;

    const ESPACIO_CORRAL_ID_ENTRADA = 30;
    const ESPACIO_ID_CROTAL_ENTRADA = 70;
    const ESPACIO_ID_CROTAL_SALIDA = 24;

    const COLOR_LINEA_COLUMNA = "#E2E8F0";
    const PADDING_TABLA_X = 14;
    const TAM_PAGINA = 10;

    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const pantallaEnfocada = useIsFocused();
    const pantallaActivaRef = useRef(false);

 const {
    lectorConectado,
    idLector,
    crotalLeido,
    iniciarLectura,
    detenerLectura,
    limpiarCrotalLeido,
    tipoLectorActivo,
    nombreLector,
} = useLectorCrotales();
    const route = useRoute<RouteProp<Record<string, LectorMaternidadParams>, string>>();
    const params = route.params ?? {};

    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoEnvioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ultimoCrotalAutoRef = useRef<string | null>(null);
    const ultimoCrotalLoteRef = useRef<string | null>(null);
    const scrollRef = useRef<ScrollView | null>(null);
    const formularioIdYRef = useRef(0);
    const [altoTeclado, setAltoTeclado] = useState(0);

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

    const [corralInput, setCorralInput] = useState("");
    const [mostrarEditarRegistro, setMostrarEditarRegistro] = useState(false);
    const [registroEditando, setRegistroEditando] = useState<RegistroPendienteEnvio | null>(null);
    const [editCorral, setEditCorral] = useState("");
    const [editId, setEditId] = useState("");
    const [editCrotal, setEditCrotal] = useState("");
    const [editError, setEditError] = useState("");
    const [validandoEdicionRegistro, setValidandoEdicionRegistro] = useState(false);
    const [mostrarModalCorral, setMostrarModalCorral] = useState(false);
    const [corralTemporal, setCorralTemporal] = useState("");
    const [validandoCorral, setValidandoCorral] = useState(false);
    const [errorCorral, setErrorCorral] = useState("");
    const [registroPendienteTrasCorral, setRegistroPendienteTrasCorral] =
        useState<RegistroPendienteEnvio | null>(null);
    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");

    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [registrosPendientesEnvio, setRegistrosPendientesEnvio] = useState<RegistroPendienteEnvio[]>([]);

    const [estaEnviando, setEstaEnviando] = useState(false);
    const [loteEnviado, setLoteEnviado] = useState(false);

    const [detectarDesconocidos, setDetectarDesconocidos] = useState(true);
    const [confirmar, setConfirmar] = useState(true);
    const [modoCaptura, setModoCaptura] = useState<ModoCaptura>("lector");
    const [tipoTeclado, setTipoTeclado] = useState<TipoTeclado>("id");
    const [valorTeclado, setValorTeclado] = useState("");
    const [errorTeclado, setErrorTeclado] = useState("");
    const [procesandoTeclado, setProcesandoTeclado] = useState(false);
    const [mostrarModalCrotalTeclado, setMostrarModalCrotalTeclado] = useState(false);
    const [idPendienteTeclado, setIdPendienteTeclado] = useState("");
    const [crotalManualTeclado, setCrotalManualTeclado] = useState("");
    const [errorCrotalManualTeclado, setErrorCrotalManualTeclado] = useState("");


    const [pagina, setPagina] = useState(0);

    const esEntrada = tipoMovimiento === "entrada";
    const esSalida = tipoMovimiento === "salida";
    const esLectura = tipoMovimiento === "lectura";
    const esBusqueda = tipoMovimiento === "busqueda";

    const esTituloLectura =
        params.modo === "lectura" || params.modo === "busqueda";

    const tituloHeader = esTituloLectura
        ? t("Reader_readingTitle")
        : t("maternityReader_screenTitle");

    const animalBusqueda = params.animalEncontrado ?? null;

    const hayPendientesEnvio = registrosPendientesEnvio.length > 0;

    const mostrandoPendientesEnvio =
        confirmar &&
        !esLectura &&
        !esBusqueda &&
        hayPendientesEnvio;

    const registrosTabla = mostrandoPendientesEnvio
        ? registrosPendientesEnvio
        : registrosEnviados;

    const tituloTablaRegistros = mostrandoPendientesEnvio
        ? "Registros no enviados"
        : !confirmar && !esLectura && !esBusqueda
            ? "Historial enviados"
            : "Registros enviados";

    const totalPaginas = Math.max(1, Math.ceil(registrosTabla.length / TAM_PAGINA));
    const totalRegistrosTabla = registrosTabla.length;
    const hayRegistros = registrosTabla.length > 0;

    const pageItems = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosTabla.slice(start, start + TAM_PAGINA);
    }, [registrosTabla, pagina]);

    const requiereCorral = esEntrada;
    const usaEnvioAutomatico = !esBusqueda && (esLectura || !confirmar);
    const tiempoAutoEnvioMs = esLectura ? 300 : 1000;

    const limpiarAutoEnvioTimer = React.useCallback(() => {
        if (autoEnvioTimerRef.current) {
            clearTimeout(autoEnvioTimerRef.current);
            autoEnvioTimerRef.current = null;
        }
    }, []);

    const subirFormularioId = React.useCallback(() => {
        const yFormulario = Math.max(formularioIdYRef.current - 80, 0);

        scrollRef.current?.scrollTo({
            y: yFormulario,
            animated: true,
        });
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

    const volverAConfiguracionMaternidad = React.useCallback(() => {
        navigation.goBack();
    }, [navigation]);
    const abrirActualizacionId = React.useCallback((crotal: string, corral: string) => {
        if (!detectarDesconocidos) return;

        limpiarAutoEnvioTimer();
        ultimoCrotalAutoRef.current = null;
        limpiarCrotalLeido();
        detenerLectura?.().catch(() => { });

        setMostrarActualizarId(true);
        setNuevoIdManual("");
        setCrotalPendienteId(String(crotal));
        setCorralPendienteId(corral?.trim() ? corral : "—");
    }, [
        detectarDesconocidos,
        limpiarAutoEnvioTimer,
        limpiarCrotalLeido,
        detenerLectura,
    ]);

    const cerrarActualizacionId = React.useCallback(() => {
        setMostrarActualizarId(false);
        setNuevoIdManual("");
        setCrotalPendienteId("");
        setCorralPendienteId("—");

        limpiarCrotalLeido();
        ultimoCrotalAutoRef.current = null;

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
        modoCaptura,
    ]);

    const traducirEstadosEnMensaje = (
        mensaje: string,
        tFuncion: (clave: string) => string
    ) => {
        if (!mensaje) return "";

        return mensaje.replace(
            /\b(gestation|out_of_gestation|maternity|out_of_maternity)\b/g,
            (estado) => traducirEstadoAnimal(estado, tFuncion)
        );
    };

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

    const agregarRegistroPendienteEnvio = React.useCallback((registro: RegistroPendienteEnvio) => {
        setRegistrosPendientesEnvio((prev) => {
            const claveNueva = normalizarClave(registro.crotal);

            if (claveNueva === "0") {
                return [registro, ...prev];
            }

            const sinDuplicado = prev.filter(
                (item) => normalizarClave(item.crotal) !== claveNueva
            );

            return [registro, ...sinDuplicado];
        });

        setLoteEnviado(false);
        setPagina(0);

        limpiarCrotalLeido();
        ultimoCrotalAutoRef.current = null;

        if (registro.tipoMovimiento === "entrada") {
            setCorralInput((prevCorral) => incrementarCorral(prevCorral));
        }

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
        modoCaptura,
    ]);

    const validarCorralLibreParaUso = React.useCallback(async (corralValor: string) => {
        const corralLimpio = soloDigitos(corralValor);

        if (!corralLimpio) {
            return {
                ok: false,
                mensaje: "Escribe un número de corral.",
            };
        }

        const corralYaEstaEnLote = registrosPendientesEnvio.some(
            (registro) =>
                normalizarClave(registro.corral) === normalizarClave(corralLimpio)
        );

        if (corralYaEstaEnLote) {
            return {
                ok: false,
                mensaje: `El corral ${corralLimpio} ya está en la tabla de registros no enviados.`,
            };
        }

        const respuestaCorral = await obtenerCorralMaternidad(corralLimpio);

        if (respuestaEsCorralNoExiste(respuestaCorral)) {
            return {
                ok: false,
                mensaje: "El corral no existe",
            };
        }

        if (respuestaEsCorralLibre(respuestaCorral)) {
            return {
                ok: true,
                mensaje: "",
            };
        }

        if (respuestaCorral.ok) {
            return {
                ok: false,
                mensaje: obtenerDetalleCorralOcupado(respuestaCorral, corralLimpio),
            };
        }

        return {
            ok: false,
            mensaje: String(obtenerMensajeErrorBackend(respuestaCorral)),
        };
    }, [registrosPendientesEnvio]);

    const abrirModalCorral = React.useCallback(() => {
        setCorralTemporal(soloDigitos(corralInput).slice(0, 9));
        setErrorCorral("");
        setRegistroPendienteTrasCorral(null);
        setMostrarModalCorral(true);
    }, [corralInput]);

    const cancelarModalCorral = React.useCallback(() => {
        setMostrarModalCorral(false);
        setCorralTemporal("");
        setErrorCorral("");
        setRegistroPendienteTrasCorral(null);

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        esBusqueda,
        idLector,
        iniciarLectura,
        modoCaptura,
    ]);

    const aceptarModalCorral = React.useCallback(async () => {
        const nuevoCorral = soloDigitos(corralTemporal).slice(0, 9);
        if (!nuevoCorral) {
            setErrorCorral("Escribe un número de corral antes de aceptar.");
            return;
        }

        const corralNum = parseNumeroSeguro(nuevoCorral);

        if (corralNum === null) {
            setErrorCorral("El corral debe ser un número válido.");
            return;
        }

        try {
            setValidandoCorral(true);
            setErrorCorral("");

            const validacion = await validarCorralLibreParaUso(nuevoCorral);

            if (!validacion.ok) {
                setErrorCorral(validacion.mensaje);
                return;
            }

            setCorralInput(nuevoCorral);
            setMostrarModalCorral(false);
            setCorralTemporal("");
            setErrorCorral("");

            if (registroPendienteTrasCorral) {
                agregarRegistroPendienteEnvio({
                    ...registroPendienteTrasCorral,
                    corral: nuevoCorral,
                });

                setRegistroPendienteTrasCorral(null);
            }
        } catch {
            setErrorCorral(
                "No se pudo validar el corral. Revisa la conexión con el servidor."
            );
        } finally {
            setValidandoCorral(false);
        }
    }, [
        corralTemporal,
        validarCorralLibreParaUso,
        registroPendienteTrasCorral,
        agregarRegistroPendienteEnvio,
    ]);

    const validarYAgregarRegistroPendienteEnvio = React.useCallback(async (
        registro: RegistroPendienteEnvio
    ) => {
        if (registro.tipoMovimiento !== "entrada") {
            agregarRegistroPendienteEnvio(registro);
            return true;
        }

        const validacionCorral = await validarCorralLibreParaUso(registro.corral);

        if (!validacionCorral.ok) {
            setRegistroPendienteTrasCorral(registro);
            setCorralTemporal(
                registro.corral && registro.corral !== "—"
                    ? soloDigitos(registro.corral).slice(0, 9)
                    : soloDigitos(corralInput).slice(0, 9)
            );
            setErrorCorral(validacionCorral.mensaje);
            setMostrarModalCorral(true);

            limpiarCrotalLeido();
            ultimoCrotalAutoRef.current = null;
            ultimoCrotalLoteRef.current = null;
            detenerLectura?.().catch(() => { });

            return false;
        }

        agregarRegistroPendienteEnvio(registro);
        return true;
    }, [
        agregarRegistroPendienteEnvio,
        validarCorralLibreParaUso,
        corralInput,
        limpiarCrotalLeido,
        detenerLectura,
    ]);

    const abrirEditarRegistro = React.useCallback((registro: RegistroPendienteEnvio) => {
        if (!mostrandoPendientesEnvio) return;

        setRegistroEditando(registro);
        setEditCorral(registro.corral && registro.corral !== "—" ? registro.corral : "");
        setEditId(registro.idBackend && registro.idBackend !== "—" ? registro.idBackend : "");
        setEditCrotal(registro.crotal && registro.crotal !== "—" ? registro.crotal : "");
        setEditError("");
        setMostrarEditarRegistro(true);

        limpiarCrotalLeido();
        ultimoCrotalAutoRef.current = null;
        ultimoCrotalLoteRef.current = null;
        detenerLectura?.().catch(() => { });
    }, [
        mostrandoPendientesEnvio,
        limpiarCrotalLeido,
        detenerLectura,
    ]);

    const cancelarEditarRegistro = React.useCallback(() => {
        setMostrarEditarRegistro(false);
        setRegistroEditando(null);
        setEditCorral("");
        setEditId("");
        setEditCrotal("");
        setEditError("");
        setValidandoEdicionRegistro(false);

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        esBusqueda,
        idLector,
        iniciarLectura,
        modoCaptura,
    ]);

    const eliminarRegistroPendiente = React.useCallback(() => {
        if (!registroEditando || validandoEdicionRegistro) return;

        const localIdEliminar = registroEditando.localId;

        setRegistrosPendientesEnvio((prev) =>
            prev.filter((registro) => registro.localId !== localIdEliminar)
        );

        setMostrarEditarRegistro(false);
        setRegistroEditando(null);
        setEditCorral("");
        setEditId("");
        setEditCrotal("");
        setEditError("");
        setValidandoEdicionRegistro(false);
        setPagina(0);

        limpiarCrotalLeido();
        ultimoCrotalAutoRef.current = null;
        ultimoCrotalLoteRef.current = null;

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        registroEditando,
        validandoEdicionRegistro,
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
        modoCaptura,
    ]);
    const guardarEdicionRegistro = React.useCallback(async () => {
        if (!registroEditando) return;

        const nuevoCorral = soloDigitos(editCorral);
        const nuevoCrotal = soloDigitos(editCrotal);
        const nuevoId = editId.trim();

        if (registroEditando.tipoMovimiento === "entrada" && !nuevoCorral) {
            setEditError("El corral es obligatorio en entrada.");
            return;
        }

        if (!nuevoCrotal) {
            setEditError("El crotal es obligatorio.");
            return;
        }

        const crotalNum = parseNumeroSeguro(nuevoCrotal);

        if (crotalNum === null) {
            setEditError("El crotal debe ser un número válido.");
            return;
        }

        const crotalRepetido = registrosPendientesEnvio.some(
            (registro) =>
                registro.localId !== registroEditando.localId &&
                normalizarClave(registro.crotal) === normalizarClave(nuevoCrotal)
        );

        if (crotalRepetido) {
            setEditError(`El crotal ${nuevoCrotal} ya está en la tabla.`);
            return;
        }

        if (nuevoId) {
            const idRepetido = registrosPendientesEnvio.some((registro) => {
                if (registro.localId === registroEditando.localId) return false;

                const idRegistro =
                    registro.idPreparado?.trim() ||
                    registro.idBackend?.trim() ||
                    "";

                if (!idRegistro || idRegistro === "0" || idRegistro === "—") {
                    return false;
                }

                return normalizarClave(idRegistro) === normalizarClave(nuevoId);
            });

            if (idRepetido) {
                setEditError(`El ID ${nuevoId} ya está en la tabla.`);
                return;
            }
        }

        try {
            setValidandoEdicionRegistro(true);
            setEditError("");

            if (registroEditando.tipoMovimiento === "entrada") {
                const corralRepetido = registrosPendientesEnvio.some(
                    (registro) =>
                        registro.localId !== registroEditando.localId &&
                        normalizarClave(registro.corral) === normalizarClave(nuevoCorral)
                );

                if (corralRepetido) {
                    setEditError(`El corral ${nuevoCorral} ya está en la tabla.`);
                    return;
                }

                const corralHaCambiado =
                    normalizarClave(registroEditando.corral) !== normalizarClave(nuevoCorral);

                if (corralHaCambiado) {
                    const respuestaCorral = await obtenerCorralMaternidad(nuevoCorral);

                    if (!respuestaEsCorralLibre(respuestaCorral)) {
                        if (respuestaCorral.ok) {
                            setEditError(obtenerDetalleCorralOcupado(respuestaCorral, nuevoCorral));
                            return;
                        }

                        setEditError(String(obtenerMensajeErrorBackend(respuestaCorral)));
                        return;
                    }
                }
            }

            const teniaIdPreparado =
                !!registroEditando.idPreparado?.trim() ||
                !!registroEditando.necesitaActualizarIdDespuesAlta;

            const idBaseAnterior =
                registroEditando.idBackend && registroEditando.idBackend !== "—"
                    ? registroEditando.idBackend
                    : "";

            const idPreparadoNuevo =
                nuevoId &&
                    (
                        teniaIdPreparado ||
                        normalizarClave(nuevoId) !== normalizarClave(idBaseAnterior)
                    )
                    ? nuevoId
                    : "";

            const idParaTabla =
                nuevoId ||
                (registroEditando.idBackend === "0" ? "0" : "—");

            const registroActualizado: RegistroPendienteEnvio = {
                ...registroEditando,
                corral:
                    registroEditando.tipoMovimiento === "entrada"
                        ? nuevoCorral
                        : "—",
                idBackend: idParaTabla,
                crotal: nuevoCrotal,
                idPreparado: idPreparadoNuevo,
                necesitaActualizarIdDespuesAlta: !!idPreparadoNuevo,
            };

            setRegistrosPendientesEnvio((prev) =>
                prev.map((registro) =>
                    registro.localId === registroEditando.localId
                        ? registroActualizado
                        : registro
                )
            );

            setMostrarEditarRegistro(false);
            setRegistroEditando(null);
            setEditCorral("");
            setEditId("");
            setEditCrotal("");
            setEditError("");

            mostrarAviso(
                "Registro actualizado",
                "El registro pendiente se ha actualizado correctamente.",
                "info"
            );

            if (!esBusqueda && idLector && modoCaptura === "lector") {
                iniciarLectura?.().catch(() => { });
            }
        } catch {
            setEditError("No se pudo validar el registro. Revisa la conexión.");
        } finally {
            setValidandoEdicionRegistro(false);
        }
    }, [
        registroEditando,
        editCorral,
        editId,
        editCrotal,
        registrosPendientesEnvio,
        esBusqueda,
        idLector,
        iniciarLectura,
        modoCaptura,
    ]);

    const enviarUnRegistroPendiente = React.useCallback(async (
        registro: RegistroPendienteEnvio
    ): Promise<RegistroEnviado> => {
        const crotalNum = parseNumeroSeguro(registro.crotal);

        if (crotalNum === null) {
            throw new Error(`Crotal inválido: ${registro.crotal}`);
        }

        const esEntradaPendiente = registro.tipoMovimiento === "entrada";
        const esSalidaPendiente = registro.tipoMovimiento === "salida";

        const corralNum = esEntradaPendiente
            ? parseNumeroSeguro(registro.corral)
            : null;

        if (esEntradaPendiente && corralNum === null) {
            throw new Error(`Corral inválido: ${registro.corral}`);
        }

        const idRegistro = String(registro.idBackend || "").trim();
        const debeEnviarPorId = !!registro.enviarPorId;

        const esEntradaPorId =
            esEntradaPendiente &&
            (debeEnviarPorId || crotalNum === 0) &&
            idRegistro !== "" &&
            idRegistro !== "0" &&
            idRegistro !== "—";

        const esSalidaPorId =
            esSalidaPendiente &&
            (debeEnviarPorId || crotalNum === 0) &&
            idRegistro !== "" &&
            idRegistro !== "0" &&
            idRegistro !== "—";

        let respuesta: {
            ok: boolean;
            status: number;
            data: any;
            rawText: string;
        };

        if (registro.necesitaActualizarCrotalDespuesAlta) {
            const respuestaActualizarCrotal = await putActualizarCrotal({
                crotal: crotalNum,
                id: registro.idBackend,
            });

            if (!respuestaActualizarCrotal.ok) {
                const detalle =
                    (respuestaActualizarCrotal.data &&
                        (
                            respuestaActualizarCrotal.data.message ||
                            respuestaActualizarCrotal.data.error ||
                            respuestaActualizarCrotal.data.mensaje
                        )) ||
                    respuestaActualizarCrotal.rawText ||
                    `HTTP ${respuestaActualizarCrotal.status}`;

                throw new Error(
                    `No se pudo actualizar el crotal ${crotalNum} para el ID ${registro.idBackend}. ${detalle}`
                );
            }
        }

        if (esEntradaPorId) {
            respuesta = await postMaternityPorId({
                id: idRegistro,
                corral: corralNum as number,
            });
        } else if (esSalidaPorId) {
            respuesta = await postMaternitySalidaPorId(idRegistro);
        } else {
            const endpointActual = await construirEndpointEspada(
                esSalidaPendiente ? "maternity/exit" : "maternity"
            );

            const payload = esEntradaPendiente
                ? { corral: corralNum as number, crotal: crotalNum }
                : { crotal: crotalNum };

            respuesta = await postMaternity(endpointActual, payload);
        }

        if (!respuesta.ok) {
            const detalle =
                (respuesta.data &&
                    typeof respuesta.data === "object" &&
                    (respuesta.data.message || respuesta.data.error || respuesta.data.mensaje)) ||
                respuesta.rawText ||
                `HTTP ${respuesta.status}`;

            throw new Error(String(detalle));
        }

        const idBackendRaw =
            respuesta.data?.animalId ??
            respuesta.data?.idAnimal ??
            respuesta.data?.identificador ??
            respuesta.data?.id ??
            (respuesta.rawText ? respuesta.rawText.replace(/^id\s*/i, "").trim() : null);

        const idManualPreparado = registro.idPreparado?.trim() ?? "";

        let idBackendTexto =
            idManualPreparado
                ? idManualPreparado
                : idBackendRaw !== null &&
                    idBackendRaw !== undefined &&
                    String(idBackendRaw).trim() !== ""
                    ? String(idBackendRaw)
                    : registro.idBackend || "—";

        if (idManualPreparado) {
            const respuestaActualizarId = await postActualizarId({
                crotal: crotalNum,
                id: idManualPreparado,
            });

            if (!respuestaActualizarId.ok) {
                const detalle =
                    (respuestaActualizarId.data &&
                        (
                            respuestaActualizarId.data.message ||
                            respuestaActualizarId.data.error ||
                            respuestaActualizarId.data.mensaje
                        )) ||
                    respuestaActualizarId.rawText ||
                    `HTTP ${respuestaActualizarId.status}`;

                throw new Error(
                    `El animal se ha dado de alta, pero no se pudo actualizar el ID ${idManualPreparado}. ${detalle}`
                );
            }

            const idActualizado =
                respuestaActualizarId.data?.animalId ??
                respuestaActualizarId.data?.idAnimal ??
                respuestaActualizarId.data?.identificador ??
                respuestaActualizarId.data?.id ??
                idManualPreparado;

            idBackendTexto =
                idActualizado !== null &&
                    idActualizado !== undefined &&
                    String(idActualizado).trim() !== "" &&
                    String(idActualizado).trim() !== "0"
                    ? String(idActualizado).trim()
                    : idManualPreparado;
        }

        return {
            localId: `enviado_${Date.now()}_${registro.crotal}`,
            corral: registro.corral,
            crotal: registro.crotal,
            idBackend: idBackendTexto,
            estado: registro.estado,
            nave: registro.nave,
        };
    }, []);


    const enviarLotePendientes = React.useCallback(async () => {
        if (registrosPendientesEnvio.length === 0) return;

        try {
            setEstaEnviando(true);

            const enviadosCorrectamente: RegistroEnviado[] = [];
            const noEnviados: RegistroPendienteEnvio[] = [];
            const erroresLote: string[] = [];

            for (const registro of registrosPendientesEnvio) {
                try {
                    const registroEnviado = await enviarUnRegistroPendiente(registro);
                    enviadosCorrectamente.push(registroEnviado);
                } catch (error: any) {
                    const mensajeError =
                        error?.message ||
                        error?.toString?.() ||
                        "Error desconocido";

                    erroresLote.push(
                        `• Corral ${registro.corral} | ID ${registro.idBackend} | Crotal ${registro.crotal}: ${mensajeError}`
                    );

                    noEnviados.push(registro);
                }
            }

            if (noEnviados.length > 0) {
                setRegistrosPendientesEnvio(noEnviados);
                setLoteEnviado(false);
                setPagina(0);

                mostrarAviso(
                    "Envío parcial",
                    `Se han enviado ${enviadosCorrectamente.length} registro(s), pero ${noEnviados.length} han quedado pendientes.\n\nMotivo:\n${erroresLote.join("\n")}`,
                    "warning"
                );

                return;
            }

            setRegistrosPendientesEnvio([]);
            setRegistrosEnviados([]);

            setLoteEnviado(false);
            setPagina(0);

            setIdRecibido("");
            setEstadoIdVisual("neutro");

            setMostrarActualizarId(false);
            setNuevoIdManual("");
            setCrotalPendienteId("");
            setCorralPendienteId("—");
            setActualizandoId(false);

            setMostrarEditarRegistro(false);
            setRegistroEditando(null);
            setEditCorral("");
            setEditId("");
            setEditCrotal("");
            setEditError("");
            setValidandoEdicionRegistro(false);

            setMostrarModalCorral(false);
            setCorralTemporal("");
            setErrorCorral("");
            setRegistroPendienteTrasCorral(null);
            setValidandoCorral(false);
            setValorTeclado("");
            setErrorTeclado("");
            setProcesandoTeclado(false);
            setMostrarModalCrotalTeclado(false);
            setIdPendienteTeclado("");
            setCrotalManualTeclado("");
            setErrorCrotalManualTeclado("");


            limpiarCrotalLeido();
            limpiarAutoEnvioTimer();

            ultimoCrotalAutoRef.current = null;
            ultimoCrotalLoteRef.current = null;
            mostrarAviso(
                "Lote enviado",
                `Se han enviado ${enviadosCorrectamente.length} registro(s) correctamente.`,
                "info"
            );

            if (!esBusqueda && idLector && modoCaptura === "lector") {
                iniciarLectura?.().catch(() => { });
            }
        } finally {
            setEstaEnviando(false);
        }
    }, [
        registrosPendientesEnvio,
        enviarUnRegistroPendiente,
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
        limpiarAutoEnvioTimer,
        modoCaptura,
    ]);

    const cancelarLotePendiente = React.useCallback(() => {
        if (estaEnviando) return;

        setRegistrosPendientesEnvio([]);
        setLoteEnviado(false);
        setPagina(0);

        setIdRecibido("");
        setEstadoIdVisual("neutro");

        setMostrarModalCorral(false);
        setCorralTemporal("");
        setErrorCorral("");
        setRegistroPendienteTrasCorral(null);
        setValidandoCorral(false);
        setMostrarActualizarId(false);

        setNuevoIdManual("");
        setCrotalPendienteId("");
        setCorralPendienteId("—");
        setActualizandoId(false);
        setMostrarEditarRegistro(false);
        setRegistroEditando(null);
        setEditCorral("");
        setEditId("");
        setEditCrotal("");
        setEditError("");
        setValidandoEdicionRegistro(false);
        setValorTeclado("");
        setErrorTeclado("");
        setProcesandoTeclado(false);
        setMostrarModalCrotalTeclado(false);
        setIdPendienteTeclado("");
        setCrotalManualTeclado("");
        setErrorCrotalManualTeclado("");

        limpiarCrotalLeido();
        limpiarAutoEnvioTimer();

        ultimoCrotalAutoRef.current = null;
        ultimoCrotalLoteRef.current = null;

        if (timerIdRef.current) {
            clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }

        if (!esBusqueda && idLector && modoCaptura === "lector") {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        estaEnviando,
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
        limpiarAutoEnvioTimer,
        modoCaptura,
    ]);

    const onEnviar = React.useCallback(async (crotalForzado?: string) => {
        if (!pantallaActivaRef.current) return;

        if (mostrarActualizarId || actualizandoId) {
            limpiarAutoEnvioTimer();
            limpiarCrotalLeido();
            ultimoCrotalAutoRef.current = null;
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
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );
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
        if (confirmar && !esLectura && !esBusqueda) {
            try {
                setEstaEnviando(true);

                let corralTexto = corralNum !== null ? String(corralNum) : "—";
                let crotalTexto = String(crotalNum);
                let idBackendTexto = "—";
                let estadoTexto = "—";
                let naveTexto = "—";

                const respuesta = await obtenerLecturaEspada(String(crotalNum));

                if (respuesta.ok) {
                    const animal = respuesta.data ?? {};

                    idBackendTexto =
                        animal?.animalId !== null &&
                            animal?.animalId !== undefined &&
                            String(animal.animalId).trim() !== ""
                            ? String(animal.animalId)
                            : "—";

                    crotalTexto =
                        animal?.crotal !== null &&
                            animal?.crotal !== undefined &&
                            String(animal.crotal).trim() !== ""
                            ? String(animal.crotal)
                            : String(crotalNum);

                    estadoTexto =
                        animal?.state !== null &&
                            animal?.state !== undefined &&
                            String(animal.state).trim() !== ""
                            ? String(animal.state)
                            : "—";

                    naveTexto =
                        animal?.houseName !== null &&
                            animal?.houseName !== undefined &&
                            String(animal.houseName).trim() !== ""
                            ? String(animal.houseName)
                            : "—";

                    if (idBackendTexto === "0" && detectarDesconocidos && esEntrada) {
                        mostrarIdTemporal("0", "error");

                        abrirActualizacionId(
                            crotalTexto,
                            corralTexto
                        );

                        return;
                    }
                }

                const registroPendiente: RegistroPendienteEnvio = {
                    localId: `pendiente_${Date.now()}_${crotalTexto}`,
                    corral: corralTexto,
                    idBackend: idBackendTexto,
                    crotal: crotalTexto,
                    estado: estadoTexto,
                    nave: naveTexto,
                    idPreparado: "",
                    necesitaActualizarIdDespuesAlta: false,
                    necesitaActualizarCrotalDespuesAlta: false,
                    tipoMovimiento,
                };

                const agregado = await validarYAgregarRegistroPendienteEnvio(registroPendiente);

                if (!agregado) {
                    return;
                }

                mostrarIdTemporal(
                    idBackendTexto,
                    idBackendTexto === "0"
                        ? "error"
                        : idBackendTexto !== "—"
                            ? "success"
                            : "neutro"
                );

                return;
            } finally {
                setEstaEnviando(false);
            }
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
                    limpiarMensajeBackend(String(detalle)),
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
    }, [
        pantallaActivaRef,
        mostrarActualizarId,
        actualizandoId,
        limpiarAutoEnvioTimer,
        limpiarCrotalLeido,
        corralInput,
        crotalLeido,
        t,
        esLectura,
        requiereCorral,
        esSalida,
        esEntrada,
        abrirActualizacionId,
        cerrarActualizacionId,
        confirmar,
        tipoMovimiento,
        agregarRegistroPendienteEnvio,
        detectarDesconocidos,
        validarYAgregarRegistroPendienteEnvio,
    ]);

    const extraerIdAnimal = React.useCallback((animal: any) => {
        const id =
            animal?.animalId ??
            animal?.idAnimal ??
            animal?.identificador ??
            animal?.id ??
            "";

        return id !== null &&
            id !== undefined &&
            String(id).trim() !== ""
            ? String(id).trim()
            : "0";
    }, []);

    const extraerCrotalAnimal = React.useCallback((animal: any) => {
        const crotal =
            animal?.crotal ??
            animal?.tag ??
            animal?.earTag ??
            "";

        return crotal !== null &&
            crotal !== undefined &&
            String(crotal).trim() !== ""
            ? soloDigitos(String(crotal))
            : "";
    }, []);

    const procesarRegistroDesdeTeclado = React.useCallback(async ({
        idBackend,
        crotal,
        actualizarIdDespuesAlta = false,
        actualizarCrotalDespuesAlta = false,
        enviarPorId = false,
    }: {
        idBackend: string;
        crotal: string;
        actualizarIdDespuesAlta?: boolean;
        actualizarCrotalDespuesAlta?: boolean;
        enviarPorId?: boolean;
    }) => {
        const crotalFinal = soloDigitos(crotal) || "0";
        const idFinal = String(idBackend || "0").trim() || "0";

        const corralActual = esEntrada
            ? corralInput.trim() || "—"
            : "—";

        if (esEntrada) {
            if (!corralActual || corralActual === "—") {
                setErrorTeclado("El corral es obligatorio.");
                return false;
            }

            if (parseNumeroSeguro(corralActual) === null) {
                setErrorTeclado("El corral debe ser un número válido.");
                return false;
            }
        }

        if (parseNumeroSeguro(crotalFinal) === null) {
            setErrorTeclado("El crotal debe ser un número válido.");
            return false;
        }

        if (confirmar) {
            const crotalRepetido =
                crotalFinal !== "0" &&
                registrosPendientesEnvio.some(
                    (registro) =>
                        normalizarClave(registro.crotal) === normalizarClave(crotalFinal)
                );

            if (crotalRepetido) {
                setErrorTeclado(`El crotal ${crotalFinal} ya está en la tabla de registros no enviados.`);
                return false;
            }

            const idRepetido =
                idFinal !== "0" &&
                registrosPendientesEnvio.some(
                    (registro) =>
                        registro.idBackend !== "0" &&
                        normalizarClave(registro.idBackend) === normalizarClave(idFinal)
                );

            if (idRepetido) {
                setErrorTeclado(`El ID ${idFinal} ya está en la tabla de registros no enviados.`);
                return false;
            }
        }

        const idPreparado =
            actualizarIdDespuesAlta &&
                idFinal !== "0" &&
                idFinal !== "—"
                ? idFinal
                : "";

        const registro: RegistroPendienteEnvio = {
            localId: `teclado_${Date.now()}_${crotalFinal}_${idFinal}`,
            corral: corralActual,
            idBackend: idFinal,
            crotal: crotalFinal,
            estado: "—",
            nave: "—",
            idPreparado,
            necesitaActualizarIdDespuesAlta: !!idPreparado,
            necesitaActualizarCrotalDespuesAlta:
                actualizarCrotalDespuesAlta &&
                crotalFinal !== "0" &&
                idFinal !== "0" &&
                idFinal !== "—",
            enviarPorId,
            tipoMovimiento,
        };

        if (confirmar) {
            const agregado = await validarYAgregarRegistroPendienteEnvio(registro);

            if (!agregado) {
                return false;
            }

            setValorTeclado("");
            setErrorTeclado("");
            Keyboard.dismiss();

            return true;
        }

        if (esEntrada) {
            const validacionCorral = await validarCorralLibreParaUso(corralActual);

            if (!validacionCorral.ok) {
                setErrorTeclado(validacionCorral.mensaje);
                return false;
            }
        }

        const enviado = await enviarUnRegistroPendiente(registro);

        setRegistrosEnviados((prev) =>
            upsertRegistroPorCrotal(
                prev,
                enviado.corral,
                enviado.crotal,
                enviado.idBackend,
                enviado.estado,
                enviado.nave
            )
        );

        mostrarIdTemporal(
            enviado.idBackend,
            enviado.idBackend === "0" || enviado.idBackend === "—"
                ? "error"
                : "success"
        );

        if (esEntrada) {
            setCorralInput((prev) => incrementarCorral(prev));
        }

        setPagina(0);
        setValorTeclado("");
        setErrorTeclado("");
        Keyboard.dismiss();

        return true;
    }, [
        esEntrada,
        corralInput,
        tipoMovimiento,
        confirmar,
        registrosPendientesEnvio,
        validarYAgregarRegistroPendienteEnvio,
        validarCorralLibreParaUso,
        enviarUnRegistroPendiente,
    ]);

    const abrirModalCrotalTeclado = React.useCallback((id: string) => {
        setIdPendienteTeclado(id);
        setCrotalManualTeclado("");
        setErrorCrotalManualTeclado("");
        setMostrarModalCrotalTeclado(true);
    }, []);

    const cancelarModalCrotalTeclado = React.useCallback(() => {
        setMostrarModalCrotalTeclado(false);
        setIdPendienteTeclado("");
        setCrotalManualTeclado("");
        setErrorCrotalManualTeclado("");
        setProcesandoTeclado(false);
    }, []);

    const aceptarModalCrotalTeclado = React.useCallback(async () => {
        if (!idPendienteTeclado) return;

        const crotalEscrito = soloDigitos(crotalManualTeclado);
        const quiereAsignarCrotal = crotalEscrito !== "" && crotalEscrito !== "0";

        const crotalFinal = quiereAsignarCrotal ? crotalEscrito : "0";

        try {
            setProcesandoTeclado(true);
            setErrorCrotalManualTeclado("");

            if (confirmar && quiereAsignarCrotal) {
                const crotalYaEstaEnLote = registrosPendientesEnvio.some(
                    (registro) =>
                        normalizarClave(registro.crotal) === normalizarClave(crotalEscrito)
                );

                if (crotalYaEstaEnLote) {
                    setErrorCrotalManualTeclado(
                        `El crotal ${crotalEscrito} ya está en la tabla de registros no enviados.`
                    );
                    return;
                }
            }

            if (quiereAsignarCrotal) {
                let respuestaLibre: any = null;

                try {
                    respuestaLibre = await comprobarCrotalLibre(crotalEscrito);
                } catch {
                    setErrorCrotalManualTeclado(
                        "No se pudo comprobar si el crotal está libre. Revisa la conexión con el servidor."
                    );
                    return;
                }

                if (!respuestaLibre.ok) {
                    const detalle =
                        (respuestaLibre.data &&
                            typeof respuestaLibre.data === "object" &&
                            (
                                respuestaLibre.data.message ||
                                respuestaLibre.data.error ||
                                respuestaLibre.data.mensaje
                            )) ||
                        respuestaLibre.rawText ||
                        `HTTP ${respuestaLibre.status}`;

                    setErrorCrotalManualTeclado(
                        `El crotal ${crotalEscrito} no está libre.\n\n${String(detalle)}`
                    );
                    return;
                }
            }

            const ok = await procesarRegistroDesdeTeclado({
                idBackend: idPendienteTeclado,
                crotal: crotalFinal,
                actualizarIdDespuesAlta: false,
                actualizarCrotalDespuesAlta: quiereAsignarCrotal,
            });

            if (!ok) {
                setErrorCrotalManualTeclado(
                    "No se pudo añadir el registro. Revisa el corral o los datos introducidos."
                );
                return;
            }

            setMostrarModalCrotalTeclado(false);
            setIdPendienteTeclado("");
            setCrotalManualTeclado("");
            setErrorCrotalManualTeclado("");
        } catch (error: any) {
            setErrorCrotalManualTeclado(
                error?.message ||
                "No se pudo añadir el registro. Revisa la conexión con el servidor."
            );
        } finally {
            setProcesandoTeclado(false);
        }
    }, [
        idPendienteTeclado,
        crotalManualTeclado,
        confirmar,
        registrosPendientesEnvio,
        procesarRegistroDesdeTeclado,
    ]);

    const procesarEntradaTeclado = React.useCallback(async () => {
        const valor =
            tipoTeclado === "crotal"
                ? soloDigitos(valorTeclado).slice(0, 15)
                : soloDigitos(valorTeclado);
        if (!valor) {
            setErrorTeclado(
                tipoTeclado === "id"
                    ? "Escribe un ID Animal."
                    : "Escribe un crotal."
            );
            return;
        }

        try {
            setProcesandoTeclado(true);
            setErrorTeclado("");

            if (esSalida) {
                if (tipoTeclado === "id") {
                    const idYaEstaEnLote = registrosPendientesEnvio.some(
                        (registro) =>
                            registro.idBackend !== "0" &&
                            normalizarClave(registro.idBackend) === normalizarClave(valor)
                    );

                    if (idYaEstaEnLote) {
                        setErrorTeclado(`El ID ${valor} ya está en la tabla de registros no enviados.`);
                        return;
                    }

                    const respuestaId = await obtenerAnimalPorId(valor);

                    if (!respuestaId.ok) {
                        if (respuestaEsNoEncontrado(respuestaId)) {
                            setErrorTeclado(`No existe ningún animal con el ID ${valor}.`);
                            return;
                        }

                        setErrorTeclado(String(obtenerMensajeErrorBackend(respuestaId)));
                        return;
                    }

                    const animal = respuestaId.data ?? {};
                    const crotalAnimal = extraerCrotalAnimal(animal) || "0";

                    await procesarRegistroDesdeTeclado({
                        idBackend: valor,
                        crotal: crotalAnimal,
                        actualizarIdDespuesAlta: false,
                        actualizarCrotalDespuesAlta: false,
                        enviarPorId: true,
                    });

                    return;
                }

                if (confirmar) {
                    const respuestaCrotal = await obtenerLecturaEspada(valor);

                    const idSalida = respuestaCrotal.ok
                        ? extraerIdAnimal(respuestaCrotal.data ?? {})
                        : "—";

                    await procesarRegistroDesdeTeclado({
                        idBackend: idSalida,
                        crotal: valor,
                        actualizarIdDespuesAlta: false,
                        enviarPorId: false,
                    });

                    return;
                }

                await onEnviar(valor);
                setValorTeclado("");
                setErrorTeclado("");
                Keyboard.dismiss();
                return;
            }

            if (tipoTeclado === "id") {
                const idYaEstaEnLote = registrosPendientesEnvio.some(
                    (registro) =>
                        registro.idBackend !== "0" &&
                        normalizarClave(registro.idBackend) === normalizarClave(valor)
                );

                if (idYaEstaEnLote) {
                    setErrorTeclado(`El ID ${valor} ya está en la tabla de registros no enviados.`);
                    return;
                }

                const respuestaId = await obtenerAnimalPorId(valor);

                if (!respuestaId.ok) {
                    if (respuestaEsNoEncontrado(respuestaId)) {
                        setErrorTeclado(`No existe ningún animal con el ID ${valor}.`);
                        return;
                    }

                    setErrorTeclado(String(obtenerMensajeErrorBackend(respuestaId)));
                    return;
                }

                const animal = respuestaId.data ?? {};
                const crotalAnimal = extraerCrotalAnimal(animal);

                if (!crotalAnimal || crotalAnimal === "0") {
                    abrirModalCrotalTeclado(valor);
                    return;
                }

                await procesarRegistroDesdeTeclado({
                    idBackend: valor,
                    crotal: crotalAnimal,
                    actualizarIdDespuesAlta: false,
                });

                return;
            }

            if (!confirmar) {
                await onEnviar(valor);
                setValorTeclado("");
                setErrorTeclado("");
                Keyboard.dismiss();
                return;
            }

            const respuestaCrotal = await obtenerLecturaEspada(valor);

            if (!respuestaCrotal.ok) {
                if (respuestaEsNoEncontrado(respuestaCrotal)) {
                    if (detectarDesconocidos && esEntrada) {
                        mostrarIdTemporal("0", "error");

                        abrirActualizacionId(
                            valor,
                            corralInput.trim() || "—"
                        );

                        setValorTeclado("");
                        return;
                    }

                    await procesarRegistroDesdeTeclado({
                        idBackend: "0",
                        crotal: valor,
                        actualizarIdDespuesAlta: false,
                    });

                    return;
                }

                setErrorTeclado(String(obtenerMensajeErrorBackend(respuestaCrotal)));
                return;
            }

            const animal = respuestaCrotal.data ?? {};
            const idAnimal = extraerIdAnimal(animal);
            const crotalAnimal = extraerCrotalAnimal(animal) || valor;

            await procesarRegistroDesdeTeclado({
                idBackend: idAnimal,
                crotal: crotalAnimal,
                actualizarIdDespuesAlta: false,
            });
        } catch (error: any) {
            setErrorTeclado(
                error?.message ||
                "No se pudo procesar el valor introducido. Revisa la conexión."
            );
        } finally {
            setProcesandoTeclado(false);
        }
    }, [
        valorTeclado,
        esSalida,
        esEntrada,
        tipoTeclado,
        confirmar,
        registrosPendientesEnvio,
        detectarDesconocidos,
        corralInput,
        extraerIdAnimal,
        extraerCrotalAnimal,
        procesarRegistroDesdeTeclado,
        abrirModalCrotalTeclado,
        abrirActualizacionId,
        onEnviar,
    ]);

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
                    limpiarMensajeBackend(String(detalle)),
                    "error"
                );
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
                t("maternityReader_alertNetworkError"),
                t("maternityReader_alertNetworkErrorMessage")
            );
        } finally {
            setActualizandoId(false);
        }
    }, [
        nuevoIdManual,
        crotalPendienteId,
        corralPendienteId,
        cerrarActualizacionId,
        t,
    ]);

    const confirmarIdentificacionAnimal = React.useCallback(async () => {
        const idManual = nuevoIdManual.trim();
        const crotalPendiente = crotalPendienteId.trim();

        if (!crotalPendiente) {
            cerrarActualizacionId();
            return;
        }

        if (!confirmar || esLectura || esBusqueda) {
            await actualizarIdAnimal();
            return;
        }

        const corralParaRegistro =
            corralPendienteId && corralPendienteId !== "—"
                ? corralPendienteId
                : corralInput.trim() || "—";

        const idParaTabla = idManual || "0";

        const idYaEstaEnLote =
            idManual !== "" &&
            registrosPendientesEnvio.some(
                (registro) =>
                    registro.idBackend !== "0" &&
                    normalizarClave(registro.idBackend) === normalizarClave(idManual)
            );

        if (idYaEstaEnLote) {
            mostrarAviso(
                "ID repetido",
                `El ID ${idManual} ya está en la tabla de registros no enviados.`,
                "warning"
            );
            return;
        }

        const registroPendiente: RegistroPendienteEnvio = {
            localId: `pendiente_${Date.now()}_${crotalPendiente}`,
            corral: corralParaRegistro,
            idBackend: idParaTabla,
            crotal: crotalPendiente,
            estado: "—",
            nave: "—",
            idPreparado: idManual,
            necesitaActualizarIdDespuesAlta: !!idManual,
            necesitaActualizarCrotalDespuesAlta: false,
            tipoMovimiento,
        };

        const agregado = await validarYAgregarRegistroPendienteEnvio(registroPendiente);

        if (!agregado) {
            setMostrarActualizarId(false);
            return;
        }

        mostrarIdTemporal(
            idParaTabla,
            idParaTabla === "0" ? "error" : "success"
        );

        cerrarActualizacionId();
    }, [
        nuevoIdManual,
        crotalPendienteId,
        corralPendienteId,
        corralInput,
        confirmar,
        esLectura,
        esBusqueda,
        tipoMovimiento,
        registrosPendientesEnvio,
        validarYAgregarRegistroPendienteEnvio,
        actualizarIdAnimal,
        cerrarActualizacionId,
    ]);

    useEffect(() => {
        pantallaActivaRef.current = pantallaEnfocada;

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
        }
    }, [pantallaEnfocada, limpiarAutoEnvioTimer]);

    useEffect(() => {
        const eventoMostrar =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

        const eventoOcultar =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const subMostrar = Keyboard.addListener(eventoMostrar, (event) => {
            setAltoTeclado(event.endCoordinates?.height ?? 0);

            if (mostrarActualizarId) {
                setTimeout(() => {
                    subirFormularioId();
                }, Platform.OS === "ios" ? 80 : 180);
            }
        });

        const subOcultar = Keyboard.addListener(eventoOcultar, () => {
            setAltoTeclado(0);
        });

        return () => {
            subMostrar.remove();
            subOcultar.remove();
        };
    }, [mostrarActualizarId, subirFormularioId]);

    useEffect(() => {
        if (!mostrarActualizarId) return;

        const timer = setTimeout(() => {
            subirFormularioId();
        }, 250);

        return () => clearTimeout(timer);
    }, [mostrarActualizarId, subirFormularioId]);

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
        const maxPagina = Math.max(0, Math.ceil(registrosTabla.length / TAM_PAGINA) - 1);
        if (pagina > maxPagina) setPagina(maxPagina);
    }, [registrosTabla.length, pagina]);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                volverAConfiguracionMaternidad();
                return true;
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );

            return () => subscription.remove();
        }, [volverAConfiguracionMaternidad])
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
                    ? soloDigitos(String(params.corral)).slice(0, 9)
                    : ""
            );

            setDetectarDesconocidos(params.detectarDesconocidos ?? true);
            setConfirmar(params.confirmar ?? true);
            setModoCaptura("lector");
            setTipoTeclado("id");
            setValorTeclado("");
            setErrorTeclado("");
            setProcesandoTeclado(false);
            setMostrarModalCrotalTeclado(false);
            setIdPendienteTeclado("");
            setCrotalManualTeclado("");
            setErrorCrotalManualTeclado("");

            setRegistrosEnviados([]);
            setRegistrosPendientesEnvio([]);
            setLoteEnviado(false);
            limpiarCrotalLeido();
            setIdRecibido("");
            setEstadoIdVisual("neutro");

            setMostrarActualizarId(false);
            setNuevoIdManual("");
            setCrotalPendienteId("");
            setCorralPendienteId("—");
            setActualizandoId(false);

            setMostrarModalCorral(false);

            setCorralTemporal("");
            setErrorCorral("");
            setRegistroPendienteTrasCorral(null);
            setValidandoCorral(false);
            setMostrarEditarRegistro(false);
            setRegistroEditando(null);
            setEditCorral("");
            setEditId("");
            setEditCrotal("");
            setEditError("");
            setValidandoEdicionRegistro(false);

            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
            }

            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            ultimoCrotalLoteRef.current = null;

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
                ultimoCrotalLoteRef.current = null;


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
        ])
    );

    useEffect(() => {
        const crotalActual = String(crotalLeido ?? "").trim();

        if (!pantallaEnfocada) return;
        if (modoCaptura !== "lector") return;

        /**
         * Solo queremos añadir automático al lote cuando:
         * - confirmar está activado
         * - no es modo lectura
         * - no es búsqueda
         */
        if (!confirmar) return;
        if (esLectura || esBusqueda) return;

        if (!crotalActual) return;

        if (estaEnviando) return;
        if (mostrarActualizarId || actualizandoId) return;

        /**
         * Evita meter el mismo crotal varias veces seguidas.
         */
        if (ultimoCrotalLoteRef.current === crotalActual) return;

        ultimoCrotalLoteRef.current = crotalActual;

        const timer = setTimeout(() => {
            onEnviar(crotalActual);
        }, 250);

        return () => {
            clearTimeout(timer);
        };
    }, [
        crotalLeido,
        pantallaEnfocada,
        confirmar,
        esLectura,
        esBusqueda,
        estaEnviando,
        mostrarActualizarId,
        actualizandoId,
        onEnviar,
        modoCaptura,
    ]);

    useEffect(() => {
        const crotalActual = (crotalLeido ?? "").trim();

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }
        if (modoCaptura !== "lector") {
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
        modoCaptura,
    ]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: BG }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <Appbar.Header
                elevated
                style={{
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderBottomColor: BORDER,
                }}
            >
                <Appbar.Action
                    icon="menu"
                    color={TEXT}
                    onPress={() => {
                        const drawerNavigation = navigation.getParent?.('RootDrawer');

                        if (drawerNavigation?.dispatch) {
                            drawerNavigation.dispatch(DrawerActions.toggleDrawer());
                            return;
                        }

                        navigation.dispatch(DrawerActions.toggleDrawer());
                    }}
                />

                <Appbar.Content
                    title={tituloHeader}
                    titleStyle={{
                        color: TEXT,
                        fontWeight: "900",
                    }}
                />
            </Appbar.Header>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom:
                        mostrarActualizarId && altoTeclado > 0
                            ? altoTeclado + 180
                            : 140,
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
                                    {t("maternityReader_animalIdLabel")} {String(animalBusqueda?.animalId ?? "—")}
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
                                onPress={volverAConfiguracionMaternidad}
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

                {!esLectura && !esBusqueda && (
                    <View
                        style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: BORDER,
                            padding: 8,
                            ...SHADOW,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            {/* Modo + Corral */}
                            <View
                                style={{
                                    flex: 1.15,
                                    minHeight: 54,
                                    borderRadius: 14,
                                    backgroundColor: "#F8FAFC",
                                    borderWidth: 1,
                                    borderColor: BORDER,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 10,
                                }}
                            >
                                {/* Modo */}
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <Ionicons
                                        name="swap-horizontal-outline"
                                        size={18}
                                        color={BRAND}
                                    />

                                    <View>
                                        <Text
                                            style={{
                                                color: MUTED,
                                                fontSize: 10,
                                                fontWeight: "800",
                                            }}
                                        >
                                            {t("maternityReader_mode")}
                                        </Text>

                                        <Text
                                            style={{
                                                color: TEXT,
                                                fontSize: 14,
                                                fontWeight: "900",
                                                marginTop: 1,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {tipoMovimiento === "entrada"
                                                ? t("maternityReader_modeEntry")
                                                : tipoMovimiento === "salida"
                                                    ? t("maternityReader_modeExit")
                                                    : t("maternityReader_modeReading")}
                                        </Text>
                                    </View>
                                </View>

                                {/* Corral solo en entrada */}
                                {esEntrada && (
                                    <>
                                        <View
                                            style={{
                                                width: 1,
                                                height: 30,
                                                backgroundColor: "#E2E8F0",
                                                marginHorizontal: 8,
                                            }}
                                        />

                                        <TouchableOpacity
                                            onPress={abrirModalCorral}
                                            activeOpacity={0.85}
                                            style={{
                                                flex: 0.8,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 8,
                                                paddingVertical: 8,
                                                borderRadius: 12,
                                            }}
                                        >
                                            <Ionicons
                                                name="home-outline"
                                                size={18}
                                                color={BRAND}
                                            />

                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={{
                                                        color: MUTED,
                                                        fontSize: 10,
                                                        fontWeight: "800",
                                                    }}
                                                >
                                                    {t("maternityReader_fieldCorral")}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: TEXT,
                                                        fontSize: 14,
                                                        fontWeight: "900",
                                                        marginTop: 1,
                                                    }}
                                                    numberOfLines={1}
                                                >
                                                    {corralInput || "—"}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name="pencil-outline"
                                                size={13}
                                                color={MUTED}
                                            />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>

                            {/* Selector Lector / Teclado */}
                            <View
                                style={{
                                    flex: 0.9,
                                    minHeight: 54,
                                    borderRadius: 14,
                                    backgroundColor: "#E5E7EB",
                                    padding: 4,
                                    flexDirection: "row",
                                    gap: 4,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        setModoCaptura("lector");
                                        setValorTeclado("");
                                        setErrorTeclado("");

                                        if (!esBusqueda && idLector) {
                                            iniciarLectura?.().catch(() => { });
                                        }
                                    }}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        borderRadius: 11,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: modoCaptura === "lector" ? BRAND : "transparent",
                                        gap: 2,
                                    }}
                                >
                                    <Ionicons
                                        name="scan-outline"
                                        size={17}
                                        color={modoCaptura === "lector" ? "#FFFFFF" : MUTED}
                                    />

                                    <Text
                                        style={{
                                            color: modoCaptura === "lector" ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                            fontSize: 12,
                                        }}
                                        numberOfLines={1}
                                    >
                                        Lector
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setModoCaptura("teclado");
                                        setTipoTeclado("id");
                                        setValorTeclado("");
                                        setErrorTeclado("");

                                        limpiarAutoEnvioTimer();
                                        limpiarCrotalLeido();

                                        ultimoCrotalAutoRef.current = null;
                                        ultimoCrotalLoteRef.current = null;

                                        detenerLectura?.().catch(() => { });
                                    }}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        borderRadius: 11,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: modoCaptura === "teclado" ? BRAND : "transparent",
                                        gap: 2,
                                    }}
                                >
                                    <Ionicons
                                        name="keypad-outline"
                                        size={17}
                                        color={modoCaptura === "teclado" ? "#FFFFFF" : MUTED}
                                    />

                                    <Text
                                        style={{
                                            color: modoCaptura === "teclado" ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                            fontSize: 12,
                                        }}
                                        numberOfLines={1}
                                    >
                                        Teclado
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {!esLectura && !esBusqueda && modoCaptura === "lector" && (
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

                {!esLectura && !esBusqueda && modoCaptura === "teclado" && (
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
                            }}
                        >
                            <Text style={{ color: TEXT, fontSize: 19, fontWeight: "900" }}>
                                Entrada manual
                            </Text>

                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                Introduce el crotal o el ID manualmente para añadirlo al lote.
                            </Text>
                        </View>

                        <View style={{ padding: 14, gap: 12 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: 10,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        setTipoTeclado("id");
                                        setValorTeclado("");
                                        setErrorTeclado("");
                                    }}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        height: 42,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: tipoTeclado === "id" ? BRAND : "#F1F5F9",
                                        borderWidth: 1,
                                        borderColor: tipoTeclado === "id" ? BRAND : BORDER,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: tipoTeclado === "id" ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                        }}
                                    >
                                        ID
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setTipoTeclado("crotal");
                                        setValorTeclado("");
                                        setErrorTeclado("");
                                    }}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        height: 42,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: tipoTeclado === "crotal" ? BRAND : "#F1F5F9",
                                        borderWidth: 1,
                                        borderColor: tipoTeclado === "crotal" ? BRAND : BORDER,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: tipoTeclado === "crotal" ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                        }}
                                    >
                                        Crotal
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                mode="outlined"
                                label={tipoTeclado === "crotal" ? "Crotal" : "ID"}
                                value={valorTeclado}
                                onChangeText={(texto) => {
                                    const soloNumeros = soloDigitos(texto);

                                    if (tipoTeclado === "crotal") {
                                        setValorTeclado(soloNumeros.slice(0, 15));
                                    } else {
                                        setValorTeclado(soloNumeros);
                                    }

                                    setErrorTeclado("");
                                }}
                                keyboardType="number-pad"
                                maxLength={tipoTeclado === "crotal" ? 15 : undefined}
                                placeholder={tipoTeclado === "crotal" ? "Ej: 982..." : "Ej: 1234"}
                                outlineColor={BRAND}
                                activeOutlineColor={BRAND}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                }}
                                outlineStyle={{
                                    borderWidth: 2,
                                    borderRadius: 14,
                                }}
                                textColor={TEXT}
                                placeholderTextColor={MUTED}
                                disabled={procesandoTeclado || estaEnviando}
                            />

                            {!!errorTeclado && (
                                <Text
                                    style={{
                                        color: DANGER,
                                        fontSize: 13,
                                        lineHeight: 18,
                                        fontWeight: "800",
                                        textAlign: "center",
                                    }}
                                >
                                    {errorTeclado}
                                </Text>
                            )}

                            <TouchableOpacity
                                onPress={procesarEntradaTeclado}
                                disabled={procesandoTeclado || estaEnviando}
                                activeOpacity={0.9}
                                style={{
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    gap: 8,
                                    backgroundColor:
                                        procesandoTeclado || estaEnviando ? "#A5B4FC" : BRAND,
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />

                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    {procesandoTeclado || estaEnviando
                                        ? "Procesando..."
                                        : "Añadir"}
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
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                    }}
                                >
                                    <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
                                        {tituloTablaRegistros}
                                    </Text>

                                    <View
                                        style={{
                                            minWidth: 36,
                                            height: 30,
                                            paddingHorizontal: 10,
                                            borderRadius: 999,
                                            backgroundColor: totalRegistrosTabla > 0 ? BRAND : "#E5E7EB",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: totalRegistrosTabla > 0 ? "#FFFFFF" : MUTED,
                                                fontWeight: "900",
                                                fontSize: 14,
                                            }}
                                        >
                                            {totalRegistrosTabla}
                                        </Text>
                                    </View>
                                </View>

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
                            ) : registrosTabla.length > TAM_PAGINA && (
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
                            {hayRegistros && !esLectura && esEntrada && (
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

                            {hayRegistros && esSalida && (
                                <LineaVerticalTabla
                                    left={PADDING_TABLA_X + ANCHO_ID + ESPACIO_ID_CROTAL_SALIDA / 2}
                                />
                            )}

                            {esLectura ? (
                                <View style={{ padding: 14, gap: 12 }}>
                                    {registrosTabla.length === 0 ? (
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

                                    {registrosTabla.length === 0 ? (
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ color: MUTED }}>
                                                {t("maternityReader_noRecords")}
                                            </Text>
                                        </View>
                                    ) : (
                                        pageItems.map((r, idx) => (
                                            <TouchableOpacity
                                                key={r.localId}
                                                onPress={() => abrirEditarRegistro(r as RegistroPendienteEnvio)}
                                                disabled={!mostrandoPendientesEnvio}
                                                activeOpacity={mostrandoPendientesEnvio ? 0.85 : 1}
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
                                            </TouchableOpacity>
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

                                    {registrosTabla.length === 0 ? (
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ color: MUTED }}>
                                                {t("maternityReader_noRecords")}
                                            </Text>
                                        </View>
                                    ) : (
                                        pageItems.map((r, idx) => (
                                            <TouchableOpacity
                                                key={r.localId}
                                                onPress={() => abrirEditarRegistro(r as RegistroPendienteEnvio)}
                                                disabled={!mostrandoPendientesEnvio}
                                                activeOpacity={mostrandoPendientesEnvio ? 0.85 : 1}
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
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {!esBusqueda && !esLectura && confirmar && (
                    <View style={{ marginTop: 12, gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 10,
                            }}
                        >
                            <TouchableOpacity
                                onPress={cancelarLotePendiente}
                                disabled={estaEnviando || registrosPendientesEnvio.length === 0}
                                activeOpacity={0.9}
                                style={{
                                    flex: 0.9,
                                    height: 46,
                                    borderRadius: 14,
                                    backgroundColor:
                                        estaEnviando || registrosPendientesEnvio.length === 0
                                            ? "#E5E7EB"
                                            : "#FEE2E2",
                                    borderWidth: 1,
                                    borderColor:
                                        estaEnviando || registrosPendientesEnvio.length === 0
                                            ? "#CBD5E1"
                                            : "#FECACA",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color:
                                            estaEnviando || registrosPendientesEnvio.length === 0
                                                ? MUTED
                                                : DANGER,
                                        fontWeight: "900",
                                        fontSize: 15,
                                    }}
                                >
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={enviarLotePendientes}
                                disabled={estaEnviando || registrosPendientesEnvio.length === 0}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1.4,
                                    height: 46,
                                    borderRadius: 14,
                                    backgroundColor:
                                        estaEnviando
                                            ? "#A5B4FC"
                                            : registrosPendientesEnvio.length === 0
                                                ? "#CBD5E1"
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
                                    {estaEnviando
                                        ? "Enviando lote..."
                                        : registrosPendientesEnvio.length > 0
                                            ? `Enviar lote (${registrosPendientesEnvio.length})`
                                            : "Enviar lote"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={mostrarEditarRegistro}
                transparent
                animationType="fade"
                onRequestClose={cancelarEditarRegistro}
            >
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 27,
                                    backgroundColor: "#EEF2FF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={28}
                                    color={BRAND}
                                />
                            </View>

                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "900",
                                    color: TEXT,
                                    textAlign: "center",
                                }}
                            >
                                Editar registro
                            </Text>

                            <Text
                                style={{
                                    marginTop: 8,
                                    color: MUTED,
                                    fontSize: 15,
                                    lineHeight: 22,
                                    textAlign: "center",
                                }}
                            >
                                Modifica los datos antes de enviar el lote.
                            </Text>
                        </View>

                        {registroEditando?.tipoMovimiento === "entrada" && (
                            <TextInput
                                mode="outlined"
                                label="Corral"
                                value={editCorral}
                                onChangeText={(texto) => {
                                    const soloNumeros = soloDigitos(texto).slice(0, 9);

                                    setEditCorral(soloNumeros);
                                    setEditError("");
                                }}
                                keyboardType="number-pad"
                                maxLength={9}
                                placeholder="Ej: 1"
                                outlineColor={BRAND}
                                activeOutlineColor={BRAND}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    marginBottom: 12,
                                }}
                                outlineStyle={{
                                    borderWidth: 2,
                                    borderRadius: 14,
                                }}
                                textColor={TEXT}
                                placeholderTextColor={MUTED}
                                disabled={validandoEdicionRegistro}
                            />
                        )}

                        <TextInput
                            mode="outlined"
                            label="ID"
                            value={editId}
                            onChangeText={(texto) => {
                                setEditId(texto);
                                setEditError("");
                            }}
                            placeholder="Ej: 1234"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            outlineColor={BRAND}
                            activeOutlineColor={BRAND}
                            style={{
                                backgroundColor: "#FFFFFF",
                                marginBottom: 12,
                            }}
                            outlineStyle={{
                                borderWidth: 2,
                                borderRadius: 14,
                            }}
                            textColor={TEXT}
                            placeholderTextColor={MUTED}
                            disabled={validandoEdicionRegistro}
                        />

                        <TextInput
                            mode="outlined"
                            label="Crotal"
                            value={editCrotal}
                            onChangeText={(texto) => {
                                setEditCrotal(soloDigitos(texto));
                                setEditError("");
                            }}
                            keyboardType="number-pad"
                            placeholder="Ej: 982..."
                            outlineColor={BRAND}
                            activeOutlineColor={BRAND}
                            style={{
                                backgroundColor: "#FFFFFF",
                            }}
                            outlineStyle={{
                                borderWidth: 2,
                                borderRadius: 14,
                            }}
                            textColor={TEXT}
                            placeholderTextColor={MUTED}
                            disabled={validandoEdicionRegistro}
                        />

                        {!!editError && (
                            <Text
                                style={{
                                    marginTop: 10,
                                    color: DANGER,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    fontWeight: "800",
                                    textAlign: "center",
                                }}
                            >
                                {editError}
                            </Text>
                        )}

                        <View style={{ marginTop: 20, gap: 12 }}>
                            <TouchableOpacity
                                onPress={eliminarRegistroPendiente}
                                disabled={validandoEdicionRegistro}
                                activeOpacity={0.9}
                                style={{
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "row",
                                    gap: 8,
                                    backgroundColor: "#FEE2E2",
                                    borderWidth: 1,
                                    borderColor: "#FECACA",
                                }}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color={DANGER}
                                />

                                <Text
                                    style={{
                                        color: DANGER,
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    Eliminar registro
                                </Text>
                            </TouchableOpacity>

                            <View
                                style={{
                                    flexDirection: "row",
                                    gap: 12,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={cancelarEditarRegistro}
                                    disabled={validandoEdicionRegistro}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        height: 46,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "#E5E7EB",
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: TEXT,
                                            fontWeight: "900",
                                            fontSize: 16,
                                        }}
                                    >
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={guardarEdicionRegistro}
                                    disabled={validandoEdicionRegistro}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        height: 46,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: validandoEdicionRegistro ? "#A5B4FC" : BRAND,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "white",
                                            fontWeight: "900",
                                            fontSize: 16,
                                        }}
                                    >
                                        {validandoEdicionRegistro ? "Validando..." : "Guardar"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={mostrarModalCrotalTeclado}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!procesandoTeclado) {
                        cancelarModalCrotalTeclado();
                    }
                }}
            >
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                        <View style={{ alignItems: "center", marginBottom: 16 }}>
                            <View
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 27,
                                    backgroundColor: "#EEF2FF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons name="barcode-outline" size={28} color={BRAND} />
                            </View>

                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "900",
                                    color: TEXT,
                                    textAlign: "center",
                                }}
                            >
                                ID sin crotal
                            </Text>

                            <Text
                                style={{
                                    marginTop: 8,
                                    color: MUTED,
                                    fontSize: 15,
                                    lineHeight: 22,
                                    textAlign: "center",
                                }}
                            >
                                El ID {idPendienteTeclado || "—"} no tiene crotal asociado.
                                Puedes escribir uno o dejarlo vacío para añadirlo con crotal 0.
                            </Text>
                        </View>

                        <TextInput
                            mode="outlined"
                            label="Número crotal"
                            value={crotalManualTeclado}
                            onChangeText={(texto) => {
                                setCrotalManualTeclado(soloDigitos(texto).slice(0, 15));
                                setErrorCrotalManualTeclado("");
                            }}
                            maxLength={15}
                            keyboardType="number-pad"
                            placeholder="Vacío = crotal 0"
                            outlineColor={BRAND}
                            activeOutlineColor={BRAND}
                            style={{ backgroundColor: "#FFFFFF" }}
                            outlineStyle={{ borderRadius: 14, borderWidth: 2 }}
                            textColor={TEXT}
                            placeholderTextColor={MUTED}
                            disabled={procesandoTeclado}
                        />

                        {!!errorCrotalManualTeclado && (
                            <Text
                                style={{
                                    marginTop: 10,
                                    color: DANGER,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    fontWeight: "800",
                                    textAlign: "center",
                                }}
                            >
                                {errorCrotalManualTeclado}
                            </Text>
                        )}

                        <View
                            style={{
                                flexDirection: "row",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={cancelarModalCrotalTeclado}
                                disabled={procesandoTeclado}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#E5E7EB",
                                }}
                            >
                                <Text
                                    style={{
                                        color: TEXT,
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={aceptarModalCrotalTeclado}
                                disabled={procesandoTeclado}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: procesandoTeclado ? "#A5B4FC" : BRAND,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    {procesandoTeclado ? "Validando..." : "Aceptar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={mostrarModalCorral}
                transparent
                animationType="fade"
                onRequestClose={cancelarModalCorral}
            >
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 27,
                                    backgroundColor: "#EEF2FF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons
                                    name="home-outline"
                                    size={28}
                                    color={BRAND}
                                />
                            </View>

                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "900",
                                    color: TEXT,
                                    textAlign: "center",
                                }}
                            >
                                Cambiar corral
                            </Text>

                            <Text
                                style={{
                                    marginTop: 8,
                                    color: MUTED,
                                    fontSize: 15,
                                    lineHeight: 22,
                                    textAlign: "center",
                                }}
                            >
                                Escribe el corral desde el que quieres continuar leyendo animales.
                            </Text>
                        </View>

                        <TextInput
                            mode="outlined"
                            label="Corral"
                            value={corralTemporal}
                            onChangeText={(texto) => {
                                const soloNumeros = soloDigitos(texto).slice(0, 9);

                                setCorralTemporal(soloNumeros);
                                setErrorCorral("");
                            }}
                            keyboardType="number-pad"
                            maxLength={9}
                            placeholder="Ej: 1"
                            autoFocus
                            outlineColor={BRAND}
                            activeOutlineColor={BRAND}
                            style={{
                                backgroundColor: "#FFFFFF",
                            }}
                            outlineStyle={{
                                borderWidth: 2,
                                borderRadius: 14,
                            }}
                            textColor={TEXT}
                            placeholderTextColor={MUTED}
                            disabled={validandoCorral}
                        />

                        {!!errorCorral && (
                            <Text
                                style={{
                                    marginTop: 10,
                                    color: DANGER,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    fontWeight: "800",
                                    textAlign: "center",
                                }}
                            >
                                {errorCorral}
                            </Text>
                        )}

                        <View
                            style={{
                                flexDirection: "row",
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={cancelarModalCorral}
                                disabled={validandoCorral}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#E5E7EB",
                                }}
                            >
                                <Text
                                    style={{
                                        color: TEXT,
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={aceptarModalCorral}
                                disabled={validandoCorral}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: validandoCorral ? "#A5B4FC" : BRAND,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "white",
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    {validandoCorral ? "Validando..." : "Aceptar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={!esBusqueda && mostrarActualizarId}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!actualizandoId) {
                        cerrarActualizacionId();
                    }
                }}
            >
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(15, 23, 42, 0.45)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 54,
                                    height: 54,
                                    borderRadius: 27,
                                    backgroundColor: "#FEF2F2",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 12,
                                }}
                            >
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={28}
                                    color={DANGER}
                                />
                            </View>

                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "900",
                                    color: TEXT,
                                    textAlign: "center",
                                }}
                            >
                                {t("maternityReader_animalWithoutIdTitle")}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 8,
                                    color: MUTED,
                                    fontSize: 15,
                                    lineHeight: 22,
                                    textAlign: "center",
                                }}
                            >
                                {t("maternityReader_animalWithoutIdDescription")}
                            </Text>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#F8FAFC",
                                borderWidth: 1,
                                borderColor: BORDER,
                                borderRadius: 16,
                                padding: 14,
                                marginBottom: 14,
                            }}
                        >
                            <Text
                                style={{
                                    color: MUTED,
                                    fontWeight: "800",
                                    fontSize: 13,
                                    marginBottom: 4,
                                }}
                            >
                                {t("maternityReader_animalCrotalLabel")}
                            </Text>

                            <Text
                                style={{
                                    color: TEXT,
                                    fontWeight: "900",
                                    fontSize: 18,
                                }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {formatearCrotalVisual(crotalPendienteId || "—")}
                            </Text>
                        </View>

                        <TextInput
                            mode="outlined"
                            label={t("maternityReader_newIdLabel")}
                            value={nuevoIdManual}
                            onChangeText={setNuevoIdManual}
                            placeholder={t("maternityReader_newIdPlaceholder")}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            outlineColor={DANGER}
                            activeOutlineColor={DANGER}
                            style={{
                                backgroundColor: "#FFFFFF",
                            }}
                            outlineStyle={{
                                borderWidth: 2,
                                borderRadius: 14,
                            }}
                            textColor={TEXT}
                            placeholderTextColor="#B91C1C"
                        />

                        <TouchableOpacity
                            onPress={confirmarIdentificacionAnimal}
                            disabled={actualizandoId}
                            activeOpacity={0.9}
                            style={{
                                marginTop: 18,
                                height: 46,
                                borderRadius: 14,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: actualizandoId ? "#A5B4FC" : BRAND,
                            }}
                        >
                            <Text
                                style={{
                                    color: "white",
                                    fontWeight: "900",
                                    fontSize: 16,
                                }}
                            >
                                {actualizandoId
                                    ? "Validando..."
                                    : confirmar && !esLectura && !esBusqueda
                                        ? "Aceptar"
                                        : t("maternityReader_updateId")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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