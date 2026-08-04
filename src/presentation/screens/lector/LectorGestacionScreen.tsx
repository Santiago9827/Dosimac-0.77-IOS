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
import { useAwrConn } from "../../../stores/awrConnStore";
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { Appbar, Switch, TextInput } from "react-native-paper";
import { obtenerLecturaEspada, formatearSoloFecha, postActualizarId, obtenerAnimalPorId } from "../../routes/obtenerLecturaEspada";
import { construirEndpointEspada } from "../../../stores/apiConfig";
import { useTranslation } from "react-i18next";
import { traducirEstadoAnimal } from "../../hooks/traducirEstadoAnimal";
import { formatearCrotalVisual } from "../../hooks/formatearCrotalVisual";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";
import { IndicadorConexionAnimado } from "../../components/IndicadorConexionAnimado";
import {
    enviarEntradaGestacion,
    enviarSalidaGestacionPorId,
    consultarCorralGestacion,
} from "../../../stores/apiApp";
import { useLectorCrotales } from "../../../stores/useLectorCrotales";

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
type EstadoIdVisual = "neutro" | "success" | "error";
type ModoCaptura = "lectura" | "teclado";
type TipoTeclado = "id" | "crotal";
type MetodoEnvioGestacion = "crotal" | "id";

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
export const LectorGestacionScreen = () => {
    const parseNumeroSeguro = (txt: string) => {
        const n = Number(txt);
        return Number.isFinite(n) ? n : null;
    };
    const soloDigitos = (texto: string) =>
        texto.replace(/[^0-9]/g, "");

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
    const scrollRef = useRef<ScrollView | null>(null);
    const formularioIdYRef = useRef(0);

    const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoEnvioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ultimoCrotalAutoRef = useRef<string | null>(null);
    const [modoCaptura, setModoCaptura] = useState<ModoCaptura>("lectura");
    const [tipoTeclado, setTipoTeclado] = useState<TipoTeclado>("id");
    const [valorTeclado, setValorTeclado] = useState("");
    const [errorTeclado, setErrorTeclado] = useState("");
    const [procesandoTeclado, setProcesandoTeclado] = useState(false);
    const estaEnModoTeclado = modoCaptura === "teclado";

    const [altoTeclado, setAltoTeclado] = useState(0);

    const [avisoVisible, setAvisoVisible] = useState(false);
    const [avisoTitulo, setAvisoTitulo] = useState("");
    const [avisoMensaje, setAvisoMensaje] = useState("");
    const [avisoTipo, setAvisoTipo] = useState<"warning" | "error" | "info">("info");

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

    const [detectarDesconocidos, setDetectarDesconocidos] = useState(true);
    const [confirmar, setConfirmar] = useState(true);

    const [corralInput, setCorralInput] = useState("");
    const [modalCorralVisible, setModalCorralVisible] = useState(false);
    const [corralTemporal, setCorralTemporal] = useState("");
    const [errorCorralModal, setErrorCorralModal] = useState("");
    const [validandoCorralModal, setValidandoCorralModal] = useState(false);

    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");
    type RegistroPendienteGestacion = RegistroEnviado & {
        tipoMovimiento: "entrada" | "salida";
        metodoEnvio: MetodoEnvioGestacion;
    };

    const [registrosPendientesEnvio, setRegistrosPendientesEnvio] =
        useState<RegistroPendienteGestacion[]>([]);

    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [estaEnviando, setEstaEnviando] = useState(false);

    const [idRecibido, setIdRecibido] = useState("");
    const [estadoIdVisual, setEstadoIdVisual] = useState<EstadoIdVisual>("neutro");

    const [pagina, setPagina] = useState(0);

    const [mostrarActualizarId, setMostrarActualizarId] = useState(false);
    const [nuevoIdManual, setNuevoIdManual] = useState("");
    const [crotalPendienteId, setCrotalPendienteId] = useState("");
    const [corralPendienteId, setCorralPendienteId] = useState("—");
    const [actualizandoId, setActualizandoId] = useState(false);

    const route = useRoute<any>();

    const modoParam = route.params?.modo ?? "entrada";
    const corralParam = route.params?.corral ?? "";
    const detectarParam = route.params?.detectarDesconocidos ?? true;
    const confirmarParam = route.params?.confirmar ?? true;
    const animalEncontradoParam = route.params?.animalEncontrado ?? null;
    const animalBusqueda = animalEncontradoParam ?? null;

    const esTituloLectura =
        modoParam === "lectura" || modoParam === "busqueda";

    const tituloHeader = esTituloLectura
        ? t("Reader_readingTitle")
        : t("gestationReader_screenTitle");

    const esEntrada = tipoMovimiento === "entrada";
    const esSalida = tipoMovimiento === "salida";
    const esLectura = tipoMovimiento === "lectura";
    const esBusqueda = tipoMovimiento === "busqueda";

    const requiereCorral = esEntrada;
    const usaEnvioAutomatico = !esBusqueda && (esLectura || !confirmar);
    const tiempoAutoEnvioMs = esLectura ? 300 : 1000;

    const mostrandoPendientesEnvio =
        confirmar &&
        !esLectura &&
        !esBusqueda;

    const registrosTabla = mostrandoPendientesEnvio
        ? registrosPendientesEnvio
        : registrosEnviados;

    const tituloTablaRegistros = mostrandoPendientesEnvio
        ? t("gestationReader_pendingRecordsTitle")
        : !confirmar && !esLectura && !esBusqueda
            ? t("gestationReader_sentHistoryTitle")
            : t("gestationReader_sentRecordsTitle");
    const totalPaginas = Math.max(
        1,
        Math.ceil(registrosTabla.length / TAM_PAGINA)
    );

    const totalRegistrosTabla = registrosTabla.length;
    const hayRegistros = registrosTabla.length > 0;

    const itemsPagina = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosTabla.slice(start, start + TAM_PAGINA);
    }, [registrosTabla, pagina]);

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

    const limpiarAutoEnvioTimer = React.useCallback(() => {
        if (autoEnvioTimerRef.current) {
            clearTimeout(autoEnvioTimerRef.current);
            autoEnvioTimerRef.current = null;
        }
    }, []);
    const cambiarModoCaptura = React.useCallback(
        (nuevoModo: ModoCaptura) => {
            if (modoCaptura === nuevoModo) return;

            setModoCaptura(nuevoModo);

            setTipoTeclado("id");
            setValorTeclado("");
            setErrorTeclado("");
            setProcesandoTeclado(false);

            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;

            limpiarCrotalLeido();

            setIdRecibido("");
            setEstadoIdVisual("neutro");

            if (timerIdRef.current) {
                clearTimeout(timerIdRef.current);
                timerIdRef.current = null;
            }

            if (nuevoModo === "teclado") {
                detenerLectura?.().catch(() => { });
                Keyboard.dismiss();
                return;
            }

            if (!esBusqueda && idLector) {
                iniciarLectura?.().catch(() => { });
            }
        },
        [
            modoCaptura,
            esBusqueda,
            idLector,
            iniciarLectura,
            detenerLectura,
            limpiarCrotalLeido,
            limpiarAutoEnvioTimer,
        ]
    );

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

    const volverAConfiguracionGestacion = React.useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }

        navigation.navigate("AjustesEnvioGestacion");
    }, [navigation]);
    const subirFormularioId = React.useCallback(() => {
        const yFormulario = Math.max(formularioIdYRef.current - 80, 0);

        scrollRef.current?.scrollTo({
            y: yFormulario,
            animated: true,
        });
    }, []);

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

        if (!esBusqueda && idLector) {
            iniciarLectura?.().catch(() => { });
        }
    }, [
        esBusqueda,
        idLector,
        iniciarLectura,
        limpiarCrotalLeido,
    ]);

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

    const abrirModalCorral = React.useCallback(() => {
        if (!esEntrada) return;

        Keyboard.dismiss();
        setCorralTemporal(soloDigitos(corralInput).slice(0, 9));
        setErrorCorralModal("");
        setModalCorralVisible(true);
    }, [esEntrada, corralInput]);
    const obtenerMensajeErrorCorralGestacion = (respuesta: any) => {
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

    const esCorralGestacionNoExiste = (respuesta: any) => {
        const mensaje = String(
            obtenerMensajeErrorCorralGestacion(respuesta) ?? "",
        )
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "");

        return (
            respuesta?.status === 400 ||
            respuesta?.status === 404 ||
            mensaje.includes("numerodecorral") ||
            mensaje.includes("notvalid") ||
            mensaje.includes("thecorraldoesnotexist") ||
            mensaje.includes("corralnoexiste")
        );
    };

    const cerrarModalCorral = React.useCallback(() => {
        setModalCorralVisible(false);
        setCorralTemporal("");
        setErrorCorralModal("");
        setValidandoCorralModal(false);
    }, []);
    const guardarCorralModal = React.useCallback(async () => {
        const corralLimpio = soloDigitos(corralTemporal).slice(0, 9);
        const corralNumero = Number(corralLimpio);

        setErrorCorralModal("");

        if (
            !corralLimpio ||
            !Number.isFinite(corralNumero) ||
            corralNumero <= 0
        ) {
            setErrorCorralModal(
                t("gestationReader_alertMissingCorralMessage"),
            );
            return;
        }

        try {
            setValidandoCorralModal(true);

            const respuesta = await consultarCorralGestacion(corralLimpio);

            if (!respuesta.ok) {
                if (esCorralGestacionNoExiste(respuesta)) {
                    setErrorCorralModal("El corral no existe");
                    return;
                }

                setErrorCorralModal(
                    limpiarMensajeBackend(
                        String(obtenerMensajeErrorCorralGestacion(respuesta)),
                    ),
                );

                return;
            }

            setCorralInput(corralLimpio);
            setModalCorralVisible(false);
            setCorralTemporal("");
            setErrorCorralModal("");

            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            limpiarCrotalLeido();
        } catch {
            setErrorCorralModal(
                "No se pudo validar el corral. Revisa la conexión con el servidor.",
            );
        } finally {
            setValidandoCorralModal(false);
        }
    }, [
        corralTemporal,
        limpiarAutoEnvioTimer,
        limpiarCrotalLeido,
        t,
    ]);
    const traducirEstadosEnMensaje = (
        mensaje: string,
        tFunction: (clave: string) => string
    ) => {
        if (!mensaje) return "";

        return mensaje.replace(
            /\b(gestation|out_of_gestation|maternity|out_of_maternity)\b/g,
            (estado) => traducirEstadoAnimal(estado, tFunction)
        );
    };
    const crearRegistroDesdeAnimal = React.useCallback(
        (
            animal: any,
            idIntroducido: string,
            metodoEnvio: MetodoEnvioGestacion
        ): RegistroPendienteGestacion => {
            const idAnimal =
                animal?.animalId !== null &&
                    animal?.animalId !== undefined &&
                    String(animal.animalId).trim() !== ""
                    ? String(animal.animalId)
                    : idIntroducido;

            const crotalAnimal =
                animal?.crotal !== null &&
                    animal?.crotal !== undefined &&
                    String(animal.crotal).trim() !== ""
                    ? String(animal.crotal)
                    : "0";

            const corralAnimal =
                esEntrada
                    ? corralInput.trim() || "—"
                    : animal?.corralName !== null &&
                        animal?.corralName !== undefined &&
                        String(animal.corralName).trim() !== ""
                        ? String(animal.corralName)
                        : "—";

            const estadoAnimal =
                animal?.state !== null &&
                    animal?.state !== undefined &&
                    String(animal.state).trim() !== ""
                    ? String(animal.state)
                    : "—";

            const naveAnimal =
                animal?.houseName !== null &&
                    animal?.houseName !== undefined &&
                    String(animal.houseName).trim() !== ""
                    ? String(animal.houseName)
                    : "—";

            return {
                localId: `gestacion_${Date.now()}_${idAnimal}_${crotalAnimal}`,
                corral: corralAnimal,
                idBackend: idAnimal,
                crotal: crotalAnimal,
                estado: estadoAnimal,
                nave: naveAnimal,
                tipoMovimiento: esEntrada ? "entrada" : "salida",
                metodoEnvio,
            };
        },
        [
            esEntrada,
            corralInput,
        ]
    );

    const agregarRegistroPendiente = React.useCallback(
        (registro: RegistroPendienteGestacion) => {
            setRegistrosPendientesEnvio((anteriores) => {
                const idRepetido = anteriores.some(
                    (item) =>
                        item.idBackend !== "0" &&
                        normalizarClave(item.idBackend) ===
                        normalizarClave(registro.idBackend)
                );

                if (idRepetido) {
                    setErrorTeclado(
                        t("gestationReader_duplicateIdPending", {
                            id: registro.idBackend,
                        })
                    );

                    return anteriores;
                }

                const crotalRepetido =
                    registro.crotal !== "0" &&
                    anteriores.some(
                        (item) =>
                            item.crotal !== "0" &&
                            normalizarClave(item.crotal) ===
                            normalizarClave(registro.crotal)
                    );

                if (crotalRepetido) {
                    setErrorTeclado(
                        t("gestationReader_duplicateCrotalPending", {
                            crotal: registro.crotal,
                        })
                    );

                    return anteriores;
                }

                return [
                    registro,
                    ...anteriores,
                ];
            });

            setPagina(0);
        },
        [t]
    );

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
        pantallaActivaRef.current = pantallaEnfocada;

        if (!pantallaEnfocada) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
        }
    }, [pantallaEnfocada, limpiarAutoEnvioTimer]);

    useEffect(() => {
        const maxPagina = Math.max(
            0,
            Math.ceil(registrosTabla.length / TAM_PAGINA) - 1
        );

        if (pagina > maxPagina) {
            setPagina(maxPagina);
        }
    }, [registrosTabla.length, pagina]);

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

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                volverAConfiguracionGestacion();
                return true;
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );

            return () => subscription.remove();
        }, [volverAConfiguracionGestacion])
    );

    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            setRegistrosEnviados([]);
            setRegistrosPendientesEnvio([]);

            setModoCaptura("lectura");
            setTipoTeclado("id");
            setValorTeclado("");
            setErrorTeclado("");
            setProcesandoTeclado(false);

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
            setModalCorralVisible(false);
            setCorralTemporal("");

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

    const enviarRegistro = React.useCallback(async (crotalForzado?: string) => {
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
                            upsertRegistroPorCrotal(prev, "—", String(crotalNum), "—", "—", "—")
                        );
                        return;
                    }

                    const detalle =
                        (respuesta.data && (respuesta.data.message || respuesta.data.error)) ||
                        respuesta.rawText ||
                        `HTTP ${respuesta.status}`;

                    mostrarAviso(
                        t("gestationReader_alertReadErrorTitle"),
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
                    t("gestationReader_alertNetworkError"),
                    t("gestationReader_alertNetworkErrorMessage"),
                    "error"
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
                    const mensajeLimpio = limpiarMensajeBackend(String(detalle));
                    const mensajeTraducido = traducirEstadosEnMensaje(mensajeLimpio, t);

                    mostrarAviso(
                        t("gestationReader_alertWarning"),
                        mensajeTraducido,
                        "warning"
                    );
                    return;
                }

                mostrarAviso(
                    t("gestationReader_alertSendErrorTitle"),
                    limpiarMensajeBackend(String(detalle)),
                    "error"
                );
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
    }, [
        actualizandoId,
        abrirActualizacionId,
        cerrarActualizacionId,
        corralInput,
        crotalLeido,
        esLectura,
        esSalida,
        limpiarAutoEnvioTimer,
        limpiarCrotalLeido,
        mostrarActualizarId,
        requiereCorral,
        t,
    ]);


    const enviarUnRegistroPendiente = React.useCallback(
        async (
            registro: RegistroPendienteGestacion
        ): Promise<RegistroEnviado> => {
            const esEntradaRegistro =
                registro.tipoMovimiento === "entrada";

            const idRegistro = String(registro.idBackend || "").trim();
            const crotalRegistro = String(registro.crotal || "").trim();
            const corralRegistro = String(registro.corral || "").trim();

            if (registro.metodoEnvio === "id") {
                if (
                    !idRegistro ||
                    idRegistro === "—" ||
                    idRegistro === "0"
                ) {
                    throw new Error(t("gestationReader_invalidAnimalId"));
                }

                if (esEntradaRegistro) {
                    const corralNumero = Number(corralRegistro);

                    if (
                        !Number.isFinite(corralNumero) ||
                        corralNumero <= 0
                    ) {
                        throw new Error(t("gestationReader_invalidPenRecord"));
                    }

                    await enviarEntradaGestacion({
                        id: idRegistro,
                        corral: corralNumero,
                    });
                } else {
                    await enviarSalidaGestacionPorId(idRegistro);
                }
            } else {
                const crotalNumero = Number(crotalRegistro);

                if (
                    !Number.isFinite(crotalNumero) ||
                    crotalNumero <= 0
                ) {
                    throw new Error(t("gestationReader_invalidCrotalRecord"));
                }

                const endpoint = await construirEndpointEspada(
                    esEntradaRegistro
                        ? "gestation"
                        : "gestation/exit"
                );

                const payload = esEntradaRegistro
                    ? {
                        corral: Number(corralRegistro),
                        crotal: crotalNumero,
                    }
                    : {
                        crotal: crotalNumero,
                    };

                const respuesta = await postGestation(
                    endpoint,
                    payload
                );

                if (!respuesta.ok) {
                    const detalle =
                        respuesta.data?.message ??
                        respuesta.data?.mensaje ??
                        respuesta.data?.error ??
                        respuesta.rawText ??
                        `HTTP ${respuesta.status}`;

                    throw new Error(
                        traducirEstadosEnMensaje(
                            limpiarMensajeBackend(String(detalle)),
                            t
                        )
                    );
                }
            }

            return {
                localId: `enviado_${Date.now()}_${registro.localId}`,
                corral: registro.corral,
                idBackend: registro.idBackend,
                crotal: registro.crotal,
                estado: registro.estado,
                nave: registro.nave,
            };
        },
        [t]
    );

    const enviarLotePendientes = React.useCallback(async () => {
        if (registrosPendientesEnvio.length === 0) {
            mostrarAviso(
                t("gestationReader_noPendingRecordsTitle"),
                t("gestationReader_noPendingRecordsText"),
                "info"
            );
            return;
        }

        try {
            setEstaEnviando(true);
            setErrorTeclado("");

            const enviadosCorrectamente: RegistroEnviado[] = [];
            const noEnviados: RegistroPendienteGestacion[] = [];
            const erroresLote: string[] = [];

            for (const registro of registrosPendientesEnvio) {
                try {
                    const registroEnviado =
                        await enviarUnRegistroPendiente(registro);

                    enviadosCorrectamente.push(registroEnviado);
                } catch (error: any) {
                    const mensajeError =
                        error?.message ||
                        error?.toString?.() ||
                        "Error desconocido";

                    console.log("Error enviando registro pendiente:", {
                        registro,
                        error,
                        mensajeError,
                    });

                    erroresLote.push(
                        `• Corral ${registro.corral} | ID ${registro.idBackend} | Crotal ${registro.crotal}: ${mensajeError}`
                    );

                    noEnviados.push(registro);
                }
            }

            if (enviadosCorrectamente.length > 0) {
                setRegistrosEnviados((anteriores) => {
                    let nuevos = anteriores;

                    enviadosCorrectamente.forEach((registro) => {
                        nuevos = upsertRegistroPorCrotal(
                            nuevos,
                            registro.corral,
                            registro.crotal,
                            registro.idBackend,
                            registro.estado,
                            registro.nave
                        );
                    });

                    return nuevos;
                });
            }

            setRegistrosPendientesEnvio(noEnviados);
            setPagina(0);

            if (erroresLote.length > 0) {
                mostrarAviso(
                    t("gestationReader_batchWithErrorsTitle"),
                    erroresLote.join("\n"),
                    "warning"
                );
                return;
            }

            mostrarAviso(
                t("gestationReader_batchSentTitle"),
                t("gestationReader_batchSentText", {
                    count: enviadosCorrectamente.length,
                }),
                "info"
            );
        } catch (error: any) {
            mostrarAviso(
                t("gestationReader_alertSendErrorTitle"),
                error?.message ||
                t("gestationReader_alertNetworkErrorMessage"),
                "error"
            );
        } finally {
            setEstaEnviando(false);
        }
    }, [
        registrosPendientesEnvio,
        enviarUnRegistroPendiente,
        t,
    ]);

    const onEnviar = () => {
        if (esLectura) return;

        if (mostrandoPendientesEnvio) {
            enviarLotePendientes();
            return;
        }

        if (!confirmar) return;

        enviarRegistro();
    };

    const agregarDesdeTeclado = React.useCallback(async () => {
        const valorEscrito =
            tipoTeclado === "crotal"
                ? soloDigitos(valorTeclado).slice(0, 15)
                : soloDigitos(valorTeclado);
        if (!valorEscrito) {
            setErrorTeclado(
                tipoTeclado === "id"
                    ? t("gestationReader_keyboardMissingId")
                    : t("gestationReader_keyboardMissingCrotal")
            );
            return;
        }

        if (esEntrada) {
            const corralNumero = Number(corralInput);

            if (
                !corralInput.trim() ||
                !Number.isFinite(corralNumero) ||
                corralNumero <= 0
            ) {
                setErrorTeclado(
                    t("gestationReader_keyboardMissingPen")
                );
                return;
            }
        }

        try {
            setProcesandoTeclado(true);
            setErrorTeclado("");

            let registro: RegistroPendienteGestacion;

            if (tipoTeclado === "id") {
                const respuestaAnimal =
                    await obtenerAnimalPorId(valorEscrito);

                if (!respuestaAnimal.ok) {
                    const detalle =
                        respuestaAnimal.data?.message ??
                        respuestaAnimal.data?.mensaje ??
                        respuestaAnimal.data?.error ??
                        respuestaAnimal.rawText ??
                        t("gestationReader_noAnimalById", {
                            id: valorEscrito,
                        })

                    setErrorTeclado(
                        limpiarMensajeBackend(String(detalle))
                    );

                    return;
                }

                registro = crearRegistroDesdeAnimal(
                    respuestaAnimal.data ?? {},
                    valorEscrito,
                    "id"
                );
            } else {
                const respuestaAnimal =
                    await obtenerLecturaEspada(valorEscrito);

                if (!respuestaAnimal.ok) {
                    const detalle =
                        respuestaAnimal.data?.message ??
                        respuestaAnimal.data?.mensaje ??
                        respuestaAnimal.data?.error ??
                        respuestaAnimal.rawText ??
                        t("gestationReader_noAnimalByCrotal", {
                            crotal: valorEscrito,
                        })

                    setErrorTeclado(
                        limpiarMensajeBackend(String(detalle))
                    );

                    return;
                }

                const animal = respuestaAnimal.data ?? {};

                const idAnimal =
                    animal?.animalId !== null &&
                        animal?.animalId !== undefined &&
                        String(animal.animalId).trim() !== ""
                        ? String(animal.animalId)
                        : "0";

                registro = crearRegistroDesdeAnimal(
                    animal,
                    idAnimal,
                    "crotal"
                );

                registro = {
                    ...registro,
                    crotal:
                        animal?.crotal !== null &&
                            animal?.crotal !== undefined &&
                            String(animal.crotal).trim() !== ""
                            ? String(animal.crotal)
                            : valorEscrito,
                    corral: esEntrada
                        ? corralInput
                        : registro.corral,
                };
            }

            if (confirmar) {
                agregarRegistroPendiente(registro);

                setValorTeclado("");
                setErrorTeclado("");

                mostrarIdTemporal(
                    registro.idBackend,
                    registro.idBackend === "0"
                        ? "error"
                        : "success"
                );

                Keyboard.dismiss();
                return;
            }

            const registroEnviado = await enviarUnRegistroPendiente(registro);

            setRegistrosEnviados((anteriores) =>
                upsertRegistroPorCrotal(
                    anteriores,
                    registroEnviado.corral,
                    registroEnviado.crotal,
                    registroEnviado.idBackend,
                    registroEnviado.estado,
                    registroEnviado.nave
                )
            );

            setPagina(0);
            setValorTeclado("");
            setErrorTeclado("");

            mostrarIdTemporal(
                registroEnviado.idBackend,
                registroEnviado.idBackend === "0"
                    ? "error"
                    : "success"
            );

            Keyboard.dismiss();

            mostrarAviso(
                t("gestationReader_recordSentTitle"),
                t("gestationReader_recordSentText"),
                "info"
            );
        } catch (error: any) {
            console.log(
                "Error añadiendo animal por teclado:",
                error
            );

            setErrorTeclado(
                error?.message ||
                t("gestationReader_addAnimalError")
            );
        } finally {
            setProcesandoTeclado(false);
        }
    }, [
        valorTeclado,
        tipoTeclado,
        esEntrada,
        corralInput,
        confirmar,
        crearRegistroDesdeAnimal,
        agregarRegistroPendiente,
        enviarUnRegistroPendiente,
        t,
    ]);
    const agregarDesdeLectorAlLote = React.useCallback(
        async (crotalActual: string) => {
            const crotalNumero = Number(crotalActual);

            if (!Number.isFinite(crotalNumero) || crotalNumero <= 0) {
                mostrarAviso(
                    t("gestationReader_alertInvalidCrotalTitle"),
                    t("gestationReader_alertInvalidCrotalMessage"),
                    "warning"
                );

                limpiarCrotalLeido();
                ultimoCrotalAutoRef.current = null;
                return;
            }

            if (esEntrada) {
                const corralNumero = Number(corralInput);

                if (
                    !corralInput.trim() ||
                    !Number.isFinite(corralNumero) ||
                    corralNumero <= 0
                ) {
                    mostrarAviso(
                        t("gestationReader_alertMissingCorralTitle"),
                        t("gestationReader_alertMissingCorralMessage"),
                        "warning"
                    );

                    limpiarCrotalLeido();
                    ultimoCrotalAutoRef.current = null;
                    return;
                }
            }

            try {
                setEstaEnviando(true);
                setErrorTeclado("");

                const respuestaAnimal =
                    await obtenerLecturaEspada(String(crotalNumero));

                if (!respuestaAnimal.ok) {
                    const detalle =
                        respuestaAnimal.data?.message ??
                        respuestaAnimal.data?.mensaje ??
                        respuestaAnimal.data?.error ??
                        respuestaAnimal.rawText ??
                        `No existe ningún animal con el crotal ${crotalNumero}.`;

                    mostrarAviso(
                        t("gestationReader_alertReadErrorTitle"),
                        limpiarMensajeBackend(String(detalle)),
                        "error"
                    );

                    limpiarCrotalLeido();
                    ultimoCrotalAutoRef.current = null;
                    return;
                }

                const animal = respuestaAnimal.data ?? {};

                const idAnimal =
                    animal?.animalId !== null &&
                        animal?.animalId !== undefined &&
                        String(animal.animalId).trim() !== ""
                        ? String(animal.animalId)
                        : "0";

                let registro = crearRegistroDesdeAnimal(
                    animal,
                    idAnimal,
                    "crotal"
                );

                registro = {
                    ...registro,
                    crotal:
                        animal?.crotal !== null &&
                            animal?.crotal !== undefined &&
                            String(animal.crotal).trim() !== ""
                            ? String(animal.crotal)
                            : String(crotalNumero),
                    corral: esEntrada
                        ? corralInput.trim()
                        : registro.corral,
                };

                agregarRegistroPendiente(registro);

                mostrarIdTemporal(
                    registro.idBackend,
                    registro.idBackend === "0"
                        ? "error"
                        : "success"
                );

                limpiarCrotalLeido();
                ultimoCrotalAutoRef.current = null;
                setPagina(0);
            } catch (error: any) {
                mostrarAviso(
                    t("gestationReader_alertSendErrorTitle"),
                    error?.message ||
                    t("gestationReader_alertNetworkErrorMessage"),
                    "error"
                );
            } finally {
                setEstaEnviando(false);
            }
        },
        [
            esEntrada,
            corralInput,
            crearRegistroDesdeAnimal,
            agregarRegistroPendiente,
            limpiarCrotalLeido,
            t,
        ]
    );

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
                    (respuesta.data &&
                        (respuesta.data.message || respuesta.data.error || respuesta.data.mensaje)) ||
                    respuesta.rawText ||
                    `HTTP ${respuesta.status}`;

                mostrarAviso(
                    t("gestationReader_alertUpdateIdErrorTitle"),
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
                t("gestationReader_alertNetworkError"),
                t("gestationReader_alertNetworkErrorMessage")
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

    useEffect(() => {
        const crotalActual = (crotalLeido ?? "").trim();

        if (estaEnModoTeclado) {
            limpiarAutoEnvioTimer();

            if (crotalActual) {
                limpiarCrotalLeido();
            }

            ultimoCrotalAutoRef.current = null;
            return;
        }

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

        if (!crotalActual) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }

        if (estaEnviando) return;

        if (ultimoCrotalAutoRef.current === crotalActual) return;

        limpiarAutoEnvioTimer();
        ultimoCrotalAutoRef.current = crotalActual;

        if (confirmar && !esLectura && !esBusqueda) {
            autoEnvioTimerRef.current = setTimeout(() => {
                if (!pantallaActivaRef.current) return;

                agregarDesdeLectorAlLote(crotalActual);
            }, 600);

            return () => {
                limpiarAutoEnvioTimer();
            };
        }

        if (!usaEnvioAutomatico) {
            limpiarAutoEnvioTimer();
            ultimoCrotalAutoRef.current = null;
            return;
        }

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
        mostrarActualizarId,
        actualizandoId,
        limpiarCrotalLeido,
        estaEnModoTeclado,
        confirmar,
        esLectura,
        esBusqueda,
        agregarDesdeLectorAlLote,
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
                <Appbar.BackAction color={TEXT} onPress={volverAConfiguracionGestacion} />
                <Appbar.Content title={tituloHeader} titleStyle={{ color: TEXT }} />
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
                                {t("gestationReader_animalInfoTitle")}
                            </Text>
                            <Text style={{ color: MUTED, marginTop: 4 }}>
                                {t("gestationReader_animalInfoDescription")}
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
                                    {t("gestationReader_animalCardTitle")}
                                </Text>

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
                                    {t("gestationReader_animalCrotalLabel")} {formatearCrotalVisual(animalBusqueda?.crotal)}
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
                                    valor={traducirEstadoAnimal(animalBusqueda?.state, t)}
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
                                onPress={volverAConfiguracionGestacion}
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
                            {/* Modo + Corral juntos */}
                            <View
                                style={{
                                    flex: 1,
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
                                            {t("gestationReader_mode")}
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
                                                ? t("gestationReader_modeEntry")
                                                : t("gestationReader_modeExit")}
                                        </Text>
                                    </View>
                                </View>

                                {/* Separador */}
                                <View
                                    style={{
                                        width: 1,
                                        height: 30,
                                        backgroundColor: "#E2E8F0",
                                        marginHorizontal: 8,
                                    }}
                                />

                                {/* Corral editable */}
                                <TouchableOpacity
                                    disabled={!esEntrada}
                                    onPress={abrirModalCorral}
                                    activeOpacity={0.85}
                                    style={{
                                        flex: 0.75,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                        opacity: esEntrada ? 1 : 0.65,
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
                                            {t("gestationReader_corral")}
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

                                    {esEntrada && (
                                        <Ionicons
                                            name="create-outline"
                                            size={15}
                                            color={MUTED}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Botón cambiar */}
                            <View
                                style={{
                                    height: 54,
                                    width: 128,
                                    borderRadius: 14,
                                    backgroundColor: "#E5E7EB",
                                    padding: 4,
                                    flexDirection: "row",
                                    gap: 4,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => cambiarModoCaptura("lectura")}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        borderRadius: 11,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: !estaEnModoTeclado ? BRAND : "transparent",
                                    }}
                                >
                                    <Ionicons
                                        name="scan-outline"
                                        size={15}
                                        color={!estaEnModoTeclado ? "#FFFFFF" : MUTED}
                                        style={{ marginBottom: 2 }}
                                    />

                                    <Text
                                        style={{
                                            color: !estaEnModoTeclado ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                            fontSize: 10,
                                        }}
                                    >
                                        {t("gestationReader_readerMode")}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => cambiarModoCaptura("teclado")}
                                    activeOpacity={0.9}
                                    style={{
                                        flex: 1,
                                        borderRadius: 11,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: estaEnModoTeclado ? BRAND : "transparent",
                                    }}
                                >
                                    <Ionicons
                                        name="keypad-outline"
                                        size={15}
                                        color={estaEnModoTeclado ? "#FFFFFF" : MUTED}
                                        style={{ marginBottom: 2 }}
                                    />

                                    <Text
                                        style={{
                                            color: estaEnModoTeclado ? "#FFFFFF" : TEXT,
                                            fontWeight: "900",
                                            fontSize: 10,
                                        }}
                                    >
                                        {t("gestationReader_keyboardMode")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {!esLectura && !esBusqueda && !estaEnModoTeclado && (
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
                                }
                            />
                        </View>
                    </View>
                )}

                {!esLectura && !esBusqueda && estaEnModoTeclado && (
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
                            <Text
                                style={{
                                    color: TEXT,
                                    fontSize: 19,
                                    fontWeight: "900",
                                }}
                            >
                                {esEntrada
                                    ? t("gestationReader_keyboardEntryTitle")
                                    : t("gestationReader_keyboardExitTitle")}
                            </Text>

                            <Text
                                style={{
                                    color: MUTED,
                                    marginTop: 4,
                                }}
                            >
                                {t("gestationReader_keyboardDescription")}
                            </Text>
                        </View>

                        <View
                            style={{
                                padding: 14,
                                gap: 12,
                            }}
                        >
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
                                        height: 44,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                        gap: 8,
                                        backgroundColor:
                                            tipoTeclado === "id"
                                                ? BRAND
                                                : "#EEF2FF",
                                        borderWidth: 1,
                                        borderColor:
                                            tipoTeclado === "id"
                                                ? BRAND
                                                : "#C7D2FE",
                                    }}
                                >
                                    <Ionicons
                                        name="finger-print-outline"
                                        size={20}
                                        color={
                                            tipoTeclado === "id"
                                                ? "#FFFFFF"
                                                : BRAND
                                        }
                                    />

                                    <Text
                                        style={{
                                            color:
                                                tipoTeclado === "id"
                                                    ? "#FFFFFF"
                                                    : BRAND,
                                            fontWeight: "900",
                                            fontSize: 15,
                                        }}
                                    >
                                        {t("gestationReader_keyboardId")}
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
                                        height: 44,
                                        borderRadius: 14,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "row",
                                        gap: 8,
                                        backgroundColor:
                                            tipoTeclado === "crotal"
                                                ? BRAND
                                                : "#EEF2FF",
                                        borderWidth: 1,
                                        borderColor:
                                            tipoTeclado === "crotal"
                                                ? BRAND
                                                : "#C7D2FE",
                                    }}
                                >
                                    <Ionicons
                                        name="barcode-outline"
                                        size={20}
                                        color={
                                            tipoTeclado === "crotal"
                                                ? "#FFFFFF"
                                                : BRAND
                                        }
                                    />

                                    <Text
                                        style={{
                                            color:
                                                tipoTeclado === "crotal"
                                                    ? "#FFFFFF"
                                                    : BRAND,
                                            fontWeight: "900",
                                            fontSize: 15,
                                        }}
                                    >
                                        {t("gestationReader_keyboardCrotal")}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                mode="outlined"
                                label={
                                    tipoTeclado === "id"
                                        ? t("gestationReader_keyboardIdLabel")
                                        : t("gestationReader_keyboardCrotalLabel")
                                }
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
                                placeholder={
                                    tipoTeclado === "id"
                                        ? t("gestationReader_keyboardIdPlaceholder")
                                        : t("gestationReader_keyboardCrotalPlaceholder")
                                }
                                outlineColor={BRAND}
                                activeOutlineColor={BRAND}
                                style={{
                                    backgroundColor: "#FFFFFF",
                                }}
                                outlineStyle={{
                                    borderRadius: 14,
                                    borderWidth: 2,
                                }}
                                textColor={TEXT}
                                disabled={procesandoTeclado}
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
                                onPress={agregarDesdeTeclado}
                                disabled={procesandoTeclado}
                                activeOpacity={0.9}
                                style={{
                                    height: 46,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor:
                                        procesandoTeclado
                                            ? "#A5B4FC"
                                            : BRAND,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontWeight: "900",
                                        fontSize: 16,
                                    }}
                                >
                                    {procesandoTeclado
                                        ? confirmar
                                            ? t("gestationReader_keyboardAdding")
                                            : t("gestationReader_buttonSending")
                                        : confirmar
                                            ? t("gestationReader_keyboardAdd")
                                            : t("gestationReader_buttonSend")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {!esBusqueda && mostrarActualizarId && (
                    <View
                        onLayout={(event) => {
                            formularioIdYRef.current = event.nativeEvent.layout.y;
                        }}
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
                                onFocus={() => {
                                    setTimeout(() => {
                                        subirFormularioId();
                                    }, Platform.OS === "ios" ? 100 : 250);
                                }}
                                placeholder={t("gestationReader_newIdPlaceholder")}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                outlineColor={DANGER}
                                activeOutlineColor={DANGER}
                                style={{
                                    backgroundColor: "#FFF7F7",
                                }}
                                outlineStyle={{
                                    borderWidth: 2,
                                    borderRadius: 14,
                                }}
                                textColor={TEXT}
                                placeholderTextColor="#B91C1C"
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
                                    {actualizandoId
                                        ? t("gestationReader_updatingId")
                                        : t("gestationReader_updateId")}
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
                                            {t("gestationReader_awrDisconnected")}
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
                            {hayRegistros && !esLectura && !esSalida && (
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
                                            {t("gestationReader_noRecords")}
                                        </Text>
                                    ) : (
                                        registrosTabla.map((r) => (
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

                                    {registrosTabla.length === 0 ? (
                                        <View
                                            style={{
                                                paddingVertical: 24,
                                                paddingHorizontal: 16,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 21,
                                                    backgroundColor: "#F1F5F9",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginBottom: 10,
                                                }}
                                            >
                                                <Ionicons name="file-tray-outline" size={22} color={MUTED} />
                                            </View>

                                            <Text
                                                style={{
                                                    color: TEXT,
                                                    fontWeight: "900",
                                                    fontSize: 15,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {t("gestationReader_noRecords")}
                                            </Text>

                                            <Text
                                                style={{
                                                    color: MUTED,
                                                    fontSize: 13,
                                                    marginTop: 4,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {t("gestationReader_pendingAnimalHint")}
                                            </Text>
                                        </View>
                                    ) : (
                                        itemsPagina.map((r, idx) => (
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

                                    {registrosTabla.length === 0 ? (
                                        <View style={{ padding: 14 }}>
                                            <Text style={{ color: MUTED }}>{t("gestationReader_noRecords")}</Text>
                                        </View>
                                    ) : (
                                        itemsPagina.map((r, idx) => (
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

                {!esBusqueda && !esLectura && confirmar && (
                    <View style={{ marginTop: 12 }}>
                        <TouchableOpacity
                            onPress={onEnviar}
                            disabled={
                                estaEnviando ||
                                esLectura ||
                                (
                                    mostrandoPendientesEnvio &&
                                    registrosPendientesEnvio.length === 0
                                )
                            }
                            activeOpacity={0.9}
                            style={{
                                height: 46,
                                borderRadius: 14,
                                backgroundColor: esLectura
                                    ? "#CBD5E1"
                                    : estaEnviando
                                        ? "#A5B4FC"
                                        : mostrandoPendientesEnvio &&
                                            registrosPendientesEnvio.length === 0
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
                                {esLectura
                                    ? t("gestationReader_buttonAutoReading")
                                    : estaEnviando
                                        ? t("gestationReader_buttonSendingBatch")
                                        : mostrandoPendientesEnvio
                                            ? registrosPendientesEnvio.length > 0
                                                ? t("gestationReader_buttonSendBatchCount", {
                                                    count: registrosPendientesEnvio.length,
                                                })
                                                : t("gestationReader_buttonSendBatch")
                                            : t("gestationReader_buttonSend")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <Modal
                visible={modalCorralVisible}
                transparent
                animationType="fade"
                onRequestClose={cerrarModalCorral}
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
                            paddingVertical: 20,
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
                                    width: 58,
                                    height: 58,
                                    borderRadius: 29,
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
                                {t("gestationReader_changePenTitle")}
                            </Text>

                            <Text
                                style={{
                                    marginTop: 6,
                                    fontSize: 15,
                                    color: MUTED,
                                    textAlign: "center",
                                    fontWeight: "700",
                                    lineHeight: 21,
                                }}
                            >
                                {t("gestationReader_changePenDescription")}
                            </Text>
                        </View>

                        <TextInput
                            mode="outlined"
                            label={t("gestationReader_newPenLabel")}
                            value={corralTemporal}
                            onChangeText={(texto) => {
                                const soloNumeros = soloDigitos(texto).slice(0, 9);

                                setCorralTemporal(soloNumeros);
                                setErrorCorralModal("");
                            }}
                            keyboardType="number-pad"
                            maxLength={9}
                            placeholder=""
                            outlineColor={errorCorralModal ? DANGER : BRAND}
                            activeOutlineColor={errorCorralModal ? DANGER : BRAND}
                            style={{
                                backgroundColor: "#FFFFFF",
                                marginBottom: errorCorralModal ? 6 : 18,
                            }}
                            outlineStyle={{
                                borderRadius: 14,
                                borderWidth: 2,
                            }}
                            textColor={TEXT}
                            disabled={validandoCorralModal}
                        />
                        {!!errorCorralModal && (
                            <Text
                                style={{
                                    color: DANGER,
                                    fontSize: 13,
                                    fontWeight: "800",
                                    textAlign: "center",
                                    marginBottom: 12,
                                }}
                            >
                                {errorCorralModal}
                            </Text>
                        )}
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 10,
                            }}
                        >
                            <TouchableOpacity
                                onPress={cerrarModalCorral}
                                disabled={validandoCorralModal}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: "#E5E7EB",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: TEXT,
                                        fontSize: 15,
                                        fontWeight: "900",
                                    }}
                                >
                                    {t("gestationReader_cancel")}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={guardarCorralModal}
                                disabled={validandoCorralModal || !corralTemporal.trim()}
                                activeOpacity={0.9}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: BRAND,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 15,
                                        fontWeight: "900",
                                    }}
                                >
                                    {validandoCorralModal
                                        ? "Validando..."
                                        : t("gestationReader_save")}
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
                            ...SHADOW,
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
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
                                {t("gestationReader_accept")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};