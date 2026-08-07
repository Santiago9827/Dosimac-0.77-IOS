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
import {
    consultarConteosTareasMovimientoTodos,
    consultarHistorialMovimientoGestacion,
    consultarHistorialMovimientoMaternidad,
    consultarCorralesGestacion,
    consultarCorralesMaternidad,
    crearMapaCorralesPorId,
} from '../../stores/apiApp';
import { useFiltrosHistorialMovimientosStore } from '../../stores/useFiltrosHistorialMovimientosStore';
import {
    TipoFiltroMovimiento,
    TipoFiltroFecha,
    TipoFiltroCorral,
    TipoFiltroAnimal,
} from '../../stores/useFiltrosTareasMovimientosStore';
import { useTranslation } from 'react-i18next';



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

type TipoFiltroSeccionHistorial =
    | 'todos'
    | 'gestacion'
    | 'maternidad';



// type TipoFiltroFechaHistorial =
//     | 'todas'
//     | 'hoy'
//     | 'ayer'
//     | 'concreta'; 

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
function filtrarHistorialPorSeccion(
    historial: HistorialMovimiento[],
    tipoSeccion: TipoFiltroSeccionHistorial,
): HistorialMovimiento[] {
    if (tipoSeccion === 'todos') {
        return historial;
    }

    if (tipoSeccion === 'gestacion') {
        return historial.filter(
            item => item.seccion === 'Gestación',
        );
    }

    return historial.filter(
        item => item.seccion === 'Maternidad',
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
    const { t } = useTranslation();

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
                            {t('tareasMovimientos.tarjetas.tareasPendientesMovimientos')}
                        </Text>
                    </View>
                </View>

                <View style={styles.movimientosPillsContainer}>
                    <DatoMovimiento
                        titulo={t('tareasMovimientos.operaciones.entrada')}
                        valor={entrada}
                        color={GREEN}
                        fondo="#ECFDF5"
                        icono="enter-outline"
                        cargando={cargando}
                    />

                    <DatoMovimiento
                        titulo={t('tareasMovimientos.operaciones.salida')}
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
    const { t } = useTranslation();
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
                    t('tareasMovimientos.errores.actualizarServidorTareas'),
                );

                return;
            }

            setServidorDesactualizado(false);

            setError(
                errorConsulta?.message ??
                t('tareasMovimientos.errores.noCargarTareas'),
            );
        } finally {
            setCargando(false);
        }
    }, [t]);

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
                titulo={t('tareasMovimientos.secciones.gestacion')}
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
                titulo={t('tareasMovimientos.secciones.maternidad')}
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
// function FiltroFechaHistorial({
//     tipoFiltro,
//     fechaConcreta,
//     onCambiarTipo,
//     onCambiarFecha,
// }: {
//     tipoFiltro: TipoFiltroFechaHistorial;
//     fechaConcreta: string;
//     onCambiarTipo: (tipo: TipoFiltroFechaHistorial) => void;
//     onCambiarFecha: (fecha: string) => void;
// }) {
//     return (
//         <View style={styles.filtroHistorialCard}>
//             <View style={styles.filtroHistorialHeader}>
//                 <View style={styles.filtroHistorialIconBox}>
//                     <Ionicons
//                         name="calendar-outline"
//                         size={18}
//                         color={PURPLE}
//                     />
//                 </View>

//                 <Text style={styles.filtroHistorialTitle}>
//                     Filtrar por fecha
//                 </Text>
//             </View>

//             <View style={styles.filtroHistorialChips}>
//                 <TouchableOpacity
//                     activeOpacity={0.85}
//                     onPress={() => onCambiarTipo('todas')}
//                     style={[
//                         styles.filtroChip,
//                         tipoFiltro === 'todas' &&
//                         styles.filtroChipSelected,
//                     ]}
//                 >
//                     <Text
//                         style={[
//                             styles.filtroChipText,
//                             tipoFiltro === 'todas' &&
//                             styles.filtroChipTextSelected,
//                         ]}
//                     >
//                         Todas
//                     </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     activeOpacity={0.85}
//                     onPress={() => onCambiarTipo('hoy')}
//                     style={[
//                         styles.filtroChip,
//                         tipoFiltro === 'hoy' &&
//                         styles.filtroChipSelected,
//                     ]}
//                 >
//                     <Text
//                         style={[
//                             styles.filtroChipText,
//                             tipoFiltro === 'hoy' &&
//                             styles.filtroChipTextSelected,
//                         ]}
//                     >
//                         Hoy
//                     </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     activeOpacity={0.85}
//                     onPress={() => onCambiarTipo('ayer')}
//                     style={[
//                         styles.filtroChip,
//                         tipoFiltro === 'ayer' &&
//                         styles.filtroChipSelected,
//                     ]}
//                 >
//                     <Text
//                         style={[
//                             styles.filtroChipText,
//                             tipoFiltro === 'ayer' &&
//                             styles.filtroChipTextSelected,
//                         ]}
//                     >
//                         Ayer
//                     </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     activeOpacity={0.85}
//                     onPress={() => onCambiarTipo('concreta')}
//                     style={[
//                         styles.filtroChip,
//                         tipoFiltro === 'concreta' &&
//                         styles.filtroChipSelected,
//                     ]}
//                 >
//                     <Text
//                         style={[
//                             styles.filtroChipText,
//                             tipoFiltro === 'concreta' &&
//                             styles.filtroChipTextSelected,
//                         ]}
//                     >
//                         Fecha
//                     </Text>
//                 </TouchableOpacity>
//             </View>

//             {tipoFiltro === 'concreta' && (
//                 <View style={styles.filtroFechaInputBox}>
//                     <Ionicons
//                         name="calendar-number-outline"
//                         size={18}
//                         color={MUTED}
//                     />

//                     <TextInput
//                         value={fechaConcreta}
//                         onChangeText={(texto) =>
//                             onCambiarFecha(
//                                 texto
//                                     .replace(/[^0-9/-]/g, '')
//                                     .slice(0, 10)
//                             )
//                         }
//                         placeholder="DD/MM/AAAA"
//                         placeholderTextColor="#94A3B8"
//                         keyboardType="number-pad"
//                         style={styles.filtroFechaInput}
//                     />
//                 </View>
//             )}
//         </View>
//     );
// }

function CardHistorialMovimiento({
    item,
}: {
    item: HistorialMovimiento;
}) {
    const { t } = useTranslation();

    const esEntrada =
        item.tipoOperacion === 'Entrada';

    const textoOperacion = esEntrada
        ? t('tareasMovimientos.operaciones.entrada')
        : t('tareasMovimientos.operaciones.salida');

    const textoSeccion =
        item.seccion === 'Gestación'
            ? t('tareasMovimientos.secciones.gestacion')
            : t('tareasMovimientos.secciones.maternidad');

    const textoCorral = esEntrada
        ? t('tareasMovimientos.tarjetas.corralDestino')
        : t('tareasMovimientos.tarjetas.corralOrigen');

    const corralCorto =
        String(item.corral).trim().length <= 2;

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
                                {textoOperacion}
                            </Text>

                            <Text style={styles.historialSeccion}>
                                {t('tareasMovimientos.operaciones.realizada')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.realizadaBadge}>
                        <Ionicons
                            name={
                                item.seccion === 'Gestación'
                                    ? 'leaf-outline'
                                    : 'home-outline'
                            }
                            size={14}
                            color={GREEN}
                        />

                        <Text style={styles.realizadaText}>
                            {textoSeccion}
                        </Text>
                    </View>
                </View>

                <View style={styles.historialInfoRow}>
                    <View
                        style={[
                            styles.historialAnimalBox,
                            {
                                backgroundColor: '#EFF6FF',
                                borderColor: '#BFDBFE',
                            },
                        ]}
                    >
                        <Text style={styles.historialLabel}>
                            {t('tareasMovimientos.tarjetas.idAnimal')}
                        </Text>

                        <Text style={styles.historialAnimalId}>
                            {item.idAnimal}
                        </Text>

                        <Text style={styles.historialCrotal}>
                            {item.crotal || t('tareasMovimientos.tarjetas.sinCrotal')}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.historialCorralBox,
                            {
                                backgroundColor: '#FFFFFF',
                                borderColor: '#E2E8F0',
                            },
                        ]}
                    >
                        <Text style={styles.historialCorralLabel}>
                            {textoCorral}
                        </Text>

                        <Text
                            style={[
                                styles.historialCorralValue,
                                corralCorto &&
                                styles.historialCorralValueCorto,
                            ]}
                        >
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
                            {t('tareasMovimientos.tarjetas.fecha')}
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
    filtroSeccion,
    desplegableSeccionVisible,
    onToggleSeccion,
    onCambiarSeccion,
}: {
    onAbrirFiltros: () => void;
    hayFiltrosActivos: boolean;
    filtroSeccion: TipoFiltroSeccionHistorial;
    desplegableSeccionVisible: boolean;
    onToggleSeccion: () => void;
    onCambiarSeccion: (
        tipo: TipoFiltroSeccionHistorial,
    ) => void;
}) {
    const { t } = useTranslation();

    const textoFiltroSeccion =
        filtroSeccion === 'todos'
            ? t('tareasMovimientos.secciones.todos')
            : filtroSeccion === 'gestacion'
                ? t('tareasMovimientos.secciones.gestacion')
                : t('tareasMovimientos.secciones.maternidad');

    const iconoFiltroSeccion: string =
        filtroSeccion === 'gestacion'
            ? 'leaf-outline'
            : filtroSeccion === 'maternidad'
                ? 'home-outline'
                : 'apps-outline';

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
                    {t('tareasMovimientos.filtros.titulo')}
                </Text>

                {hayFiltrosActivos && (
                    <View
                        style={
                            styles.historialFilterDot
                        }
                    />
                )}
            </TouchableOpacity>

            <View
                style={
                    styles.historialSeccionWrapper
                }
            >
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onToggleSeccion}
                    style={[
                        styles.historialSeccionButton,
                        filtroSeccion !== 'todos' &&
                        styles.historialSeccionButtonActive,
                    ]}
                >
                    <Ionicons
                        name={iconoFiltroSeccion}
                        size={17}
                        color={PURPLE}
                    />

                    <Text
                        style={
                            styles.historialFilterText
                        }
                    >
                        {textoFiltroSeccion}
                    </Text>

                    <Ionicons
                        name={
                            desplegableSeccionVisible
                                ? 'chevron-up-outline'
                                : 'chevron-down-outline'
                        }
                        size={15}
                        color={PURPLE}
                    />
                </TouchableOpacity>

                {desplegableSeccionVisible && (
                    <View
                        style={
                            styles.historialSeccionDropdown
                        }
                    >
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                                onCambiarSeccion(
                                    'todos',
                                )
                            }
                            style={[
                                styles.historialSeccionOption,
                                filtroSeccion ===
                                'todos' &&
                                styles.historialSeccionOptionSelected,
                            ]}
                        >
                            <Ionicons
                                name="apps-outline"
                                size={17}
                                color={PURPLE}
                            />

                            <Text
                                style={
                                    styles.historialSeccionOptionText
                                }
                            >
                                {t('tareasMovimientos.secciones.todos')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                                onCambiarSeccion(
                                    'gestacion',
                                )
                            }
                            style={[
                                styles.historialSeccionOption,
                                filtroSeccion ===
                                'gestacion' &&
                                styles.historialSeccionOptionSelected,
                            ]}
                        >
                            <Ionicons
                                name="leaf-outline"
                                size={17}
                                color={PURPLE}
                            />

                            <Text
                                style={
                                    styles.historialSeccionOptionText
                                }
                            >
                                {t('tareasMovimientos.secciones.gestacion')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                                onCambiarSeccion(
                                    'maternidad',
                                )
                            }
                            style={[
                                styles.historialSeccionOption,
                                filtroSeccion ===
                                'maternidad' &&
                                styles.historialSeccionOptionSelected,
                            ]}
                        >
                            <Ionicons
                                name="home-outline"
                                size={17}
                                color={PURPLE}
                            />

                            <Text
                                style={
                                    styles.historialSeccionOptionText
                                }
                            >
                                {t('tareasMovimientos.secciones.maternidad')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

function HistorialTab() {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();

    const [historial, setHistorial] =
        React.useState<HistorialMovimiento[]>([]);

    const [cargandoHistorial, setCargandoHistorial] =
        React.useState(false);

    const [errorHistorial, setErrorHistorial] =
        React.useState('');

    const [
        filtroSeccionHistorial,
        setFiltroSeccionHistorial,
    ] = React.useState<TipoFiltroSeccionHistorial>(
        'todos',
    );

    const [
        desplegableSeccionVisible,
        setDesplegableSeccionVisible,
    ] = React.useState(false);

    const filtrosHistorial =
        useFiltrosHistorialMovimientosStore(
            state => state.filtrosHistorial,
        );

    const cargarHistorial =
        React.useCallback(async () => {
            try {
                setCargandoHistorial(true);
                setErrorHistorial('');

                const [
                    historialGestacion,
                    historialMaternidad,
                    corralesGestacion,
                    corralesMaternidad,
                ] = await Promise.all([
                    consultarHistorialMovimientoGestacion(),
                    consultarHistorialMovimientoMaternidad(),
                    consultarCorralesGestacion(),
                    consultarCorralesMaternidad(),
                ]);

                const mapaCorralesGestacion =
                    crearMapaCorralesPorId(
                        corralesGestacion,
                    );

                const mapaCorralesMaternidad =
                    crearMapaCorralesPorId(
                        corralesMaternidad,
                    );

                const historialGestacionAdaptado:
                    HistorialMovimiento[] =
                    historialGestacion.map(item => {
                        const corralId =
                            Number(item.corralId);

                        const corralVisible =
                            Number.isFinite(corralId) &&
                                mapaCorralesGestacion[
                                corralId
                                ] !== undefined
                                ? String(
                                    mapaCorralesGestacion[
                                    corralId
                                    ],
                                )
                                : String(
                                    item.corralId ??
                                    '—',
                                );

                        return {
                            id: `gestacion-${item.id}`,
                            tipoOperacion:
                                item.tipoOperacion,
                            seccion: 'Gestación',
                            idAnimal:
                                item.idAnimal,
                            crotal:
                                item.crotal,
                            corral:
                                corralVisible,
                            fecha:
                                item.fecha,
                        };
                    });

                const historialMaternidadAdaptado:
                    HistorialMovimiento[] =
                    historialMaternidad.map(item => {
                        const corralId =
                            Number(item.corralId);

                        const corralVisible =
                            Number.isFinite(corralId) &&
                                mapaCorralesMaternidad[
                                corralId
                                ] !== undefined
                                ? String(
                                    mapaCorralesMaternidad[
                                    corralId
                                    ],
                                )
                                : String(
                                    item.corralId ??
                                    '—',
                                );

                        return {
                            id: `maternidad-${item.id}`,
                            tipoOperacion:
                                item.tipoOperacion,
                            seccion: 'Maternidad',
                            idAnimal:
                                item.idAnimal,
                            crotal:
                                item.crotal,
                            corral:
                                corralVisible,
                            fecha:
                                item.fecha,
                        };
                    });

                const historialCompleto = [
                    ...historialGestacionAdaptado,
                    ...historialMaternidadAdaptado,
                ].sort((itemA, itemB) => {
                    const convertirFecha = (
                        fecha: string,
                    ) => {
                        const [
                            dia,
                            mes,
                            anio,
                        ] = fecha.split('/');

                        return new Date(
                            Number(anio),
                            Number(mes) - 1,
                            Number(dia),
                        ).getTime();
                    };

                    return (
                        convertirFecha(itemB.fecha) -
                        convertirFecha(itemA.fecha)
                    );
                });

                setHistorial(
                    historialCompleto,
                );
            } catch (errorConsulta: any) {
                console.log(
                    'Error cargando historial de movimientos:',
                    errorConsulta,
                );

                setHistorial([]);

                setErrorHistorial(
                    errorConsulta?.message ??
                    t('tareasMovimientos.errores.noCargarHistorial'),
                );
            } finally {
                setCargandoHistorial(false);
            }
        }, [t]);

    useFocusEffect(
        React.useCallback(() => {
            cargarHistorial();
        }, [cargarHistorial]),
    );

    const historialFiltradoMovimiento =
        filtrarHistorialPorMovimiento(
            historial,
            filtrosHistorial.tipoMovimiento,
        );

    const historialFiltradoFecha =
        filtrarHistorialPorFecha(
            historialFiltradoMovimiento,
            filtrosHistorial.tipoFecha,
            filtrosHistorial.fechaConcreta,
        );

    const historialFiltradoCorral =
        filtrarHistorialPorCorral(
            historialFiltradoFecha,
            filtrosHistorial.tipoCorral,
            filtrosHistorial.corralEspecifico,
        );

    const historialFiltradoAnimal =
        filtrarHistorialPorIdAnimal(
            historialFiltradoCorral,
            filtrosHistorial.tipoAnimal,
            filtrosHistorial.idAnimalEspecifico,
        );

    const historialFiltrado =
        filtrarHistorialPorSeccion(
            historialFiltradoAnimal,
            filtroSeccionHistorial,
        );

    const hayFiltrosPantallaActivos =
        filtrosHistorial.tipoMovimiento !==
        'todos' ||
        filtrosHistorial.tipoFecha !==
        'todas' ||
        filtrosHistorial.tipoCorral !==
        'todos' ||
        filtrosHistorial.tipoAnimal !==
        'todos';



    const hayFiltrosActivos =
        hayFiltrosPantallaActivos ||
        filtroSeccionHistorial !== 'todos';

    const cambiarFiltroSeccionHistorial = (
        tipoSeccion: TipoFiltroSeccionHistorial,
    ) => {
        setFiltroSeccionHistorial(
            tipoSeccion,
        );

        setDesplegableSeccionVisible(false);
    };

    const abrirFiltrosHistorial = () => {
        setDesplegableSeccionVisible(false);

        navigation.navigate(
            'FiltrosHistorialMovimientos',
        );
    };

    return (
        <View style={styles.screen}>
            <BarraAccionesHistorial
                hayFiltrosActivos={
                    hayFiltrosPantallaActivos
                }
                filtroSeccion={
                    filtroSeccionHistorial
                }
                desplegableSeccionVisible={
                    desplegableSeccionVisible
                }
                onToggleSeccion={() =>
                    setDesplegableSeccionVisible(
                        visible => !visible,
                    )
                }
                onCambiarSeccion={
                    cambiarFiltroSeccionHistorial
                }
                onAbrirFiltros={
                    abrirFiltrosHistorial
                }
            />
            {desplegableSeccionVisible && (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                        setDesplegableSeccionVisible(
                            false,
                        )
                    }
                    style={
                        styles.historialDropdownBackdrop
                    }
                />
            )}

            <ScrollView
                style={styles.screen}
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {cargandoHistorial &&
                    historial.length === 0 ? (
                    <View
                        style={
                            styles.historialEmptyCard
                        }
                    >
                        <ActivityIndicator
                            size="small"
                            color={PURPLE}
                        />

                        <Text
                            style={
                                styles.historialEmptyTitle
                            }
                        >
                            {t('tareasMovimientos.carga.cargandoHistorial')}
                        </Text>
                    </View>
                ) : null}

                {!cargandoHistorial &&
                    errorHistorial ? (
                    <View
                        style={
                            styles.historialEmptyCard
                        }
                    >
                        <Ionicons
                            name="warning-outline"
                            size={34}
                            color={ORANGE}
                        />

                        <Text
                            style={
                                styles.historialEmptyTitle
                            }
                        >
                            {t('tareasMovimientos.errores.noCargarHistorialTitulo')}                        </Text>

                        <Text
                            style={
                                styles.historialEmptyText
                            }
                        >
                            {errorHistorial}
                        </Text>
                    </View>
                ) : null}

                {!cargandoHistorial &&
                    !errorHistorial &&
                    historialFiltrado.length === 0 ? (
                    <View
                        style={
                            styles.historialEmptyCard
                        }
                    >
                        <Ionicons
                            name="search-outline"
                            size={34}
                            color={MUTED}
                        />

                        <Text
                            style={
                                styles.historialEmptyTitle
                            }
                        >
                            {t('tareasMovimientos.vacio.sinResultados')}
                        </Text>

                        <Text
                            style={
                                styles.historialEmptyText
                            }
                        >
                            {hayFiltrosActivos
                                ? t('tareasMovimientos.vacio.sinMovimientosConFiltros')
                                : t('tareasMovimientos.vacio.sinMovimientosTodavia')}
                        </Text>
                    </View>
                ) : null}

                {!errorHistorial &&
                    historialFiltrado.map(
                        item => (
                            <CardHistorialMovimiento
                                key={item.id}
                                item={item}
                            />
                        ),
                    )}
            </ScrollView>
        </View>
    );
}

export const TareasMovimientosScreen = () => {
        const { t } = useTranslation();

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
                options={{
                    title: t('tareasMovimientos.tabs.tareas'),
                }}
            />

             <TopTab.Screen
                name="Historial"
                component={HistorialTab}
                options={{
                    title: t('tareasMovimientos.tabs.historial'),
                }}
            />
        </TopTab.Navigator>
    );
};

const styles = StyleSheet.create({
    historialCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,

    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: {
        width: 0,
        height: 3,
    },

    elevation: 2,
},

historialBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
},

historialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
},

historialHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
},

historialIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1.3,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 8,
},

historialOperacion: {
    fontSize: 15,
    fontWeight: '900',
},

historialSeccion: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 0,
},

realizadaBadge: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
},

realizadaText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '900',
},

historialInfoRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 9,
},

historialAnimalBox: {
    flex: 1.25,
    borderRadius: 15,
    borderWidth: 1.3,
    paddingHorizontal: 11,
    paddingVertical: 9,
    justifyContent: 'center',
},

historialLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 1,
},

historialAnimalId: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 2,
},

historialCrotal: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
},

historialCorralBox: {
    minWidth: 104,
    borderRadius: 15,
    borderWidth: 1.3,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
},

historialCorralLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'right',
},

historialCorralValue: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'right',
},

historialCorralValueCorto: {
    width: '100%',
    textAlign: 'center',
},

historialFechaBox: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,

    flexDirection: 'row',
    alignItems: 'center',
},

historialFechaLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
},

historialFechaLabel: {
    color: '#5B21B6',
    fontSize: 13,
    fontWeight: '900',
},

historialFechaValue: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '900',
},
    historialActionsBar: {
        backgroundColor: CARD,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        gap: 8,
        zIndex: 1000,
        elevation: 1000,
        overflow: 'visible',
    },

    historialFilterButton: {
        flex: 1,
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
    historialSeccionWrapper: {
        flex: 1,
        position: 'relative',
        zIndex: 1001,
        elevation: 1001,
        overflow: 'visible',
    },

    historialSeccionButton: {
        height: 42,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    historialSeccionButtonActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#C4B5FD',
    },

    historialSeccionDropdown: {
        position: 'absolute',
        top: 48,
        right: 0,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DDD6FE',
        padding: 6,
        shadowColor: '#0F172A',
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        elevation: 2000,
        zIndex: 2000,
    },

    historialSeccionOption: {
        minHeight: 44,
        borderRadius: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    historialSeccionOptionSelected: {
        backgroundColor: '#F5F3FF',
    },

    historialSeccionOptionText: {
        flex: 1,
        color: PURPLE,
        fontSize: 13,
        fontWeight: '900',
    },

    historialDropdownBackdrop: {
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 900,
        elevation: 900,
    },

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