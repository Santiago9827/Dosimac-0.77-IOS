/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Appbar, TextInput } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAwrConn } from "../../../stores/awrConnStore";
import Ionicons from "react-native-vector-icons/Ionicons";


const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BRAND = "#4F46E5";
const SOFT = "#EEF2FF";
const SOFT_BORDER = "#C7D2FE";
const DANGER = "#DC2626";

const ENDPOINT_GESTATION =
    "http://192.168.11.203:6060/CtiAlimentacionAPI/api/espada/gestation";

type RegistroEnviado = {
    id: string;
    corral: string;
    crotal: string;
};

type TipoMovimiento = "entrada" | "salida";

// ---------- helpers (misma lógica, más claro) ----------
const soloDigitos = (txt: string) => txt.replace(/[^0-9]/g, "");

const normalizarClave = (valor: string) =>
    valor.trim().toUpperCase().replace(/\s+/g, "");

const parseNumeroSeguro = (txt: string) => {
    const n = Number(txt);
    return Number.isFinite(n) ? n : null;
};

async function postGestation(payload: { corral: number; crotal: number }) {
    const res = await fetch(ENDPOINT_GESTATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data: any = null;
    let rawText = "";

    try {
        data = await res.json();
    } catch {
        try {
            rawText = await res.text();
        } catch { }
    }

    return { ok: res.ok, status: res.status, data, rawText };
}

function upsertRegistroPorCrotal(
    prev: RegistroEnviado[],
    corralNum: number,
    crotalNum: number
) {
    const key = normalizarClave(String(crotalNum));
    const idx = prev.findIndex((x) => normalizarClave(x.crotal) === key);

    if (idx >= 0) {
        const copia = [...prev];
        const actualizado: RegistroEnviado = {
            ...copia[idx],
            corral: String(corralNum),
            crotal: String(crotalNum),
        };
        copia.splice(idx, 1);
        return [actualizado, ...copia]; // mantiene “último enviado arriba”
    }

    return [
        { id: String(Date.now()), corral: String(corralNum), crotal: String(crotalNum) },
        ...prev,
    ];
}

// ---------- componente ----------
export const LectorGestacionScreen = () => {
    const navigation = useNavigation<any>();

    // AWR store (alias legibles)
    const lectorConectado = useAwrConn((s) => s.isConnected);
    const idLector = useAwrConn((s) => s.currentId);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    // UI state
    const [corralInput, setCorralInput] = useState("");
    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");

    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [estaEnviando, setEstaEnviando] = useState(false);

    // paginación (mismo comportamiento)
    const TAM_PAGINA = 10;
    const [pagina, setPagina] = useState(0);

    const totalPaginas = Math.max(1, Math.ceil(registrosEnviados.length / TAM_PAGINA));

    const itemsPagina = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosEnviados.slice(start, start + TAM_PAGINA);
    }, [registrosEnviados, pagina]);

    // si baja el número de registros y la página queda fuera, la ajusta
    useEffect(() => {
        const maxPagina = Math.max(0, Math.ceil(registrosEnviados.length / TAM_PAGINA) - 1);
        if (pagina > maxPagina) setPagina(maxPagina);
    }, [registrosEnviados.length, pagina]);

    // al entrar/salir (igual que tu versión)
    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            setCorralInput("");
            setRegistrosEnviados([]);
            limpiarCrotalLeido();
            setTipoMovimiento("entrada");

            (async () => {
                if (!idLector) return;

                try {
                    await iniciarLectura();
                } catch {
                    if (!mounted) return;
                }
            })();

            return () => {
                mounted = false;
                detenerLectura?.().catch(() => { });
            };
        }, [idLector, iniciarLectura, detenerLectura, limpiarCrotalLeido])
    );

    const volverACtiFeed = () => {
        const parent = navigation.getParent?.();
        if (parent?.navigate) parent.navigate("Tabs");
        else navigation.navigate("Tabs");
    };

    const onEnviar = async () => {
        const corralTxt = corralInput.trim();
        const crotalTxt = (crotalLeido ?? "").trim();

        if (!corralTxt) {
            Alert.alert("Falta corral", "Escribe el corral antes de enviar.");
            return;
        }
        if (!crotalTxt) {
            Alert.alert("Falta crotal", "Acerca el crotal al lector antes de enviar.");
            return;
        }

        const corralNum = parseNumeroSeguro(corralTxt);
        const crotalNum = parseNumeroSeguro(crotalTxt);

        if (corralNum === null) {
            Alert.alert("Corral inválido", "El corral debe ser un número.");
            return;
        }
        if (crotalNum === null) {
            Alert.alert("Crotal inválido", "El crotal debe ser numérico.");
            return;
        }

        try {
            setEstaEnviando(true);

            const r = await postGestation({ corral: corralNum, crotal: crotalNum });

            if (!r.ok) {
                if (r.status === 400) {
                    Alert.alert("No válido", "El corral y/o el crotal que has enviado no existe.");
                    return;
                }

                const detalle =
                    (r.data && (r.data.message || r.data.error)) ||
                    r.rawText ||
                    `HTTP ${r.status}`;

                Alert.alert("Error al enviar", String(detalle));
                return;
            }

            // ✅ OK -> tabla (sin duplicar por crotal)
            setRegistrosEnviados((prev) => upsertRegistroPorCrotal(prev, corralNum, crotalNum));

            // ✅ gestación: NO incrementamos corral (se queda fijo)
            setPagina(0);
            limpiarCrotalLeido();
        } catch {
            Alert.alert("Error de red", "No se pudo conectar con el servidor.");
        } finally {
            setEstaEnviando(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <Appbar.Header
                elevated
                style={{
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderBottomColor: BORDER,
                }}
            >
                <Appbar.BackAction color={TEXT} onPress={volverACtiFeed} />
                <Appbar.Content title="Lector Gestación" titleStyle={{ color: TEXT }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
                {/* Tabs Entrada/Salida */}
                <View
                    style={{
                        backgroundColor: CARD,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: BORDER,
                        padding: 4,
                        flexDirection: "row",
                        gap: 6,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setTipoMovimiento("entrada")}
                        activeOpacity={0.9}
                        style={{
                            flex: 1,
                            height: 34,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: tipoMovimiento === "entrada" ? BRAND : "transparent",
                        }}
                    >
                        <Text style={{ fontWeight: "900", fontSize: 14, color: tipoMovimiento === "entrada" ? "white" : TEXT }}>
                            Entrada
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTipoMovimiento("salida")}
                        activeOpacity={0.9}
                        style={{
                            flex: 1,
                            height: 34,
                            borderRadius: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: tipoMovimiento === "salida" ? BRAND : "transparent",
                        }}
                    >
                        <Text style={{ fontWeight: "900", fontSize: 14, color: tipoMovimiento === "salida" ? "white" : TEXT }}>
                            Salida
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Corral (fijo) */}
                <View
                    style={{
                        backgroundColor: CARD,
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: BORDER,
                        shadowColor: "#000",
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 2,
                    }}
                >
                    <View style={{ backgroundColor: SOFT, padding: 14, borderBottomWidth: 1, borderBottomColor: SOFT_BORDER }}>
                        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>Corral</Text>
                        <Text style={{ color: "#4B5563", marginTop: 4 }}>
                            Escriba el corral en el que desea introducir al animal.
                        </Text>
                    </View>

                    <View style={{ padding: 14 }}>
                        <TextInput
                            mode="outlined"
                            label="Corral"
                            value={corralInput}
                            onChangeText={(txt) => setCorralInput(soloDigitos(txt))}
                            keyboardType="number-pad"
                            autoCapitalize="none"
                            autoCorrect={false}
                            left={<TextInput.Icon icon="pencil" color={BRAND} />}
                            outlineColor={BORDER}
                            activeOutlineColor={BRAND}
                            placeholder="Ej: 8"
                        />
                    </View>
                </View>

                {/* Crotal leído */}
                <View
                    style={{
                        backgroundColor: CARD,
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: BORDER,
                        shadowColor: "#000",
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 2,
                    }}
                >
                    <View style={{ backgroundColor: "#F8FAFF", padding: 14, borderBottomWidth: 1, borderBottomColor: "#E0E7FF" }}>
                        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>Crotal leído</Text>
                        <Text style={{ color: MUTED, marginTop: 4 }}>Cuando el lector detecte el crotal, se mostrará aquí.</Text>
                    </View>

                    <View style={{ padding: 14 }}>
                        {!lectorConectado && (
                            <View
                                style={{
                                    alignSelf: "flex-start",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 999,
                                    backgroundColor: "#FEF2F2",
                                    borderWidth: 1,
                                    borderColor: "#FECACA",
                                }}
                            >
                                <Ionicons name="alert-circle-outline" size={18} color={DANGER} />
                                <Text style={{ color: DANGER, fontWeight: "900" }}>AWR no conectado</Text>
                            </View>
                        )}

                        <View
                            style={{
                                marginTop: 12,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: BORDER,
                                backgroundColor: "#F1F5F9",
                                paddingVertical: 18,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ color: MUTED, fontWeight: "800" }}>Crotal leído</Text>
                            <Text style={{ marginTop: 8, color: TEXT, fontSize: 30, fontWeight: "900", letterSpacing: 1 }}>
                                {crotalLeido ? String(crotalLeido) : "—"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Enviar */}
                <View style={{ marginTop: 12 }}>
                    <TouchableOpacity
                        onPress={onEnviar}
                        disabled={estaEnviando}
                        activeOpacity={0.9}
                        style={{
                            height: 46,
                            borderRadius: 14,
                            backgroundColor: estaEnviando ? "#A5B4FC" : BRAND,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 3 },
                            elevation: 2,
                        }}
                    >
                        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                            {estaEnviando ? "Enviando..." : "Enviar"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tabla */}
                <View style={{ marginTop: 12, backgroundColor: CARD, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: BORDER }}>
                    <View
                        style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            backgroundColor: "#F8FAFF",
                            borderBottomWidth: 1,
                            borderBottomColor: "#E0E7FF",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>Registros enviados</Text>

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
                                    <Text style={{ fontSize: 16, color: pagina === 0 ? "#6B7280" : "white", fontWeight: "900" }}>
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
                                    <Text style={{ fontSize: 16, color: pagina >= totalPaginas - 1 ? "#6B7280" : "white", fontWeight: "900" }}>
                                        {">"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: "#FFFFFF" }}>
                        <Text style={{ flex: 1, color: MUTED, fontWeight: "900" }}>Corral</Text>
                        <Text style={{ flex: 1, color: MUTED, fontWeight: "900" }}>Crotal</Text>
                    </View>

                    {registrosEnviados.length === 0 ? (
                        <View style={{ padding: 14 }}>
                            <Text style={{ color: MUTED }}>Aún no has enviado ningún registro.</Text>
                        </View>
                    ) : (
                        itemsPagina.map((r) => (
                            <View key={r.id} style={{ flexDirection: "row", paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
                                <Text style={{ flex: 1, color: TEXT, fontWeight: "700" }}>{r.corral}</Text>
                                <Text style={{ flex: 1, color: TEXT, fontWeight: "700" }}>{r.crotal}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};