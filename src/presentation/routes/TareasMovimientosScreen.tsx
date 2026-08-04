import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
    useNavigation,
    useFocusEffect,
} from '@react-navigation/native';
import { consultarConteosTareasMovimientoTodos } from '../../stores/apiApp';
import { useFiltrosHistorialMovimientosStore } from '../../stores/useFiltrosHistorialMovimientosStore';
import {
    TipoFiltroMovimiento,
    TipoFiltroFecha,
    TipoFiltroCorral,
    TipoFiltroAnimal,
} from '../../stores/useFiltrosTareasMovimientosStore';



const TopTab = createMaterialTopTabNavigator();

const BG = '#F6F8FC';
const CARD = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const PURPLE = '#4C1D95';
const BLUE = '#2563EB';
const GREEN = '#0F766E';
const ORANGE = '#EA580C';

type ConteoMovimiento = {
    entrada: number;
    salida: number;
};

type ConteosPantalla = {
    gestacion: ConteoMovimiento;
    maternidad: ConteoMovimiento;
};

const conteosIniciales: ConteosPantalla = {
    gestacion: {
        entrada: 0,
        salida: 0,
    },
    maternidad: {
        entrada: 0,
        salida: 0,
    },
};

type HistorialMovimiento = {
    id: string;
    tipoOperacion: 'Entrada' | 'Salida';
    seccion: 'Gestación' | 'Maternidad';
    idAnimal: string;
    crotal: string;
    corral: string;
    fecha: string;
};

const historialInventado: HistorialMovimiento[] = [
    {
        id: '1',
        tipoOperacion: 'Entrada',
        seccion: 'Gestación',
        idAnimal: '55555',
        crotal: '123456',
        corral: '4',
        fecha: '03/08/2026',
    },
    {
        id: '2',
        tipoOperacion: 'Salida',
        seccion: 'Maternidad',
        idAnimal: '77881',
        crotal: '998877',
        corral: '9',
        fecha: '02/08/2026',
    },
    {
        id: '3',
        tipoOperacion: 'Entrada',
        seccion: 'Maternidad',
        idAnimal: '44321',
        crotal: '654321',
        corral: '12',
        fecha: '01/08/2026',
    },
];

type TipoFiltroFechaHistorial =
    | 'todas'
    | 'hoy'
    | 'ayer'
    | 'concreta';

function formatearFechaHistorialDate(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear());

    return `${dia}/${mes}/${anio}`;
}

function obtenerFechaHoyHistorial(): string {
    return formatearFechaHistorialDate(new Date());
}

function obtenerFechaAyerHistorial(): string {
    const fecha = new Date();

    fecha.setDate(fecha.getDate() - 1);

    return formatearFechaHistorialDate(fecha);
}

function normalizarFechaHistorial(fecha: string): string {
    const texto = String(fecha ?? '').trim();

    const formatoGuion = texto.match(
        /^(\d{2})-(\d{2})-(\d{2}|\d{4})$/
    );

    if (formatoGuion) {
        const [, dia, mes, anio] = formatoGuion;

        const anioNormalizado =
            anio.length === 2
                ? `20${anio}`
                : anio;

        return `${dia}/${mes}/${anioNormalizado}`;
    }

    const formatoBarra = texto.match(
        /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/
    );

    if (formatoBarra) {
        const [, dia, mes, anio] = formatoBarra;

        const anioNormalizado =
            anio.length === 2
                ? `20${anio}`
                : anio;

        return `${dia}/${mes}/${anioNormalizado}`;
    }

    return texto;
}
function obtenerFechaMananaHistorial(): string {
    const fecha = new Date();

    fecha.setDate(fecha.getDate() + 1);

    return formatearFechaHistorialDate(fecha);
}

function filtrarHistorialPorMovimiento(
    historial: HistorialMovimiento[],
    tipoMovimiento: TipoFiltroMovimiento
): HistorialMovimiento[] {
    if (tipoMovimiento === 'todos') {
        return historial;
    }

    if (tipoMovimiento === 'entrada') {
        return historial.filter(
            (item) => item.tipoOperacion === 'Entrada'
        );
    }

    return historial.filter(
        (item) => item.tipoOperacion === 'Salida'
    );
}

function filtrarHistorialPorFecha(
    historial: HistorialMovimiento[],
    tipoFecha: TipoFiltroFecha,
    fechaConcreta: string
): HistorialMovimiento[] {
    if (tipoFecha === 'todas') {
        return historial;
    }

    let fechaObjetivo = '';

    if (tipoFecha === 'hoy') {
        fechaObjetivo = obtenerFechaHoyHistorial();
    }

    if (tipoFecha === 'manana') {
        fechaObjetivo = obtenerFechaMananaHistorial();
    }

    if (tipoFecha === 'concreta') {
        fechaObjetivo = normalizarFechaHistorial(
            fechaConcreta
        );
    }

    if (!fechaObjetivo) {
        return historial;
    }

    return historial.filter(
        (item) =>
            normalizarFechaHistorial(item.fecha) ===
            fechaObjetivo
    );
}

function filtrarHistorialPorCorral(
    historial: HistorialMovimiento[],
    tipoCorral: TipoFiltroCorral,
    corralEspecifico: string
): HistorialMovimiento[] {
    if (tipoCorral === 'todos') {
        return historial;
    }

    const corralFiltro = String(corralEspecifico)
        .trim()
        .toLowerCase();

    if (!corralFiltro) {
        return historial;
    }

    return historial.filter(
        (item) =>
            String(item.corral)
                .trim()
                .toLowerCase() === corralFiltro
    );
}

function filtrarHistorialPorIdAnimal(
    historial: HistorialMovimiento[],
    tipoAnimal: TipoFiltroAnimal,
    idAnimalEspecifico: string
): HistorialMovimiento[] {
    if (tipoAnimal === 'todos') {
        return historial;
    }

    const idFiltro = String(idAnimalEspecifico)
        .trim()
        .toLowerCase();

    if (!idFiltro) {
        return historial;
    }

    return historial.filter(
        (item) =>
            String(item.idAnimal)
                .trim()
                .toLowerCase() === idFiltro
    );
}
function DatoMovimiento({
    titulo,
    valor,
    color,
    fondo,
    icono,
    cargando,
}: {
    titulo: string;
    valor: number;
    color: string;
    fondo: string;
    icono: string;
    cargando: boolean;
}) {
    return (
        <View
            style={[
                styles.movimientoPill,
                {
                    backgroundColor: fondo,
                    borderColor: color,
                },
            ]}
        >
            <View style={styles.movimientoPillLeft}>
                <Ionicons
                    name={icono}
                    size={18}
                    color={color}
                />

                <Text
                    style={[
                        styles.movimientoPillText,
                        {
                            color,
                        },
                    ]}
                >
                    {titulo}
                </Text>
            </View>

            {cargando ? (
                <ActivityIndicator
                    size="small"
                    color={color}
                />
            ) : (
                <Text
                    style={[
                        styles.movimientoPillValue,
                        {
                            color,
                        },
                    ]}
                >
                    {valor}
                </Text>
            )}
        </View>
    );
}
function CardTareaMovimiento({
    titulo,
    icono,
    color,
    fondoIcono,
    entrada,
    salida,
    cargando,
    disabled,
    onPress,
}: {
    titulo: string;
    icono: string;
    color: string;
    fondoIcono: string;
    entrada: number;
    salida: number;
    cargando: boolean;
    disabled?: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={disabled ? 1 : 0.9}
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.card,
                disabled && styles.cardDisabled,
            ]}
        >
            <View style={[styles.cardTopLine, { backgroundColor: color }]} />

            <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                    <View
                        style={[
                            styles.iconBox,
                            { backgroundColor: fondoIcono },
                        ]}
                    >
                        <Ionicons
                            name={icono}
                            size={26}
                            color={color}
                        />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                            {titulo}
                        </Text>

                        <Text style={styles.cardSubtitle}>
                            Tareas pendientes de movimientos
                        </Text>
                    </View>
                </View>

                <View style={styles.movimientosPillsContainer}>
                    <DatoMovimiento
                        titulo="Entrada"
                        valor={entrada}
                        color={GREEN}
                        fondo="#ECFDF5"
                        icono="enter-outline"
                        cargando={cargando}
                    />

                    <DatoMovimiento
                        titulo="Salida"
                        valor={salida}
                        color={ORANGE}
                        fondo="#FFF7ED"
                        icono="exit-outline"
                        cargando={cargando}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}

function TareasTab() {
    const navigation = useNavigation<any>();

    const [conteos, setConteos] =
        React.useState<ConteosPantalla>(conteosIniciales);

    const [cargando, setCargando] =
        React.useState(false);

    const [error, setError] =
        React.useState('');

    const [servidorDesactualizado, setServidorDesactualizado] =
        React.useState(false);

    const cargarConteos = React.useCallback(async () => {
        try {
            setCargando(true);
            setError('');
            setServidorDesactualizado(false);

            const respuesta =
                await consultarConteosTareasMovimientoTodos();

            setConteos({
                gestacion: {
                    entrada:
                        respuesta.gestacion?.entrada ?? 0,
                    salida:
                        respuesta.gestacion?.salida ?? 0,
                },
                maternidad: {
                    entrada:
                        respuesta.maternidad?.entrada ?? 0,
                    salida:
                        respuesta.maternidad?.salida ?? 0,
                },
            });
        } catch (errorConsulta: any) {
            console.log(
                'Error cargando tareas de movimiento:',
                errorConsulta,
            );

            setConteos(conteosIniciales);

            if (Number(errorConsulta?.status) === 404) {
                setServidorDesactualizado(true);

                setError(
                    'Debe actualizar el servidor para utilizar la función de tareas de movimientos.',
                );

                return;
            }

            setServidorDesactualizado(false);

            setError(
                errorConsulta?.message ??
                'No se pudieron cargar las tareas.',
            );
        } finally {
            setCargando(false);
        }
    }, []);
    useFocusEffect(
        React.useCallback(() => {
            cargarConteos();
        }, [cargarConteos])
    );

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {error ? (
                <View style={styles.errorBox}>
                    <Ionicons
                        name="warning-outline"
                        size={21}
                        color={ORANGE}
                    />

                    <View style={{ flex: 1 }}>
                        <Text style={styles.errorText}>
                            {error}
                        </Text>
                    </View>
                </View>
            ) : null}

            <CardTareaMovimiento
                titulo="Gestación"
                icono="leaf-outline"
                color={PURPLE}
                fondoIcono="#F3E8FF"
                entrada={conteos.gestacion.entrada}
                salida={conteos.gestacion.salida}
                cargando={cargando}
                disabled={servidorDesactualizado}
                onPress={() =>
                    navigation.navigate('TareasMovimientosDetalle', {
                        tabInicial: 'Gestacion',
                    })
                }
            />

            <CardTareaMovimiento
                titulo="Maternidad"
                icono="home-outline"
                color={BLUE}
                fondoIcono="#DBEAFE"
                entrada={conteos.maternidad.entrada}
                salida={conteos.maternidad.salida}
                cargando={cargando}
                disabled={servidorDesactualizado}
                onPress={() =>
                    navigation.navigate('TareasMovimientosDetalle', {
                        tabInicial: 'Maternidad',
                    })
                }
            />
        </ScrollView>
    );
}
function FiltroFechaHistorial({
    tipoFiltro,
    fechaConcreta,
    onCambiarTipo,
    onCambiarFecha,
}: {
    tipoFiltro: TipoFiltroFechaHistorial;
    fechaConcreta: string;
    onCambiarTipo: (tipo: TipoFiltroFechaHistorial) => void;
    onCambiarFecha: (fecha: string) => void;
}) {
    return (
        <View style={styles.filtroHistorialCard}>
            <View style={styles.filtroHistorialHeader}>
                <View style={styles.filtroHistorialIconBox}>
                    <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={PURPLE}
                    />
                </View>

                <Text style={styles.filtroHistorialTitle}>
                    Filtrar por fecha
                </Text>
            </View>

            <View style={styles.filtroHistorialChips}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onCambiarTipo('todas')}
                    style={[
                        styles.filtroChip,
                        tipoFiltro === 'todas' &&
                        styles.filtroChipSelected,
                    ]}
                >
                    <Text
                        style={[
                            styles.filtroChipText,
                            tipoFiltro === 'todas' &&
                            styles.filtroChipTextSelected,
                        ]}
                    >
                        Todas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onCambiarTipo('hoy')}
                    style={[
                        styles.filtroChip,
                        tipoFiltro === 'hoy' &&
                        styles.filtroChipSelected,
                    ]}
                >
                    <Text
                        style={[
                            styles.filtroChipText,
                            tipoFiltro === 'hoy' &&
                            styles.filtroChipTextSelected,
                        ]}
                    >
                        Hoy
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onCambiarTipo('ayer')}
                    style={[
                        styles.filtroChip,
                        tipoFiltro === 'ayer' &&
                        styles.filtroChipSelected,
                    ]}
                >
                    <Text
                        style={[
                            styles.filtroChipText,
                            tipoFiltro === 'ayer' &&
                            styles.filtroChipTextSelected,
                        ]}
                    >
                        Ayer
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onCambiarTipo('concreta')}
                    style={[
                        styles.filtroChip,
                        tipoFiltro === 'concreta' &&
                        styles.filtroChipSelected,
                    ]}
                >
                    <Text
                        style={[
                            styles.filtroChipText,
                            tipoFiltro === 'concreta' &&
                            styles.filtroChipTextSelected,
                        ]}
                    >
                        Fecha
                    </Text>
                </TouchableOpacity>
            </View>

            {tipoFiltro === 'concreta' && (
                <View style={styles.filtroFechaInputBox}>
                    <Ionicons
                        name="calendar-number-outline"
                        size={18}
                        color={MUTED}
                    />

                    <TextInput
                        value={fechaConcreta}
                        onChangeText={(texto) =>
                            onCambiarFecha(
                                texto
                                    .replace(/[^0-9/-]/g, '')
                                    .slice(0, 10)
                            )
                        }
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        style={styles.filtroFechaInput}
                    />
                </View>
            )}
        </View>
    );
}

function CardHistorialMovimiento({
    item,
}: {
    item: HistorialMovimiento;
}) {
    const esEntrada =
        item.tipoOperacion === 'Entrada';

    const colorOperacion = esEntrada
        ? GREEN
        : ORANGE;

    const fondoSuave = esEntrada
        ? '#ECFDF5'
        : '#FFF7ED';

    const bordeSuave = esEntrada
        ? '#A7F3D0'
        : '#FED7AA';

    const iconoOperacion: string =
        esEntrada
            ? 'enter-outline'
            : 'exit-outline';

    const textoCorral = esEntrada
        ? 'Corral destino'
        : 'Corral origen';

    return (
        <View style={styles.historialCard}>
            <View
                style={[
                    styles.cardTopLine,
                    {
                        backgroundColor:
                            colorOperacion,
                    },
                ]}
            />

            <View style={styles.historialBody}>
                <View style={styles.historialHeader}>
                    <View style={styles.historialHeaderLeft}>
                        <View
                            style={[
                                styles.historialIconBox,
                                {
                                    backgroundColor:
                                        fondoSuave,
                                    borderColor:
                                        bordeSuave,
                                },
                            ]}
                        >
                            <Ionicons
                                name={iconoOperacion}
                                size={20}
                                color={colorOperacion}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                style={[
                                    styles.historialOperacion,
                                    {
                                        color:
                                            colorOperacion,
                                    },
                                ]}
                            >
                                {item.tipoOperacion}
                            </Text>

                            <Text style={styles.historialSeccion}>
                                {item.seccion}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.realizadaBadge}>
                        <Ionicons
                            name="checkmark-done-outline"
                            size={14}
                            color={GREEN}
                        />

                        <Text style={styles.realizadaText}>
                            Realizada
                        </Text>
                    </View>
                </View>

                <View style={styles.historialInfoRow}>
                    <View
                        style={[
                            styles.historialAnimalBox,
                            {
                                backgroundColor:
                                    fondoSuave,
                                borderColor:
                                    bordeSuave,
                            },
                        ]}
                    >
                        <Text style={styles.historialLabel}>
                            ID animal
                        </Text>

                        <Text style={styles.historialAnimalId}>
                            {item.idAnimal}
                        </Text>

                        <Text style={styles.historialCrotal}>
                            {item.crotal}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.historialCorralBox,
                            {
                                backgroundColor:
                                    fondoSuave,
                                borderColor:
                                    bordeSuave,
                            },
                        ]}
                    >
                        <Text style={styles.historialCorralLabel}>
                            {textoCorral}
                        </Text>

                        <Text style={styles.historialCorralValue}>
                            {item.corral}
                        </Text>
                    </View>
                </View>

                <View style={styles.historialFechaBox}>
                    <View style={styles.historialFechaLeft}>
                        <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={PURPLE}
                        />

                        <Text style={styles.historialFechaLabel}>
                            Fecha
                        </Text>
                    </View>

                    <Text style={styles.historialFechaValue}>
                        {item.fecha}
                    </Text>
                </View>
            </View>
        </View>
    );
}
function BarraAccionesHistorial({
    onAbrirFiltros,
    hayFiltrosActivos,
}: {
    onAbrirFiltros: () => void;
    hayFiltrosActivos: boolean;
}) {
    return (
        <View style={styles.historialActionsBar}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAbrirFiltros}
                style={[
                    styles.historialFilterButton,
                    hayFiltrosActivos &&
                    styles.historialFilterButtonActive,
                ]}
            >
                <Ionicons
                    name="filter-outline"
                    size={17}
                    color={PURPLE}
                />

                <Text style={styles.historialFilterText}>
                    Filtros
                </Text>

                {hayFiltrosActivos && (
                    <View style={styles.historialFilterDot} />
                )}
            </TouchableOpacity>
        </View>
    );
}

function HistorialTab() {
    const navigation = useNavigation<any>();

    const filtrosHistorial =
        useFiltrosHistorialMovimientosStore(
            (state) => state.filtrosHistorial
        );

    const historialFiltradoMovimiento =
        filtrarHistorialPorMovimiento(
            historialInventado,
            filtrosHistorial.tipoMovimiento
        );

    const historialFiltradoFecha =
        filtrarHistorialPorFecha(
            historialFiltradoMovimiento,
            filtrosHistorial.tipoFecha,
            filtrosHistorial.fechaConcreta
        );

    const historialFiltradoCorral =
        filtrarHistorialPorCorral(
            historialFiltradoFecha,
            filtrosHistorial.tipoCorral,
            filtrosHistorial.corralEspecifico
        );

    const historialFiltrado =
        filtrarHistorialPorIdAnimal(
            historialFiltradoCorral,
            filtrosHistorial.tipoAnimal,
            filtrosHistorial.idAnimalEspecifico
        );

    const hayFiltrosActivos =
        filtrosHistorial.tipoMovimiento !== 'todos' ||
        filtrosHistorial.tipoFecha !== 'todas' ||
        filtrosHistorial.tipoCorral !== 'todos' ||
        filtrosHistorial.tipoAnimal !== 'todos';

    return (
        <View style={styles.screen}>
            <BarraAccionesHistorial
                hayFiltrosActivos={hayFiltrosActivos}
                onAbrirFiltros={() =>
                    navigation.navigate(
                        'FiltrosHistorialMovimientos'
                    )
                }
            />

            <ScrollView
                style={styles.screen}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {historialFiltrado.length === 0 ? (
                    <View style={styles.historialEmptyCard}>
                        <Ionicons
                            name="search-outline"
                            size={34}
                            color={MUTED}
                        />

                        <Text style={styles.historialEmptyTitle}>
                            Sin resultados
                        </Text>

                        <Text style={styles.historialEmptyText}>
                            No hay movimientos realizados con esos filtros.
                        </Text>
                    </View>
                ) : (
                    historialFiltrado.map((item) => (
                        <CardHistorialMovimiento
                            key={item.id}
                            item={item}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

export const TareasMovimientosScreen = () => {
    return (
        <TopTab.Navigator
            initialRouteName="Tareas"
            screenOptions={{
                tabBarActiveTintColor: PURPLE,
                tabBarInactiveTintColor: '#94A3B8',
                tabBarIndicatorStyle: {
                    backgroundColor: PURPLE,
                    height: 3,
                    borderRadius: 999,
                },
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    height: 48,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                },
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: '900',
                    textTransform: 'none',
                },
                tabBarPressColor: '#EEF2FF',
            }}
        >
            <TopTab.Screen
                name="Tareas"
                component={TareasTab}
                options={{ title: 'Tareas' }}
            />

            <TopTab.Screen
                name="Historial"
                component={HistorialTab}
                options={{ title: 'Historial' }}
            />
        </TopTab.Navigator>
    );
};

const styles = StyleSheet.create({

    cardDisabled: {
        opacity: 0.48,
    },

    resumenMovimientos: {
        flexDirection: 'row',
        gap: 12,
    },

    datoResumenCard: {
        flex: 1,
        minHeight: 116,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 14,

        alignItems: 'center',
        justifyContent: 'center',
    },

    datoResumenIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,

        alignItems: 'center',
        justifyContent: 'center',

        marginBottom: 8,
    },

    datoResumenTitulo: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 4,
    },

    datoResumenValor: {
        fontSize: 32,
        lineHeight: 36,
        fontWeight: '900',
    },
    datoTitulo: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '900',
    },

    datoDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    datoValor: {
        fontSize: 24,
        fontWeight: '900',
    },
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 28,
    },

    errorBox: {
        backgroundColor: '#FFF7ED',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FED7AA',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    errorText: {
        color: '#9A3412',
        fontSize: 13,
        fontWeight: '800',
    },

    errorRetryText: {
        color: '#C2410C',
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },

    card: {
        backgroundColor: CARD,
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: '#0F172A',
        shadowOpacity: 0.07,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },

    cardTopLine: {
        height: 6,
    },

    cardBody: {
        padding: 16,
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },

    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardTitle: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
    },

    cardSubtitle: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },

    emptyScreen: {
        flex: 1,
        backgroundColor: BG,
        padding: 16,
        justifyContent: 'center',
    },

    emptyCard: {
        backgroundColor: CARD,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        alignItems: 'center',
    },

    emptyTitle: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
        marginTop: 10,
    },

    emptyText: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 4,
    },
    historialCard: {
        backgroundColor: CARD,
        borderRadius: 22,
        overflow: 'hidden',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,

        shadowColor: '#0F172A',
        shadowOpacity: 0.07,
        shadowRadius: 9,
        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 3,
    },

    historialBody: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 16,
    },

    historialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    historialHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
    },

    historialIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        borderWidth: 1.5,

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    historialOperacion: {
        fontSize: 17,
        fontWeight: '900',
    },

    historialSeccion: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '800',
        marginTop: 1,
    },

    realizadaBadge: {
        minHeight: 32,
        borderRadius: 999,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 10,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },

    realizadaText: {
        color: GREEN,
        fontSize: 12,
        fontWeight: '900',
    },

    historialInfoRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 12,
        marginBottom: 12,
    },

    historialAnimalBox: {
        flex: 1.25,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: 'center',
    },

    historialLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },

    historialAnimalId: {
        color: TEXT,
        fontSize: 30,
        lineHeight: 35,
        fontWeight: '900',
        marginBottom: 4,
    },

    historialCrotal: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '700',
    },

    historialCorralBox: {
        minWidth: 126,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },

    historialCorralLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'right',
    },

    historialCorralValue: {
        color: TEXT,
        fontSize: 30,
        lineHeight: 35,
        fontWeight: '900',
        textAlign: 'right',
    },

    historialFechaBox: {
        minHeight: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DDD6FE',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,

        flexDirection: 'row',
        alignItems: 'center',
    },

    historialFechaLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    historialFechaLabel: {
        color: '#5B21B6',
        fontSize: 14,
        fontWeight: '900',
    },

    historialFechaValue: {
        color: PURPLE,
        fontSize: 16,
        fontWeight: '900',
    },
    filtroHistorialCard: {
        backgroundColor: CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 14,
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

    filtroHistorialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    filtroHistorialIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F3E8FF',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    filtroHistorialTitle: {
        color: TEXT,
        fontSize: 16,
        fontWeight: '900',
    },

    filtroHistorialChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    filtroChip: {
        minHeight: 38,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,

        alignItems: 'center',
        justifyContent: 'center',
    },

    filtroChipSelected: {
        backgroundColor: '#F5F3FF',
        borderColor: '#C4B5FD',
    },

    filtroChipText: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '900',
    },

    filtroChipTextSelected: {
        color: PURPLE,
    },

    filtroFechaInputBox: {
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C4B5FD',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        marginTop: 12,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    filtroFechaInput: {
        flex: 1,
        height: '100%',
        color: TEXT,
        fontSize: 15,
        fontWeight: '800',
        paddingVertical: 0,
    },

    historialEmptyCard: {
        backgroundColor: CARD,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
    },

    historialEmptyTitle: {
        color: TEXT,
        fontSize: 19,
        fontWeight: '900',
        marginTop: 10,
    },

    historialEmptyText: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 4,
    },

    historialActionsBar: {
        backgroundColor: CARD,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        paddingHorizontal: 12,
        paddingVertical: 10,

        flexDirection: 'row',
    },

    historialFilterButton: {
        height: 42,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',
        paddingHorizontal: 16,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    historialFilterButtonActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#C4B5FD',
    },

    historialFilterText: {
        color: PURPLE,
        fontSize: 12,
        fontWeight: '900',
    },

    historialFilterDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: ORANGE,
        marginLeft: 2,
    },
    movimientosPillsContainer: {
        flexDirection: 'row',
        gap: 10,
    },

    movimientoPill: {
        flex: 1,
        minHeight: 48,
        borderRadius: 999,
        borderWidth: 1.3,
        paddingHorizontal: 13,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    movimientoPillLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    movimientoPillText: {
        fontSize: 13,
        fontWeight: '900',
    },

    movimientoPillValue: {
        fontSize: 22,
        fontWeight: '900',
    },
});