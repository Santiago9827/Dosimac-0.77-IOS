import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Modal,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApiMovilVersionStore } from '../../stores/useApiMovilVersionStore';

import {
    obtenerBaseUrlGuardada,
    validarInstalacionActiva,
} from '../../stores/ipConfig';

import { useAuthStore } from '../../stores/authStore';

const TEXT = '#0F172A';
const MUTED = '#64748B';
const BG = '#F6F8FC';
const BRAND = '#4C1D95';

type TipoBloqueo =
    | 'ip'
    | 'login'
    | 'permiso'
    | 'conexion'
    | 'sesion'
    | 'version';
function GeneralCard({
    titulo,
    descripcion,
    icono,
    color,
    fondoIcono,
    onPress,
    disabled = false,
}: {
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    fondoIcono: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.card,
                disabled && styles.cardDisabled,
            ]}
        >
            <View style={[styles.cardTopLine, { backgroundColor: color }]} />

            <View style={styles.cardBody}>
                <View style={[styles.iconCircle, { backgroundColor: fondoIcono }]}>
                    <Ionicons
                        name={icono}
                        size={28}
                        color={color}
                    />
                </View>

                <Text style={styles.cardTitle}>{titulo}</Text>
                <Text style={styles.cardDesc}>{descripcion}</Text>
            </View>
        </TouchableOpacity>
    );
}

export const GeneralHomeScreen = ({ navigation }: any) => {
    const { t } = useTranslation();

    const [validandoConexion, setValidandoConexion] = useState(false);
    const [hayIpConfigurada, setHayIpConfigurada] = useState(false);

    const [modalIpVisible, setModalIpVisible] = useState(false);
    const [tipoBloqueo, setTipoBloqueo] = useState<TipoBloqueo>('ip');

    const [mostrarConectando, setMostrarConectando] = useState(false);
    const timeoutConectandoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const token = useAuthStore((s) => s.token);
    const isHydrated = useAuthStore((s) => s.isHydrated);
    const rol = useAuthStore((s) => s.rol ?? []);

    const esAdmin = rol.includes('admin');


    const consultarVersionApiMovil = useApiMovilVersionStore(
        s => s.consultarVersionApiMovil,
    );

    const limpiarVersionActual = useApiMovilVersionStore(
        s => s.limpiarVersionActual,
    );

    const compatibleActual = useApiMovilVersionStore(
        s => s.compatibleActual,
    );

    const versionComprobada = useApiMovilVersionStore(
        s => s.versionComprobada,
    );

    const errorVersion = useApiMovilVersionStore(
        s => s.errorVersion,
    );
    const mostrarAvisoServidorDesactualizado =
        hayIpConfigurada &&
        versionComprobada &&
        !compatibleActual;

    const comprobarIpConfigurada = useCallback(async () => {
        const baseUrlGuardada = await obtenerBaseUrlGuardada();
        const existeIp = !!baseUrlGuardada;

        setHayIpConfigurada(existeIp);

        if (!existeIp) {
            limpiarVersionActual();
        }

        return existeIp;
    }, [limpiarVersionActual]);

    useFocusEffect(
        useCallback(() => {
            const comprobarEstadoPantalla = async () => {
                const existeIp = await comprobarIpConfigurada();

                if (!existeIp) {
                    return;
                }

                await consultarVersionApiMovil();
            };

            comprobarEstadoPantalla();
        }, [comprobarIpConfigurada, consultarVersionApiMovil])
    );
    useEffect(() => {
        return () => {
            if (timeoutConectandoRef.current) {
                clearTimeout(timeoutConectandoRef.current);
            }
        };
    }, []);

    const abrirModalBloqueo = (tipo: TipoBloqueo) => {
        setTipoBloqueo(tipo);
        setModalIpVisible(true);
    };

    const navegarSiHayIp = async (
        pantalla: string,
        requiereAdmin = false
    ) => {
        if (validandoConexion) return;

        const existeIp = await comprobarIpConfigurada();

        if (!existeIp) {
            abrirModalBloqueo('ip');
            return;
        }

        try {
            setValidandoConexion(true);

            timeoutConectandoRef.current = setTimeout(() => {
                setMostrarConectando(true);
            }, 700);

            const conexion = await validarInstalacionActiva();


            if (!conexion.ok) {
                abrirModalBloqueo('conexion');
                return;
            }

            const infoVersion = await consultarVersionApiMovil();

            if (!infoVersion.compatible) {
                abrirModalBloqueo('version');
                return;
            }

            if (!isHydrated) {
                abrirModalBloqueo('sesion');
                return;
            }

            if (!token) {
                abrirModalBloqueo('login');
                return;
            }

            if (requiereAdmin && !esAdmin) {
                abrirModalBloqueo('permiso');
                return;
            }

            navigation.navigate(pantalla);
        } catch (error: any) {
            abrirModalBloqueo('conexion');
        } finally {
            if (timeoutConectandoRef.current) {
                clearTimeout(timeoutConectandoRef.current);
                timeoutConectandoRef.current = null;
            }

            setMostrarConectando(false);
            setValidandoConexion(false);
        }
    };

    const tituloModal =
        tipoBloqueo === 'ip'
            ? t('generalHome.modalApplicationNotConfiguredTitle')
            : tipoBloqueo === 'login'
                ? t('generalHome.modalNoSessionTitle')
                : tipoBloqueo === 'conexion'
                    ? t('generalHome.modalInstallationUnavailableTitle')
                    : tipoBloqueo === 'sesion'
                        ? t('generalHome.modalPreparingSessionTitle')
                        : tipoBloqueo === 'version'
                            ? t('generalHome.modalServerOutdatedTitle', {
                                defaultValue: 'Servidor CTIFEED desactualizado',
                            })
                            : t('generalHome.modalReadOnlyPermissionTitle');

    const textoModal =
        tipoBloqueo === 'ip'
            ? t('generalHome.modalApplicationNotConfiguredText')
            : tipoBloqueo === 'login'
                ? t('generalHome.modalNoSessionText')
                : tipoBloqueo === 'conexion'
                    ? t('generalHome.modalInstallationUnavailableText')
                    : tipoBloqueo === 'sesion'
                        ? t('generalHome.modalPreparingSessionText')
                        : tipoBloqueo === 'version'
                            ? errorVersion ||
                            t('generalHome.modalServerOutdatedText', {
                                defaultValue:
                                    'Es necesario actualizar el servidor CTIFEED para usar esta funcionalidad.',
                            })
                            : t('generalHome.modalReadOnlyPermissionText');
    const iconoModal =
        tipoBloqueo === 'permiso' || tipoBloqueo === 'version'
            ? 'warning-outline'
            : tipoBloqueo === 'login'
                ? 'person-circle-outline'
                : 'business-outline';

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.cardsWrapper}>
                    {mostrarAvisoServidorDesactualizado && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => abrirModalBloqueo('version')}
                            style={styles.versionWarningCard}
                        >
                            <View style={styles.versionWarningIconBox}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={28}
                                    color="#DC2626"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.versionWarningText}>
                                    {errorVersion ||
                                        t('generalHome.modalServerOutdatedText', {
                                            defaultValue:
                                                'Es necesario actualizar el servidor CTIFEED para usar esta funcionalidad.',
                                        })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    <GeneralCard
                        titulo={t('generalHome.movementAnimalTitle')}
                        descripcion={t('generalHome.readerDescription')}
                        icono="radio-outline"
                        color="#0F766E"
                        fondoIcono="#DDF3EF"
                        disabled={validandoConexion}
                        onPress={() => navegarSiHayIp('GeneralLecturaAntena')}
                    />

                    <GeneralCard
                        titulo={t('generalHome.movementAnimalTitle')}
                        descripcion={t('generalHome.keyboardDescription')}
                        icono="swap-horizontal-outline"
                        color="#4338CA"
                        fondoIcono="#E0E7FF"
                        disabled={validandoConexion}
                        onPress={() => navegarSiHayIp('MovimientoAnimal', true)}
                    />

                    <GeneralCard
                        titulo={t('generalHome.ctifeedTitle')}
                        descripcion={t('generalHome.ctifeedDescription')}
                        icono="enter-outline"
                        color="#2F6BFF"
                        fondoIcono="#DCE8FF"
                        disabled={validandoConexion}
                        onPress={() => navegarSiHayIp('GeneralPortal')}
                    />
                </View>
            </ScrollView>

            <Modal
                visible={modalIpVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalIpVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconCircle}>
                            <Ionicons
                                name={iconoModal}
                                size={34}
                                color={BRAND}
                            />
                        </View>

                        <Text style={styles.modalTitle}>
                            {tituloModal}
                        </Text>

                        <Text style={styles.modalText}>
                            {textoModal}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.modalButton}
                            onPress={() => setModalIpVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>
                                {t('generalHome.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={mostrarConectando}
                transparent
                animationType="fade"
            >
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color={BRAND} />

                        <Text style={styles.loadingTitle}>
                            {t('generalHome.connectingTitle')}
                        </Text>

                        <Text style={styles.loadingText}>
                            {t('generalHome.connectingText')}
                        </Text>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },

    scroll: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 90,
    },

    cardsWrapper: {
        gap: 18,
        width: '100%',
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    cardDisabled: {
        opacity: 0.65,
    },

    cardTopLine: {
        height: 6,
    },

    cardBody: {
        paddingVertical: 26,
        paddingHorizontal: 18,
        alignItems: 'center',
    },

    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
        marginBottom: 5,
    },

    cardDesc: {
        fontSize: 17,
        fontWeight: '700',
        color: MUTED,
        textAlign: 'center',
        lineHeight: 23,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    modalCard: {
        width: '100%',
        maxWidth: 390,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 22,
        paddingVertical: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
    },

    modalIconCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: '#F1EAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    modalTitle: {
        fontSize: 27,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
        marginBottom: 12,
    },

    modalText: {
        fontSize: 17,
        lineHeight: 25,
        fontWeight: '700',
        color: MUTED,
        textAlign: 'center',
        marginBottom: 24,
    },

    modalButton: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '900',
    },

    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    loadingCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    loadingTitle: {
        marginTop: 16,
        fontSize: 23,
        fontWeight: '900',
        color: TEXT,
        textAlign: 'center',
    },

    loadingText: {
        marginTop: 8,
        fontSize: 15,
        fontWeight: '700',
        color: MUTED,
        textAlign: 'center',
        lineHeight: 21,
    },
    versionWarningCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FECACA',
        paddingHorizontal: 15,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#991B1B',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    versionWarningIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    versionWarningText: {
        color: '#7F1D1D',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
});