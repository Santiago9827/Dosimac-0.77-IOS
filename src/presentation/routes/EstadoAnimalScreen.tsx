/* eslint-disable prettier/prettier */
import React, { useMemo, useRef, useState } from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Keyboard,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Modal,
} from 'react-native';
import {
    consultarMaternidadPorId,
    consultarMaternidadPorCorral,
    consultarCurvas,
    consultarGestacionPorIdAnimal,
} from '../../stores/apiApp';

import { mapearMaternidadADetalleAnimal } from '../../stores/mapearMaternidadADetalleAnimal';

import { TextInput } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

type TipoBusquedaEstado =
    | 'corral'
    | 'idAutomatico';

type CurvaApi = {
    id: number;
    name: string;
};

const obtenerIdCurva = (datosApi: any) => {
    return Number(
        datosApi?.animal?.curveId ??
        datosApi?.curveId ??
        -1,
    );
};

const obtenerNombreCurva = (
    curvas: CurvaApi[],
    curveId: number,
) => {
    const curvaEncontrada = curvas.find(
        curva => Number(curva.id) === Number(curveId),
    );

    return curvaEncontrada?.name ?? '—';
};

const esErrorNoEncontrado = (error: any) => {
    const mensaje = String(error?.message ?? error ?? '')
        .trim()
        .toLowerCase();

    return (
        mensaje.includes('no encontrado') ||
        mensaje.includes('not found') ||
        mensaje.includes('404') ||
        mensaje.includes('400')
    );
};

const BRAND = '#4C1D95';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BG = '#F8FAFC';
const BORDER = '#E5E7EB';
const GREEN = '#0F766E';
const CARD = '#FFFFFF';

export const EstadoAnimalScreen = ({ navigation }: any) => {
    const { t } = useTranslation();

    const [tipoBusqueda, setTipoBusqueda] =
        useState<TipoBusquedaEstado>('corral');

    const [valor, setValor] = useState('');
    const [cargando, setCargando] = useState(false);

    const [error, setError] = useState('');
    const [modalErrorVisible, setModalErrorVisible] =
        useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const puedeContinuar = useMemo(() => {
        return valor.trim().length > 0;
    }, [valor]);

    const obtenerNombreCurvaDesdeApi = async (datosApi: any) => {
    let nombreCurva = '—';

    try {
        const curvas = await consultarCurvas();
        const curveId = obtenerIdCurva(datosApi);

        nombreCurva = Array.isArray(curvas)
            ? obtenerNombreCurva(curvas, curveId)
            : '—';

        console.log('CurveId:', curveId);
        console.log('Nombre curva:', nombreCurva);
    } catch (errorCurvas) {
        console.log(
            'No se pudo consultar el nombre de la curva:',
            errorCurvas,
        );
    }

    return nombreCurva;
};

const navegarDetalleMaternidad = async (
    datosApi: any,
    valorLimpio: string,
) => {
    const nombreCurva = await obtenerNombreCurvaDesdeApi(datosApi);

    const datosDetalle = mapearMaternidadADetalleAnimal(
        datosApi,
        nombreCurva,
    );

    const corralId = Number(
        datosApi?.animal?.corralName ?? valorLimpio,
    );

    navigation.navigate('EstadoAnimalDetalle', {
        corralId: Number.isFinite(corralId)
            ? corralId
            : undefined,
        mockData: datosDetalle,
        datosMaternidad: datosApi,
        origen: 'estadoAnimal',
    });
};

const navegarDetalleGestacion = async (datosGestacion: any) => {
    const nombreCurvaGestacion =
        await obtenerNombreCurvaDesdeApi(datosGestacion);

    const datosGestacionConCurva = {
        ...datosGestacion,
        curveName: nombreCurvaGestacion,
        animal: {
            ...(datosGestacion?.animal ?? {}),
            curveName: nombreCurvaGestacion,
        },
    };

    const corralIdGestacion = Number(
        datosGestacionConCurva?.animal?.corralName ??
        datosGestacionConCurva?.corral ??
        0,
    );

    navigation.navigate('GestCorralDetail', {
        corralId: Number.isFinite(corralIdGestacion)
            ? corralIdGestacion
            : undefined,
        datosGestacion: datosGestacionConCurva,
        origen: 'estadoAnimalGestacion',
    });
};

const buscarPorIdAutomatico = async (valorLimpio: string) => {
    let errorMaternidad: any = null;
    let errorGestacion: any = null;

    try {
        const datosMaternidad =
            await consultarMaternidadPorId(valorLimpio);

        await navegarDetalleMaternidad(
            datosMaternidad,
            valorLimpio,
        );

        return;
    } catch (errorMat: any) {
        errorMaternidad = errorMat;

        console.log(
            'No encontrado en maternidad o error consultando maternidad:',
            errorMat,
        );
    }

    try {
        const datosGestacion =
            await consultarGestacionPorIdAnimal(valorLimpio);

        await navegarDetalleGestacion(datosGestacion);

        return;
    } catch (errorGest: any) {
        errorGestacion = errorGest;

        console.log(
            'No encontrado en gestación o error consultando gestación:',
            errorGest,
        );
    }

    const ambosSonNoEncontrado =
        esErrorNoEncontrado(errorMaternidad) &&
        esErrorNoEncontrado(errorGestacion);

    if (ambosSonNoEncontrado) {
        throw new Error(t('estadoAnimal.animalNotFound'));
    }

    throw new Error(
        errorGestacion?.message ||
        errorMaternidad?.message ||
        t('estadoAnimal.serverConnectionError'),
    );
};

    const buscarEstadoAnimal = async () => {
    Keyboard.dismiss();

    const valorLimpio = valor.trim();

    if (!valorLimpio || cargando) {
        Alert.alert(
            t('estadoAnimal.requiredData'),
            tipoBusqueda === 'corral'
                ? t('estadoAnimal.enterCorral')
                : t('estadoAnimal.enterId'),
        );

        return;
    }

    try {
        setCargando(true);

        if (tipoBusqueda === 'idAutomatico') {
            await buscarPorIdAutomatico(valorLimpio);
            return;
        }

        const datosMaternidadCorral =
            await consultarMaternidadPorCorral(valorLimpio);

        await navegarDetalleMaternidad(
            datosMaternidadCorral,
            valorLimpio,
        );
    } catch (error: any) {
        console.log('Error consultando estado animal:', error);

        setError(
            error?.message === 'No hay IP configurada' ||
                error?.message === 'NO_IP_CONFIGURADA'
                ? t('estadoAnimal.noIpConfigured', {
                    defaultValue: 'No hay IP configurada.',
                })
                : error?.message ||
                t('estadoAnimal.serverConnectionError'),
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
        tipo: TipoBusquedaEstado;
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
                        backgroundColor: '#FFFFFF',
                        borderColor: activo ? color : BORDER,
                        borderWidth: activo ? 2 : 1,
                    },
                ]}
            >
                {activo && (
                    <View
                        style={[
                            styles.optionAccent,
                            { backgroundColor: color },
                        ]}
                    />
                )}

                <View style={styles.optionHeaderRow}>
                    <View
                        style={[
                            styles.optionIconBox,
                            {
                                backgroundColor: activo
                                    ? '#FFFFFF'
                                    : fondo,
                            },
                        ]}
                    >
                        <Ionicons
                            name={icono}
                            size={23}
                            color={color}
                        />
                    </View>

                   {tipo === 'idAutomatico' ? (
    <View style={styles.optionTitleDouble}>
        <Text style={styles.optionTitleBigLine}>
            ID
        </Text>

        <Text style={styles.optionTitleBigLine}>
            Animal
        </Text>
    </View>
) : tipo === 'corral' ? (
    <View style={styles.optionTitleDouble}>
        <Text style={styles.optionTitleBigLine}>
            Corral
        </Text>

        <Text style={styles.optionTitleBigLine}>
            Maternidad
        </Text>
    </View>
) : (
    <Text style={styles.optionTitle}>
        {titulo}
    </Text>
)}
                </View>

                <Text style={styles.optionDescription}>
                    {descripcion}
                </Text>

                <View
                    style={[
                        styles.checkCircle,
                        {
                            backgroundColor: activo
                                ? color
                                : '#E5E7EB',
                        },
                    ]}
                >
                    {activo && (
                        <Ionicons
                            name="checkmark-outline"
                            size={16}
                            color="#FFFFFF"
                        />
                    )}
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
                                    name="pulse-outline"
                                    size={25}
                                    color={GREEN}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.smallLabel}>
                                    {t('estadoAnimal.queryLabel')}
                                </Text>

                                <Text style={styles.title}>
                                    {t('estadoAnimal.title')}
                                </Text>

                                <Text style={styles.subtitle}>
                                    {t('estadoAnimal.subtitle')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsBox}>
                       <OpcionBusqueda
    tipo="corral"
    titulo={t('estadoAnimal.corral')}
    descripcion={t('estadoAnimal.corralMaternityDescription', {
        defaultValue: 'Introduce el número del corral de maternidad.',
    })}
    icono="home-outline"
    color={GREEN}
    fondo="#DDF3EF"
/>

<OpcionBusqueda
    tipo="idAutomatico"
    titulo={t('estadoAnimal.animalId')}
    descripcion={t('estadoAnimal.idAnimalDescription', {
        defaultValue: 'Busca en maternidad y gestación.',
    })}
    icono="search-outline"
    color="#2563EB"
    fondo="#DBEAFE"
/>
                    </View>

                    <View style={styles.inputCard}>
                        <Text style={styles.inputLabel}>
                            {tipoBusqueda === 'corral'
                                ? t('estadoAnimal.corral')
                                : t('estadoAnimal.animalId')}
                        </Text>

                        <TextInput
                            mode="outlined"
                            value={valor}
                            onChangeText={texto =>  {
                                setValor(texto);
                                if (error) setError('');
                            }}
                            onFocus={() => {
                                setTimeout(() => {
                                    scrollRef.current?.scrollToEnd({
                                        animated: true,
                                    });
                                }, 300);
                            }}
                            placeholder=""
                            placeholderTextColor="#A0AEC0"
                            keyboardType={
                                tipoBusqueda === 'corral'
                                    ? 'number-pad'
                                    : 'default'
                            }
                            autoCapitalize="characters"
                            autoCorrect={false}
                            outlineColor={BORDER}
                            activeOutlineColor={BRAND}
                            textColor={TEXT}
                            style={styles.textInput}
                            outlineStyle={styles.textInputOutline}
                            contentStyle={styles.textInputContent}
                            left={
                                <TextInput.Icon
                                   icon={
    tipoBusqueda === 'corral'
        ? 'home-outline'
        : 'search-outline'
}
                                    color={BRAND}
                                />
                            }
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        disabled={!puedeContinuar || cargando}
                        onPress={buscarEstadoAnimal}
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
                                ? t('estadoAnimal.consulting')
                                : t('estadoAnimal.continue')}
                        </Text>
                    </TouchableOpacity>

                    <Modal
                        visible={modalErrorVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() =>
                            setModalErrorVisible(false)
                        }
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
                                        {t('estadoAnimal.accept')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </View>
            </ScrollView>
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
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#DDF3EF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    smallLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: GREEN,
        letterSpacing: 1.3,
        marginBottom: 3,
        textTransform: 'uppercase',
    },

    title: {
        fontSize: 25,
        fontWeight: '900',
        color: TEXT,
    },

    subtitle: {
        marginTop: 4,
        fontSize: 15,
        color: MUTED,
        fontWeight: '700',
        lineHeight: 21,
    },

    optionsBox: {
        marginTop: 4,
        flexDirection: 'row',
        gap: 10,
    },

    optionCard: {
        flex: 1,
        position: 'relative',
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 12,
        minHeight: 106,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
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
        right: 0,
        top: 0,
        height: 6,
    },

   optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
},
    optionIconBox: {
        width: 37,
        height: 37,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    optionTitle: {
        color: TEXT,
        fontSize: 23,
        fontWeight: '900',
        textAlign: 'center',
    },

    optionDescription: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 16,
        textAlign: 'center',
    },

    checkCircle: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 25,
        height: 25,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },

    inputCard: {
        marginTop: 14,
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
        fontSize: 17,
        fontWeight: '900',
        marginBottom: 8,
    },

    textInput: {
        backgroundColor: '#FFFFFF',
        height: 52,
    },

    textInputOutline: {
        borderRadius: 15,
    },

    textInputContent: {
        fontSize: 17,
        fontWeight: '700',
    },

    continueButton: {
        marginTop: 18,
        height: 56,
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
    optionTitleDouble: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
},

optionTitleBigLine: {
    width: '100%',
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
},
});