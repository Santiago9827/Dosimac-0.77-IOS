/* eslint-disable prettier/prettier */
import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
    Keyboard,
    TextInput
} from 'react-native';

import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import {
    ejecutarOperacionMaternidad, consultarCurvas, consultarCondicionesCorporales, enviarReporteNacidos,
    consultarMaternidadPorPkid, consultarMaternidadPorCorral
} from '../../stores/apiApp';
import { useAuthStore } from '../../stores/authStore';

const BG = '#F1F5F9';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BRAND = '#4C1D95';
const BLUE = '#1E3A8A';
const RED = '#EF4444';
const BORDER = '#E2E8F0';
const CARD = '#FFFFFF';

const formatearNumero = (valor: any) => {
    const numero = Number(valor ?? 0);

    if (!Number.isFinite(numero)) {
        return '0';
    }

    return numero.toLocaleString('es-ES');
};

const limitarPorcentaje = (valor: any) => {
    const numero = Number(valor ?? 0);

    if (!Number.isFinite(numero)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numero)));
};

function ChipDato({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <View style={styles.chipItem}>
            <Text style={styles.chipLabel}>{label}</Text>

            <Text
                style={styles.chipValue}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {String(value ?? '—')}
            </Text>
        </View>
    );
}

function InfoItem({
    label,
    value,
    pill,
}: {
    label: string;
    value: string | number;
    pill?: boolean;
}) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{label}</Text>

            <View style={styles.infoRow}>
                <Ionicons
                    name="book-outline"
                    size={18}
                    color={TEXT}
                />

                <Text
                    style={[
                        styles.infoValue,
                        pill && styles.infoPill,
                    ]}
                    numberOfLines={1}
                >
                    {String(value ?? '—')}
                </Text>
            </View>
        </View>
    );
}
function FilaStepperLechones({
    label,
    value,
    disabled,
    onMinus,
    onPlus,
}: {
    label: string;
    value: string | number;
    disabled?: boolean;
    onMinus: () => void;
    onPlus: () => void;
}) {
    return (
        <View style={styles.filaStepperLechones}>
            <Text style={styles.labelStepperLechones}>
                {label}
            </Text>

            <View style={styles.controlesStepper}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={disabled}
                    onPress={onMinus}
                    style={[
                        styles.botonStepper,
                        disabled && styles.botonStepperDisabled,
                    ]}
                >
                    <Ionicons
                        name="remove-outline"
                        size={24}
                        color={TEXT}
                    />
                </TouchableOpacity>

                <View style={styles.valorStepper}>
                    <Text style={styles.textoValorStepper}>
                        {String(value)}
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={disabled}
                    onPress={onPlus}
                    style={[
                        styles.botonStepper,
                        styles.botonStepperMas,
                        disabled && styles.botonStepperDisabled,
                    ]}
                >
                    <Ionicons
                        name="add-outline"
                        size={26}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}
function OpcionOperacion({
    icono,
    titulo,
    disabled,
    onPress,
}: {
    icono: string;
    titulo: string;
    disabled?: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            disabled={disabled}
            onPress={onPress}
            style={[
                styles.opcionOperacion,
                disabled && styles.opcionOperacionDisabled,
            ]}
        >
            <Ionicons
                name={icono}
                size={21}
                color={disabled ? '#94A3B8' : BRAND}
            />

            <Text
                style={[
                    styles.textoOpcionOperacion,
                    disabled && styles.textoOpcionOperacionDisabled,
                ]}
            >
                {titulo}
            </Text>

            <Ionicons
                name="chevron-forward-outline"
                size={19}
                color={disabled ? '#CBD5E1' : MUTED}
            />
        </TouchableOpacity>
    );


}
type TipoSalidaAnimal =
    | 'salidaMaternidad'
    | 'salidaProgramada'
    | 'salidaProgramadaVacioTolva'
    | 'sinSalidaProgramada';

const OPCIONES_SALIDA_ANIMAL: {
    tipo: TipoSalidaAnimal;
    labelKey: string;
    defaultValue: string;
    typeBackend: '0' | '1' | '2' | '3';
    icono: string;
    sacarDePantalla: boolean;
}[] = [
        {
            tipo: 'salidaMaternidad',
            labelKey: 'matCorralDetail.exitImmediate',
            defaultValue: 'Salida inmediata',
            typeBackend: '0',
            icono: 'exit-outline',
            sacarDePantalla: true,
        },
        {
            tipo: 'salidaProgramada',
            labelKey: 'matCorralDetail.exitScheduled',
            defaultValue: 'Salida programada',
            typeBackend: '2',
            icono: 'calendar-outline',
            sacarDePantalla: false,
        },
        {
            tipo: 'salidaProgramadaVacioTolva',
            labelKey: 'matCorralDetail.exitScheduledEmptyHopper',
            defaultValue: 'Salida programada con tolva vacía',
            typeBackend: '3',
            icono: 'archive-outline',
            sacarDePantalla: false,
        },
        {
            tipo: 'sinSalidaProgramada',
            labelKey: 'matCorralDetail.cancelScheduledExit',
            defaultValue: 'Cancelar salida programada',
            typeBackend: '1',
            icono: 'close-circle-outline',
            sacarDePantalla: false,
        },
    ];

type CurvaApi = {
    id: number;
    name: string;
};
type CondicionCorporalApi = {
    description: string;
    id: string;
    position: number;
    value: number;
};

type SubEstadoApi = 'prepartum' | 'lactation' | 'weaning';

const OPCIONES_SUB_ESTADO: {
    value: SubEstadoApi;
    labelKey: string;
    defaultValue: string;
    icono: string;
}[] = [
        {
            value: 'prepartum',
            labelKey: 'subState.prepartum',
            defaultValue: 'Preparto',
            icono: 'medkit-outline',
        },
        {
            value: 'lactation',
            labelKey: 'subState.lactation',
            defaultValue: 'Lactancia',
            icono: 'nutrition-outline',
        },
        {
            value: 'weaning',
            labelKey: 'subState.weaning',
            defaultValue: 'Destete',
            icono: 'flag-outline',
        },
    ];
type TipoIdentificacionAnonima = 'id' | 'crotal';

type IdentificacionAnonimaData = {
    type: TipoIdentificacionAnonima;
    value: string;
};

type ModoCapturaLechones = 'captura' | 'pasarLactancia';

export const EstadoAnimalDetalleScreen = ({
    navigation,
}: any) => {
    const { t } = useTranslation();
    const route = useRoute<any>();
    const rol = useAuthStore((s) => s.rol ?? []);
    const esAdmin = Array.isArray(rol)
        ? rol.includes('admin')
        : String(rol).includes('admin');

    const [modalSoloLecturaVisible, setModalSoloLecturaVisible] =
        useState(false);

    const params = route.params ?? {};
    const corralId = params.corralId;
    const mockData = params.mockData;
    const datosMaternidad = params.datosMaternidad;

    const animal = mockData?.animal;
    const lechonesPresentesIniciales = Number(
        datosMaternidad?.totalPigletsPresent ??
        animal?.lechonesPresentes,
    );

    const [lechonesPresentesVisual, setLechonesPresentesVisual] =
        useState<string | number>(
            Number.isFinite(lechonesPresentesIniciales)
                ? lechonesPresentesIniciales
                : animal?.lechonesPresentes ?? '—',
        );

    const [fechaPartoVisual, setFechaPartoVisual] = useState(
        animal?.fechas?.parto ?? '—',
    );
    const [idVisual, setIdVisual] = useState(
        animal?.id ?? '—',
    );

    const [crotalVisual, setCrotalVisual] = useState(
        animal?.crotal ?? '—',
    );
    const [corralVisual, setCorralVisual] = useState(
        animal?.corral ?? corralId ?? '—',
    );
    const [condicionVisual, setCondicionVisual] = useState(
        animal?.correccion ?? '—',
    );
    const [curvaVisual, setCurvaVisual] = useState(
        animal?.curva ?? '—',
    );

    const [curvaIdVisual, setCurvaIdVisual] = useState(
        Number(
            datosMaternidad?.animal?.curveId ??
            datosMaternidad?.curveId ??
            -1,
        ),
    );
    const [subEstadoVisual, setSubEstadoVisual] = useState(
        animal?.subEstado ?? '—',
    );

    const [guardandoOperacion, setGuardandoOperacion] =
        useState(false);

    const [pkidAnimalOperacion, setPkidAnimalOperacion] =
        useState(() =>
            Number(
                datosMaternidad?.animal?.id ??
                datosMaternidad?.id ??
                mockData?.datosOriginales?.animal?.id ??
                mockData?.datosOriginales?.id ??
                0,
            ),
        );

    const pkidValido =
        Number.isFinite(pkidAnimalOperacion) &&
        pkidAnimalOperacion > 0;

    const pad2 = (numero: number) =>
        String(numero).padStart(2, '0');

    const todayStr = () => {
        const fecha = new Date();

        return `${pad2(fecha.getDate())}-${pad2(
            fecha.getMonth() + 1,
        )}-${fecha.getFullYear()}`;
    };
    const parseNumeroEntero = (valor: string) => {
        const numero = Number(String(valor ?? '').trim());

        if (!Number.isFinite(numero)) {
            return 0;
        }

        return Math.max(0, Math.trunc(numero));
    };
    const cambiarNumeroLechones = (
        valorActual: string,
        setValor: React.Dispatch<React.SetStateAction<string>>,
        cambio: number,
    ) => {
        const nuevoValor = Math.max(
            0,
            parseNumeroEntero(valorActual) + cambio,
        );

        setValor(String(nuevoValor));
    };

    const cambiarFechaCaptura = (cambioDias: number) => {
        const fecha = parsearFechaLocal(fechaCapturaLechones);

        fecha.setDate(fecha.getDate() + cambioDias);

        setFechaCapturaLechones(
            formatearFechaDDMMYYYY(fecha),
        );
    };


    const formatearFechaDDMMYYYY = (fecha: Date) => {
        return `${pad2(fecha.getDate())}-${pad2(
            fecha.getMonth() + 1,
        )}-${fecha.getFullYear()}`;
    };

    const parsearFechaLocal = (valor?: string) => {
        const texto = String(valor ?? '').trim();

        if (/^\d{2}-\d{2}-\d{4}$/.test(texto)) {
            const [dia, mes, anio] = texto.split('-').map(Number);
            return new Date(anio, mes - 1, dia);
        }

        if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
            const [anio, mes, dia] = texto
                .slice(0, 10)
                .split('-')
                .map(Number);

            return new Date(anio, mes - 1, dia);
        }

        return new Date();
    };

    const normalizarFechaDia = (fecha: Date) => {
        const copia = new Date(fecha);

        copia.setHours(0, 0, 0, 0);

        return copia;
    };

    const obtenerFechaMaximaSalida = () => {
        const fecha = normalizarFechaDia(parsearFechaLocal(todayStr()));

        fecha.setDate(fecha.getDate() + 3);

        return fecha;
    };

    const puedeRestarFechaSalida = () => {
        const fechaActual = normalizarFechaDia(
            parsearFechaLocal(fechaSalidaProgramada),
        );

        const hoy = normalizarFechaDia(parsearFechaLocal(todayStr()));

        return fechaActual.getTime() > hoy.getTime();
    };

    const puedeSumarFechaSalida = () => {
        const fechaActual = normalizarFechaDia(
            parsearFechaLocal(fechaSalidaProgramada),
        );

        const fechaMaxima = obtenerFechaMaximaSalida();

        return fechaActual.getTime() < fechaMaxima.getTime();
    };

    const cambiarFechaSalidaProgramada = (cambioDias: number) => {
        const fecha = normalizarFechaDia(
            parsearFechaLocal(fechaSalidaProgramada),
        );

        fecha.setDate(fecha.getDate() + cambioDias);

        const hoy = normalizarFechaDia(parsearFechaLocal(todayStr()));
        const fechaMaxima = obtenerFechaMaximaSalida();

        if (
            fecha.getTime() < hoy.getTime() ||
            fecha.getTime() > fechaMaxima.getTime()
        ) {
            return;
        }

        setFechaSalidaProgramada(formatearFechaDDMMYYYY(fecha));
    };

    const formatearFechaIsoBackend = (fecha: Date) => {
        const fechaUtc = new Date(
            Date.UTC(
                fecha.getFullYear(),
                fecha.getMonth(),
                fecha.getDate(),
                0,
                0,
                0,
            ),
        );

        return fechaUtc.toISOString().replace('.000Z', 'Z');
    };

    const normalizarSubEstado = (valor: any): SubEstadoApi => {
        const texto = String(valor ?? '').trim().toLowerCase();

        if (texto.includes('lact')) {
            return 'lactation';
        }

        if (texto.includes('wean') || texto.includes('destete')) {
            return 'weaning';
        }

        return 'prepartum';
    };
    const [modalOperacionesVisible, setModalOperacionesVisible] =
        useState(false);
    const [modalSalidaVisible, setModalSalidaVisible] =
        useState(false);
    const [tipoSalidaSeleccionada, setTipoSalidaSeleccionada] =
        useState<TipoSalidaAnimal>('salidaMaternidad');

    const [fechaSalidaProgramada, setFechaSalidaProgramada] =
        useState(todayStr());
    const [modalCurvaVisible, setModalCurvaVisible] =
        useState(false);

    const [curvas, setCurvas] = useState<CurvaApi[]>([]);

    const [cargandoCurvas, setCargandoCurvas] =
        useState(false);

    const [guardandoCurva, setGuardandoCurva] =
        useState(false);

    const [modalCondicionVisible, setModalCondicionVisible] =
        useState(false);

    const [condicionesCorporales, setCondicionesCorporales] =
        useState<CondicionCorporalApi[]>([]);

    const [cargandoCondicionesCorporales, setCargandoCondicionesCorporales] =
        useState(false);

    const [guardandoCondicion, setGuardandoCondicion] =
        useState(false);
    const [modalSubEstadoVisible, setModalSubEstadoVisible] =
        useState(false);

    const [guardandoSubEstado, setGuardandoSubEstado] =
        useState(false);

    const [modalCambiarCorralVisible, setModalCambiarCorralVisible] =
        useState(false);

    const [nuevoCorral, setNuevoCorral] = useState('');
    const [errorCambiarCorral, setErrorCambiarCorral] = useState('');

    const [guardandoCorral, setGuardandoCorral] =
        useState(false);
    const [modalIdentificadorAnonimoVisible, setModalIdentificadorAnonimoVisible] =
        useState(false);

    const [tipoIdentificadorAnonimo, setTipoIdentificadorAnonimo] =
        useState<TipoIdentificacionAnonima>('id');

    const [valorIdentificadorAnonimo, setValorIdentificadorAnonimo] =
        useState('');

    const [guardandoIdentificadorAnonimo, setGuardandoIdentificadorAnonimo] =
        useState(false);

    const [modalCrotalVisible, setModalCrotalVisible] =
        useState(false);

    const [nuevoCrotal, setNuevoCrotal] = useState('');
    const [errorSustituirCrotal, setErrorSustituirCrotal] = useState('');

    const [guardandoCrotal, setGuardandoCrotal] =
        useState(false);
    const [modalCapturaLechonesVisible, setModalCapturaLechonesVisible] =
        useState(false);

    const [lechonesVivos, setLechonesVivos] = useState('0');
    const [lechonesMuertos, setLechonesMuertos] = useState('0');
    const [lechonesMomificados, setLechonesMomificados] = useState('0');
    const [fechaCapturaLechones, setFechaCapturaLechones] =
        useState(todayStr());

    const [guardandoCapturaLechones, setGuardandoCapturaLechones] =
        useState(false);

    const [modoCapturaLechones, setModoCapturaLechones] =
        useState<ModoCapturaLechones>('captura');

    const subEstadoNormalizado = String(
        subEstadoVisual ??
        datosMaternidad?.animal?.subState ??
        animal?.subEstado ??
        '',
    )
        .trim()
        .toLowerCase();

    const tieneAnimal =
        Boolean(animal?.id) &&
        String(animal?.id) !== '—';

    const cerrarOperaciones = () => {
        setModalOperacionesVisible(false);
    };
    const abrirOperaciones = () => {
        if (!esAdmin) {
            setModalSoloLecturaVisible(true);
            return;
        }

        setModalOperacionesVisible(true);
    };
    const abrirModalSalidaAnimal = () => {
        cerrarOperaciones();

        setTipoSalidaSeleccionada('salidaMaternidad');
        setFechaSalidaProgramada(todayStr());

        setTimeout(() => {
            setModalSalidaVisible(true);
        }, 200);
    };


    const cargarCurvas = async () => {
        try {
            setCargandoCurvas(true);

            const datos = await consultarCurvas();

            const curvasNormalizadas: CurvaApi[] = Array.isArray(datos)
                ? datos
                    .map((curva: any) => ({
                        id: Number(curva.id),
                        name: String(curva.name ?? '').trim(),
                    }))
                    .filter(
                        curva =>
                            Number.isFinite(curva.id) &&
                            curva.name.length > 0,
                    )
                : [];

            setCurvas(curvasNormalizadas);
        } catch (error) {
            console.log('No se pudieron cargar las curvas:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.loadCurvesError', {
                    defaultValue: 'No se pudieron cargar las curvas.',
                }),
            );
        } finally {
            setCargandoCurvas(false);
        }
    };

    const abrirModalCurva = () => {
        cerrarOperaciones();

        setTimeout(() => {
            setModalCurvaVisible(true);
            cargarCurvas();
        }, 200);
    };

    const aplicarCurva = async (curva: CurvaApi) => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidChangeCurveNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            setGuardandoCurva(true);

            await ejecutarOperacionMaternidad({
                op: 'curve',
                key: pkidAnimalOperacion,
                value: curva.id,
            });

            setCurvaVisual(curva.name);
            setCurvaIdVisual(curva.id);
            setModalCurvaVisible(false);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.changeCurveDone', {
                    defaultValue: 'Curva actualizada correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error cambiando curva:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.changeCurveError', {
                    defaultValue:
                        'No se pudo cambiar la curva.',
                }),
            );
        } finally {
            setGuardandoCurva(false);
        }
    };

    const cargarCondicionesCorporales = async () => {
        try {
            setCargandoCondicionesCorporales(true);

            const datos = await consultarCondicionesCorporales();

            const condicionesNormalizadas: CondicionCorporalApi[] =
                Array.isArray(datos)
                    ? datos
                        .map((condicion: any) => ({
                            description: String(
                                condicion.description ?? '',
                            ).trim(),
                            id: String(condicion.id ?? '').trim(),
                            position: Number(condicion.position),
                            value: Number(condicion.value),
                        }))
                        .filter(
                            condicion =>
                                condicion.description.length > 0 &&
                                condicion.id.length > 0 &&
                                Number.isFinite(condicion.position),
                        )
                        .sort((a, b) => a.position - b.position)
                    : [];

            setCondicionesCorporales(condicionesNormalizadas);
        } catch (error) {
            console.log(
                'No se pudieron cargar las condiciones corporales:',
                error,
            );

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.loadBodyConditionsError', {
                    defaultValue:
                        'No se pudieron cargar las condiciones corporales.',
                }),
            );
        } finally {
            setCargandoCondicionesCorporales(false);
        }
    };

    const abrirModalCondicion = () => {
        cerrarOperaciones();

        setTimeout(() => {
            setModalCondicionVisible(true);
            cargarCondicionesCorporales();
        }, 200);
    };

    const aplicarCondicion = async (
        condicion: CondicionCorporalApi,
    ) => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidChangeBodyConditionNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            setGuardandoCondicion(true);

            await ejecutarOperacionMaternidad({
                op: 'bodyCondition',
                key: pkidAnimalOperacion,
                value: condicion.id,
            });

            setCondicionVisual(condicion.id);
            setModalCondicionVisible(false);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.changeBodyConditionDone', {
                    defaultValue:
                        'Condición corporal actualizada correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error cambiando condición corporal:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.changeBodyConditionError', {
                    defaultValue:
                        'No se pudo cambiar la condición corporal.',
                }),
            );
        } finally {
            setGuardandoCondicion(false);
        }
    };

    const abrirModalSubEstado = () => {
        cerrarOperaciones();

        setTimeout(() => {
            setModalSubEstadoVisible(true);
        }, 200);
    };

    const obtenerTextoSubEstado = (subEstado: SubEstadoApi) => {
        if (subEstado === 'lactation') {
            return 'LACTANCIA';
        }

        if (subEstado === 'weaning') {
            return 'DESTETE';
        }

        return 'PREPARTO';
    };

    const aplicarSubEstadoManual = async (
        nuevoSubEstado: SubEstadoApi,
    ) => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidChangeStateNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            setGuardandoSubEstado(true);

            const fecha = todayStr();



            await ejecutarOperacionMaternidad({
                op: 'changeState',
                key: pkidAnimalOperacion,
                value: JSON.stringify({
                    subState: nuevoSubEstado,
                    date: fecha,
                }),
            });

            setSubEstadoVisual(obtenerTextoSubEstado(nuevoSubEstado));
            setModalSubEstadoVisible(false);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.changeStateDone', {
                    defaultValue: 'SubEstado actualizado correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error cambiando subestado manual:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.changeStateError', {
                    defaultValue:
                        'No se pudo cambiar el estado del animal.',
                }),
            );
        } finally {
            setGuardandoSubEstado(false);
        }
    };

    const abrirModalCambiarCorral = () => {
        cerrarOperaciones();

        setNuevoCorral('');
        setErrorCambiarCorral('');

        setTimeout(() => {
            setModalCambiarCorralVisible(true);
        }, 200);
    };

    const aplicarCambiarCorral = async () => {
        const corralLimpio = nuevoCorral.trim();

        setErrorCambiarCorral('');

        if (!corralLimpio) {
            setErrorCambiarCorral(
                t('matCorralDetail.enterNewPen', {
                    defaultValue: 'Introduce el nuevo corral.',
                }),
            );

            return;
        }

        if (!pkidValido) {
            setErrorCambiarCorral(
                t('matCorralDetail.pkidChangePenNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            Keyboard.dismiss();
            setGuardandoCorral(true);

            await ejecutarOperacionMaternidad({
                op: 'changePen',
                key: pkidAnimalOperacion,
                value: corralLimpio,
            });

            setCorralVisual(corralLimpio);
            setModalCambiarCorralVisible(false);
            setErrorCambiarCorral('');

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.changePenDone', {
                    defaultValue: 'Corral actualizado correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error cambiando corral:', error);

            const mensajeError = String(
                error?.message ?? error ?? '',
            ).toLowerCase();

            if (
                mensajeError.includes('corral not found') ||
                mensajeError.includes('pen not found') ||
                mensajeError.includes('corral no encontrado') ||
                mensajeError.includes('not found')
            ) {
                setErrorCambiarCorral(
                    t('matCorralDetail.penNotFound', {
                        defaultValue: 'Corral no encontrado',
                    }),
                );

                return;
            }

            setErrorCambiarCorral(
                error?.message ??
                t('matCorralDetail.changePenError', {
                    defaultValue: 'No se pudo cambiar el corral.',
                }),
            );
        } finally {
            setGuardandoCorral(false);
        }
    };

    const abrirModalCrotal = () => {
        cerrarOperaciones();

        setNuevoCrotal('');
        setErrorSustituirCrotal('');


        setTimeout(() => {
            setModalCrotalVisible(true);
        }, 200);
    };

    const aplicarCrotal = async () => {
        const crotalNuevo = nuevoCrotal.trim();

        setErrorSustituirCrotal('');

        if (!crotalNuevo) {
            setErrorSustituirCrotal(
                t('matCorralDetail.enterNewEarTag', {
                    defaultValue: 'Introduce el nuevo crotal.',
                }),
            );

            return;
        }

        if (!pkidValido) {
            setErrorSustituirCrotal(
                t('matCorralDetail.pkidEarTagNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            Keyboard.dismiss();
            setGuardandoCrotal(true);

            const payloadCrotal = {
                op: 'replaceEarTag',
                key: pkidAnimalOperacion,
                value: crotalNuevo,
            };

            console.log('===== SUSTITUIR CROTAL =====');
            console.log('payloadCrotal:', JSON.stringify(payloadCrotal, null, 2));
            console.log(
                'datosMaternidad.animal:',
                JSON.stringify(datosMaternidad?.animal, null, 2),
            );

            await ejecutarOperacionMaternidad(payloadCrotal);

            setCrotalVisual(crotalNuevo);
            setModalCrotalVisible(false);
            setErrorSustituirCrotal('');

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.replaceEarTagDone', {
                    defaultValue: 'Crotal actualizado correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error sustituyendo crotal:', error);

            const mensajeError = String(
                error?.message ?? error ?? '',
            ).toLowerCase();

            if (
                mensajeError.includes('crotal asignado a otro animal') ||
                mensajeError.includes('asignado a otro animal') ||
                mensajeError.includes('assigned to another animal')
            ) {
                setErrorSustituirCrotal(
                    t('matCorralDetail.earTagAlreadyAssigned', {
                        defaultValue: 'El crotal está asignado a otro animal',
                    }),
                );

                return;
            }

            setErrorSustituirCrotal(
                error?.message ??
                t('matCorralDetail.replaceEarTagError', {
                    defaultValue: 'No se pudo sustituir el crotal.',
                }),
            );
        } finally {
            setGuardandoCrotal(false);
        }
    };

    const abrirModalCapturaLechones = () => {
        cerrarOperaciones();
        setModoCapturaLechones('captura');

        if (
            subEstadoNormalizado.includes('weaning') ||
            subEstadoNormalizado.includes('destete')
        ) {
            Alert.alert(
                t('matCorralDetail.pigletCapture', {
                    defaultValue: 'Captura de lechones',
                }),
                t('matCorralDetail.weaningPigletsOnlyRead', {
                    defaultValue:
                        'En destete solo se pueden consultar los lechones.',
                }),
            );

            return;
        }

        setLechonesVivos(
            String(
                Number(
                    datosMaternidad?.totalLivePiglets ??
                    animal?.lechonesPresentes ??
                    0,
                ),
            ),
        );

        setLechonesMuertos(
            String(Number(datosMaternidad?.totalDeadPiglets ?? 0)),
        );

        setLechonesMomificados(
            String(Number(datosMaternidad?.totalMummifiedPiglets ?? 0)),
        );

        setFechaCapturaLechones(
            fechaPartoVisual && fechaPartoVisual !== '—'
                ? formatearFechaDDMMYYYY(
                    parsearFechaLocal(String(fechaPartoVisual)),
                )
                : todayStr(),
        );

        setTimeout(() => {
            setModalCapturaLechonesVisible(true);
        }, 200);
    };

    const abrirModalPasarLactancia = () => {
        cerrarOperaciones();

        setModoCapturaLechones('pasarLactancia');

        setLechonesVivos('0');
        setLechonesMuertos('0');
        setLechonesMomificados('0');

        setFechaCapturaLechones(
            fechaPartoVisual && fechaPartoVisual !== '—'
                ? formatearFechaDDMMYYYY(
                    parsearFechaLocal(String(fechaPartoVisual)),
                )
                : todayStr(),
        );

        setTimeout(() => {
            setModalCapturaLechonesVisible(true);
        }, 200);
    };

    const aplicarCapturaLechones = async () => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidPigletsNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        const vivos = parseNumeroEntero(lechonesVivos);
        const muertos = parseNumeroEntero(lechonesMuertos);
        const momificados = parseNumeroEntero(lechonesMomificados);
        const nacidosTotales = vivos + muertos + momificados;

        const fechaDate = parsearFechaLocal(fechaCapturaLechones);
        const fechaIso = formatearFechaIsoBackend(fechaDate);

        try {
            Keyboard.dismiss();
            setGuardandoCapturaLechones(true);

            const payloadLechones = {
                pkid: pkidAnimalOperacion,
                nacidosTotales,
                muertos,
                vivos,
                momificados,
                fecha: fechaIso,
            };

            console.log('===== CAPTURA LECHONES =====');
            console.log(
                'payloadLechones:',
                JSON.stringify(payloadLechones, null, 2),
            );

            await enviarReporteNacidos(payloadLechones);
            if (modoCapturaLechones === 'pasarLactancia') {
                await ejecutarOperacionMaternidad({
                    op: 'changeState',
                    key: pkidAnimalOperacion,
                    value: JSON.stringify({
                        subState: 'lactation',
                        date: formatearFechaDDMMYYYY(fechaDate),
                    }),
                });

                setSubEstadoVisual('LACTANCIA');
            }

            try {
                const datosActualizados = await consultarMaternidadPorPkid(
                    pkidAnimalOperacion,
                );

                const vivosBackend = Number(
                    datosActualizados?.totalLivePiglets ?? vivos,
                );

                const lechonesPresentesBackend = Number(
                    datosActualizados?.totalPigletsPresent ??
                    datosActualizados?.animal?.totalPigletsPresent ??
                    vivosBackend,
                );

                setLechonesPresentesVisual(
                    Number.isFinite(lechonesPresentesBackend)
                        ? lechonesPresentesBackend
                        : vivos,
                );

                const fechaPartoBackend =
                    datosActualizados?.farrowingDate ?? fechaIso;

                setFechaPartoVisual(
                    formatearFechaDDMMYYYY(
                        parsearFechaLocal(fechaPartoBackend),
                    ),
                );

                const subStateBackend =
                    datosActualizados?.animal?.subState ??
                    datosActualizados?.subState;

                if (subStateBackend) {
                    setSubEstadoVisual(
                        obtenerTextoSubEstado(
                            normalizarSubEstado(subStateBackend),
                        ),
                    );
                }
            } catch (errorActualizar) {
                console.log(
                    'No se pudo refrescar el animal tras capturar lechones:',
                    errorActualizar,
                );

                setLechonesPresentesVisual(vivos);
                setFechaPartoVisual(formatearFechaDDMMYYYY(fechaDate));
            }

            setModalCapturaLechonesVisible(false);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.pigletCaptureDone', {
                    defaultValue:
                        'Captura de lechones guardada correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error capturando lechones:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.pigletCaptureError', {
                    defaultValue:
                        'No se pudo guardar la captura de lechones.',
                }),
            );
        } finally {
            setGuardandoCapturaLechones(false);
        }
    };

    const esValorAnonimoCero = (valor: any) => {
        const texto = String(valor ?? '').trim();

        if (!texto || texto === '—') {
            return true;
        }

        return Number(texto) === 0;
    };

    const abrirModalIdentificadorAnonimo = () => {
        cerrarOperaciones();



        const puedeIdentificarAnonimo =
            esValorAnonimoCero(idVisual) &&
            esValorAnonimoCero(crotalVisual);

        if (!puedeIdentificarAnonimo) {
            Alert.alert(
                t('matCorralDetail.anonymousAnimalId', {
                    defaultValue: 'Identificador animal anónimo',
                }),
                t('matCorralDetail.notAnonymousAnimalText', {
                    defaultValue:
                        'Este animal no es anónimo porque ya tiene ID o crotal asignado.',
                }),
            );

            return;
        }

        setTipoIdentificadorAnonimo('id');
        setValorIdentificadorAnonimo('');

        setTimeout(() => {
            setModalIdentificadorAnonimoVisible(true);
        }, 200);
    };
    const refrescarAnimalPorCorral = async () => {
        const corralActual = String(corralVisual ?? '').trim();

        if (!corralActual || corralActual === '—') {
            return;
        }

        try {
            const datosActualizados = await consultarMaternidadPorCorral(
                corralActual,
            );

            console.log('===== ANIMAL REFRESCADO POR CORRAL =====');
            console.log(
                JSON.stringify(datosActualizados?.animal, null, 2),
            );

            const animalActualizado = datosActualizados?.animal ?? {};
            const pkidActualizado = Number(
                animalActualizado?.id ??
                datosActualizados?.animal?.id ??
                datosActualizados?.id ??
                0,
            );

            console.log('PKID ACTUALIZADO POR CORRAL:', pkidActualizado);

            if (
                Number.isFinite(pkidActualizado) &&
                pkidActualizado > 0
            ) {
                setPkidAnimalOperacion(pkidActualizado);
            }

            setIdVisual(
                animalActualizado?.animalId !== null &&
                    animalActualizado?.animalId !== undefined
                    ? String(animalActualizado.animalId)
                    : '—',
            );

            setCrotalVisual(
                animalActualizado?.crotal !== null &&
                    animalActualizado?.crotal !== undefined
                    ? String(animalActualizado.crotal)
                    : '—',
            );

            setCorralVisual(
                animalActualizado?.corralName !== null &&
                    animalActualizado?.corralName !== undefined
                    ? String(animalActualizado.corralName)
                    : corralActual,
            );

            if (animalActualizado?.bodyConditionCorrection !== undefined) {
                setCondicionVisual(
                    String(animalActualizado.bodyConditionCorrection),
                );
            }

            const subStateBackend =
                animalActualizado?.subState ??
                datosActualizados?.subState;

            if (subStateBackend) {
                setSubEstadoVisual(
                    obtenerTextoSubEstado(
                        normalizarSubEstado(subStateBackend),
                    ),
                );
            }

            const lechonesPresentesBackend = Number(
                datosActualizados?.totalPigletsPresent ??
                animalActualizado?.totalPigletsPresent,
            );

            if (Number.isFinite(lechonesPresentesBackend)) {
                setLechonesPresentesVisual(lechonesPresentesBackend);
            }

            if (datosActualizados?.farrowingDate) {
                setFechaPartoVisual(
                    formatearFechaDDMMYYYY(
                        parsearFechaLocal(datosActualizados.farrowingDate),
                    ),
                );
            }
        } catch (error) {
            console.log(
                'No se pudo refrescar el animal por corral:',
                error,
            );
        }
    };
    const aplicarIdentificadorAnonimo = async () => {
        const valorLimpio = valorIdentificadorAnonimo.trim();

        if (!valorLimpio) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                tipoIdentificadorAnonimo === 'id'
                    ? t('matCorralDetail.enterNewId', {
                        defaultValue: 'Introduce el nuevo ID.',
                    })
                    : t('matCorralDetail.enterNewEarTag', {
                        defaultValue: 'Introduce el nuevo crotal.',
                    }),
            );

            return;
        }

        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidIdentifyNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            Keyboard.dismiss();
            setGuardandoIdentificadorAnonimo(true);

            const payloadIdentificadorAnonimo = {
                op: 'anonymousAnimalIdentificacion',
                key: pkidAnimalOperacion,
                value: JSON.stringify({
                    type: tipoIdentificadorAnonimo,
                    value: valorLimpio,
                }),
            };

            console.log('===== IDENTIFICADOR ANÓNIMO =====');
            console.log('pkidAnimalOperacion:', pkidAnimalOperacion);
            console.log('tipoIdentificadorAnonimo:', tipoIdentificadorAnonimo);
            console.log('valorLimpio:', valorLimpio);
            console.log(
                'payloadIdentificadorAnonimo:',
                JSON.stringify(payloadIdentificadorAnonimo, null, 2),
            );
            console.log(
                'datosMaternidad.animal:',
                JSON.stringify(datosMaternidad?.animal, null, 2),
            );

            await ejecutarOperacionMaternidad(payloadIdentificadorAnonimo);

            await refrescarAnimalPorCorral();

            setModalIdentificadorAnonimoVisible(false);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.identifyAnonymousAnimalDone', {
                    defaultValue:
                        'Identificador del animal actualizado correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error identificando animal anónimo:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.identifyAnonymousAnimalError', {
                    defaultValue:
                        'No se pudo identificar el animal anónimo.',
                }),
            );
        } finally {
            setGuardandoIdentificadorAnonimo(false);
        }
    };

    const operacionPendiente = (titulo: string) => {
        cerrarOperaciones();

        Alert.alert(
            titulo,
            t('matCorralDetail.operationsPendingText', {
                defaultValue:
                    'Las operaciones las haremos en el siguiente paso.',
            }),
        );
    };

    const aplicarSubEstado = async (
        nuevoSubEstado: 'prepartum' | 'lactation' | 'weaning',
    ) => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidChangeStateNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            cerrarOperaciones();
            setGuardandoOperacion(true);

            const fecha = todayStr();

            await ejecutarOperacionMaternidad({
                op: 'changeState',
                key: pkidAnimalOperacion,
                value: JSON.stringify({
                    subState: nuevoSubEstado,
                    date: fecha,
                }),
            });

            const textoVisual =
                nuevoSubEstado === 'lactation'
                    ? 'LACTANCIA'
                    : nuevoSubEstado === 'weaning'
                        ? 'DESTETE'
                        : 'PREPARTO';

            setSubEstadoVisual(textoVisual);

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                t('matCorralDetail.operationDone', {
                    defaultValue: 'Operación realizada correctamente.',
                }),
            );
        } catch (error: any) {
            console.log('Error cambiando subestado:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.changeStateError', {
                    defaultValue:
                        'No se pudo cambiar el estado del animal.',
                }),
            );
        } finally {
            setGuardandoOperacion(false);
        }
    };

    const aplicarSalidaAnimal = async ({
        typeBackend,
        textoOk,
        sacarDePantalla,
        fechaSalida,
    }: {
        typeBackend: '0' | '1' | '2' | '3';
        textoOk: string;
        sacarDePantalla: boolean;
        fechaSalida?: string;
    }) => {
        if (!pkidValido) {
            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                t('matCorralDetail.pkidExitNotFound', {
                    defaultValue:
                        'No se encontró el identificador interno del animal.',
                }),
            );

            return;
        }

        try {
            setModalSalidaVisible(false);
            setGuardandoOperacion(true);

            const fecha = fechaSalida ?? todayStr();

            await ejecutarOperacionMaternidad({
                op: 'changeExit',
                key: pkidAnimalOperacion,
                value: JSON.stringify({
                    type: typeBackend,
                    date: fecha,
                }),
            });

            Alert.alert(
                t('matCorralDetail.operations', {
                    defaultValue: 'Operaciones',
                }),
                textoOk,
                [
                    {
                        text: t('matCorralDetail.accept', {
                            defaultValue: 'Aceptar',
                        }),
                        onPress: () => {
                            if (sacarDePantalla) {
                                navigation.goBack();
                            }
                        },
                    },
                ],
            );
        } catch (error: any) {
            console.log('Error realizando salida animal:', error);

            Alert.alert(
                t('matCorralDetail.error', {
                    defaultValue: 'Error',
                }),
                error?.message ??
                t('matCorralDetail.animalExitError', {
                    defaultValue:
                        'No se pudo realizar la salida del animal.',
                }),
            );
        } finally {
            setGuardandoOperacion(false);
        }
    };
    const actual = Number(animal?.consumo?.actual ?? 0);
    const objetivo = Number(animal?.consumo?.objetivo ?? 0);

    const porcentaje =
        animal?.consumo?.porcentaje !== undefined
            ? Number(animal.consumo.porcentaje)
            : objetivo > 0
                ? Math.round((actual / objetivo) * 100)
                : 0;

    const porcentajeLimitado = limitarPorcentaje(porcentaje);

    const diasSinAlimentar = Number(
        animal?.diasSinAlimentar ?? 0,
    );

    const intervalos = useMemo(() => {
        if (
            Array.isArray(animal?.intervalos) &&
            animal.intervalos.length > 0
        ) {
            return animal.intervalos;
        }

        return Array.from({ length: 4 }).map((_, index) => ({
            index,
            porcentaje: 0,
            pct: 0,
            activo: index === 2,
            color: '#CBD5E1',
        }));
    }, [animal]);
    const opcionSalidaSeleccionada =
        OPCIONES_SALIDA_ANIMAL.find(
            opcion => opcion.tipo === tipoSalidaSeleccionada,
        ) ?? OPCIONES_SALIDA_ANIMAL[0];

    const mostrarFechaSalidaProgramada =
        tipoSalidaSeleccionada === 'salidaProgramada' ||
        tipoSalidaSeleccionada === 'salidaProgramadaVacioTolva';

    if (!animal) {
        return (
            <View style={styles.emptyScreen}>
                <Ionicons
                    name="alert-circle-outline"
                    size={46}
                    color="#EA580C"
                />

                <Text style={styles.emptyTitle}>
                    {t('matCorralDetail.noAnimalData')}
                </Text>

                <Text style={styles.emptyText}>
                    {t('matCorralDetail.noAnimalDataText')}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>
                        {t('matCorralDetail.back')}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.card}>
                    <View style={styles.metaRow}>
                        <ChipDato
                            label={t('matCorralDetail.id', {
                                defaultValue: 'ID',
                            })}
                            value={idVisual}
                        />

                        <ChipDato
                            label={t('matCorralDetail.earTag', {
                                defaultValue: 'Crotal',
                            })}
                            value={crotalVisual}
                        />

                        <ChipDato
                            label={t('matCorralDetail.cycle', {
                                defaultValue: 'Ciclo',
                            })}
                            value={animal.ciclo ?? '—'}
                        />
                    </View>

                    <View style={styles.subEstadoRow}>
                        <Text style={styles.subEstado}>
                            {subEstadoVisual}
                        </Text>

                        <View style={styles.diaInline}>
                            <Text style={styles.diaLabel}>
                                {t('matCorralDetail.day', {
                                    defaultValue: 'Día',
                                })}
                            </Text>

                            <Text style={styles.diaValue}>
                                {animal.dia ?? '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.kpiRow}>
                        <View style={styles.kpiLeft}>
                            <View style={styles.kpiValueRow}>
                                <Text style={styles.kpiNumber}>
                                    {formatearNumero(actual)}
                                </Text>

                                <Text style={styles.kpiUnit}>gr</Text>
                            </View>

                            <View style={styles.progressRow}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${porcentajeLimitado}%`,
                                            },
                                        ]}
                                    />
                                </View>

                                <Text style={styles.progressText}>
                                    {porcentajeLimitado}%
                                </Text>
                            </View>

                            <Text style={styles.objectiveText}>
                                {t('matCorralDetail.ofGrams', {
                                    amount: formatearNumero(objetivo),
                                })}
                            </Text>
                        </View>

                        <View style={styles.intervalosBox}>
                            {intervalos.map((intervalo: any, index: number) => {
                                const porcentajeIntervalo = limitarPorcentaje(
                                    intervalo?.porcentaje ?? 0,
                                );

                                const alturaRelleno = Math.round(
                                    88 * (porcentajeIntervalo / 100),
                                );

                                return (
                                    <View
                                        key={`${intervalo.index ?? index}-${index}`}
                                        style={[
                                            styles.intervaloBar,
                                            intervalo?.activo &&
                                            styles.intervaloActivo,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.intervaloFill,
                                                {
                                                    height: alturaRelleno,
                                                    backgroundColor:
                                                        intervalo?.color ?? '#CBD5E1',
                                                },
                                            ]}
                                        />
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {diasSinAlimentar > 0 ? (
                        <View style={styles.alertaSinAlimentar}>
                            <Text style={styles.alertaTexto}>
                                {diasSinAlimentar === 1
                                    ? '1 día sin alimentar'
                                    : `${diasSinAlimentar} días sin alimentar`}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.infoGrid}>
                        <InfoItem
                            label={t('matCorralDetail.curve', {
                                defaultValue: 'Curva',
                            })}
                            value={curvaVisual}
                            pill
                        />

                        <InfoItem
                            label={t('matCorralDetail.correction', {
                                defaultValue: 'Corrección',
                            })}
                            value={condicionVisual}
                        />

                        <InfoItem
                            label={t('matCorralDetail.entryDate', {
                                defaultValue: 'Fecha entrada',
                            })}
                            value={animal.fechas?.entrada ?? '—'}
                        />

                        <InfoItem
                            label={t('matCorralDetail.farrowingDate', {
                                defaultValue: 'Fecha parto',
                            })}
                            value={fechaPartoVisual}
                        />

                        <InfoItem
                            label={t('matCorralDetail.house', {
                                defaultValue: 'Nave',
                            })}
                            value={animal.nave ?? '—'}
                        />

                        <InfoItem
                            label={t('matCorralDetail.pen', {
                                defaultValue: 'Corral',
                            })}
                            value={corralVisual}
                        />

                        <InfoItem
                            label={t('matCorralDetail.lastFeeding', {
                                defaultValue: 'Última alimentación',
                            })}
                            value={animal.ultimaAlimentacion ?? '—'}
                        />

                        <InfoItem
                            label={t('matCorralDetail.presentPiglets', {
                                defaultValue: 'Lechones presentes',
                            })}
                            value={lechonesPresentesVisual}
                        />

                        <InfoItem
                            label={t('matCorralDetail.inseminationDate', {
                                defaultValue: 'Fecha inseminación',
                            })}
                            value={animal.fechas?.inseminacion ?? '—'}
                        />

                        <InfoItem
                            label={t('matCorralDetail.teatsNumber', {
                                defaultValue: 'Nº tetas',
                            })}
                            value={animal.numeroTetas ?? '—'}
                        />
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                activeOpacity={0.9}
                onPress={abrirOperaciones}
                style={styles.fab}
            >
                <Text style={styles.fabText}>
                    {t('matCorralDetail.operations', {
                        defaultValue: 'Operaciones',
                    })}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={modalSoloLecturaVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalSoloLecturaVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(15, 23, 42, 0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 24,
                    }}
                >
                    <View
                        style={{
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
                            shadowOffset: {
                                width: 0,
                                height: 6,
                            },
                        }}
                    >
                        <View
                            style={{
                                width: 78,
                                height: 78,
                                borderRadius: 39,
                                backgroundColor: '#FFF7ED',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                            }}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={34}
                                color="#EA580C"
                            />
                        </View>

                        <Text
                            style={{
                                fontSize: 27,
                                fontWeight: '900',
                                color: TEXT,
                                textAlign: 'center',
                                marginBottom: 12,
                            }}
                        >
                            {t('matCorralDetail.readOnlyPermission', {
                                defaultValue: 'Permiso de solo lectura',
                            })}
                        </Text>

                        <Text
                            style={{
                                fontSize: 17,
                                lineHeight: 25,
                                fontWeight: '700',
                                color: MUTED,
                                textAlign: 'center',
                                marginBottom: 24,
                            }}
                        >
                            {t('matCorralDetail.readOnlyPermissionText', {
                                defaultValue:
                                    'Este usuario solo tiene permisos de lectura. No puede realizar operaciones sobre el animal.',
                            })}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => setModalSoloLecturaVisible(false)}
                            style={{
                                width: '100%',
                                height: 52,
                                borderRadius: 16,
                                backgroundColor: '#2563EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 17,
                                    fontWeight: '900',
                                }}
                            >
                                {t('matCorralDetail.accept', {
                                    defaultValue: 'Aceptar',
                                })}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalOperacionesVisible}
                transparent
                animationType="fade"
                onRequestClose={cerrarOperaciones}
            >
                <View style={styles.modalOperacionesOverlay}>
                    <Pressable
                        style={styles.modalOperacionesBackdrop}
                        onPress={cerrarOperaciones}
                    />
                    <View style={styles.panelOperaciones}>
                        <View style={styles.grabberOperaciones} />

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.contenidoPanelOperaciones}
                        >
                            <View style={styles.cabeceraOperaciones}>
                                <View style={styles.iconoCabeceraOperaciones}>
                                    <Ionicons
                                        name="options-outline"
                                        size={23}
                                        color={BRAND}
                                    />
                                </View>

                                <View style={styles.textosCabeceraOperaciones}>
                                    <Text style={styles.tituloOperaciones}>
                                        {t('matCorralDetail.operations', {
                                            defaultValue: 'Operaciones',
                                        })}
                                    </Text>

                                    <Text style={styles.subtituloOperaciones}>
                                        {t('matCorralDetail.chooseOption', {
                                            defaultValue:
                                                'Selecciona una operación para este animal.',
                                        })}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={cerrarOperaciones}
                                    style={styles.botonCerrarOperaciones}
                                >
                                    <Ionicons
                                        name="close-outline"
                                        size={24}
                                        color={MUTED}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.seccionOperaciones}>
                                {t('matCorralDetail.nextOperation', {
                                    defaultValue: 'Siguiente operación',
                                })}
                            </Text>

                            <View style={styles.grupoOperaciones}>
                                {!tieneAnimal ? (
                                    <OpcionOperacion
                                        icono="add-circle-outline"
                                        titulo={t('matCorralDetail.insertAnimal', {
                                            defaultValue: 'Insertar animal',
                                        })}
                                        onPress={() =>
                                            operacionPendiente(
                                                t('matCorralDetail.insertAnimal', {
                                                    defaultValue: 'Insertar animal',
                                                }),
                                            )
                                        }
                                    />
                                ) : subEstadoNormalizado.includes('prepartum') ||
                                    subEstadoNormalizado.includes('preparto') ? (
                                    <OpcionOperacion
                                        icono="medkit-outline"
                                        titulo={t('matCorralDetail.moveToLactation', {
                                            defaultValue: 'Pasar a lactancia',
                                        })}
                                        disabled={guardandoOperacion || guardandoCapturaLechones}
                                        onPress={abrirModalPasarLactancia}
                                    />
                                ) : subEstadoNormalizado.includes('lactation') ||
                                    subEstadoNormalizado.includes('lactancia') ? (
                                    <OpcionOperacion
                                        icono="flag-outline"
                                        titulo={t('matCorralDetail.moveToWeaning', {
                                            defaultValue: 'Pasar a destete',
                                        })}
                                        disabled={guardandoOperacion}
                                        onPress={() => {
                                            Alert.alert(
                                                t('matCorralDetail.moveToWeaning', {
                                                    defaultValue: 'Pasar a destete',
                                                }),
                                                t('matCorralDetail.confirmNextOperation', {
                                                    defaultValue:
                                                        '¿Seguro que quieres pasar a la siguiente operación?',
                                                }),
                                                [
                                                    {
                                                        text: t('matCorralDetail.cancel', {
                                                            defaultValue: 'Cancelar',
                                                        }),
                                                        style: 'cancel',
                                                    },
                                                    {
                                                        text: t('matCorralDetail.accept', {
                                                            defaultValue: 'Aceptar',
                                                        }),
                                                        onPress: () => aplicarSubEstado('weaning'),
                                                    },
                                                ],
                                            );
                                        }}
                                    />
                                ) : subEstadoNormalizado.includes('weaning') ||
                                    subEstadoNormalizado.includes('destete') ? (
                                    <OpcionOperacion
                                        icono="exit-outline"
                                        titulo={t('matCorralDetail.animalExit', {
                                            defaultValue: 'Salida animal',
                                        })}
                                        disabled={guardandoOperacion}
                                        onPress={abrirModalSalidaAnimal}
                                    />
                                ) : (
                                    <OpcionOperacion
                                        icono="arrow-forward-outline"
                                        titulo={t('matCorralDetail.nextStep', {
                                            defaultValue: 'Siguiente paso',
                                        })}
                                        onPress={() =>
                                            operacionPendiente(
                                                t('matCorralDetail.nextStep', {
                                                    defaultValue: 'Siguiente paso',
                                                }),
                                            )
                                        }
                                    />
                                )}
                            </View>

                            <Text style={styles.seccionOperaciones}>
                                {t('matCorralDetail.actions', {
                                    defaultValue: 'Acciones',
                                })}
                            </Text>

                            <View style={styles.grupoOperaciones}>
                                <OpcionOperacion
                                    icono="pulse-outline"
                                    titulo={t('matCorralDetail.curve', {
                                        defaultValue: 'Curva',
                                    })}
                                    disabled={!tieneAnimal || guardandoCurva}
                                    onPress={abrirModalCurva}
                                />

                                <View style={styles.divisorOperacion} />
                                <OpcionOperacion
                                    icono="body-outline"
                                    titulo={t('matCorralDetail.bodyCondition', {
                                        defaultValue: 'Condición corporal',
                                    })}
                                    disabled={!tieneAnimal || guardandoCondicion}
                                    onPress={abrirModalCondicion}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="flag-outline"
                                    titulo={t('matCorralDetail.subState', {
                                        defaultValue: 'SubEstado',
                                    })}
                                    disabled={!tieneAnimal || guardandoSubEstado}
                                    onPress={abrirModalSubEstado}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="paw-outline"
                                    titulo={t('matCorralDetail.pigletCapture', {
                                        defaultValue: 'Captura de lechones',
                                    })}
                                    disabled={!tieneAnimal || guardandoCapturaLechones}
                                    onPress={abrirModalCapturaLechones}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="exit-outline"
                                    titulo={t('matCorralDetail.animalExit', {
                                        defaultValue: 'Salida animal',
                                    })}
                                    disabled={!tieneAnimal || guardandoOperacion}
                                    onPress={abrirModalSalidaAnimal}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="pricetag-outline"
                                    titulo={t('matCorralDetail.replaceEarTag', {
                                        defaultValue: 'Sustituir crotal',
                                    })}
                                    disabled={!tieneAnimal || guardandoCrotal}
                                    onPress={abrirModalCrotal}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="home-outline"
                                    titulo={t('matCorralDetail.changePen', {
                                        defaultValue: 'Cambiar corral',
                                    })}
                                    disabled={!tieneAnimal || guardandoCorral}
                                    onPress={abrirModalCambiarCorral}
                                />

                                <View style={styles.divisorOperacion} />

                                <OpcionOperacion
                                    icono="finger-print-outline"
                                    titulo={t('matCorralDetail.anonymousAnimalId', {
                                        defaultValue: 'Identificador animal anónimo',
                                    })}
                                    disabled={!tieneAnimal || guardandoIdentificadorAnonimo}
                                    onPress={abrirModalIdentificadorAnonimo}
                                />
                            </View>
                        </ScrollView>
                    </View>


                </View>
            </Modal>
            <Modal
                visible={modalSalidaVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalSalidaVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalSalidaVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="exit-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.animalExit', {
                                        defaultValue: 'Salida animal',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.selectExitType', {
                                        defaultValue:
                                            'Selecciona el tipo de salida que quieres aplicar.',
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalSalidaVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        {OPCIONES_SALIDA_ANIMAL.map(opcion => {
                            const activa = tipoSalidaSeleccionada === opcion.tipo;

                            return (
                                <TouchableOpacity
                                    key={opcion.tipo}
                                    activeOpacity={0.85}
                                    disabled={guardandoOperacion}
                                    style={styles.opcionSalidaRadio}
                                    onPress={() => setTipoSalidaSeleccionada(opcion.tipo)}
                                >
                                    <Ionicons
                                        name={activa ? 'radio-button-on' : 'radio-button-off'}
                                        size={24}
                                        color={activa ? '#4F46E5' : MUTED}
                                    />

                                    <Text style={styles.textoOpcionSalidaRadio}>
                                        {t(opcion.labelKey, {
                                            defaultValue: opcion.defaultValue,
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {mostrarFechaSalidaProgramada ? (
                            <View style={styles.cajaFechaSalida}>
                                <Text style={styles.labelFechaStepper}>
                                    {t('matCorralDetail.scheduledDate', {
                                        defaultValue: 'Fecha programada',
                                    })}
                                </Text>

                                <View style={styles.filaFechaStepper}>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        disabled={
                                            guardandoOperacion || !puedeRestarFechaSalida()
                                        }
                                        onPress={() => cambiarFechaSalidaProgramada(-1)}
                                        style={[
                                            styles.botonStepper,
                                            (guardandoOperacion ||
                                                !puedeRestarFechaSalida()) &&
                                            styles.botonStepperDisabled,
                                        ]}
                                    >
                                        <Ionicons
                                            name="remove-outline"
                                            size={24}
                                            color={TEXT}
                                        />
                                    </TouchableOpacity>

                                    <View style={styles.valorFechaStepper}>
                                        <Text style={styles.textoValorStepper}>
                                            {fechaSalidaProgramada}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        disabled={
                                            guardandoOperacion || !puedeSumarFechaSalida()
                                        }
                                        onPress={() => cambiarFechaSalidaProgramada(1)}
                                        style={[
                                            styles.botonStepper,
                                            styles.botonStepperMas,
                                            (guardandoOperacion ||
                                                !puedeSumarFechaSalida()) &&
                                            styles.botonStepperDisabled,
                                        ]}
                                    >
                                        <Ionicons
                                            name="add-outline"
                                            size={26}
                                            color="#FFFFFF"
                                        />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.textoAyudaFechaSalida}>
                                    {t('matCorralDetail.exitDateLimitText', {
                                        defaultValue:
                                            'No se puede seleccionar una fecha anterior a hoy ni posterior a 3 días.',
                                    })}
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.lineaModalSeparadora} />

                        <View style={styles.botonesModalFila}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoOperacion}
                                onPress={() => setModalSalidaVisible(false)}
                                style={styles.botonModalCancelar}
                            >
                                <Text style={styles.textoBotonModalCancelar}>
                                    {t('matCorralDetail.cancel', {
                                        defaultValue: 'Cancelar',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoOperacion}
                                onPress={() =>
                                    aplicarSalidaAnimal({
                                        typeBackend: opcionSalidaSeleccionada.typeBackend,
                                        textoOk: t('matCorralDetail.animalExitDone', {
                                            defaultValue:
                                                'Salida de animal realizada correctamente.',
                                        }),
                                        sacarDePantalla:
                                            opcionSalidaSeleccionada.sacarDePantalla,
                                        fechaSalida: mostrarFechaSalidaProgramada
                                            ? fechaSalidaProgramada
                                            : todayStr(),
                                    })
                                }
                                style={[
                                    styles.botonModalAceptar,
                                    guardandoOperacion &&
                                    styles.botonModalAceptarDisabled,
                                ]}
                            >
                                <Text style={styles.textoBotonModalAceptar}>
                                    {guardandoOperacion
                                        ? t('matCorralDetail.saving', {
                                            defaultValue: 'Guardando...',
                                        })
                                        : t('matCorralDetail.accept', {
                                            defaultValue: 'Aceptar',
                                        })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalCurvaVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalCurvaVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalCurvaVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="pulse-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.selectCurve', {
                                        defaultValue: 'Seleccionar curva',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.selectCurveText', {
                                        defaultValue:
                                            'Selecciona la nueva curva del animal.',
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalCurvaVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        {cargandoCurvas ? (
                            <Text style={styles.textoOpcionSalida}>
                                {t('matCorralDetail.loadingCurves', {
                                    defaultValue: 'Cargando curvas...',
                                })}
                            </Text>
                        ) : curvas.length === 0 ? (
                            <Text style={styles.textoOpcionSalida}>
                                {t('matCorralDetail.noCurvesAvailable', {
                                    defaultValue: 'No hay curvas disponibles.',
                                })}
                            </Text>
                        ) : (
                            <ScrollView
                                style={{ maxHeight: 360 }}
                                showsVerticalScrollIndicator
                            >
                                {curvas.map(curva => {
                                    const activa =
                                        Number(curvaIdVisual) === Number(curva.id);

                                    return (
                                        <TouchableOpacity
                                            key={curva.id}
                                            activeOpacity={0.85}
                                            disabled={guardandoCurva}
                                            style={styles.opcionSalida}
                                            onPress={() => {
                                                Alert.alert(
                                                    curva.name,
                                                    t('matCorralDetail.confirmChangeCurve', {
                                                        defaultValue:
                                                            '¿Seguro que quieres cambiar la curva?',
                                                    }),
                                                    [
                                                        {
                                                            text: t('matCorralDetail.cancel', {
                                                                defaultValue: 'Cancelar',
                                                            }),
                                                            style: 'cancel',
                                                        },
                                                        {
                                                            text: t('matCorralDetail.accept', {
                                                                defaultValue: 'Aceptar',
                                                            }),
                                                            onPress: () => aplicarCurva(curva),
                                                        },
                                                    ],
                                                );
                                            }}
                                        >
                                            <Ionicons
                                                name={
                                                    activa
                                                        ? 'radio-button-on'
                                                        : 'radio-button-off'
                                                }
                                                size={22}
                                                color={activa ? BRAND : MUTED}
                                            />

                                            <Text style={styles.textoOpcionSalida}>
                                                {curva.name}
                                            </Text>

                                            <Ionicons
                                                name="chevron-forward-outline"
                                                size={19}
                                                color={MUTED}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalCondicionVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalCondicionVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalCondicionVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="body-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.bodyCondition', {
                                        defaultValue: 'Condición corporal',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.selectBodyConditionText', {
                                        defaultValue:
                                            'Selecciona la nueva condición corporal del animal.',
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalCondicionVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        {cargandoCondicionesCorporales ? (
                            <Text style={styles.textoOpcionSalida}>
                                {t('matCorralDetail.loadingBodyConditions', {
                                    defaultValue:
                                        'Cargando condiciones corporales...',
                                })}
                            </Text>
                        ) : condicionesCorporales.length === 0 ? (
                            <Text style={styles.textoOpcionSalida}>
                                {t('matCorralDetail.noBodyConditionsAvailable', {
                                    defaultValue:
                                        'No hay condiciones corporales disponibles.',
                                })}
                            </Text>
                        ) : (
                            <ScrollView
                                style={{ maxHeight: 360 }}
                                showsVerticalScrollIndicator
                            >
                                {condicionesCorporales.map(condicion => {
                                    const activa =
                                        String(condicionVisual) ===
                                        String(condicion.id);

                                    return (
                                        <TouchableOpacity
                                            key={condicion.id}
                                            activeOpacity={0.85}
                                            disabled={guardandoCondicion}
                                            style={styles.opcionSalida}
                                            onPress={() => {
                                                Alert.alert(
                                                    condicion.id,
                                                    t('matCorralDetail.confirmChangeBodyCondition', {
                                                        defaultValue:
                                                            '¿Seguro que quieres cambiar la condición corporal?',
                                                    }),
                                                    [
                                                        {
                                                            text: t('matCorralDetail.cancel', {
                                                                defaultValue: 'Cancelar',
                                                            }),
                                                            style: 'cancel',
                                                        },
                                                        {
                                                            text: t('matCorralDetail.accept', {
                                                                defaultValue: 'Aceptar',
                                                            }),
                                                            onPress: () =>
                                                                aplicarCondicion(
                                                                    condicion,
                                                                ),
                                                        },
                                                    ],
                                                );
                                            }}
                                        >
                                            <Ionicons
                                                name={
                                                    activa
                                                        ? 'radio-button-on'
                                                        : 'radio-button-off'
                                                }
                                                size={22}
                                                color={activa ? BRAND : MUTED}
                                            />

                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.textoOpcionSalida}>
                                                    {condicion.id}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: MUTED,
                                                        fontSize: 12,
                                                        fontWeight: '700',
                                                        marginTop: 1,
                                                    }}
                                                >
                                                    {condicion.description}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name="chevron-forward-outline"
                                                size={19}
                                                color={MUTED}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalSubEstadoVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalSubEstadoVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalSubEstadoVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="flag-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.subState', {
                                        defaultValue: 'SubEstado',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.selectSubStateText', {
                                        defaultValue:
                                            'Selecciona manualmente el nuevo subestado del animal.',
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalSubEstadoVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        {OPCIONES_SUB_ESTADO.map(opcion => {
                            const activo =
                                subEstadoNormalizado.includes(opcion.value) ||
                                subEstadoNormalizado.includes(
                                    opcion.defaultValue.toLowerCase(),
                                );

                            return (
                                <TouchableOpacity
                                    key={opcion.value}
                                    activeOpacity={0.85}
                                    disabled={guardandoSubEstado}
                                    style={styles.opcionSalida}
                                    onPress={() => {
                                        Alert.alert(
                                            t(opcion.labelKey, {
                                                defaultValue: opcion.defaultValue,
                                            }),
                                            t('matCorralDetail.confirmChangeSubState', {
                                                defaultValue:
                                                    '¿Seguro que quieres cambiar el subestado?',
                                            }),
                                            [
                                                {
                                                    text: t('matCorralDetail.cancel', {
                                                        defaultValue: 'Cancelar',
                                                    }),
                                                    style: 'cancel',
                                                },
                                                {
                                                    text: t('matCorralDetail.accept', {
                                                        defaultValue: 'Aceptar',
                                                    }),
                                                    onPress: () =>
                                                        aplicarSubEstadoManual(
                                                            opcion.value,
                                                        ),
                                                },
                                            ],
                                        );
                                    }}
                                >
                                    <Ionicons
                                        name={activo ? 'radio-button-on' : opcion.icono}
                                        size={22}
                                        color={activo ? BRAND : MUTED}
                                    />

                                    <Text style={styles.textoOpcionSalida}>
                                        {t(opcion.labelKey, {
                                            defaultValue: opcion.defaultValue,
                                        })}
                                    </Text>

                                    <Ionicons
                                        name="chevron-forward-outline"
                                        size={19}
                                        color={MUTED}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalCambiarCorralVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setModalCambiarCorralVisible(false);
                    setErrorCambiarCorral('');
                }}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => {
                            setModalCambiarCorralVisible(false);
                            setErrorCambiarCorral('');
                        }}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="home-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.changePen', {
                                        defaultValue: 'Cambiar corral',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.currentPen', {
                                        pen: corralVisual,
                                        defaultValue: `Corral actual: ${corralVisual}`,
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setModalCambiarCorralVisible(false);
                                    setErrorCambiarCorral('');
                                }}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.labelInputCorral}>
                            {t('matCorralDetail.newPen', {
                                defaultValue: 'Nuevo corral',
                            })}
                        </Text>

                        <TextInput
                            value={nuevoCorral}
                            onChangeText={texto => {
                                setNuevoCorral(texto.replace(/[^0-9]/g, ''));

                                if (errorCambiarCorral) {
                                    setErrorCambiarCorral('');
                                }
                            }}
                            editable={!guardandoCorral}
                            keyboardType="numeric"
                            inputMode="numeric"
                            placeholder={t('matCorralDetail.enterNewPen', {
                                defaultValue: 'Introduce el nuevo corral',
                            })}
                            placeholderTextColor="#94A3B8"
                            style={[
                                styles.inputCorral,
                                errorCambiarCorral && styles.inputCorralError,
                            ]}
                        />

                        {!!errorCambiarCorral && (
                            <Text style={styles.textoErrorModal}>
                                {errorCambiarCorral}
                            </Text>
                        )}

                        <View style={styles.botonesModalFila}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoCorral}
                                onPress={() => {
                                    setModalCambiarCorralVisible(false);
                                    setErrorCambiarCorral('');
                                }}
                                style={styles.botonModalCancelar}
                            >
                                <Text style={styles.textoBotonModalCancelar}>
                                    {t('matCorralDetail.cancel', {
                                        defaultValue: 'Cancelar',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={!nuevoCorral.trim() || guardandoCorral}
                                onPress={aplicarCambiarCorral}
                                style={[
                                    styles.botonModalAceptar,
                                    (!nuevoCorral.trim() || guardandoCorral) &&
                                    styles.botonModalAceptarDisabled,
                                ]}
                            >
                                <Text style={styles.textoBotonModalAceptar}>
                                    {guardandoCorral
                                        ? t('matCorralDetail.saving', {
                                            defaultValue: 'Guardando...',
                                        })
                                        : t('matCorralDetail.accept', {
                                            defaultValue: 'Aceptar',
                                        })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalIdentificadorAnonimoVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalIdentificadorAnonimoVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalIdentificadorAnonimoVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="finger-print-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.anonymousAnimalId', {
                                        defaultValue: 'Identificador animal anónimo',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.identifyAnonymousAnimalText', {
                                        defaultValue:
                                            'Elige si quieres asignar un ID o un crotal al animal.',
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalIdentificadorAnonimoVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.selectorIdentificador}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setTipoIdentificadorAnonimo('id');
                                    setValorIdentificadorAnonimo('');
                                }}
                                style={[
                                    styles.opcionIdentificador,
                                    tipoIdentificadorAnonimo === 'id' &&
                                    styles.opcionIdentificadorActiva,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        tipoIdentificadorAnonimo === 'id'
                                            ? 'radio-button-on'
                                            : 'radio-button-off'
                                    }
                                    size={21}
                                    color={
                                        tipoIdentificadorAnonimo === 'id'
                                            ? BRAND
                                            : MUTED
                                    }
                                />

                                <Text style={styles.textoIdentificador}>
                                    ID
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setTipoIdentificadorAnonimo('crotal');
                                    setValorIdentificadorAnonimo('');
                                }}
                                style={[
                                    styles.opcionIdentificador,
                                    tipoIdentificadorAnonimo === 'crotal' &&
                                    styles.opcionIdentificadorActiva,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        tipoIdentificadorAnonimo === 'crotal'
                                            ? 'radio-button-on'
                                            : 'radio-button-off'
                                    }
                                    size={21}
                                    color={
                                        tipoIdentificadorAnonimo === 'crotal'
                                            ? BRAND
                                            : MUTED
                                    }
                                />

                                <Text style={styles.textoIdentificador}>
                                    {t('matCorralDetail.earTag', {
                                        defaultValue: 'Crotal',
                                    })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.labelInputCorral}>
                            {tipoIdentificadorAnonimo === 'id'
                                ? t('matCorralDetail.newId', {
                                    defaultValue: 'Nuevo ID',
                                })
                                : t('matCorralDetail.newEarTag', {
                                    defaultValue: 'Nuevo crotal',
                                })}
                        </Text>

                        <TextInput
                            value={valorIdentificadorAnonimo}
                            onChangeText={texto => {
                                if (tipoIdentificadorAnonimo === 'crotal') {
                                    setValorIdentificadorAnonimo(
                                        texto.replace(/[^0-9]/g, ''),
                                    );
                                } else {
                                    setValorIdentificadorAnonimo(texto);
                                }
                            }}
                            editable={!guardandoIdentificadorAnonimo}
                            keyboardType={
                                tipoIdentificadorAnonimo === 'crotal'
                                    ? 'numeric'
                                    : 'default'
                            }
                            inputMode={
                                tipoIdentificadorAnonimo === 'crotal'
                                    ? 'numeric'
                                    : 'text'
                            }
                            autoCapitalize="characters"
                            placeholder={
                                tipoIdentificadorAnonimo === 'id'
                                    ? t('matCorralDetail.idExample', {
                                        defaultValue: 'Ej: 1010',
                                    })
                                    : t('matCorralDetail.earTagExample', {
                                        defaultValue: 'Ej: 123',
                                    })
                            }
                            placeholderTextColor="#94A3B8"
                            style={styles.inputCorral}
                        />

                        <View style={styles.botonesModalFila}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoIdentificadorAnonimo}
                                onPress={() => setModalIdentificadorAnonimoVisible(false)}
                                style={styles.botonModalCancelar}
                            >
                                <Text style={styles.textoBotonModalCancelar}>
                                    {t('matCorralDetail.cancel', {
                                        defaultValue: 'Cancelar',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={
                                    !valorIdentificadorAnonimo.trim() ||
                                    guardandoIdentificadorAnonimo
                                }
                                onPress={aplicarIdentificadorAnonimo}
                                style={[
                                    styles.botonModalAceptar,
                                    (!valorIdentificadorAnonimo.trim() ||
                                        guardandoIdentificadorAnonimo) &&
                                    styles.botonModalAceptarDisabled,
                                ]}
                            >
                                <Text style={styles.textoBotonModalAceptar}>
                                    {guardandoIdentificadorAnonimo
                                        ? t('matCorralDetail.saving', {
                                            defaultValue: 'Guardando...',
                                        })
                                        : t('matCorralDetail.accept', {
                                            defaultValue: 'Aceptar',
                                        })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalCrotalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setModalCrotalVisible(false);
                    setErrorSustituirCrotal('');
                }}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => {
                            setModalCrotalVisible(false);
                            setErrorSustituirCrotal('');
                        }}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="pricetag-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {t('matCorralDetail.replaceEarTag', {
                                        defaultValue: 'Sustituir crotal',
                                    })}
                                </Text>

                                <Text style={styles.modalSalidaSubtitulo}>
                                    {t('matCorralDetail.currentEarTag', {
                                        earTag: crotalVisual,
                                        defaultValue: `Crotal actual: ${crotalVisual}`,
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setModalCrotalVisible(false);
                                    setErrorSustituirCrotal('');
                                }}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.labelInputCorral}>
                            {t('matCorralDetail.newEarTag', {
                                defaultValue: 'Nuevo crotal',
                            })}
                        </Text>

                        <TextInput
                            value={nuevoCrotal}
                            onChangeText={texto => {
                                setNuevoCrotal(texto.replace(/[^0-9]/g, ''));

                                if (errorSustituirCrotal) {
                                    setErrorSustituirCrotal('');
                                }
                            }}
                            editable={!guardandoCrotal}
                            keyboardType="numeric"
                            inputMode="numeric"
                            placeholder={t('matCorralDetail.enterNewEarTag', {
                                defaultValue: 'Introduce el nuevo crotal',
                            })}
                            placeholderTextColor="#94A3B8"
                            style={[
                                styles.inputCorral,
                                errorSustituirCrotal && styles.inputCorralError,
                            ]}
                        />

                        {!!errorSustituirCrotal && (
                            <Text style={styles.textoErrorModal}>
                                {errorSustituirCrotal}
                            </Text>
                        )}

                        <View style={styles.botonesModalFila}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoCrotal}
                                onPress={() => {
                                    setModalCrotalVisible(false);
                                    setErrorSustituirCrotal('');
                                }}
                                style={styles.botonModalCancelar}
                            >
                                <Text style={styles.textoBotonModalCancelar}>
                                    {t('matCorralDetail.cancel', {
                                        defaultValue: 'Cancelar',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={!nuevoCrotal.trim() || guardandoCrotal}
                                onPress={aplicarCrotal}
                                style={[
                                    styles.botonModalAceptar,
                                    (!nuevoCrotal.trim() || guardandoCrotal) &&
                                    styles.botonModalAceptarDisabled,
                                ]}
                            >
                                <Text style={styles.textoBotonModalAceptar}>
                                    {guardandoCrotal
                                        ? t('matCorralDetail.saving', {
                                            defaultValue: 'Guardando...',
                                        })
                                        : t('matCorralDetail.accept', {
                                            defaultValue: 'Aceptar',
                                        })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={modalCapturaLechonesVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalCapturaLechonesVisible(false)}
            >
                <View style={styles.modalSalidaOverlay}>
                    <Pressable
                        style={styles.modalSalidaBackdrop}
                        onPress={() => setModalCapturaLechonesVisible(false)}
                    />

                    <View style={styles.modalSalidaCard}>
                        <View style={styles.modalSalidaHeader}>
                            <View style={styles.modalSalidaIcono}>
                                <Ionicons
                                    name="paw-outline"
                                    size={24}
                                    color={BRAND}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalSalidaTitulo}>
                                    {modoCapturaLechones === 'pasarLactancia'
                                        ? t('matCorralDetail.moveToLactation', {
                                            defaultValue: 'Pasar a lactancia',
                                        })
                                        : t('matCorralDetail.pigletCapture', {
                                            defaultValue: 'Captura de lechones',
                                        })}
                                </Text>
                                <Text style={styles.modalSalidaSubtitulo}>
                                    {modoCapturaLechones === 'pasarLactancia'
                                        ? t('matCorralDetail.captureBeforeLactationText', {
                                            defaultValue:
                                                'Registra los nacidos antes de pasar a lactancia.',
                                        })
                                        : t('matCorralDetail.pigletCaptureText', {
                                            defaultValue:
                                                'Introduce los lechones vivos, muertos y momificados.',
                                        })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setModalCapturaLechonesVisible(false)}
                                style={styles.botonCerrarOperaciones}
                            >
                                <Ionicons
                                    name="close-outline"
                                    size={24}
                                    color={MUTED}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cajaCapturaLechones}>
                            <FilaStepperLechones
                                label={t('matCorralDetail.livePiglets', {
                                    defaultValue: 'Vivos',
                                })}
                                value={lechonesVivos}
                                disabled={guardandoCapturaLechones}
                                onMinus={() =>
                                    cambiarNumeroLechones(
                                        lechonesVivos,
                                        setLechonesVivos,
                                        -1,
                                    )
                                }
                                onPlus={() =>
                                    cambiarNumeroLechones(
                                        lechonesVivos,
                                        setLechonesVivos,
                                        1,
                                    )
                                }
                            />

                            <FilaStepperLechones
                                label={t('matCorralDetail.deadPiglets', {
                                    defaultValue: 'Muertos',
                                })}
                                value={lechonesMuertos}
                                disabled={guardandoCapturaLechones}
                                onMinus={() =>
                                    cambiarNumeroLechones(
                                        lechonesMuertos,
                                        setLechonesMuertos,
                                        -1,
                                    )
                                }
                                onPlus={() =>
                                    cambiarNumeroLechones(
                                        lechonesMuertos,
                                        setLechonesMuertos,
                                        1,
                                    )
                                }
                            />

                            <FilaStepperLechones
                                label={t('matCorralDetail.mummifiedPiglets', {
                                    defaultValue: 'Momificados',
                                })}
                                value={lechonesMomificados}
                                disabled={guardandoCapturaLechones}
                                onMinus={() =>
                                    cambiarNumeroLechones(
                                        lechonesMomificados,
                                        setLechonesMomificados,
                                        -1,
                                    )
                                }
                                onPlus={() =>
                                    cambiarNumeroLechones(
                                        lechonesMomificados,
                                        setLechonesMomificados,
                                        1,
                                    )
                                }
                            />
                        </View>

                        <View style={styles.cajaFechaLechones}>
                            <Text style={styles.labelFechaStepper}>
                                {t('matCorralDetail.farrowingDate', {
                                    defaultValue: 'Fecha',
                                })}
                            </Text>

                            <View style={styles.filaFechaStepper}>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={guardandoCapturaLechones}
                                    onPress={() => cambiarFechaCaptura(-1)}
                                    style={[
                                        styles.botonStepper,
                                        guardandoCapturaLechones &&
                                        styles.botonStepperDisabled,
                                    ]}
                                >
                                    <Ionicons
                                        name="remove-outline"
                                        size={24}
                                        color={TEXT}
                                    />
                                </TouchableOpacity>

                                <View style={styles.valorFechaStepper}>
                                    <Text style={styles.textoValorStepper}>
                                        {fechaCapturaLechones}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={guardandoCapturaLechones}
                                    onPress={() => cambiarFechaCaptura(1)}
                                    style={[
                                        styles.botonStepper,
                                        styles.botonStepperMas,
                                        guardandoCapturaLechones &&
                                        styles.botonStepperDisabled,
                                    ]}
                                >
                                    <Ionicons
                                        name="add-outline"
                                        size={26}
                                        color="#FFFFFF"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.resumenLechones}>
                            <Text style={styles.textoResumenLechones}>
                                {t('matCorralDetail.totalBornPiglets', {
                                    defaultValue: 'Total nacidos',
                                })}
                                {': '}
                                {parseNumeroEntero(lechonesVivos) +
                                    parseNumeroEntero(lechonesMuertos) +
                                    parseNumeroEntero(lechonesMomificados)}
                            </Text>
                        </View>

                        <View style={styles.botonesModalFila}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoCapturaLechones}
                                onPress={() => setModalCapturaLechonesVisible(false)}
                                style={styles.botonModalCancelar}
                            >
                                <Text style={styles.textoBotonModalCancelar}>
                                    {t('matCorralDetail.cancel', {
                                        defaultValue: 'Cancelar',
                                    })}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                disabled={guardandoCapturaLechones}
                                onPress={aplicarCapturaLechones}
                                style={[
                                    styles.botonModalAceptar,
                                    guardandoCapturaLechones &&
                                    styles.botonModalAceptarDisabled,
                                ]}
                            >
                                <Text style={styles.textoBotonModalAceptar}>
                                    {guardandoCapturaLechones
                                        ? t('matCorralDetail.saving', {
                                            defaultValue: 'Guardando...',
                                        })
                                        : t('matCorralDetail.accept', {
                                            defaultValue: 'Aceptar',
                                        })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 120,
    },

    card: {
        width: '100%',
    },

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    chipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    chipLabel: {
        color: '#475569',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: '700',
    },

    chipValue: {
        marginLeft: 7,
        color: '#334155',
        fontSize: 17,
        fontWeight: '900',
        maxWidth: 110,
    },

    subEstadoRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
    },

    subEstado: {
        color: BLUE,
        fontSize: 31,
        fontWeight: '900',
    },

    diaInline: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    diaLabel: {
        color: '#475569',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        fontSize: 14,
        fontWeight: '800',
    },

    diaValue: {
        marginLeft: 8,
        color: '#334155',
        fontSize: 22,
        fontWeight: '900',
    },

    kpiRow: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },

    kpiLeft: {
        flex: 1,
        minWidth: 0,
    },

    kpiValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },

    kpiNumber: {
        color: '#475569',
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: -2,
    },

    kpiUnit: {
        color: '#475569',
        fontSize: 22,
        marginLeft: 6,
        fontWeight: '700',
    },

    progressRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    progressBar: {
        flex: 1,
        height: 14,
        borderRadius: 999,
        backgroundColor: '#D1D5DB',
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#22C55E',
    },

    progressText: {
        width: 40,
        textAlign: 'right',
        color: '#334155',
        fontSize: 15,
        fontWeight: '900',
    },

    objectiveText: {
        marginTop: 7,
        color: '#475569',
        fontSize: 18,
        fontWeight: '900',
        textAlign: 'right',
    },

    intervalosBox: {
        height: 98,
        minWidth: 145,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 8,
    },

    intervaloBar: {
        width: 24,
        height: 88,
        borderRadius: 999,
        backgroundColor: '#CBD5E1',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },

    intervaloActivo: {
        borderWidth: 3,
        borderColor: '#000000',
    },

    intervaloFill: {
        width: '100%',
        borderRadius: 999,
    },

    alertaSinAlimentar: {
        minHeight: 48,
        marginTop: 26,
        backgroundColor: RED,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    alertaTexto: {
        color: '#FFFFFF',
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
    },

    infoGrid: {
        marginTop: 28,
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 20,
        columnGap: 12,
    },

    infoItem: {
        width: '48%',
    },

    infoLabel: {
        color: MUTED,
        fontSize: 22,
        fontWeight: '500',
    },

    infoRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    infoValue: {
        flex: 1,
        color: '#334155',
        fontSize: 18,
        fontWeight: '800',
    },

    infoPill: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 2,
        color: TEXT,
        fontWeight: '900',
    },

    fab: {
        position: 'absolute',
        right: 18,
        bottom: 22,
        minWidth: 170,
        height: 66,
        borderRadius: 25,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        shadowColor: '#000000',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },

    fabText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

    emptyScreen: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    emptyTitle: {
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
        marginTop: 12,
        textAlign: 'center',
    },

    emptyText: {
        color: MUTED,
        fontSize: 15,
        fontWeight: '700',
        marginTop: 6,
        textAlign: 'center',
    },

    backButton: {
        marginTop: 20,
        height: 48,
        borderRadius: 15,
        backgroundColor: BRAND,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },


    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
    },

    modalOperacionesOverlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },

    modalOperacionesBackdrop: {
        flex: 1,
    },

    panelOperaciones: {
        width: '82%',
        maxWidth: 390,
        height: '100%',
        backgroundColor: '#FFFFFF',

        borderTopLeftRadius: 24,
        borderBottomLeftRadius: 24,

        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 24,

        borderLeftWidth: 1,
        borderColor: BORDER,

        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: {
            width: -4,
            height: 0,
        },
    },

    contenidoPanelOperaciones: {
        paddingBottom: 40,
    },

    grabberOperaciones: {
        alignSelf: 'center',
        width: 48,
        height: 5,
        borderRadius: 999,
        backgroundColor: '#CBD5E1',
        marginBottom: 18,
    },

    cabeceraOperaciones: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },

    iconoCabeceraOperaciones: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    textosCabeceraOperaciones: {
        flex: 1,
    },

    tituloOperaciones: {
        color: TEXT,
        fontSize: 20,
        fontWeight: '900',
    },

    subtituloOperaciones: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },

    botonCerrarOperaciones: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    seccionOperaciones: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginTop: 12,
        marginBottom: 8,
    },

    grupoOperaciones: {
        backgroundColor: '#FFFFFF',
        borderRadius: 17,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        marginBottom: 12,
    },

    opcionOperacion: {
        minHeight: 54,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
    },

    opcionOperacionDisabled: {
        backgroundColor: '#F8FAFC',
    },

    textoOpcionOperacion: {
        flex: 1,
        color: TEXT,
        fontSize: 15,
        fontWeight: '800',
    },

    textoOpcionOperacionDisabled: {
        color: '#94A3B8',
    },

    divisorOperacion: {
        height: 1,
        backgroundColor: BORDER,
        marginLeft: 46,
    },
    modalSalidaOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },

    modalSalidaBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },

    modalSalidaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: '#000000',
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },

    modalSalidaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    modalSalidaIcono: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    modalSalidaTitulo: {
        color: TEXT,
        fontSize: 20,
        fontWeight: '900',
    },

    modalSalidaSubtitulo: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },

    opcionSalida: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 10,
        gap: 10,
    },

    textoOpcionSalida: {
        flex: 1,
        color: TEXT,
        fontSize: 15,
        fontWeight: '800',
    },
    labelInputCorral: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 8,
    },

    inputCorral: {
        height: 50,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 14,
        paddingHorizontal: 14,
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
        backgroundColor: '#F8FAFC',
    },

    botonesModalFila: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },

    botonModalCancelar: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    textoBotonModalCancelar: {
        color: TEXT,
        fontSize: 15,
        fontWeight: '900',
    },

    botonModalAceptar: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: BRAND,
        alignItems: 'center',
        justifyContent: 'center',
    },

    botonModalAceptarDisabled: {
        backgroundColor: '#A5B4FC',
    },

    textoBotonModalAceptar: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    selectorIdentificador: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        marginBottom: 14,
    },

    opcionIdentificador: {
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 10,
        backgroundColor: '#FFFFFF',
    },

    opcionIdentificadorActiva: {
        backgroundColor: '#F8FAFC',
    },

    textoIdentificador: {
        color: TEXT,
        fontSize: 15,
        fontWeight: '900',
    },
    resumenLechones: {
        marginTop: 14,
        minHeight: 44,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    textoResumenLechones: {
        color: TEXT,
        fontSize: 15,
        fontWeight: '900',
    },
    cajaCapturaLechones: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
    },

    filaStepperLechones: {
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    labelStepperLechones: {
        flex: 1,
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
    },

    controlesStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },

    botonStepper: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    botonStepperMas: {
        backgroundColor: '#4F46E5',
    },

    botonStepperDisabled: {
        opacity: 0.5,
    },

    valorStepper: {
        minWidth: 72,
        height: 42,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    textoValorStepper: {
        color: TEXT,
        fontSize: 18,
        fontWeight: '900',
    },

    cajaFechaLechones: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        padding: 14,
        marginBottom: 14,
    },

    labelFechaStepper: {
        color: MUTED,
        fontSize: 15,
        fontWeight: '900',
        marginBottom: 10,
    },

    filaFechaStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    valorFechaStepper: {
        flex: 1,
        height: 46,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    opcionSalidaRadio: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },

    textoOpcionSalidaRadio: {
        flex: 1,
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
    },

    cajaFechaSalida: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        padding: 14,
        marginTop: 12,
        marginBottom: 14,
    },

    textoAyudaFechaSalida: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 10,
    },

    lineaModalSeparadora: {
        height: 1,
        backgroundColor: BORDER,
        marginTop: 6,
        marginBottom: 10,
    },
    inputCorralError: {
        borderColor: RED,
        backgroundColor: '#FEF2F2',
    },

    textoErrorModal: {
        marginTop: 8,
        color: RED,
        fontSize: 13,
        fontWeight: '800',
    },

});