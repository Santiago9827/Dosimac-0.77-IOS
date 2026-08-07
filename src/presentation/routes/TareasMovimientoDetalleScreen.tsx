/* eslint-disable prettier/prettier */
import React, {
    useCallback,
    useRef,
    useState,
} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
    consultarTareasMovimientoGestacion,
    consultarTareasMovimientoMaternidad,
    consultarCorralesGestacion,
    consultarCorralesMaternidad,
    crearMapaCorralesPorId,
    enviarTareaMovimientoAnimalRealizada,
    validarCorralMaternidadParaTarea,
    obtenerIdCorralMaternidadPorNombre,
} from '../../stores/apiApp';


import {
    TipoFiltroMovimiento,
    TipoFiltroFecha,
    useFiltrosTareasMovimientosStore,
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
const GREEN = '#0F766E';
const ORANGE = '#C2410C';

/* =========================
   Tipos
========================= */

type TipoOrdenCorral =
    | 'asc'
    | 'desc';

type TipoSeccionTareas =
    | 'gestacion'
    | 'maternidad';

type TipoOperacion =
    | 'Entrada'
    | 'Salida'
    | 'Traslado Entrada'
    | 'Traslado Salida';

type TareaMovimiento = {
    id: string;
    tipoOperacion: TipoOperacion;
    idAnimal: string;
    crotal: string;
    corralId?: string;
    corralNombre?: string;
    fecha: string;
    raw?: any;
};
type TipoModalResultado =
    | 'exito'
    | 'error';

type ModalResultadoState = {
    visible: boolean;
    tipo: TipoModalResultado;
    titulo: string;
    mensaje: string;
};

type ModalCorralMaternidadState = {
    visible: boolean;
    corral: string;
    tareaEntrada: TareaMovimiento | null;
};
/* =========================
   Helpers
========================= */

function formatearFechaMovimiento(fechaApi: string): string {
    const texto = String(fechaApi ?? '').trim();

    const coincidencia = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (!coincidencia) {
        return texto;
    }

    const [, anio, mes, dia] = coincidencia;

    return `${dia}/${mes}/${anio}`;
}

function adaptarTareaMovimientoApi(
    tarea: any,
    mapaCorrales: Record<number, number>
): TareaMovimiento {
    const corralId =
        tarea.corralDestino ??
        tarea.corralId ??
        tarea.raw?.corral ??
        tarea.raw?.corralOrigen ??
        tarea.raw?.corralDestino ??
        undefined;

    const corralIdNumero = Number(corralId);

    const corralNombre =
        Number.isFinite(corralIdNumero) &&
            mapaCorrales[corralIdNumero] !== undefined
            ? String(mapaCorrales[corralIdNumero])
            : corralId !== undefined && corralId !== null
                ? String(corralId)
                : undefined;

    return {
        id: String(tarea.id),
        tipoOperacion: tarea.tipoOperacion,
        idAnimal: String(tarea.idAnimal ?? ''),
        crotal: String(tarea.crotal ?? ''),
        corralId:
            corralId !== undefined && corralId !== null
                ? String(corralId)
                : undefined,
        corralNombre,
        fecha: formatearFechaMovimiento(
            String(tarea.fecha ?? '')
        ),
        raw: tarea.raw ?? tarea,
    };
}

function obtenerNumeroCorral(tarea: TareaMovimiento): number | null {
    const valorCorral =
        tarea.corralNombre ??
        tarea.corralId;

    if (!valorCorral) {
        return null;
    }

    const numero = Number(valorCorral);

    if (!Number.isFinite(numero)) {
        return null;
    }

    return numero;
}

function ordenarTareasPorCorral(
    tareas: TareaMovimiento[],
    orden: TipoOrdenCorral
): TareaMovimiento[] {
    return [...tareas].sort((tareaA, tareaB) => {
        const corralA = obtenerNumeroCorral(tareaA);
        const corralB = obtenerNumeroCorral(tareaB);

        if (corralA === null && corralB === null) {
            return 0;
        }

        if (corralA === null) {
            return 1;
        }

        if (corralB === null) {
            return -1;
        }

        if (orden === 'asc') {
            return corralA - corralB;
        }

        return corralB - corralA;
    });
}

function esTareaEntrada(tarea: TareaMovimiento): boolean {
    return (
        tarea.tipoOperacion === 'Entrada' ||
        tarea.tipoOperacion === 'Traslado Entrada'
    );
}

function esTareaSalida(tarea: TareaMovimiento): boolean {
    return (
        tarea.tipoOperacion === 'Salida' ||
        tarea.tipoOperacion === 'Traslado Salida'
    );
}

function filtrarTareasPorMovimiento(
    tareas: TareaMovimiento[],
    tipoMovimiento: TipoFiltroMovimiento
): TareaMovimiento[] {
    if (tipoMovimiento === 'todos') {
        return tareas;
    }

    if (tipoMovimiento === 'entrada') {
        return tareas.filter(esTareaEntrada);
    }

    return tareas.filter(esTareaSalida);
}

function formatearFechaDate(fecha: Date): string {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear());

    return `${dia}/${mes}/${anio}`;
}

function obtenerFechaManana(): string {
    const fecha = new Date();

    fecha.setDate(fecha.getDate() + 1);

    return formatearFechaDate(fecha);
}

function normalizarFechaComparacion(fecha: string): string {
    const texto = String(fecha ?? '').trim();

    const formatoApi = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (formatoApi) {
        const [, anio, mes, dia] = formatoApi;
        return `${dia}/${mes}/${anio}`;
    }

    const formatoUsuario = texto.match(
        /^(\d{2})[/-](\d{2})[/-](\d{2}|\d{4})$/
    );

    if (formatoUsuario) {
        const [, dia, mes, anio] = formatoUsuario;

        const anioNormalizado =
            anio.length === 2
                ? `20${anio}`
                : anio;

        return `${dia}/${mes}/${anioNormalizado}`;
    }

    return texto;
}

function filtrarTareasPorFecha(
    tareas: TareaMovimiento[],
    tipoFecha: TipoFiltroFecha,
    fechaConcreta: string
): TareaMovimiento[] {
    if (tipoFecha === 'todas') {
        return tareas;
    }

    let fechaObjetivo = '';

    if (tipoFecha === 'hoy') {
        fechaObjetivo = formatearFechaDate(new Date());
    }

    if (tipoFecha === 'manana') {
        fechaObjetivo = obtenerFechaManana();
    }

    if (tipoFecha === 'concreta') {
        fechaObjetivo = normalizarFechaComparacion(fechaConcreta);
    }

    if (!fechaObjetivo) {
        return tareas;
    }

    return tareas.filter((tarea) =>
        normalizarFechaComparacion(tarea.fecha) === fechaObjetivo
    );
}
function normalizarTextoFiltro(valor: string | undefined): string {
    return String(valor ?? '')
        .trim()
        .toLowerCase();
}

function filtrarTareasPorCorral(
    tareas: TareaMovimiento[],
    tipoCorral: TipoFiltroCorral,
    corralEspecifico: string
): TareaMovimiento[] {
    if (tipoCorral === 'todos') {
        return tareas;
    }

    const corralFiltro = normalizarTextoFiltro(corralEspecifico);

    if (!corralFiltro) {
        return tareas;
    }

    return tareas.filter((tarea) => {
        const corralNombre = normalizarTextoFiltro(tarea.corralNombre);

        return corralNombre === corralFiltro;
    });
}

function filtrarTareasPorIdAnimal(
    tareas: TareaMovimiento[],
    tipoAnimal: TipoFiltroAnimal,
    idAnimalEspecifico: string
): TareaMovimiento[] {
    if (tipoAnimal === 'todos') {
        return tareas;
    }

    const idFiltro = normalizarTextoFiltro(idAnimalEspecifico);

    if (!idFiltro) {
        return tareas;
    }

    return tareas.filter((tarea) => {
        const idAnimal = normalizarTextoFiltro(tarea.idAnimal);

        return idAnimal === idFiltro;
    });
}

function obtenerErrorEstadoCorralMaternidad(datosCorral: any): string {
    if (!datosCorral) {
        return '';
    }

    const datos =
        datosCorral?.data ??
        datosCorral;

    const existe =
        datos?.existe ??
        datos?.exists ??
        datos?.found;

    if (
        existe === false ||
        String(existe).toLowerCase() === 'false'
    ) {
        return 'corralNoExiste';
    }

    const ocupado =
        datos?.ocupado ??
        datos?.occupied ??
        datos?.isOccupied;

    if (
        ocupado === true ||
        String(ocupado).toLowerCase() === 'true' ||
        Number(ocupado) === 1
    ) {
        return 'corralOcupado';
    }

    const libre =
        datos?.libre ??
        datos?.disponible ??
        datos?.available ??
        datos?.isFree;

    if (
        libre === false ||
        String(libre).toLowerCase() === 'false' ||
        Number(libre) === 0
    ) {
        return 'corralOcupado';
    }

    const estado = String(
        datos?.estado ??
        datos?.status ??
        ''
    ).toLowerCase();

    if (
        estado.includes('ocupado') ||
        estado.includes('occupied')
    ) {
        return 'corralOcupado';
    }

    const animal =
        datos?.animal ??
        datos?.animalActual;

    if (
        animal &&
        typeof animal === 'object' &&
        Object.keys(animal).length > 0
    ) {
        return 'corralOcupado';
    }

    if (
        datos?.idAnimal ||
        datos?.pkIdAnimal ||
        datos?.crotal
    ) {
        return 'corralOcupado';
    }

    return '';
}

function normalizarTextoRespuestaBackend(valor: any): string {
    return String(valor ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s/g, '');
}

function respuestaCorralMaternidadEsLibre(resultadoCorral: any): boolean {
    const textoRespuesta = normalizarTextoRespuestaBackend(
        resultadoCorral?.rawText ??
        resultadoCorral?.data
    );

    return (
        textoRespuesta.includes('enestecorralnohayningunanimal') ||
        textoRespuesta.includes('nohayningunanimal') ||
        textoRespuesta.includes('thereisnoanimal') ||
        textoRespuesta.includes('thereisnoanimalinthispen')
    );
}

function respuestaCorralMaternidadNoExiste(resultadoCorral: any): boolean {
    const textoRespuesta = normalizarTextoRespuestaBackend(
        resultadoCorral?.rawText ??
        resultadoCorral?.data
    );

    return (
        textoRespuesta.includes('thecorraldoesnotexist') ||
        textoRespuesta.includes('corraldoesnotexist') ||
        textoRespuesta.includes('elcorralnoexiste') ||
        textoRespuesta.includes('noexiste')
    );
}
/* =========================
   Barra de acciones
========================= */

function BarraAccionesTareas({

    onAbrirFiltros,
    ordenCorral,
    desplegableOrdenVisible,
    onToggleOrden,
    onCambiarOrden,
    totalSeleccionadas,
    marcandoRealizadas,
    onMarcarRealizadas,
}: {
    onAbrirFiltros: () => void;
    ordenCorral: TipoOrdenCorral;
    desplegableOrdenVisible: boolean;
    onToggleOrden: () => void;
    onCambiarOrden: (orden: TipoOrdenCorral) => void;
    totalSeleccionadas: number;
    marcandoRealizadas: boolean;
    onMarcarRealizadas: () => void;
}) {
    const { t } = useTranslation();
    return (
        <View style={styles.actionsBar}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAbrirFiltros}
                style={styles.actionButton}
            >
                <Ionicons
                    name="filter-outline"
                    size={17}
                    color={PURPLE}
                />

                <Text style={styles.actionText}>
                    {t('tareasMovimientosDetalle.acciones.filtros')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.85}
                disabled={
                    marcandoRealizadas ||
                    totalSeleccionadas === 0
                }
                onPress={onMarcarRealizadas}
                style={[
                    styles.actionButtonMain,
                    (marcandoRealizadas ||
                        totalSeleccionadas === 0) &&
                    styles.actionButtonMainDisabled,
                ]}
            >
                <Ionicons
                    name="checkmark-done-outline"
                    size={17}
                    color="#FFFFFF"
                />

                <Text style={styles.actionTextMain}>
                    {marcandoRealizadas
                        ? t('tareasMovimientosDetalle.acciones.marcando')
                        : totalSeleccionadas > 0
                            ? t('tareasMovimientosDetalle.acciones.marcarSeleccionadas', {
                                total: totalSeleccionadas,
                            })
                            : t('tareasMovimientosDetalle.acciones.marcarRealizado')}
                </Text>
            </TouchableOpacity>

            <View style={styles.orderWrapper}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onToggleOrden}
                    style={[
                        styles.actionButton,
                        desplegableOrdenVisible &&
                        styles.actionButtonSelected,
                    ]}
                >
                    <Ionicons
                        name={
                            ordenCorral === 'asc'
                                ? 'arrow-up-outline'
                                : 'arrow-down-outline'
                        }
                        size={17}
                        color={PURPLE}
                    />

                    <Text style={styles.actionText}>
                        {t('tareasMovimientosDetalle.acciones.ordenar')}
                    </Text>
                </TouchableOpacity>

                {desplegableOrdenVisible && (
                    <View style={styles.orderDropdown}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                                onCambiarOrden('asc')
                            }
                            style={[
                                styles.orderOption,
                                ordenCorral === 'asc' &&
                                styles.orderOptionSelected,
                            ]}
                        >
                            <Ionicons
                                name="arrow-up-outline"
                                size={17}
                                color={PURPLE}
                            />

                            <Text style={styles.orderOptionText}>
                                {t('tareasMovimientosDetalle.orden.corralAscendente')}
                            </Text>

                            {ordenCorral === 'asc' && (
                                <Ionicons
                                    name="checkmark-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                                onCambiarOrden('desc')
                            }
                            style={[
                                styles.orderOption,
                                ordenCorral === 'desc' &&
                                styles.orderOptionSelected,
                            ]}
                        >
                            <Ionicons
                                name="arrow-down-outline"
                                size={17}
                                color={PURPLE}
                            />

                            <Text style={styles.orderOptionText}>
                                {t('tareasMovimientosDetalle.orden.corralDescendente')}
                            </Text>

                            {ordenCorral === 'desc' && (
                                <Ionicons
                                    name="checkmark-outline"
                                    size={18}
                                    color={PURPLE}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

/* =========================
   Tarjeta de tarea
========================= */

function CardTarea({
    tarea,
    marcada,
    onToggleMarcada,
}: {
    tarea: TareaMovimiento;
    marcada: boolean;
    onToggleMarcada: () => void;
}) {
    const { t } = useTranslation();
    const esMovimientoEntrada = esTareaEntrada(tarea);

    const colorOperacion = esMovimientoEntrada
        ? GREEN
        : ORANGE;

    const fondoSuave = esMovimientoEntrada
        ? '#ECFDF5'
        : '#FFF7ED';

    const fondoSuave2 = esMovimientoEntrada
        ? '#F0FDFA'
        : '#FFF1E8';

    const bordeSuave = esMovimientoEntrada
        ? '#A7F3D0'
        : '#FED7AA';

    const iconoOperacion: string =
        esMovimientoEntrada
            ? 'enter-outline'
            : 'exit-outline';



    const textoOperacion =
        tarea.tipoOperacion === 'Entrada'
            ? t('tareasMovimientosDetalle.operaciones.entrada')
            : tarea.tipoOperacion === 'Salida'
                ? t('tareasMovimientosDetalle.operaciones.salida')
                : tarea.tipoOperacion === 'Traslado Entrada'
                    ? t('tareasMovimientosDetalle.operaciones.trasladoEntrada')
                    : t('tareasMovimientosDetalle.operaciones.trasladoSalida');

    const textoCorral = esMovimientoEntrada
        ? t('tareasMovimientosDetalle.tarjetas.corralDestino')
        : t('tareasMovimientosDetalle.tarjetas.corralOrigen');

    return (
        <View
            style={[
                styles.taskCard,
                marcada && styles.taskCardSelected,
            ]}
        >
            <View
                style={[
                    styles.taskAccent,
                    {
                        backgroundColor:
                            colorOperacion,
                    },
                ]}
            />

            <View style={styles.taskBody}>
                <View style={styles.cardHeader}>
                    <View style={styles.operationHeader}>
                        <View
                            style={[
                                styles.operationIconBadge,
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
                                size={18}
                                color={colorOperacion}
                            />
                        </View>

                        <Text
                            style={[
                                styles.operationHeaderText,
                                {
                                    color:
                                        colorOperacion,
                                },
                            ]}
                        >
                            {textoOperacion}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                            checked: marcada,
                        }}
                        onPress={onToggleMarcada}
                        style={[
                            styles.checkbox,
                            marcada &&
                            styles.checkboxMarked,
                        ]}
                    >
                        {marcada && (
                            <Ionicons
                                name="checkmark-outline"
                                size={20}
                                color="#FFFFFF"
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                    <View
                        style={[
                            styles.animalBlock,
                            {
                                backgroundColor:
                                    fondoSuave2,
                                borderColor:
                                    bordeSuave,
                            },
                        ]}
                    >
                        <Text style={styles.informationLabel}>
                            {t('tareasMovimientosDetalle.tarjetas.idAnimal')}
                        </Text>

                        <Text style={styles.animalId}>
                            {tarea.idAnimal || '—'}
                        </Text>

                        <Text
                            style={styles.crotalSmall}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {tarea.crotal || t('tareasMovimientosDetalle.tarjetas.sinCrotal')}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.corralResumenBox,
                            {
                                backgroundColor:
                                    fondoSuave2,
                                borderColor:
                                    bordeSuave,
                            },
                        ]}
                    >
                        <Text style={styles.corralResumenLabel}>
                            {textoCorral}
                        </Text>

                        <Text style={styles.corralResumenValue}>
                            {tarea.corralNombre ?? '—'}
                        </Text>
                    </View>
                </View>

                <View style={styles.fechaDetalleBox}>
                    <View style={styles.fechaDetalleLeft}>
                        <View style={styles.fechaIconBox}>
                            <Ionicons
                                name="calendar-outline"
                                size={18}
                                color={PURPLE}
                            />
                        </View>

                        <Text style={styles.fechaDetalleLabel}>
                            {t('tareasMovimientosDetalle.tarjetas.fecha')}
                        </Text>
                    </View>

                    <Text style={styles.fechaDetalleValue}>
                        {tarea.fecha || '—'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function ModalResultadoTareas({
    visible,
    tipo,
    titulo,
    mensaje,
    onCerrar,
}: {
    visible: boolean;
    tipo: TipoModalResultado;
    titulo: string;
    mensaje: string;
    onCerrar: () => void;
}) {
    const { t } = useTranslation();
    const esExito = tipo === 'exito';

    const colorModal = esExito
        ? GREEN
        : ORANGE;

    const fondoIcono = esExito
        ? '#ECFDF5'
        : '#FFF7ED';

    const icono: string = esExito
        ? 'checkmark-circle-outline'
        : 'warning-outline';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCerrar}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View
                        style={[
                            styles.modalIconBox,
                            {
                                backgroundColor:
                                    fondoIcono,
                            },
                        ]}
                    >
                        <Ionicons
                            name={icono}
                            size={42}
                            color={colorModal}
                        />
                    </View>

                    <Text style={styles.modalTitle}>
                        {titulo}
                    </Text>

                    <Text style={styles.modalMessage}>
                        {mensaje}
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onCerrar}
                        style={[
                            styles.modalButton,
                            {
                                backgroundColor:
                                    colorModal,
                            },
                        ]}
                    >
                        <Text style={styles.modalButtonText}>
                            {t('tareasMovimientosDetalle.acciones.aceptar')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
function ModalCorralMaternidad({
    visible,
    corral,
    errorCorral,
    marcandoRealizadas,
    validandoCorral,
    onCambiarCorral,
    onCancelar,
    onConfirmar,
}: {
    visible: boolean;
    corral: string;
    errorCorral: string;
    marcandoRealizadas: boolean;
    validandoCorral: boolean;
    onCambiarCorral: (corral: string) => void;
    onCancelar: () => void;
    onConfirmar: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancelar}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalIconBoxEntrada}>
                        <Ionicons
                            name="home-outline"
                            size={40}
                            color={PURPLE}
                        />
                    </View>

                    <Text style={styles.modalTitle}>
                        {t('tareasMovimientosDetalle.modalCorral.titulo')}
                    </Text>

                    <Text style={styles.modalMessage}>
                        {t('tareasMovimientosDetalle.modalCorral.mensaje')}
                    </Text>

                    <View style={styles.modalInputBlock}>
                        <Text style={styles.modalInputLabel}>
                            {t('tareasMovimientosDetalle.modalCorral.labelCorralDestino')}
                        </Text>

                        <TextInput
                            value={corral}
                            onChangeText={onCambiarCorral}
                            keyboardType="number-pad"
                            maxLength={9}
                            placeholder={t('tareasMovimientosDetalle.modalCorral.placeholderCorral')}
                            placeholderTextColor="#94A3B8"
                            editable={
                                !marcandoRealizadas &&
                                !validandoCorral
                            }
                            style={[
                                styles.modalInput,
                                !!errorCorral &&
                                styles.modalInputErrorBorder,
                            ]}
                        />

                        {!!errorCorral && (
                            <Text style={styles.modalInputErrorText}>
                                {errorCorral}
                            </Text>
                        )}
                    </View>

                    <View style={styles.modalButtonsRow}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={
                                marcandoRealizadas ||
                                validandoCorral
                            }
                            onPress={onCancelar}
                            style={styles.modalButtonSecondary}
                        >
                            <Text style={styles.modalButtonSecondaryText}>
                                {t('tareasMovimientosDetalle.acciones.cancelar')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            disabled={
                                marcandoRealizadas ||
                                validandoCorral
                            }
                            onPress={onConfirmar}
                            style={[
                                styles.modalButtonConfirm,
                                (marcandoRealizadas ||
                                    validandoCorral) &&
                                styles.actionButtonMainDisabled,
                            ]}
                        >
                            <Text style={styles.modalButtonText}>
                                {validandoCorral
                                    ? t('tareasMovimientosDetalle.acciones.validando')
                                    : marcandoRealizadas
                                        ? t('tareasMovimientosDetalle.acciones.marcando')
                                        : t('tareasMovimientosDetalle.acciones.confirmar')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
/* =========================
   Lista de tareas
========================= */
function TareasListaTab({
    tipo,
    onAbrirFiltros,
}: {
    tipo: TipoSeccionTareas;
    onAbrirFiltros: () => void;
}) {
    const { t } = useTranslation();
    const [ordenCorral, setOrdenCorral] =
        useState<TipoOrdenCorral>('asc');

    const [
        desplegableOrdenVisible,
        setDesplegableOrdenVisible,
    ] = useState(false);

    const [tareas, setTareas] =
        useState<TareaMovimiento[]>([]);

    const [cargando, setCargando] =
        useState(false);

    const primeraCargaRef = useRef(true);

    const [error, setError] =
        useState('');

    const [tareasMarcadas, setTareasMarcadas] =
        useState<Record<string, boolean>>({});

    const [marcandoRealizadas, setMarcandoRealizadas] =
        useState(false);

    const [modalResultado, setModalResultado] =
        useState<ModalResultadoState>({
            visible: false,
            tipo: 'exito',
            titulo: '',
            mensaje: '',
        });

    const [modalCorralMaternidad, setModalCorralMaternidad] =
        useState<ModalCorralMaternidadState>({
            visible: false,
            corral: '',
            tareaEntrada: null,
        });

    const [errorCorralMaternidad, setErrorCorralMaternidad] =
        useState('');

    const [validandoCorralMaternidad, setValidandoCorralMaternidad] =
        useState(false);

    const cerrarModalResultado = () => {
        setModalResultado((estadoActual) => ({
            ...estadoActual,
            visible: false,
        }));
    };

    const cerrarModalCorralMaternidad = () => {
        if (marcandoRealizadas || validandoCorralMaternidad) {
            return;
        }

        setErrorCorralMaternidad('');

        setModalCorralMaternidad({
            visible: false,
            corral: '',
            tareaEntrada: null,
        });
    };

    const cambiarCorralMaternidad = (corralNuevo: string) => {
        const soloNumeros = corralNuevo
            .replace(/\D/g, '')
            .slice(0, 9);

        setErrorCorralMaternidad('');

        setModalCorralMaternidad((estadoActual) => ({
            ...estadoActual,
            corral: soloNumeros,
        }));
    };

    const filtrosActuales =
        useFiltrosTareasMovimientosStore(
            (state) =>
                tipo === 'gestacion'
                    ? state.filtrosGestacion
                    : state.filtrosMaternidad
        );
    const cargarTareas = useCallback(
        async (mostrarCargaCompleta = false) => {
            try {
                if (mostrarCargaCompleta) {
                    setCargando(true);
                }

                setError('');

                if (tipo === 'gestacion') {
                    const [
                        tareasApi,
                        corralesApi,
                    ] = await Promise.all([
                        consultarTareasMovimientoGestacion(),
                        consultarCorralesGestacion(),
                    ]);

                    const mapaCorrales =
                        crearMapaCorralesPorId(corralesApi);

                    setTareas(
                        tareasApi.map((tarea: any) =>
                            adaptarTareaMovimientoApi(
                                tarea,
                                mapaCorrales,
                            ),
                        ),
                    );

                    return;
                }

                const [
                    tareasApi,
                    corralesApi,
                ] = await Promise.all([
                    consultarTareasMovimientoMaternidad(),
                    consultarCorralesMaternidad(),
                ]);

                const mapaCorrales =
                    crearMapaCorralesPorId(corralesApi);

                setTareas(
                    tareasApi.map((tarea: any) =>
                        adaptarTareaMovimientoApi(
                            tarea,
                            mapaCorrales,
                        ),
                    ),
                );
            } catch (errorConsulta: any) {
                console.log(
                    'Error cargando tareas de movimiento:',
                    errorConsulta,
                );

                /*
                 * Solo vaciamos la pantalla si todavía
                 * no había información cargada.
                 */
                if (primeraCargaRef.current) {
                    setTareas([]);
                }

                setError(
                    errorConsulta?.message ??
                    t('tareasMovimientosDetalle.errores.noCargarTareas'),
                );
            } finally {
                if (mostrarCargaCompleta) {
                    setCargando(false);
                }

                primeraCargaRef.current = false;
            }
        },
        [tipo, t],
    );

    useFocusEffect(
        useCallback(() => {
            setDesplegableOrdenVisible(false);

            /*
             * Primera entrada:
             * muestra el estado de carga.
             *
             * Siguientes cambios entre tabs:
             * actualiza silenciosamente sin borrar la lista.
             */
            cargarTareas(primeraCargaRef.current);

            return () => {
                setDesplegableOrdenVisible(false);
            };
        }, [cargarTareas]),
    );


    const tareasFiltradasMovimiento = filtrarTareasPorMovimiento(
        tareas,
        filtrosActuales.tipoMovimiento
    );

    const tareasFiltradasFecha = filtrarTareasPorFecha(
        tareasFiltradasMovimiento,
        filtrosActuales.tipoFecha,
        filtrosActuales.fechaConcreta
    );

    const tareasFiltradasCorral = filtrarTareasPorCorral(
        tareasFiltradasFecha,
        filtrosActuales.tipoCorral,
        filtrosActuales.corralEspecifico
    );

    const tareasFiltradas = filtrarTareasPorIdAnimal(
        tareasFiltradasCorral,
        filtrosActuales.tipoAnimal,
        filtrosActuales.idAnimalEspecifico
    );

    const tareasOrdenadas = ordenarTareasPorCorral(
        tareasFiltradas,
        ordenCorral
    );

    const hayFiltrosActivos =
        filtrosActuales.tipoMovimiento !== 'todos' ||
        filtrosActuales.tipoFecha !== 'todas' ||
        filtrosActuales.tipoCorral !== 'todos' ||
        filtrosActuales.tipoAnimal !== 'todos';

    const cambiarOrden = (orden: TipoOrdenCorral) => {
        setOrdenCorral(orden);
        setDesplegableOrdenVisible(false);
    };

    const alternarTareaMarcada = (tarea: TareaMovimiento) => {
        const yaEstaMarcada =
            !!tareasMarcadas[tarea.id];

        if (
            !yaEstaMarcada &&
            tipo === 'maternidad' &&
            esTareaEntrada(tarea)
        ) {
            const yaHayOtraEntradaMarcada = tareas.some(
                (tareaActual) =>
                    tareaActual.id !== tarea.id &&
                    tareasMarcadas[tareaActual.id] &&
                    esTareaEntrada(tareaActual)
            );

            if (yaHayOtraEntradaMarcada) {
                setModalResultado({
                    visible: true,
                    tipo: 'error',
                    titulo: t('tareasMovimientosDetalle.errores.entradaMaternidadTitulo'),
                    mensaje: t('tareasMovimientosDetalle.errores.soloUnaEntradaMaternidad'),
                });

                return;
            }
        }

        setTareasMarcadas((estadoActual) => ({
            ...estadoActual,
            [tarea.id]: !estadoActual[tarea.id],
        }));
    };

    const tareasSeleccionadas = tareas.filter(
        (tarea) => tareasMarcadas[tarea.id]
    );

    const enviarTareasSeleccionadas = async (
        idCorralInternoMaternidad?: number,
    ) => {
        await Promise.all(
            tareasSeleccionadas.map((tarea) => {
                const esEntradaMaternidad =
                    tipo === 'maternidad' &&
                    esTareaEntrada(tarea);

                const valueOperacion = esEntradaMaternidad
                    ? String(
                        idCorralInternoMaternidad ??
                        tarea.raw?.corral ??
                        tarea.corralId ??
                        '',
                    )
                    : '';

                return enviarTareaMovimientoAnimalRealizada(
                    tarea.id,
                    valueOperacion,
                );
            }),
        );
    };
    const marcarTareasRealizadas = async () => {
        if (tareasSeleccionadas.length === 0) {
            return;
        }

        const entradasMaternidadSeleccionadas =
            tipo === 'maternidad'
                ? tareasSeleccionadas.filter(esTareaEntrada)
                : [];

        if (entradasMaternidadSeleccionadas.length > 1) {
            setModalResultado({
                visible: true,
                tipo: 'error',
                titulo: t('tareasMovimientosDetalle.errores.entradaMaternidadTitulo'),
                mensaje: t('tareasMovimientosDetalle.errores.soloUnaEntradaMaternidadCadaVez'),
            });

            return;
        }

        if (entradasMaternidadSeleccionadas.length === 1) {
            const tareaEntrada =
                entradasMaternidadSeleccionadas[0];

            setErrorCorralMaternidad('');

            setModalCorralMaternidad({
                visible: true,

                /*
                 * Esto es el corral visible/name,
                 * no el id interno.
                 */
                corral: String(tareaEntrada.corralNombre ?? ''),
                tareaEntrada,
            });

            return;
        }

        try {
            setMarcandoRealizadas(true);

            await enviarTareasSeleccionadas();

            setTareasMarcadas({});

            await cargarTareas();

            setModalResultado({
                visible: true,
                tipo: 'exito',
                titulo: t('tareasMovimientosDetalle.modalResultado.tareasRealizadasTitulo'),
                mensaje: t('tareasMovimientosDetalle.modalResultado.tareasRealizadasMensaje'),
            });
        } catch (errorMarcar: any) {
            console.log(
                'Error marcando tareas realizadas:',
                errorMarcar
            );

            setModalResultado({
                visible: true,
                tipo: 'error',
                titulo: t('tareasMovimientosDetalle.modalResultado.errorTitulo'),
                mensaje:
                    errorMarcar?.message ??
                    t('tareasMovimientosDetalle.errores.noMarcarTareas'),
            });
        } finally {
            setMarcandoRealizadas(false);
        }
    };
    const confirmarCorralMaternidad = async () => {
        const corralVisible =
            modalCorralMaternidad.corral.trim();

        const corralNumero = Number(corralVisible);

        setErrorCorralMaternidad('');

        if (
            !corralVisible ||
            !/^\d{1,9}$/.test(corralVisible) ||
            !Number.isFinite(corralNumero) ||
            corralNumero <= 0
        ) {
            setErrorCorralMaternidad(
                t('tareasMovimientosDetalle.errores.corralMaximo9')
            );
            return;
        }

        try {
            setValidandoCorralMaternidad(true);

            const resultadoCorral =
                await validarCorralMaternidadParaTarea(
                    corralVisible
                );

            console.log(
                'Respuesta validación corral maternidad:',
                resultadoCorral
            );

            /*
             * IMPORTANTE:
             * El backend devuelve 400 cuando el corral existe
             * y no hay ningún animal.
             * Para nosotros eso significa que el corral está libre.
             */
            const corralLibre =
                respuestaCorralMaternidadEsLibre(
                    resultadoCorral
                );

            const corralNoExiste =
                respuestaCorralMaternidadNoExiste(
                    resultadoCorral
                );

            if (corralNoExiste) {
                setErrorCorralMaternidad(
                    t('tareasMovimientosDetalle.errores.corralNoExiste')
                );

                return;
            }

            if (!corralLibre) {
                if (!resultadoCorral.ok) {
                    setErrorCorralMaternidad(
                        t('tareasMovimientosDetalle.errores.noValidarCorral')
                    );

                    return;
                }

                const errorEstadoCorral =
                    obtenerErrorEstadoCorralMaternidad(
                        resultadoCorral.data
                    );

                if (errorEstadoCorral) {
                    setErrorCorralMaternidad(
                        t(`tareasMovimientosDetalle.errores.${errorEstadoCorral}`)
                    );

                    return;
                }

                /*
                 * Si el endpoint responde OK y no indica que está libre,
                 * normalmente significa que hay información de un animal.
                 */
                setErrorCorralMaternidad(
                    t('tareasMovimientosDetalle.errores.corralOcupado')
                );

                return;
            }

            /*
             * Aquí ya sabemos que el usuario escribió un corral visible/name válido.
             * Ejemplo: corralVisible = "2"
             *
             * Ahora buscamos su id interno en /api/corral/maternity.
             * Ejemplo: { id: 448, name: 2 }
             */
            const idCorralInterno =
                await obtenerIdCorralMaternidadPorNombre(
                    corralVisible
                );

            console.log(
                'Corral maternidad validado:',
                {
                    corralVisible,
                    idCorralInterno,
                }
            );

            setValidandoCorralMaternidad(false);
            setMarcandoRealizadas(true);

            await enviarTareasSeleccionadas(
                idCorralInterno
            );

            setTareasMarcadas({});

            setModalCorralMaternidad({
                visible: false,
                corral: '',
                tareaEntrada: null,
            });

            await cargarTareas();

            setModalResultado({
                visible: true,
                tipo: 'exito',
                titulo: t('tareasMovimientosDetalle.modalResultado.tareaRealizadaTitulo'),
                mensaje: t('tareasMovimientosDetalle.modalResultado.tareaRealizadaMensaje'),
            });
        } catch (errorMarcar: any) {
            console.log(
                'Error validando o marcando entrada de maternidad:',
                errorMarcar
            );

            setErrorCorralMaternidad(
                errorMarcar?.message ??
                t('tareasMovimientosDetalle.errores.noValidarCorralMaternidad')
            );
        } finally {
            setValidandoCorralMaternidad(false);
            setMarcandoRealizadas(false);
        }
    };

    return (
        <View style={styles.screen}>
            <BarraAccionesTareas
                onAbrirFiltros={() => {
                    setDesplegableOrdenVisible(false);
                    onAbrirFiltros();
                }}
                ordenCorral={ordenCorral}
                desplegableOrdenVisible={desplegableOrdenVisible}
                onToggleOrden={() =>
                    setDesplegableOrdenVisible(
                        (visible) => !visible
                    )
                }
                onCambiarOrden={cambiarOrden}
                totalSeleccionadas={tareasSeleccionadas.length}
                marcandoRealizadas={marcandoRealizadas}
                onMarcarRealizadas={marcarTareasRealizadas}
            />

            {desplegableOrdenVisible && (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                        setDesplegableOrdenVisible(false)
                    }
                    style={styles.orderBackdrop}
                />
            )}

            <ScrollView
                style={styles.listScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {cargando && tareas.length === 0 && (
                    <View style={styles.stateCard}>
                        <ActivityIndicator
                            size="small"
                            color={PURPLE}
                        />

                        <Text style={styles.stateTitle}>
                            {t('tareasMovimientosDetalle.estados.cargandoTareas')}
                        </Text>
                    </View>
                )}

                {!cargando && tareas.length === 0 && error && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => cargarTareas(true)}
                        style={styles.stateCard}
                    >
                        <Ionicons
                            name="warning-outline"
                            size={30}
                            color={ORANGE}
                        />

                        <Text style={styles.stateTitle}>
                            {t('tareasMovimientosDetalle.estados.noCargarTareasTitulo')}
                        </Text>

                        <Text style={styles.stateText}>
                            {error}
                        </Text>

                        <Text style={styles.retryText}>
                            {t('tareasMovimientosDetalle.estados.pulsaReintentar')}
                        </Text>
                    </TouchableOpacity>
                )}

                {!cargando &&
                    !error &&
                    tareasOrdenadas.length === 0 && (
                        <View style={styles.stateCard}>
                            <Ionicons
                                name="checkmark-done-outline"
                                size={32}
                                color={GREEN}
                            />

                            <Text style={styles.stateTitle}>
                                {hayFiltrosActivos
                                    ? t('tareasMovimientosDetalle.estados.sinTareasConFiltros')
                                    : t('tareasMovimientosDetalle.estados.sinTareasPendientes')}
                            </Text>

                            <Text style={styles.stateText}>
                                {hayFiltrosActivos
                                    ? t('tareasMovimientosDetalle.estados.cambiaFiltros')
                                    : t('tareasMovimientosDetalle.estados.sinMovimientosPendientes')}
                            </Text>
                        </View>
                    )}

                {!cargando &&
                    !error &&
                    tareasOrdenadas.map((tarea) => (
                        <CardTarea
                            key={tarea.id}
                            tarea={tarea}
                            marcada={!!tareasMarcadas[tarea.id]}
                            onToggleMarcada={() =>
                                alternarTareaMarcada(tarea)
                            }
                        />
                    ))}
            </ScrollView>

            <ModalResultadoTareas
                visible={modalResultado.visible}
                tipo={modalResultado.tipo}
                titulo={modalResultado.titulo}
                mensaje={modalResultado.mensaje}
                onCerrar={cerrarModalResultado}
            />

            <ModalCorralMaternidad
                visible={modalCorralMaternidad.visible}
                corral={modalCorralMaternidad.corral}
                errorCorral={errorCorralMaternidad}
                marcandoRealizadas={marcandoRealizadas}
                validandoCorral={validandoCorralMaternidad}
                onCambiarCorral={cambiarCorralMaternidad}
                onCancelar={cerrarModalCorralMaternidad}
                onConfirmar={confirmarCorralMaternidad}
            />
        </View>
    );
}

/* =========================
   Pantalla principal
========================= */

export const TareasMovimientosDetalleScreen = ({
    navigation,
    route,
}: any) => {
    const { t } = useTranslation();
    const tabInicial =
        route.params?.tabInicial === 'Maternidad'
            ? 'Maternidad'
            : 'Gestacion';

    const abrirFiltros = (
        tipo: TipoSeccionTareas
    ) => {
        navigation.navigate(
            'FiltrosTareasMovimientos',
            {
                tipo,
            }
        );
    };

    return (
        <TopTab.Navigator
            initialRouteName={tabInicial}
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
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
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
                name="Gestacion"
                options={{
                    title: t('tareasMovimientosDetalle.tabs.gestacion'),
                }}
            >
                {() => (
                    <TareasListaTab
                        tipo="gestacion"
                        onAbrirFiltros={() =>
                            abrirFiltros('gestacion')
                        }
                    />
                )}
            </TopTab.Screen>

            <TopTab.Screen
                name="Maternidad"
                options={{
                    title: t('tareasMovimientosDetalle.tabs.maternidad'),
                }}
            >
                {() => (
                    <TareasListaTab
                        tipo="maternidad"
                        onAbrirFiltros={() =>
                            abrirFiltros('maternidad')
                        }
                    />
                )}
            </TopTab.Screen>
        </TopTab.Navigator>
    );
};

/* =========================
   Estilos
========================= */

const styles = StyleSheet.create({

    orderBackdrop: {
        ...StyleSheet.absoluteFillObject,
        top: 62,
        zIndex: 900,
        elevation: 900,
        backgroundColor: 'transparent',
    },
    modalInputErrorBorder: {
        borderColor: ORANGE,
        backgroundColor: '#FFF7ED',
    },

    modalInputErrorText: {
        color: ORANGE,
        fontSize: 12,
        fontWeight: '800',
        marginTop: 6,
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
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 20,
        alignItems: 'center',

        shadowColor: '#0F172A',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: {
            width: 0,
            height: 8,
        },

        elevation: 8,
    },

    modalIconBox: {
        width: 74,
        height: 74,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    modalTitle: {
        color: TEXT,
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
    },

    modalMessage: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },

    modalButton: {
        width: '100%',
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    actionButtonMainDisabled: {
        opacity: 0.45,
    },
    corralResumenBox: {
        minWidth: 126,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    corralResumenLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'right',
    },

    corralResumenValue: {
        color: TEXT,
        fontSize: 30,
        lineHeight: 35,
        fontWeight: '900',
        textAlign: 'right',
    },

    fechaDetalleBox: {
        minHeight: 58,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#DDD6FE',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,

        flexDirection: 'row',
        alignItems: 'center',
    },

    fechaDetalleLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    fechaIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EDE9FE',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    fechaDetalleLabel: {
        color: '#5B21B6',
        fontSize: 14,
        fontWeight: '900',
    },

    fechaDetalleValue: {
        color: PURPLE,
        fontSize: 18,
        fontWeight: '900',
        marginLeft: 10,
    },
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    listScroll: {
        flex: 1,
        zIndex: 0,
        elevation: 0,
    },

    content: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 28,
    },

    actionsBar: {
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

    actionButton: {
        flex: 1,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#DDD6FE',

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    actionButtonSelected: {
        backgroundColor: '#F5F3FF',
        borderColor: '#C4B5FD',
    },

    actionButtonMain: {
        flex: 1.35,
        height: 42,
        borderRadius: 14,
        backgroundColor: PURPLE,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    actionText: {
        color: PURPLE,
        fontSize: 12,
        fontWeight: '900',
    },

    actionTextMain: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },

    orderWrapper: {
        flex: 1,
        position: 'relative',
        zIndex: 1001,
        elevation: 1001,
        overflow: 'visible',
    },

    orderDropdown: {
        position: 'absolute',
        top: 48,
        right: 0,
        width: 210,
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

    orderOption: {
        minHeight: 46,
        borderRadius: 12,
        paddingHorizontal: 10,

        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    orderOptionSelected: {
        backgroundColor: '#F5F3FF',
    },

    orderOptionText: {
        flex: 1,
        color: PURPLE,
        fontSize: 13,
        fontWeight: '900',
    },

    taskCard: {
        backgroundColor: CARD,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 14,

        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 4,
    },

    taskCardSelected: {
        borderColor: '#7C3AED',
        borderWidth: 2,
        shadowColor: PURPLE,
        shadowOpacity: 0.16,
    },

    taskAccent: {
        height: 6,
    },

    taskBody: {
        paddingHorizontal: 17,
        paddingTop: 14,
        paddingBottom: 17,
        backgroundColor: '#FFFFFF',
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    operationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8,
    },

    operationIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 13,
        borderWidth: 1.5,

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    operationHeaderText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '900',
    },

    checkbox: {
        width: 36,
        height: 36,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',

        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxMarked: {
        backgroundColor: PURPLE,
        borderColor: PURPLE,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 12,
        marginBottom: 12,
    },

    animalBlock: {
        flex: 1.25,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 12,
        justifyContent: 'center',
    },

    informationLabel: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },

    animalId: {
        color: TEXT,
        fontSize: 30,
        lineHeight: 35,
        fontWeight: '900',
        marginBottom: 4,
    },

    crotalSmall: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
    },

    dateBox: {
        minWidth: 126,
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },

    dateLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5,
        marginBottom: 5,
    },

    dateValue: {
        color: TEXT,
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
        textAlign: 'right',
    },

    corralBox: {
        minHeight: 64,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#DDD6FE',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,
        paddingVertical: 10,

        flexDirection: 'row',
        alignItems: 'center',
    },

    corralIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#EDE9FE',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    corralTextBlock: {
        flex: 1,
    },

    corralLabel: {
        color: '#5B21B6',
        fontSize: 14,
        fontWeight: '900',
    },

    corralValue: {
        color: PURPLE,
        fontSize: 25,
        fontWeight: '900',
        marginLeft: 10,
    },

    stateCard: {
        backgroundColor: CARD,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        paddingHorizontal: 18,
        paddingVertical: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,

        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 2,
    },

    stateTitle: {
        color: TEXT,
        fontSize: 17,
        fontWeight: '900',
        marginTop: 8,
        textAlign: 'center',
    },

    stateText: {
        color: MUTED,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },

    retryText: {
        color: PURPLE,
        fontSize: 13,
        fontWeight: '900',
        marginTop: 10,
    },
    modalIconBoxEntrada: {
        width: 74,
        height: 74,
        borderRadius: 24,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    modalInputBlock: {
        width: '100%',
        marginBottom: 18,
    },

    modalInputLabel: {
        color: TEXT,
        fontSize: 13,
        fontWeight: '900',
        marginBottom: 8,
    },

    modalInput: {
        width: '100%',
        height: 50,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: '#DDD6FE',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        color: TEXT,
        fontSize: 18,
        fontWeight: '900',
    },

    modalButtonsRow: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
    },

    modalButtonSecondary: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalButtonSecondaryText: {
        color: PURPLE,
        fontSize: 15,
        fontWeight: '900',
    },

    modalButtonConfirm: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
    },
});