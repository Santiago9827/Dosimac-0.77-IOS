/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Appbar, TextInput } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAwrConn } from "../../../stores/awrConnStore";

const BG = "#F6F7FB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BRAND = "#4F46E5";
const SOFT = "#EEF2FF";
const SOFT_BORDER = "#C7D2FE";
const DANGER = "#DC2626";

const ENDPOINT_MATERNITY =
    "http://192.168.11.203:6060/CtiAlimentacionAPI/api/espada/maternity";

type RegistroEnviado = {
    id: string;
    corral: string;
    crotal: string;
};

type TipoMovimiento = "entrada" | "salida";

// ---------- helpers pequeños y claros ----------
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

async function postMaternity(payload: { corral: number; crotal: number }) {
    const res = await fetch(ENDPOINT_MATERNITY, {
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
        return [actualizado, ...copia];
    }

    return [
        { id: String(Date.now()), corral: String(corralNum), crotal: String(crotalNum) },
        ...prev,
    ];
}

// ---------- componente ----------
export const LectorMaternidadScreen = () => {
    const navigation = useNavigation<any>();

    // store AWR (alias con nombres claros)
    const lectorConectado = useAwrConn((s) => s.isConnected);
    const idLector = useAwrConn((s) => s.currentId);
    const crotalLeido = useAwrConn((s) => s.lastTag);
    const iniciarLectura = useAwrConn((s) => s.startReading);
    const detenerLectura = useAwrConn((s) => s.stopReading);
    const limpiarCrotalLeido = useAwrConn((s) => s.clearLastTag);

    // estados UI
    const [corralInput, setCorralInput] = useState("");
    const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>("entrada");

    const [registrosEnviados, setRegistrosEnviados] = useState<RegistroEnviado[]>([]);
    const [estaEnviando, setEstaEnviando] = useState(false);

    // paginación
    const TAM_PAGINA = 3;
    const [pagina, setPagina] = useState(0);

    const totalPaginas = Math.max(1, Math.ceil(registrosEnviados.length / TAM_PAGINA));

    const pageItems = useMemo(() => {
        const start = pagina * TAM_PAGINA;
        return registrosEnviados.slice(start, start + TAM_PAGINA);
    }, [registrosEnviados, pagina]);

    // si borras o cambias lista, ajusta página para no “pasarte”
    useEffect(() => {
        const maxPagina = Math.max(0, Math.ceil(registrosEnviados.length / TAM_PAGINA) - 1);
        if (pagina > maxPagina) setPagina(maxPagina);
    }, [registrosEnviados.length, pagina]);

    // al entrar/salir: reset + start/stop reading (igual que antes)
    useFocusEffect(
        React.useCallback(() => {
            let mounted = true;

            setCorralInput("");
            setRegistrosEnviados([]);
            limpiarCrotalLeido();
            setTipoMovimiento("entrada");

            (async () => {
                if (!idLector) return; // mismo comportamiento: si no hay lector, no lee

                try {
                    await iniciarLectura();
                } catch {
                    // si falla, no hacemos nada aquí (igual que tu versión si no lo mostrabas)
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

        // validaciones UI (igual que antes)
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
            Alert.alert("Corral inválido", "El corral debe ser un número (ej: 8).");
            return;
        }
        if (crotalNum === null) {
            Alert.alert("Crotal inválido", "El crotal debe ser numérico.");
            return;
        }

        try {
            setEstaEnviando(true);

            const r = await postMaternity({ corral: corralNum, crotal: crotalNum });

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

            // OK -> upsert + corral +1 + pagina 0 + limpiar crotal (igual que antes)
            setRegistrosEnviados((prev) => upsertRegistroPorCrotal(prev, corralNum, crotalNum));
            setCorralInput((prev) => incrementarCorral(prev));
            setPagina(0);
            limpiarCrotalLeido();
        } catch (e) {
            Alert.alert("Error de red", "No se pudo conectar con el servidor.");
        } finally {
            setEstaEnviando(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <Appbar.Header
                elevated
                style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: BORDER }}
            >
                <Appbar.BackAction color={TEXT} onPress={volverACtiFeed} />
                <Appbar.Content title="Lector Maternidad" titleStyle={{ color: TEXT }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
                {/* Tabs */}
                <View
                    style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: BORDER,
                        padding: 3,
                        flexDirection: "row",
                        gap: 4,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setTipoMovimiento("entrada")}
                        activeOpacity={0.9}
                        style={{
                            flex: 1,
                            height: 30,
                            borderRadius: 9,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: tipoMovimiento === "entrada" ? BRAND : "transparent",
                        }}
                    >
                        <Text style={{ fontWeight: "800", fontSize: 13, color: tipoMovimiento === "entrada" ? "white" : TEXT }}>
                            Entrada
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTipoMovimiento("salida")}
                        activeOpacity={0.9}
                        style={{
                            flex: 1,
                            height: 30,
                            borderRadius: 9,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: tipoMovimiento === "salida" ? BRAND : "transparent",
                        }}
                    >
                        <Text style={{ fontWeight: "800", fontSize: 13, color: tipoMovimiento === "salida" ? "white" : TEXT }}>
                            Salida
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Corral */}
                <View
                    style={{
                        backgroundColor: CARD,
                        borderRadius: 18,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: BORDER,
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
                            left={<TextInput.Icon icon="pencil" color={BRAND} />}
                            outlineColor={BORDER}
                            activeOutlineColor={BRAND}
                            placeholder="Ej: 8"
                        />
                    </View>
                </View>

                {/* Crotal leído */}
                <View style={{ backgroundColor: CARD, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: BORDER }}>
                    <View style={{ backgroundColor: "#F8FAFF", padding: 14, borderBottomWidth: 1, borderBottomColor: "#E0E7FF" }}>
                        <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>Crotal leído</Text>
                        <Text style={{ color: MUTED, marginTop: 4 }}>Acerca el crotal al lector y se mostrará aquí al instante.</Text>
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
                        }}
                    >
                        <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                            {estaEnviando ? "Enviando..." : "Enviar"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tabla */}
                <View style={{ marginTop: 3, backgroundColor: CARD, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: BORDER }}>
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
                            gap: 10,
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

                    <View style={{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                        <Text style={{ flex: 1, color: MUTED, fontWeight: "900" }}>Corral</Text>
                        <Text style={{ flex: 1, color: MUTED, fontWeight: "900" }}>Crotal</Text>
                    </View>

                    {registrosEnviados.length === 0 ? (
                        <View style={{ padding: 14 }}>
                            <Text style={{ color: MUTED }}>Aún no has enviado ningún registro</Text>
                        </View>
                    ) : (
                        pageItems.map((r) => (
                            <View key={r.id} style={{ flexDirection: "row", paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
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