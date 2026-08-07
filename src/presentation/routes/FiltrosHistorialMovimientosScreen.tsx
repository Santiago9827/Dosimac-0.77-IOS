import React, {
    useCallback,
    useState,
} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    useFocusEffect,
} from '@react-navigation/native';
import {
    SafeAreaView,
} from 'react-native-safe-area-context';

import {
    crearFiltrosTareasIniciales,
    FiltrosTareasMovimientos,
} from '../../stores/useFiltrosTareasMovimientosStore';

import {
    useFiltrosHistorialMovimientosStore,
} from '../../stores/useFiltrosHistorialMovimientosStore';
import { useTranslation } from 'react-i18next';

/* =========================
   Colores
========================= */

const BG = '#F6F8FC';
const CARD = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';

const PURPLE = '#4C1D95';
const PURPLE_LIGHT = '#F5F3FF';
const PURPLE_BORDER = '#C4B5FD';

/* =========================
   Formatear fecha
========================= */

type ParteFecha = 'dia' | 'mes' | 'anio';

type FechaPartes = {
    dia: string;
    mes: string;
    anio: string;
};

function obtenerPartesFecha(fecha: string): FechaPartes {
    const partes = fecha.split('-');

    return {
        dia: partes[0] ?? '',
        mes: partes[1] ?? '',
        anio: partes[2] ?? '',
    };
}

function construirFecha({
    dia,
    mes,
    anio,
}: FechaPartes): string {
    if (!dia && !mes && !anio) {
        return '';
    }

    return [dia, mes, anio].filter(Boolean).join('-');
}

function normalizarParteFecha(
    parte: ParteFecha,
    texto: string,
    valorAnterior: string
): string {
    const maxLength = parte === 'anio' ? 4 : 2;

    const valor = texto
        .replace(/\D/g, '')
        .slice(0, maxLength);

    if (parte === 'dia' && valor.length === 2) {
        const dia = Number(valor);

        if (dia < 1 || dia > 31) {
            return valorAnterior;
        }
    }

    if (parte === 'mes' && valor.length === 2) {
        const mes = Number(valor);

        if (mes < 1 || mes > 12) {
            return valorAnterior;
        }
    }

    return valor;
}

function obtenerErrorFechaConcreta(fecha: string): string | null {
    const { dia, mes, anio } = obtenerPartesFecha(fecha);

    if (!dia || !mes || !anio) {
        return 'fechaCompleta';
    }

    if (dia.length !== 2) {
        return 'diaDosCifras';
    }

    if (mes.length !== 2) {
        return 'mesDosCifras';
    }

    if (anio.length !== 2 && anio.length !== 4) {
        return 'anioDosOCuatroCifras';
    }

    const diaNumero = Number(dia);
    const mesNumero = Number(mes);

    const anioNumero =
        anio.length === 2
            ? Number(`20${anio}`)
            : Number(anio);

    if (diaNumero < 1 || diaNumero > 31) {
        return 'diaRango';
    }

    if (mesNumero < 1 || mesNumero > 12) {
        return 'mesRango';
    }

    const fechaComprobacion = new Date(
        anioNumero,
        mesNumero - 1,
        diaNumero
    );

    const fechaExiste =
        fechaComprobacion.getFullYear() === anioNumero &&
        fechaComprobacion.getMonth() === mesNumero - 1 &&
        fechaComprobacion.getDate() === diaNumero;

    if (!fechaExiste) {
        return 'fechaNoExiste';
    }

    return null;
}
function normalizarFechaParaGuardar(fecha: string): string {
    const { dia, mes, anio } = obtenerPartesFecha(fecha);

    if (!dia || !mes || !anio) {
        return fecha;
    }

    const anioNormalizado =
        anio.length === 2 ? `20${anio}` : anio;

    return `${dia}-${mes}-${anioNormalizado}`;
}

/* =========================
   Opción seleccionable
========================= */

function OpcionFiltro({
    texto,
    seleccionada,
    onPress,
}: {
    texto: string;
    seleccionada: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{
                checked: seleccionada,
            }}
            onPress={onPress}
            style={[
                styles.option,
                seleccionada &&
                styles.optionSelected,
            ]}
        >
            <View
                style={[
                    styles.optionCheckbox,
                    seleccionada &&
                    styles.optionCheckboxSelected,
                ]}
            >
                {seleccionada && (
                    <Ionicons
                        name="checkmark-outline"
                        size={18}
                        color="#FFFFFF"
                    />
                )}
            </View>

            <Text
                style={[
                    styles.optionText,
                    seleccionada &&
                    styles.optionTextSelected,
                ]}
            >
                {texto}
            </Text>
        </TouchableOpacity>
    );
}

/* =========================
   Bloque de opciones
========================= */

function BloqueFiltro({
    titulo,
    icono,
    children,
}: {
    titulo: string;
    icono: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.block}>
            <View style={styles.blockHeader}>
                <View style={styles.blockIcon}>
                    <Ionicons
                        name={icono}
                        size={20}
                        color={PURPLE}
                    />
                </View>

                <Text style={styles.blockTitle}>
                    {titulo}
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                {children}
            </View>
        </View>
    );
}

/* =========================
   Campo específico
========================= */

function CampoFiltro({
    icono,
    value,
    placeholder,
    maxLength,
    keyboardType = 'number-pad',
    autoCapitalize = 'none',
    onFocus,
    onChangeText,
}: {
    icono: string;
    value: string;
    placeholder: string;
    maxLength?: number;
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
    autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
    onFocus?: () => void;
    onChangeText: (texto: string) => void;
}) {
    return (
        <View style={styles.inputContainer}>
            <Ionicons
                name={icono}
                size={19}
                color={MUTED}
            />

            <TextInput
                value={value}
                onFocus={onFocus}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
                maxLength={maxLength}
                style={styles.input}
            />
        </View>
    );
}

function CampoFechaFiltro({
    fecha,
    onFocus,
    onChangeParte,
}: {
    fecha: string;
    onFocus?: () => void;
    onChangeParte: (
        parte: ParteFecha,
        texto: string
    ) => void;
}) {
    const { t } = useTranslation();
    const partes = obtenerPartesFecha(fecha);

    return (
        <View style={styles.dateInputContainer}>
            <Ionicons
                name="calendar-outline"
                size={19}
                color={MUTED}
            />

            <TextInput
                value={partes.dia}
                onFocus={onFocus}
                onChangeText={(texto) =>
                    onChangeParte('dia', texto)
                }
                placeholder={t('filtrosHistorialMovimientos.placeholders.dia')}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={2}
                style={styles.datePartInput}
            />

            <Text style={styles.dateSeparator}>
                -
            </Text>

            <TextInput
                value={partes.mes}
                onFocus={onFocus}
                onChangeText={(texto) =>
                    onChangeParte('mes', texto)
                }
                placeholder={t('filtrosHistorialMovimientos.placeholders.mes')}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={2}
                style={styles.datePartInput}
            />

            <Text style={styles.dateSeparator}>
                -
            </Text>

            <TextInput
                value={partes.anio}
                onFocus={onFocus}
                onChangeText={(texto) =>
                    onChangeParte('anio', texto)
                }
                placeholder={t('filtrosHistorialMovimientos.placeholders.anio')}
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                style={[
                    styles.datePartInput,
                    styles.dateYearInput,
                ]}
            />
        </View>
    );
}

/* =========================
   Pantalla Historial
========================= */

export const FiltrosHistorialMovimientosScreen = ({
    navigation,
}: any) => {
    const { t } = useTranslation();
    const scrollViewRef = React.useRef<ScrollView>(null);

    const subirScrollPorTeclado = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({
                animated: true,
            });
        }, 250);
    };

    const filtrosGuardados =
        useFiltrosHistorialMovimientosStore(
            (state) => state.filtrosHistorial
        );

    const aplicarFiltros =
        useFiltrosHistorialMovimientosStore(
            (state) => state.aplicarFiltrosHistorial
        );

    const [
        filtrosTemporales,
        setFiltrosTemporales,
    ] = useState<FiltrosTareasMovimientos>(
        () => ({
            ...filtrosGuardados,
        })
    );

    useFocusEffect(
        useCallback(() => {
            setFiltrosTemporales({
                ...filtrosGuardados,
            });
        }, [filtrosGuardados])
    );

    /* =========================
       Validación
    ========================= */

    const errorFecha =
        filtrosTemporales.tipoFecha === 'concreta'
            ? obtenerErrorFechaConcreta(
                filtrosTemporales.fechaConcreta
            )
            : null;

    const fechaValida = errorFecha === null;

    const corralValido =
        filtrosTemporales.tipoCorral !== 'especifico' ||
        filtrosTemporales.corralEspecifico
            .trim()
            .length > 0;

    const animalValido =
        filtrosTemporales.tipoAnimal !== 'especifico' ||
        filtrosTemporales.idAnimalEspecifico
            .trim()
            .length > 0;

    const formularioValido =
        fechaValida &&
        corralValido &&
        animalValido;

    /* =========================
       Acciones
    ========================= */

    const cancelar = () => {
        navigation.goBack();
    };

    const aceptar = () => {
        if (!formularioValido) {
            return;
        }

        const filtrosParaGuardar: FiltrosTareasMovimientos = {
            ...filtrosTemporales,
            fechaConcreta:
                filtrosTemporales.tipoFecha === 'concreta'
                    ? normalizarFechaParaGuardar(
                        filtrosTemporales.fechaConcreta
                    )
                    : '',
        };

        aplicarFiltros(filtrosParaGuardar);

        navigation.goBack();
    };

    const limpiarFiltros = () => {
        setFiltrosTemporales(
            crearFiltrosTareasIniciales()
        );
    };

    return (
        <SafeAreaView
            style={styles.screen}
            edges={['top', 'bottom']}
        >
            <StatusBar
                barStyle="dark-content"
                backgroundColor={CARD}
            />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : 'height'
                }
                keyboardVerticalOffset={0}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={cancelar}
                        style={styles.backButton}
                    >
                        <Ionicons
                            name="arrow-back-outline"
                            size={24}
                            color={TEXT}
                        />
                    </TouchableOpacity>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>
                            {t('filtrosHistorialMovimientos.cabecera.titulo')}
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            {t('filtrosHistorialMovimientos.cabecera.subtitulo')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={limpiarFiltros}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetButtonText}>
                            {t('filtrosHistorialMovimientos.cabecera.limpiar')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    contentContainerStyle={styles.content}
                >
                    <BloqueFiltro
                        titulo={t('filtrosHistorialMovimientos.bloques.tipoMovimiento')}
                        icono="swap-horizontal-outline"
                    >
                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.todos')}
                            seleccionada={
                                filtrosTemporales.tipoMovimiento ===
                                'todos'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoMovimiento:
                                            'todos',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.entrada')}
                            seleccionada={
                                filtrosTemporales.tipoMovimiento ===
                                'entrada'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoMovimiento:
                                            'entrada',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.salida')}
                            seleccionada={
                                filtrosTemporales.tipoMovimiento ===
                                'salida'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoMovimiento:
                                            'salida',
                                    })
                                )
                            }
                        />
                    </BloqueFiltro>

                    <BloqueFiltro
                        titulo={t('filtrosHistorialMovimientos.bloques.fecha')}
                        icono="calendar-outline"
                    >
                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.todasLasFechas')}
                            seleccionada={
                                filtrosTemporales.tipoFecha ===
                                'todas'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoFecha: 'todas',
                                        fechaConcreta: '',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.hoy')}
                            seleccionada={
                                filtrosTemporales.tipoFecha ===
                                'hoy'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoFecha: 'hoy',
                                        fechaConcreta: '',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.manana')}
                            seleccionada={
                                filtrosTemporales.tipoFecha ===
                                'manana'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoFecha:
                                            'manana',
                                        fechaConcreta: '',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.fecha')}
                            seleccionada={
                                filtrosTemporales.tipoFecha ===
                                'concreta'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoFecha:
                                            'concreta',
                                    })
                                )
                            }
                        />

                        {filtrosTemporales.tipoFecha ===
                            'concreta' && (
                                <CampoFechaFiltro
                                    fecha={filtrosTemporales.fechaConcreta}
                                    onChangeParte={(parte, texto) =>
                                        setFiltrosTemporales(
                                            (actual) => {
                                                const partesActuales =
                                                    obtenerPartesFecha(
                                                        actual.fechaConcreta
                                                    );

                                                const nuevoValor =
                                                    normalizarParteFecha(
                                                        parte,
                                                        texto,
                                                        partesActuales[parte]
                                                    );

                                                const nuevasPartes = {
                                                    ...partesActuales,
                                                    [parte]: nuevoValor,
                                                };

                                                return {
                                                    ...actual,
                                                    fechaConcreta:
                                                        construirFecha(
                                                            nuevasPartes
                                                        ),
                                                };
                                            }
                                        )
                                    }
                                />
                            )}

                        {filtrosTemporales.tipoFecha ===
                            'concreta' &&
                            errorFecha && (
                                <Text style={styles.validationText}>
                                    {t(`filtrosHistorialMovimientos.validaciones.${errorFecha}`)}
                                </Text>
                            )}
                    </BloqueFiltro>

                    <BloqueFiltro
                        titulo={t('filtrosHistorialMovimientos.bloques.corral')}
                        icono="home-outline"
                    >
                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.todosLosCorrales')}
                            seleccionada={
                                filtrosTemporales.tipoCorral ===
                                'todos'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoCorral:
                                            'todos',
                                        corralEspecifico:
                                            '',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.porCorral')}
                            seleccionada={
                                filtrosTemporales.tipoCorral ===
                                'especifico'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoCorral:
                                            'especifico',
                                    })
                                )
                            }
                        />

                        {filtrosTemporales.tipoCorral ===
                            'especifico' && (
                                <CampoFiltro
                                    icono="home-outline"
                                    value={
                                        filtrosTemporales.corralEspecifico
                                    }
                                    placeholder={t('filtrosHistorialMovimientos.placeholders.introduceCorral')}
                                    maxLength={9}
                                    onFocus={subirScrollPorTeclado}
                                    onChangeText={(texto) =>
                                        setFiltrosTemporales(
                                            (actual) => ({
                                                ...actual,
                                                corralEspecifico:
                                                    texto
                                                        .replace(
                                                            /[^0-9]/g,
                                                            ''
                                                        )
                                                        .slice(
                                                            0,
                                                            9
                                                        ),
                                            })
                                        )
                                    }
                                />
                            )}

                        {filtrosTemporales.tipoCorral ===
                            'especifico' &&
                            !corralValido && (
                                <Text style={styles.validationText}>
                                    {t('filtrosHistorialMovimientos.validaciones.introduceCorral')}
                                </Text>
                            )}
                    </BloqueFiltro>

                    <BloqueFiltro
                        titulo={t('filtrosHistorialMovimientos.bloques.idAnimal')}
                        icono="paw-outline"
                    >
                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.todosLosAnimales')}
                            seleccionada={
                                filtrosTemporales.tipoAnimal ===
                                'todos'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoAnimal:
                                            'todos',
                                        idAnimalEspecifico:
                                            '',
                                    })
                                )
                            }
                        />

                        <OpcionFiltro
                            texto={t('filtrosHistorialMovimientos.opciones.porId')}
                            seleccionada={
                                filtrosTemporales.tipoAnimal ===
                                'especifico'
                            }
                            onPress={() =>
                                setFiltrosTemporales(
                                    (actual) => ({
                                        ...actual,
                                        tipoAnimal:
                                            'especifico',
                                    })
                                )
                            }
                        />

                        {filtrosTemporales.tipoAnimal ===
                            'especifico' && (
                                <CampoFiltro
                                    icono="paw-outline"
                                    value={
                                        filtrosTemporales.idAnimalEspecifico
                                    }
                                    placeholder={t('filtrosHistorialMovimientos.placeholders.introduceIdAnimal')}
                                    keyboardType="default"
                                    autoCapitalize="characters"
                                    onFocus={subirScrollPorTeclado}
                                    onChangeText={(texto) =>
                                        setFiltrosTemporales(
                                            (actual) => ({
                                                ...actual,
                                                idAnimalEspecifico:
                                                    texto.replace(
                                                        /\s/g,
                                                        ''
                                                    ),
                                            })
                                        )
                                    }
                                />
                            )}

                        {filtrosTemporales.tipoAnimal ===
                            'especifico' &&
                            !animalValido && (
                                <Text style={styles.validationText}>
                                    {t('filtrosHistorialMovimientos.validaciones.introduceIdAnimal')}
                                </Text>
                            )}
                    </BloqueFiltro>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={cancelar}
                        style={styles.cancelButton}
                    >
                        <Text style={styles.cancelButtonText}>
                            {t('filtrosHistorialMovimientos.botones.cancelar')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        disabled={!formularioValido}
                        onPress={aceptar}
                        style={[
                            styles.acceptButton,
                            !formularioValido &&
                            styles.acceptButtonDisabled,
                        ]}
                    >
                        <Ionicons
                            name="checkmark-outline"
                            size={20}
                            color="#FFFFFF"
                        />

                        <Text style={styles.acceptButtonText}>
                            {t('filtrosHistorialMovimientos.botones.aceptar')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

/* =========================
   Estilos
========================= */

const styles = StyleSheet.create({
    dateInputContainer: {
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: PURPLE_BORDER,
        backgroundColor: CARD,
        paddingHorizontal: 13,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,

        marginTop: 2,
    },

    datePartInput: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: BORDER,

        color: TEXT,
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
        paddingVertical: 0,
    },

    dateYearInput: {
        width: 78,
    },

    dateSeparator: {
        color: MUTED,
        fontSize: 18,
        fontWeight: '900',
    },

    scrollView: {
        flex: 1,
    },

    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    keyboardView: {
        flex: 1,
    },

    header: {
        minHeight: 68,
        backgroundColor: CARD,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        paddingHorizontal: 16,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: BORDER,

        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },

    headerTitle: {
        color: TEXT,
        fontSize: 20,
        fontWeight: '900',
    },

    headerSubtitle: {
        color: MUTED,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 1,
    },

    resetButton: {
        minWidth: 58,
        minHeight: 40,

        alignItems: 'flex-end',
        justifyContent: 'center',
    },

    resetButtonText: {
        color: PURPLE,
        fontSize: 13,
        fontWeight: '900',
    },

    content: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 30,
    },

    block: {
        backgroundColor: CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 15,
        marginBottom: 14,

        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 2,
    },

    blockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    blockIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    blockTitle: {
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
    },

    optionsContainer: {
        gap: 8,
    },

    option: {
        minHeight: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,

        flexDirection: 'row',
        alignItems: 'center',
    },

    optionSelected: {
        backgroundColor: PURPLE_LIGHT,
        borderColor: PURPLE_BORDER,
    },

    optionCheckbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        backgroundColor: CARD,

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 11,
    },

    optionCheckboxSelected: {
        backgroundColor: PURPLE,
        borderColor: PURPLE,
    },

    optionText: {
        flex: 1,
        color: '#475569',
        fontSize: 14,
        fontWeight: '800',
    },

    optionTextSelected: {
        color: PURPLE,
        fontWeight: '900',
    },

    inputContainer: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: PURPLE_BORDER,
        backgroundColor: CARD,
        paddingHorizontal: 13,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,

        marginTop: 2,
    },

    input: {
        flex: 1,
        height: '100%',
        color: TEXT,
        fontSize: 15,
        fontWeight: '800',
        paddingVertical: 0,
    },

    validationText: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 1,
        marginLeft: 3,
    },

    footer: {
        backgroundColor: CARD,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,

        flexDirection: 'row',
        gap: 10,
    },

    cancelButton: {
        flex: 1,
        height: 52,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: PURPLE_BORDER,
        backgroundColor: CARD,

        alignItems: 'center',
        justifyContent: 'center',
    },

    cancelButtonText: {
        color: PURPLE,
        fontSize: 15,
        fontWeight: '900',
    },

    acceptButton: {
        flex: 1.35,
        height: 52,
        borderRadius: 15,
        backgroundColor: PURPLE,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },

    acceptButtonDisabled: {
        backgroundColor: '#A78BFA',
        opacity: 0.6,
    },

    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
});