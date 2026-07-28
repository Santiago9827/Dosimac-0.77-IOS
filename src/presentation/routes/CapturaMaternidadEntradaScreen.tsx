import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    StyleSheet,
    Modal,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import {
    consultarMaternidadPorId,
    consultarMaternidadPorCorral,
} from '../../stores/apiApp';

type TipoBusqueda = 'corral' | 'id';

const BRAND = '#4C1D95';
const GREEN = '#0F766E';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E5E7EB';
const BG = '#F8FAFC';
const CARD = '#FFFFFF';

export const CapturaMaternidadEntradaScreen = ({
    navigation,
    route,
}: any) => {
    const { t } = useTranslation();

    const [tipoBusqueda, setTipoBusqueda] =
        useState<TipoBusqueda>('corral');

    const [valor, setValor] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [modalErrorVisible, setModalErrorVisible] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const tituloPantalla =
        route?.params?.tituloPantalla ??
        t('capturaMaternidadEntrada.title', {
            defaultValue: 'Captura de parto',
        });

    const descripcionPantalla =
        route?.params?.descripcionPantalla ??
        t('capturaMaternidadEntrada.description', {
            defaultValue:
                'Busca el animal por corral o por ID para registrar el parto.',
        });

    const siguientePantalla =
        route?.params?.siguientePantalla ?? 'CapturaPartoFormulario';

    const puedeContinuar = useMemo(() => {
        return valor.trim().length > 0;
    }, [valor]);

    const continuar = async () => {
        Keyboard.dismiss();

        const valorLimpio = valor.trim();

        if (!valorLimpio || cargando) {
            return;
        }

        try {
            setCargando(true);
            setError('');

            const datosApi =
                tipoBusqueda === 'id'
                    ? await consultarMaternidadPorId(valorLimpio)
                    : await consultarMaternidadPorCorral(valorLimpio);

            console.log('Respuesta captura parto:', datosApi);

            const animalApi = datosApi?.animal ?? {};

            const idBackend =
                animalApi?.animalId !== null &&
                    animalApi?.animalId !== undefined &&
                    String(animalApi.animalId).trim() !== ''
                    ? String(animalApi.animalId)
                    : tipoBusqueda === 'id'
                        ? valorLimpio
                        : '';

            const corralBackend =
                animalApi?.corralName !== null &&
                    animalApi?.corralName !== undefined &&
                    String(animalApi.corralName).trim() !== ''
                    ? String(animalApi.corralName)
                    : tipoBusqueda === 'corral'
                        ? valorLimpio
                        : '';

            navigation.navigate(siguientePantalla, {
                tipoBusqueda,
                corral: corralBackend,
                id: idBackend,
                datosMaternidad: datosApi,
            });
        } catch (err: any) {
            console.log('Error consultando captura parto:', err);

            setError(
                err?.message ??
                t('capturaMaternidadEntrada.serverConnectionError', {
                    defaultValue:
                        'No se pudo conectar con el servidor.',
                }),
            );

            setModalErrorVisible(true);
        } finally {
            setCargando(false);
        }
    };

    const OpcionBusqueda = ({
        tipo,
        titulo,
        descripcion,
        icono,
        color,
        fondo,
    }: {
        tipo: TipoBusqueda;
        titulo: string;
        descripcion: string;
        icono: string;
        color: string;
        fondo: string;
    }) => {
        const activo = tipoBusqueda === tipo;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    setTipoBusqueda(tipo);
                    setValor('');
                    setError('');
                }}
                style={[
                    styles.optionCard,
                    {
                        borderColor: activo ? color : BORDER,
                        borderWidth: activo ? 2 : 1,
                    },
                ]}
            >
                {activo ? (
                    <View
                        style={[
                            styles.optionAccent,
                            {
                                backgroundColor: color,
                            },
                        ]}
                    />
                ) : null}

                <View
                    style={[
                        styles.optionIconBox,
                        {
                            backgroundColor: activo ? '#FFFFFF' : fondo,
                        },
                    ]}
                >
                    <Ionicons
                        name={icono}
                        size={25}
                        color={color}
                    />
                </View>

                <View style={styles.optionTextBox}>
                    <Text style={styles.optionTitle}>
                        {titulo}
                    </Text>

                    <Text style={styles.optionDescription}>
                        {descripcion}
                    </Text>
                </View>

                <View
                    style={[
                        styles.checkCircle,
                        {
                            backgroundColor: activo ? color : '#E5E7EB',
                        },
                    ]}
                >
                    {activo ? (
                        <Ionicons
                            name="checkmark-outline"
                            size={16}
                            color="#FFFFFF"
                        />
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.headerCard}>
                        <View style={styles.headerTopLine} />

                        <View style={styles.headerContent}>
                            <View style={styles.smallIconBox}>
                                <Ionicons
                                    name="clipboard-outline"
                                    size={22}
                                    color={GREEN}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>
                                    {t('capturaMaternidadEntrada.maternityLabel', {
                                        defaultValue: 'MATERNIDAD',
                                    })}
                                </Text>

                                <Text style={styles.title}>
                                    {tituloPantalla}
                                </Text>

                                <Text style={styles.subtitle}>
                                    {descripcionPantalla}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsBox}>
                        <OpcionBusqueda
                            tipo="corral"
                            titulo={t('capturaMaternidadEntrada.corral', {
                                defaultValue: 'Corral',
                            })}
                            descripcion={t(
                                'capturaMaternidadEntrada.corralDescription',
                                {
                                    defaultValue:
                                        'Busca el animal por el número de corral.',
                                },
                            )}
                            icono="home-outline"
                            color={GREEN}
                            fondo="#DDF3EF"
                        />

                        <OpcionBusqueda
                            tipo="id"
                            titulo={t('capturaMaternidadEntrada.id', {
                                defaultValue: 'ID',
                            })}
                            descripcion={t(
                                'capturaMaternidadEntrada.idDescription',
                                {
                                    defaultValue:
                                        'Busca el animal por su identificador.',
                                },
                            )}
                            icono="finger-print-outline"
                            color={BRAND}
                            fondo="#EEF2FF"
                        />
                    </View>

                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>
                            {tipoBusqueda === 'corral'
                                ? t('capturaMaternidadEntrada.corral', {
                                    defaultValue: 'Corral',
                                })
                                : t('capturaMaternidadEntrada.animalId', {
                                    defaultValue: 'ID animal',
                                })}
                        </Text>

                        <View style={styles.inputBox}>
                            <Ionicons
                                name={
                                    tipoBusqueda === 'corral'
                                        ? 'home-outline'
                                        : 'finger-print-outline'
                                }
                                size={22}
                                color={BRAND}
                                style={{ marginRight: 8 }}
                            />

                            <TextInput
                                value={valor}
                                onChangeText={texto => {
                                    if (tipoBusqueda === 'corral') {
                                        const soloNumeros = texto.replace(/[^0-9]/g, '');
                                        setValor(soloNumeros.slice(0, 9));
                                    } else {
                                        setValor(texto);
                                    }

                                    if (error) {
                                        setError('');
                                    }
                                }}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollRef.current?.scrollToEnd({
                                            animated: true,
                                        });
                                    }, 300);
                                }}
                                keyboardType={
                                    tipoBusqueda === 'corral'
                                        ? 'number-pad'
                                        : 'default'
                                }
                                maxLength={tipoBusqueda === 'corral' ? 9 : undefined}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                placeholder={
                                    tipoBusqueda === 'corral'
                                        ? t('capturaMaternidadEntrada.corralExample', {
                                            defaultValue: 'Ej: 102',
                                        })
                                        : t('capturaMaternidadEntrada.idExample', {
                                            defaultValue: 'Ej: 1234',
                                        })
                                }
                                placeholderTextColor="#94A3B8"
                                style={styles.textInput}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        disabled={!puedeContinuar || cargando}
                        onPress={continuar}
                        style={[
                            styles.continueButton,
                            {
                                backgroundColor:
                                    puedeContinuar && !cargando
                                        ? BRAND
                                        : '#CBD5E1',
                            },
                        ]}
                    >
                        <Text style={styles.continueButtonText}>
                            {cargando
                                ? t('capturaMaternidadEntrada.consulting', {
                                    defaultValue: 'Consultando...',
                                })
                                : t('capturaMaternidadEntrada.continue', {
                                    defaultValue: 'Continuar',
                                })}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                visible={modalErrorVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalErrorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalIconBox}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={36}
                                color="#DC2626"
                            />
                        </View>

                        <Text style={styles.modalMessage}>
                            {error}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.modalButton}
                            onPress={() => {
                                setModalErrorVisible(false);
                            }}
                        >
                            <Text style={styles.modalButtonText}>
                                {t('capturaMaternidadEntrada.accept', {
                                    defaultValue: 'Aceptar',
                                })}
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
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 260,
    },

    content: {
        width: '100%',
        maxWidth: 380,
        alignSelf: 'center',
    },

    headerCard: {
        backgroundColor: CARD,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    headerTopLine: {
        height: 5,
        backgroundColor: GREEN,
    },

    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },

    smallIconBox: {
        width: 46,
        height: 46,
        borderRadius: 17,
        backgroundColor: '#DDF3EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    smallLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: GREEN,
        letterSpacing: 1.3,
        marginBottom: 3,
    },

    title: {
        fontSize: 22,
        fontWeight: '900',
        color: TEXT,
    },

    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: MUTED,
        fontWeight: '600',
        lineHeight: 18,
    },

    optionsBox: {
        marginTop: 4,
    },

    optionCard: {
        position: 'relative',
        borderRadius: 20,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.055,
        shadowRadius: 7,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    optionAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
    },

    optionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    optionTextBox: {
        flex: 1,
    },

    optionTitle: {
        color: TEXT,
        fontSize: 18,
        fontWeight: '900',
    },

    optionDescription: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
        lineHeight: 17,
    },

    checkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },

    inputCard: {
        marginTop: 10,
        backgroundColor: CARD,
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000000',
        shadowOpacity: 0.055,
        shadowRadius: 7,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    inputLabel: {
        color: TEXT,
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 8,
    },

    inputBox: {
        minHeight: 52,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    textInput: {
        flex: 1,
        color: TEXT,
        fontSize: 17,
        fontWeight: '800',
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },

    continueButton: {
        marginTop: 18,
        height: 52,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4C1D95',
        shadowOpacity: 0.22,
        shadowRadius: 9,
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },

    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
        shadowColor: '#000000',
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 6,
        },
    },

    modalIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    modalMessage: {
        color: '#991B1B',
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 22,
    },

    modalButton: {
        width: '100%',
        height: 48,
        borderRadius: 16,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },
});