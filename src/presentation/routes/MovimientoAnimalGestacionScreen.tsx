/* eslint-disable prettier/prettier */
import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Keyboard,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MovimientoTipo = 'entrada' | 'salida';

const BG = '#F8FAFC';
const CARD = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const PURPLE = '#4C1D95';
const GREEN = '#16A34A';
const RED = '#DC2626';

const STORAGE_KEY = '@cti_portal_base_url';

const obtenerOrigin = (baseUrl: string) => {
    const limpia = String(baseUrl || '').trim();

    if (!limpia) {
        throw new Error('NO_IP_CONFIGURADA');
    }

    const sinSlashFinal = limpia.replace(/\/+$/, '');

    const match = sinSlashFinal.match(/^(https?:\/\/[^/]+)/i);

    if (match?.[1]) {
        return match[1];
    }

    return sinSlashFinal;
};

async function construirEndpointAppV1(ruta: string) {
    const baseGuardada = await AsyncStorage.getItem(STORAGE_KEY);

    if (!baseGuardada) {
        throw new Error('NO_IP_CONFIGURADA');
    }

    const origin = obtenerOrigin(baseGuardada);

    return `${origin}/CtiAlimentacionAPI/api/app/v1/${ruta.replace(/^\/+/, '')}`;
}

export const MovimientoAnimalGestacionScreen = () => {
    const [movimiento, setMovimiento] = useState<MovimientoTipo>('entrada');
    const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);

    const [corralEntrada, setCorralEntrada] = useState('');
    const [idEntrada, setIdEntrada] = useState('');
    const [valorSalida, setValorSalida] = useState('');

    const [modalConfirmacionVisible, setModalConfirmacionVisible] = useState(false);

    const [modalMensajeVisible, setModalMensajeVisible] = useState(false);
    const [modalMensajeTipo, setModalMensajeTipo] = useState<'success' | 'error'>('success');
    const [modalMensajeTitulo, setModalMensajeTitulo] = useState('');
    const [modalMensajeTexto, setModalMensajeTexto] = useState('');

    const scrollRef = useRef<ScrollView | null>(null);

    const colorMovimiento = movimiento === 'entrada' ? GREEN : RED;

    const puedeAceptar = useMemo(() => {
        if (movimiento === 'entrada') {
            return (
                corralEntrada.trim().length > 0 &&
                idEntrada.trim().length > 0
            );
        }

        return valorSalida.trim().length > 0;
    }, [movimiento, corralEntrada, idEntrada, valorSalida]);

    const mostrarModalMensaje = (
        tipo: 'success' | 'error',
        titulo: string,
        mensaje: string
    ) => {
        setModalMensajeTipo(tipo);
        setModalMensajeTitulo(titulo);
        setModalMensajeTexto(mensaje);
        setModalMensajeVisible(true);
    };

    const hacerScrollAlFinal = () => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 250);
    };

    const aceptarMovimiento = () => {
        Keyboard.dismiss();

        if (!puedeAceptar) {
            return;
        }

        setModalConfirmacionVisible(true);
    };

    const obtenerMensajeBackend = (texto: string, status: number) => {
        if (!texto || texto.trim() === '') {
            return `El servidor no devolvió mensaje. Código HTTP ${status}.`;
        }

        try {
            const datos = JSON.parse(texto);

            if (typeof datos === 'string') {
                return datos;
            }

            const mensaje =
                datos?.message ??
                datos?.mensaje ??
                datos?.error ??
                datos?.detail ??
                datos?.title;

            if (mensaje) {
                return String(mensaje);
            }

            if (Array.isArray(datos?.errors)) {
                return datos.errors.join('\n');
            }

            if (datos?.errors && typeof datos.errors === 'object') {
                return Object.values(datos.errors)
                    .flat()
                    .map(String)
                    .join('\n');
            }

            return texto;
        } catch {
            return texto;
        }
    };

    const enviarEntradaGestacion = async ({
        id,
        corral,
    }: {
        id: string;
        corral: number;
    }) => {
        const endpoint = await construirEndpointAppV1('gestation');

        const respuesta = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: String(id),
                corral: Number(corral),
            }),
        });

        const texto = await respuesta.text();

        if (!respuesta.ok) {
            throw new Error(obtenerMensajeBackend(texto, respuesta.status));
        }

        return texto;
    };

    const enviarSalidaGestacionPorId = async (animalId: string) => {
        const endpoint = await construirEndpointAppV1(
            `gestation/exitById/${encodeURIComponent(String(animalId))}`
        );

        const respuesta = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });

        const texto = await respuesta.text();

        if (!respuesta.ok) {
            throw new Error(obtenerMensajeBackend(texto, respuesta.status));
        }

        return texto;
    };

    const confirmarMovimiento = async () => {
        setModalConfirmacionVisible(false);

        if (movimiento === 'entrada') {
            const idLimpio = idEntrada.trim();
            const corralLimpio = corralEntrada.trim();
            const corralNumero = Number(corralLimpio);

            if (!idLimpio || !corralLimpio) {
                mostrarModalMensaje(
                    'error',
                    'Datos incompletos',
                    'Introduce el corral y el ID del animal.'
                );
                return;
            }

            if (!Number.isFinite(corralNumero) || corralNumero <= 0) {
                mostrarModalMensaje(
                    'error',
                    'Corral inválido',
                    'El corral debe ser un número válido mayor que 0.'
                );
                return;
            }

            try {
                setEnviandoMovimiento(true);

                await enviarEntradaGestacion({
                    id: idLimpio,
                    corral: corralNumero,
                });

                mostrarModalMensaje(
                    'success',
                    'Entrada enviada',
                    'El movimiento de entrada en gestación se ha enviado correctamente.'
                );

                setCorralEntrada('');
                setIdEntrada('');
            } catch (error: any) {
                mostrarModalMensaje(
                    'error',
                    'Error al enviar',
                    error?.message === 'NO_IP_CONFIGURADA'
                        ? 'No hay una IP configurada.'
                        : error?.message || 'No se pudo conectar con el servidor.'
                );
            } finally {
                setEnviandoMovimiento(false);
            }

            return;
        }

        const idSalidaLimpio = valorSalida.trim();

        if (!idSalidaLimpio) {
            mostrarModalMensaje(
                'error',
                'Datos incompletos',
                'Introduce el ID del animal para hacer la salida.'
            );
            return;
        }

        try {
            setEnviandoMovimiento(true);

            await enviarSalidaGestacionPorId(idSalidaLimpio);

            mostrarModalMensaje(
                'success',
                'Salida enviada',
                'La salida por ID en gestación se ha enviado correctamente.'
            );

            setValorSalida('');
        } catch (error: any) {
            mostrarModalMensaje(
                'error',
                'Error al enviar',
                error?.message === 'NO_IP_CONFIGURADA'
                    ? 'No hay una IP configurada.'
                    : error?.message || 'No se pudo conectar con el servidor.'
            );
        } finally {
            setEnviandoMovimiento(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                <View style={styles.content}>
                    <View style={styles.headerCard}>
                        <View
                            style={[
                                styles.headerTopLine,
                                { backgroundColor: colorMovimiento },
                            ]}
                        />

                        <View style={styles.headerContent}>
                            <View
                                style={[
                                    styles.headerIconBox,
                                    {
                                        backgroundColor:
                                            movimiento === 'entrada'
                                                ? '#DCFCE7'
                                                : '#FEE2E2',
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="swap-horizontal-outline"
                                    size={24}
                                    color={colorMovimiento}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>
                                    GESTACIÓN
                                </Text>

                                <Text style={styles.title}>
                                    Movimiento animal
                                </Text>

                                <Text style={styles.subtitle}>
                                    Realiza entradas y salidas manuales por teclado.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Tipo de movimiento
                        </Text>

                        <View style={styles.segment}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setMovimiento('entrada')}
                                style={[
                                    styles.segmentButton,
                                    movimiento === 'entrada' && {
                                        backgroundColor: '#DCFCE7',
                                        borderColor: GREEN,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="enter-outline"
                                    size={22}
                                    color={movimiento === 'entrada' ? GREEN : MUTED}
                                />

                                <Text
                                    style={[
                                        styles.segmentText,
                                        movimiento === 'entrada' && {
                                            color: GREEN,
                                        },
                                    ]}
                                >
                                    Entrada
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setMovimiento('salida')}
                                style={[
                                    styles.segmentButton,
                                    movimiento === 'salida' && {
                                        backgroundColor: '#FEE2E2',
                                        borderColor: RED,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name="exit-outline"
                                    size={22}
                                    color={movimiento === 'salida' ? RED : MUTED}
                                />

                                <Text
                                    style={[
                                        styles.segmentText,
                                        movimiento === 'salida' && {
                                            color: RED,
                                        },
                                    ]}
                                >
                                    Salida
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Buscar animal
                        </Text>

                        {movimiento === 'entrada' ? (
                            <>
                                <Text style={styles.helperText}>
                                    Introduce el corral de destino y el ID del animal.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Corral</Text>

                                    <View style={styles.inputBox}>
                                        <Ionicons
                                            name="home-outline"
                                            size={24}
                                            color={PURPLE}
                                        />

                                        <TextInput
                                            value={corralEntrada}
                                            onChangeText={setCorralEntrada}
                                            placeholder=""
                                            placeholderTextColor="#6B7280"
                                            keyboardType="number-pad"
                                            autoCorrect={false}
                                            style={styles.input}
                                            onFocus={hacerScrollAlFinal}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>ID Animal</Text>

                                    <View style={styles.inputBox}>
                                        <Ionicons
                                            name="finger-print-outline"
                                            size={24}
                                            color={PURPLE}
                                        />

                                        <TextInput
                                            value={idEntrada}
                                            onChangeText={setIdEntrada}
                                            placeholder=""
                                            placeholderTextColor="#6B7280"
                                            keyboardType="default"
                                            autoCorrect={false}
                                            style={styles.input}
                                            onFocus={hacerScrollAlFinal}
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.helperText}>
                                    Introduce el ID del animal para hacer la salida de gestación.
                                </Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>ID Animal</Text>

                                    <View style={styles.inputBox}>
                                        <Ionicons
                                            name="finger-print-outline"
                                            size={24}
                                            color={PURPLE}
                                        />

                                        <TextInput
                                            value={valorSalida}
                                            onChangeText={setValorSalida}
                                            placeholder=""
                                            placeholderTextColor="#6B7280"
                                            keyboardType="default"
                                            autoCorrect={false}
                                            style={styles.input}
                                            onFocus={hacerScrollAlFinal}
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        disabled={!puedeAceptar || enviandoMovimiento}
                        onPress={aceptarMovimiento}
                        style={[
                            styles.acceptButton,
                            {
                                backgroundColor:
                                    puedeAceptar && !enviandoMovimiento
                                        ? colorMovimiento
                                        : '#CBD5E1',
                            },
                        ]}
                    >
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={22}
                            color="#FFFFFF"
                        />

                        <Text style={styles.acceptButtonText}>
                            {enviandoMovimiento ? 'Enviando...' : 'Aceptar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalConfirmacionVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalConfirmacionVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View
                            style={[
                                styles.modalIconBox,
                                {
                                    backgroundColor:
                                        movimiento === 'entrada'
                                            ? '#DCFCE7'
                                            : '#FEE2E2',
                                },
                            ]}
                        >
                            <Ionicons
                                name={
                                    movimiento === 'entrada'
                                        ? 'enter-outline'
                                        : 'exit-outline'
                                }
                                size={32}
                                color={colorMovimiento}
                            />
                        </View>

                        <Text style={styles.modalTitle}>
                            {movimiento === 'entrada'
                                ? 'Confirmar entrada'
                                : 'Confirmar salida'}
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            Revisa los datos antes de enviar el movimiento.
                        </Text>

                        <View style={styles.modalInfoBox}>
                            <Text style={styles.modalInfoLabel}>
                                Tipo
                            </Text>

                            <Text style={styles.modalInfoValue}>
                                {movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                            </Text>
                        </View>

                        {movimiento === 'entrada' ? (
                            <>
                                <View style={styles.modalInfoBox}>
                                    <Text style={styles.modalInfoLabel}>
                                        Corral
                                    </Text>

                                    <Text style={styles.modalInfoValue}>
                                        {corralEntrada.trim()}
                                    </Text>
                                </View>

                                <View style={styles.modalInfoBox}>
                                    <Text style={styles.modalInfoLabel}>
                                        ID Animal
                                    </Text>

                                    <Text style={styles.modalInfoValue}>
                                        {idEntrada.trim()}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.modalInfoBox}>
                                <Text style={styles.modalInfoLabel}>
                                    ID Animal
                                </Text>

                                <Text style={styles.modalInfoValue}>
                                    {valorSalida.trim()}
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalConfirmacionVisible(false)}
                                style={styles.modalCancelButton}
                            >
                                <Text style={styles.modalCancelText}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={confirmarMovimiento}
                                style={[
                                    styles.modalAcceptButton,
                                    { backgroundColor: colorMovimiento },
                                ]}
                            >
                                <Text style={styles.modalAcceptText}>
                                    Aceptar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={modalMensajeVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalMensajeVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalMessageCard}>
                        <View
                            style={[
                                styles.modalMessageIconBox,
                                {
                                    backgroundColor:
                                        modalMensajeTipo === 'success'
                                            ? '#DCFCE7'
                                            : '#FEE2E2',
                                },
                            ]}
                        >
                            <Ionicons
                                name={
                                    modalMensajeTipo === 'success'
                                        ? 'checkmark-circle-outline'
                                        : 'alert-circle-outline'
                                }
                                size={42}
                                color={
                                    modalMensajeTipo === 'success'
                                        ? GREEN
                                        : RED
                                }
                            />
                        </View>

                        <Text style={styles.modalMessageTitle}>
                            {modalMensajeTitulo}
                        </Text>

                        <Text style={styles.modalMessageText}>
                            {modalMensajeTexto}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[
                                styles.modalMessageButton,
                                {
                                    backgroundColor:
                                        modalMensajeTipo === 'success'
                                            ? GREEN
                                            : RED,
                                },
                            ]}
                            onPress={() => setModalMensajeVisible(false)}
                        >
                            <Text style={styles.modalMessageButtonText}>
                                Aceptar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 260,
    },

    content: {
        width: '100%',
        maxWidth: 390,
        alignSelf: 'center',
    },

    headerCard: {
        backgroundColor: CARD,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    headerTopLine: {
        height: 5,
    },

    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },

    headerIconBox: {
        width: 50,
        height: 50,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    smallLabel: {
        color: PURPLE,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.3,
        marginBottom: 3,
    },

    title: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
    },

    subtitle: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        marginTop: 4,
    },

    card: {
        backgroundColor: CARD,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.045,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },

    sectionTitle: {
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
        marginBottom: 12,
    },

    helperText: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 12,
    },

    segment: {
        flexDirection: 'row',
        gap: 10,
    },

    segmentButton: {
        flex: 1,
        minHeight: 72,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },

    segmentText: {
        color: MUTED,
        fontSize: 15,
        fontWeight: '900',
    },

    inputGroup: {
        marginTop: 10,
    },

    inputLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: TEXT,
        marginBottom: 6,
        marginLeft: 4,
    },

    inputBox: {
        height: 58,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
    },

    input: {
        flex: 1,
        marginLeft: 10,
        color: TEXT,
        fontSize: 18,
        fontWeight: '800',
    },

    acceptButton: {
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    modalCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: CARD,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },

    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },

    modalTitle: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
    },

    modalSubtitle: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 19,
        marginTop: 6,
        marginBottom: 16,
    },

    modalInfoBox: {
        width: '100%',
        minHeight: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginBottom: 8,
    },

    modalInfoLabel: {
        color: MUTED,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },

    modalInfoValue: {
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
        marginTop: 2,
    },

    modalButtons: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },

    modalCancelButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalCancelText: {
        color: MUTED,
        fontSize: 15,
        fontWeight: '900',
    },

    modalAcceptButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalAcceptText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },

    modalMessageCard: {
        width: '88%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER,
    },

    modalMessageIconBox: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    modalMessageTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
        marginBottom: 10,
    },

    modalMessageText: {
        fontSize: 16,
        fontWeight: '700',
        color: MUTED,
        textAlign: 'center',
        lineHeight: 23,
    },

    modalMessageButton: {
        width: '100%',
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },

    modalMessageButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
});