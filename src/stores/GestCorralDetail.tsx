/* eslint-disable prettier/prettier */
import React, { ComponentProps, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Dimensions,
    StyleSheet,
    Platform,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { consultarCurvas } from './apiApp';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CARD_BORDER = '#E2E8F0';
const TEXT = '#0F172A';

const pad2 = (n: number) => String(n).padStart(2, '0');

const esFechaVacia = (valor?: string | null) => {
    const texto = String(valor ?? '').trim();

    if (!texto || texto === '—') return true;

    return (
        texto.startsWith('2000-12-31') ||
        texto.startsWith('2001-01-01')
    );
};

const parsearFechaLocal = (valor?: string | null) => {
    const texto = String(valor ?? '').trim();

    if (esFechaVacia(texto)) return null;

    const matchIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (matchIso) {
        const [, year, month, day] = matchIso;

        const fecha = new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
        );

        if (Number.isNaN(fecha.getTime())) return null;

        return fecha;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(texto)) {
        const [day, month, year] = texto.split('-').map(Number);
        const fecha = new Date(year, month - 1, day);

        if (Number.isNaN(fecha.getTime())) return null;

        return fecha;
    }

    return null;
};

const formatearFecha = (valor?: string | null) => {
    const fecha = parsearFechaLocal(valor);

    if (!fecha) return '—';

    return `${pad2(fecha.getDate())}-${pad2(
        fecha.getMonth() + 1,
    )}-${fecha.getFullYear()}`;
};

const formatearFechaHora = (valor?: string | null) => {
    const texto = String(valor ?? '').trim();

    if (esFechaVacia(texto)) return '—';

    const textoDate = texto.replace('[UTC]', '');
    const fecha = new Date(textoDate);

    if (Number.isNaN(fecha.getTime())) {
        return formatearFecha(texto);
    }

    return `${pad2(fecha.getDate())}-${pad2(
        fecha.getMonth() + 1,
    )}-${fecha.getFullYear()} ${pad2(fecha.getHours())}:${pad2(
        fecha.getMinutes(),
    )}`;
};

const sumarDiasFecha = (valor?: string | null, dias = 115) => {
    const fecha = parsearFechaLocal(valor);

    if (!fecha) return '—';

    const nueva = new Date(fecha);
    nueva.setDate(nueva.getDate() + dias);

    return `${pad2(nueva.getDate())}-${pad2(
        nueva.getMonth() + 1,
    )}-${nueva.getFullYear()}`;
};

const numeroSeguro = (valor: any, defecto = 0) => {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : defecto;
};

const textoDato = (valor: any, defecto = '—') => {
    if (valor === null || valor === undefined) return defecto;

    const texto = String(valor).trim();

    return texto ? texto : defecto;
};

const obtenerIdCurvaGestacion = (datosGestacion: any) => {
    const animal = datosGestacion?.animal ?? {};

    const curveId =
        animal?.curveId ??
        datosGestacion?.curveId;

    const numero = Number(curveId);

    return Number.isFinite(numero) ? numero : -1;
};

const traducirEstadoGestacion = (
    estado: any,
    t: (clave: string) => string,
) => {
    const texto = String(estado ?? '').trim().toLowerCase();

    if (texto === 'gestation') {
        return t('gestCorralDetail.stateGestation');
    }

    if (texto === 'out_of_gestation') {
        return t('gestCorralDetail.stateOutOfGestation');
    }

    return textoDato(estado);
};

const formatearDia = (valor: any) => {
    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero < 0) return '—';

    return String(numero);
};

const obtenerUltimaAlimentacion = (datosGestacion: any) => {
    const animal = datosGestacion?.animal;

    const directa =
        animal?.ultimaAlimentacion ??
        animal?.lastFeeding ??
        datosGestacion?.ultimaAlimentacion ??
        datosGestacion?.lastFeeding ??
        null;

    if (directa) {
        return formatearFechaHora(String(directa));
    }

    const lista = Array.isArray(datosGestacion?.listDosage)
        ? datosGestacion.listDosage
        : [];

    if (lista.length === 0) return '—';

    const ultima = [...lista]
        .filter(item => item?.date)
        .sort((a, b) => {
            const fechaA = new Date(
                String(a.date).replace('[UTC]', ''),
            ).getTime();

            const fechaB = new Date(
                String(b.date).replace('[UTC]', ''),
            ).getTime();

            return fechaB - fechaA;
        })[0];

    if (!ultima?.date) return '—';

    return formatearFechaHora(ultima.date);
};

function EmptyGestacionCard({
    corralId,
    t,
}: {
    corralId: number | string;
    t: (clave: string) => string;
}) {
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
                <Ionicons
                    name="warning-outline"
                    size={34}
                    color="#92400E"
                />
            </View>

            <Text style={styles.emptyTitle}>
                {t('gestCorralDetail.emptyTitle')}
            </Text>

            <View style={styles.emptyCorralRow}>
                <Text style={styles.emptyCorralLabel}>
                    {t('gestCorralDetail.corral')}{' '}
                </Text>

                <View style={styles.emptyCorralChip}>
                    <Text style={styles.emptyCorralValue}>
                        {corralId}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function MetaDato({
    label,
    value,
    tipo = 'normal',
}: {
    label: string;
    value: any;
    tipo?: 'id' | 'crotal' | 'ciclo' | 'normal';
}) {
    return (
        <View
            style={[
                styles.metaDato,
                tipo === 'id' && styles.metaDatoId,
                tipo === 'crotal' && styles.metaDatoCrotal,
                tipo === 'ciclo' && styles.metaDatoCiclo,
            ]}
        >
            <View style={styles.metaDatoLabelBox}>
                <Text style={styles.metaDatoLabelText}>
                    {label}
                </Text>
            </View>

            <Text
                style={styles.metaDatoValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
            >
                {textoDato(value)}
            </Text>
        </View>
    );
}

function InfoCell({
    width,
    label,
    value,
    icon = 'book-outline',
    isPhone,
    pill,
}: {
    width: number;
    label: string;
    value: any;
    icon?: IoniconName;
    isPhone: boolean;
    pill?: boolean;
}) {
    const valorTexto = textoDato(value);

    return (
        <View style={[styles.infoCell, { width }]}>
            <Text
                style={[
                    styles.infoLabel,
                    isPhone && styles.infoLabelSm,
                ]}
            >
                {label}
            </Text>

            <View style={styles.infoRow}>
                <Ionicons
                    name={icon}
                    size={18}
                    color="#0F172A"
                />

                {pill ? (
                    <View style={styles.pillBox}>
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                            style={[
                                styles.infoValue,
                                isPhone && styles.infoValueSm,
                                styles.pillText,
                            ]}
                        >
                            {valorTexto}
                        </Text>
                    </View>
                ) : (
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[
                            styles.infoValue,
                            isPhone && styles.infoValueSm,
                        ]}
                    >
                        {valorTexto}
                    </Text>
                )}
            </View>
        </View>
    );
}

export const GestCorralDetail = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    const params = route.params ?? {};

    const {
        corralId = 0,
        mockEmpty = false,
        mockData = null,
        datosGestacion: datosGestacionParam = null,
        datosMaternidad = null,
        diasSinAlimentar = 0,
    } = params;

    const winH = Dimensions.get('window').height;
    const winW = Dimensions.get('window').width;

    const isPhone = winW <= 420;

    const [contentW, setContentW] = useState(0);
    const [nombreCurvaApi, setNombreCurvaApi] = useState('');

    const datosGestacion = useMemo(() => {
        if (mockEmpty) {
            return { animal: null };
        }

        return datosGestacionParam ?? datosMaternidad ?? mockData ?? null;
    }, [
        mockEmpty,
        datosGestacionParam,
        datosMaternidad,
        mockData,
    ]);

    const animal = datosGestacion?.animal ?? null;
    const hasAnimal = !!animal;
    const curveIdAnimal = obtenerIdCurvaGestacion(datosGestacion);

    useEffect(() => {
        if (!hasAnimal) return;

        const nombreYaRecibido =
            animal?.curveName ??
            datosGestacion?.curveName ??
            animal?.curvaNombre ??
            datosGestacion?.curvaNombre;

        if (
            nombreYaRecibido !== null &&
            nombreYaRecibido !== undefined &&
            String(nombreYaRecibido).trim() !== ''
        ) {
            setNombreCurvaApi(String(nombreYaRecibido).trim());
            return;
        }

        if (curveIdAnimal < 0) {
            setNombreCurvaApi('—');
            return;
        }

        let activo = true;

        const cargarNombreCurva = async () => {
            try {
                const curvas = await consultarCurvas();

                const curvaEncontrada = Array.isArray(curvas)
                    ? curvas.find(
                        curva => Number(curva.id) === Number(curveIdAnimal),
                    )
                    : null;

                if (!activo) return;

                setNombreCurvaApi(
                    curvaEncontrada?.name ?? String(curveIdAnimal),
                );
            } catch (error) {
                console.log('No se pudo cargar el nombre de la curva:', error);

                if (!activo) return;

                setNombreCurvaApi(String(curveIdAnimal));
            }
        };

        cargarNombreCurva();

        return () => {
            activo = false;
        };
    }, [
        hasAnimal,
        animal?.curveName,
        datosGestacion?.curveName,
        animal?.curvaNombre,
        datosGestacion?.curvaNombre,
        curveIdAnimal,
    ]);

    const idAnimal = textoDato(
        animal?.animalId ??
        datosGestacion?.animalId ??
        animal?.id,
    );

    const crotalAnimal = textoDato(
        animal?.crotal ??
        datosGestacion?.crotal,
    );

    const cicloAnimal = textoDato(
        datosGestacion?.cycle ??
        animal?.cycle,
    );

    const diaAnimal = formatearDia(
        datosGestacion?.day ??
        animal?.day ??
        animal?.dia,
    );

    const estadoAnimal = traducirEstadoGestacion(
        animal?.state ??
        datosGestacion?.state,
        t,
    );

    const plannedFeeding = numeroSeguro(
        datosGestacion?.plannedFeeding ??
        animal?.plannedFeeding ??
        animal?.consumo?.objetivo,
        0,
    );

    const totalFeeding = numeroSeguro(
        datosGestacion?.totalFeeding ??
        animal?.totalFeeding ??
        animal?.consumo?.actual,
        0,
    );

    const porcentajeBackend = Number(
        datosGestacion?.percentageTotalFeeding,
    );

    const pct = Number.isFinite(porcentajeBackend)
        ? Math.round(porcentajeBackend)
        : plannedFeeding > 0
            ? Math.round((totalFeeding / plannedFeeding) * 100)
            : 0;

    const pctClamped = Math.min(100, Math.max(0, pct));

    const diasSinAlimentarValor = numeroSeguro(
        animal?.daysWithoutFeeding ??
        animal?.diasSinAlimentar ??
        datosGestacion?.daysWithoutFeeding ??
        diasSinAlimentar,
        0,
    );

    const hasDiasSinAlimentar =
        Number.isFinite(diasSinAlimentarValor) &&
        diasSinAlimentarValor > 0;

    const curvaValor = textoDato(
        nombreCurvaApi
            ? nombreCurvaApi
            : animal?.curveName ??
            datosGestacion?.curveName ??
            animal?.curvaNombre ??
            datosGestacion?.curvaNombre ??
            animal?.curva ??
            datosGestacion?.curva ??
            animal?.curveId ??
            datosGestacion?.curveId,
    );

    const correccionValor = textoDato(
        animal?.bodyConditionCorrection ??
        datosGestacion?.bodyConditionCorrection ??
        animal?.correccion ??
        animal?.bodyConditionId,
    );

    const fechaEntrada = formatearFecha(
        datosGestacion?.gestationEntryDate ??
        animal?.systemEntryDate ??
        datosGestacion?.systemEntryDate,
    );

    const fechaInseminacion = formatearFecha(
        datosGestacion?.inseminationDate ??
        animal?.inseminationDate,
    );

    const fechaEstimadaPartoDirecta =
        datosGestacion?.estimatedFarrowingDate ??
        datosGestacion?.expectedFarrowingDate ??
        animal?.estimatedFarrowingDate ??
        animal?.expectedFarrowingDate;

    const fechaEstimadaParto = !esFechaVacia(
        fechaEstimadaPartoDirecta,
    )
        ? formatearFecha(fechaEstimadaPartoDirecta)
        : sumarDiasFecha(
            datosGestacion?.inseminationDate ??
            animal?.inseminationDate,
            115,
        );

    const naveValor = textoDato(
        animal?.houseName ??
        datosGestacion?.houseName ??
        animal?.nave,
    );

    const corralValor = textoDato(
        animal?.corralName ??
        datosGestacion?.corralName ??
        animal?.corral ??
        corralId,
    );

    const ultimaAlimentacion =
        obtenerUltimaAlimentacion(datosGestacion);

    const kpiFontSize = isPhone ? 52 : 56;

    const GRID_COLS = contentW >= 700 ? 3 : 2;
    const GRID_GAP = isPhone ? 10 : 14;
    const CONTENT_PAD_H = isPhone ? 16 : 24;
    const GRID_AVAILABLE_W =
        (contentW || winW) - CONTENT_PAD_H * 2;

    const infoCellW = Math.floor(
        (GRID_AVAILABLE_W - GRID_GAP * (GRID_COLS - 1)) /
        GRID_COLS,
    );

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{
                    paddingBottom: 24 + insets.bottom,
                }}
            >
                <View
                    onLayout={e =>
                        setContentW(e.nativeEvent.layout.width)
                    }
                    style={[
                        styles.card,
                        {
                            paddingHorizontal: isPhone ? 16 : 24,
                            minHeight: winH - 80,
                        },
                    ]}
                >
                    <View style={styles.detailHeader}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="chevron-back-outline"
                                size={32}
                                color={TEXT}
                            />
                        </TouchableOpacity>

                        <Text
                            style={styles.detailHeaderTitle}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                        >
                            {t('gestCorralDetail.title')}
                        </Text>
                    </View>

                    {!hasAnimal ? (
                        <EmptyGestacionCard
                            corralId={corralId}
                            t={t}
                        />
                    ) : (
                        <>
                            <View style={styles.metaRowEven}>
                                <MetaDato
                                    label={t('gestCorralDetail.id')}
                                    value={idAnimal}
                                    tipo="id"
                                />

                                <MetaDato
                                    label={t('gestCorralDetail.crotal')}
                                    value={crotalAnimal}
                                    tipo="crotal"
                                />

                                <MetaDato
                                    label={t('gestCorralDetail.cycle')}
                                    value={cicloAnimal}
                                    tipo="ciclo"
                                />
                            </View>

                            <View style={styles.headerRowMd}>
                                <Text style={styles.subTitle}>
                                    {estadoAnimal}
                                </Text>

                                <View style={styles.dayInline}>
                                    <View style={styles.metaDatoLabelBox}>
                                        <Text style={styles.metaDatoLabelText}>
                                            {t('gestCorralDetail.day')}
                                        </Text>
                                    </View>

                                    <Text
                                        style={styles.metaDatoValue}
                                        numberOfLines={1}
                                    >
                                        {diaAnimal}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.kpiRow}>
                                <View style={styles.kpiLeft}>
                                    <View style={styles.kpiNumberRow}>
                                        <Text
                                            style={[
                                                styles.kpiNumber,
                                                {
                                                    fontSize: kpiFontSize,
                                                },
                                            ]}
                                        >
                                            {totalFeeding.toLocaleString(
                                                'es-ES',
                                            )}
                                        </Text>

                                        <Text style={styles.kpiUnit}>
                                            gr
                                        </Text>
                                    </View>

                                    <View style={styles.consumoProgressRow}>
                                        <View style={styles.progressWrap}>
                                            <View style={styles.barBg} />

                                            <View
                                                style={[
                                                    styles.barFill,
                                                    {
                                                        width: `${pctClamped}%`,
                                                    },
                                                ]}
                                            />
                                        </View>

                                        <Text style={styles.consumoPctText}>
                                            {pct}%
                                        </Text>
                                    </View>

                                    <View style={styles.objetivoConsumoRow}>
                                        <Text style={styles.objetivoConsumoValue}>
                                            {t('gestCorralDetail.of')}{' '}
                                            {plannedFeeding.toLocaleString(
                                                'es-ES',
                                            )}{' '}
                                            gr
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {hasDiasSinAlimentar && (
                                <View style={styles.errorBand}>
                                    <Text style={styles.errorText}>
                                        {diasSinAlimentarValor === 1
                                            ? t('gestCorralDetail.oneDayWithoutFeeding')
                                            : t('gestCorralDetail.daysWithoutFeeding', {
                                                count: diasSinAlimentarValor,
                                            })}
                                    </Text>
                                </View>
                            )}

                            <View
                                style={[
                                    styles.infoGrid,
                                    {
                                        columnGap: GRID_GAP,
                                        rowGap: GRID_GAP,
                                    },
                                ]}
                            >
                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.curve')}
                                    value={curvaValor}
                                    isPhone={isPhone}
                                    pill
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.correction')}
                                    value={correccionValor}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.entryDate')}
                                    value={fechaEntrada}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.inseminationDate')}
                                    value={fechaInseminacion}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.house')}
                                    value={naveValor}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.corral')}
                                    value={corralValor}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.estimatedFarrowingDate')}
                                    value={fechaEstimadaParto}
                                    isPhone={isPhone}
                                />

                                <InfoCell
                                    width={infoCellW}
                                    label={t('gestCorralDetail.lastFeeding')}
                                    value={ultimaAlimentacion}
                                    isPhone={isPhone}
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },

    card: {
        width: '100%',
        alignSelf: 'stretch',
        paddingTop: 8,
        paddingBottom: 16,
        position: 'relative',
    },

    detailHeader: {
        marginTop: 6,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
        flexShrink: 0,
    },

    detailHeaderTitle: {
        flex: 1,
        color: TEXT,
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 28,
    },

    emptyContainer: {
        marginTop: 24,
        alignItems: 'center',
    },

    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
    },

    emptyCorralRow: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyCorralLabel: {
        color: '#475569',
        fontSize: 16,
    },

    emptyCorralChip: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: CARD_BORDER,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
    },

    emptyCorralValue: {
        color: '#0F172A',
        fontWeight: '900',
        fontSize: 16,
        lineHeight: 18,
    },

    metaRowEven: {
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
    },

    metaDato: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
    },

    metaDatoId: {
        width: 90,
    },

    metaDatoCrotal: {
        flex: 1,
        justifyContent: 'center',
    },

    metaDatoCiclo: {
        width: 92,
        justifyContent: 'flex-end',
    },

    metaDatoLabelBox: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        marginRight: 6,
        flexShrink: 0,
    },

    metaDatoLabelText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '800',
    },

    metaDatoValue: {
        color: '#334155',
        fontSize: 17,
        fontWeight: '900',
        flexShrink: 1,
    },

    headerRowMd: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 18,
    },

    subTitle: {
        fontSize: 22,
        color: '#1E3A8A',
        fontWeight: '700',
    },

    dayInline: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    kpiRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        columnGap: 4,
    },

    kpiLeft: {
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        paddingRight: 8,
    },

    kpiNumberRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },

    kpiNumber: {
        color: '#475569',
        fontWeight: '700',
        letterSpacing: -1.5,
    },

    kpiUnit: {
        fontSize: 18,
        color: '#475569',
        marginLeft: 6,
    },

    consumoProgressRow: {
        marginTop: 8,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    progressWrap: {
        position: 'relative',
        height: 14,
        justifyContent: 'center',
        flex: 1,
    },

    barBg: {
        height: 14,
        borderRadius: 999,
        backgroundColor: '#D1D5DB',
        width: '100%',
    },

    barFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 14,
        borderRadius: 999,
        backgroundColor: '#22C55E',
    },

    consumoPctText: {
        minWidth: 34,
        textAlign: 'right',
        color: '#334155',
        fontSize: 13,
        fontWeight: '900',
    },

    objetivoConsumoRow: {
        marginTop: 4,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },

    objetivoConsumoValue: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '800',
    },

    errorBand: {
        marginTop: 20,
        minHeight: 36,
        width: '100%',
        backgroundColor: '#EF4444',
        borderRadius: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    errorText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: Platform.OS === 'ios' ? '400' : '600',
        textAlign: 'center',
    },

    infoGrid: {
        marginTop: 18,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    infoCell: {},

    infoLabel: {
        fontSize: 22,
        color: '#64748B',
    },

    infoLabelSm: {
        fontSize: 18,
    },

    infoRow: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    infoValue: {
        fontSize: 18,
        color: '#334155',
        fontWeight: '700',
        fontFamily:
            Platform.OS === 'ios'
                ? 'Menlo'
                : Platform.OS === 'android'
                    ? 'monospace'
                    : undefined,
    },

    infoValueSm: {
        fontSize: 16,
    },

    pillBox: {
        maxWidth: '85%',
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: CARD_BORDER,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },

    pillText: {
        color: '#0F172A',
        fontWeight: '800',
    },
});