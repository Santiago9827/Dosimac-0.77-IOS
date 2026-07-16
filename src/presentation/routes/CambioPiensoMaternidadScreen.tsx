/* eslint-disable prettier/prettier */
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {
    consultarTareasCambioPiensoMaternidad,
    TareaCambioPiensoMaternidad,
} from '../../stores/apiApp';

const BG = '#F6F8FC';
const CARD = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const PURPLE = '#4C1D95';
const PURPLE_SOFT = '#F5F3FF';

const BLUE = '#2563EB';

const ORANGE = '#EA580C';
const ORANGE_SOFT = '#FFF7ED';
const ORANGE_BORDER = '#FED7AA';

const PIENSO_1_GREEN = '#15803D';
const PIENSO_1_GREEN_SOFT = '#DCFCE7';
const PIENSO_1_GREEN_BORDER = '#4ADE80';

const PIENSO_2_BLUE = '#0EA5C6';
const PIENSO_2_BLUE_SOFT = '#D9F7FB';
const PIENSO_2_BLUE_BORDER = '#22C7EE';

const obtenerEstiloPiensoDestino = (
    piensoDestinoId?: number,
) => {
    const id = Number(piensoDestinoId);

    if (id === 1) {
        return {
            color: PIENSO_1_GREEN,
            fondo: PIENSO_1_GREEN_SOFT,
            borde: PIENSO_1_GREEN_BORDER,
        };
    }

    if (id === 2) {
        return {
            color: PIENSO_2_BLUE,
            fondo: PIENSO_2_BLUE_SOFT,
            borde: PIENSO_2_BLUE_BORDER,
        };
    }

    return {
        color: PURPLE,
        fondo: PURPLE_SOFT,
        borde: '#C4B5FD',
    };
};

export const CambioPiensoMaternidadScreen = () => {
    const { t } = useTranslation();

    const [tareas, setTareas] = useState<
        TareaCambioPiensoMaternidad[]
    >([]);

    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] =
        useState(false);

    const tareasOrdenadas = useMemo(() => {
        return [...tareas].sort((a, b) => {
            const corralA = Number(a.corral ?? 0);
            const corralB = Number(b.corral ?? 0);

            return corralA - corralB;
        });
    }, [tareas]);

    const cargarTareas = useCallback(async () => {
        try {
            const datos =
                await consultarTareasCambioPiensoMaternidad();

            setTareas(datos);
        } catch (error: any) {
            console.log(
                'Error cargando tareas cambio pienso:',
                error,
            );

            Alert.alert(
                t('cambioPiensoMaternidad.error'),
                error?.message ||
                t('cambioPiensoMaternidad.loadTasksError'),
            );
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, [t]);

    useEffect(() => {
        cargarTareas();
    }, [cargarTareas]);

    const refrescar = async () => {
        setRefrescando(true);
        await cargarTareas();
    };

    if (cargando) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator
                    size="large"
                    color={PURPLE}
                />

                <Text style={styles.loadingText}>
                    {t('cambioPiensoMaternidad.loadingTasks')}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <View style={styles.headerCard}>
                <View style={styles.headerMainRow}>
                    <View style={styles.headerIconBox}>
                        <MaterialCommunityIcons
                            name="barley"
                            size={30}
                            color={PURPLE}
                        />
                    </View>

                    <View style={styles.headerTextBlock}>
                        <Text style={styles.title}>
                            {t('cambioPiensoMaternidad.title')}
                        </Text>

                        <View style={styles.pendingChip}>
                            <Ionicons
                                name="time-outline"
                                size={15}
                                color={ORANGE}
                            />

                            <Text style={styles.pendingChipText}>
                                {tareas.length === 1
                                    ? t(
                                        'cambioPiensoMaternidad.pendingTask',
                                        {
                                            count: tareas.length,
                                        },
                                    )
                                    : t(
                                        'cambioPiensoMaternidad.pendingTasks',
                                        {
                                            count: tareas.length,
                                        },
                                    )}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <FlatList
                data={tareasOrdenadas}
                keyExtractor={(item, index) =>
                    `${item.idAnimal}-${item.corral}-${index}`
                }
                refreshing={refrescando}
                onRefresh={refrescar}
                contentContainerStyle={styles.content}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={42}
                            color={BLUE}
                        />

                        <Text style={styles.emptyTitle}>
                            {t('cambioPiensoMaternidad.emptyTitle')}
                        </Text>

                        <Text style={styles.emptyText}>
                            {t('cambioPiensoMaternidad.emptyText')}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const estiloDestino =
                        obtenerEstiloPiensoDestino(
                            item.piensoDestinoId,
                        );

                    return (
                        <View style={styles.card}>
                            <View style={styles.cardAccent} />

                            <View style={styles.cardTop}>
                                <View style={styles.animalBlock}>
                                    <Text style={styles.label}>
                                        {t(
                                            'cambioPiensoMaternidad.animalId',
                                        )}
                                    </Text>

                                    <Text
                                        style={styles.value}
                                        numberOfLines={1}
                                    >
                                        {item.idAnimal}
                                    </Text>

                                    <Text
                                        style={styles.crotal}
                                        numberOfLines={1}
                                    >
                                        {String(item.crotal)}
                                    </Text>
                                </View>

                                <View style={styles.corralChip}>
                                    <Text style={styles.corralChipText}>
                                        {t(
                                            'cambioPiensoMaternidad.corral',
                                        )}{' '}
                                        {item.corral}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.piensoBox}>
                                <View style={styles.fijarBox}>
                                    <Text style={styles.fijarText}>
                                        {t('cambioPiensoMaternidad.setTo')}
                                    </Text>
                                </View>

                                <View style={styles.arrowBox}>
                                    <Ionicons
                                        name="arrow-forward-outline"
                                        size={24}
                                        color={PURPLE}
                                    />
                                </View>

                                <View
                                    style={[
                                        styles.piensoDestinoBox,
                                        {
                                            backgroundColor:
                                                estiloDestino.fondo,
                                            borderColor:
                                                estiloDestino.borde,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.piensoLabelDestino,
                                            {
                                                color: estiloDestino.color,
                                            },
                                        ]}
                                    >
                                        {t(
                                            'cambioPiensoMaternidad.destination',
                                        )}
                                    </Text>

                                    <Text
                                        style={styles.piensoText}
                                        numberOfLines={2}
                                    >
                                        {item.piensoDestino}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: BG,
    },

    loadingScreen: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        marginTop: 10,
        color: MUTED,
        fontSize: 14,
        fontWeight: '800',
    },

    headerCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: PURPLE_SOFT,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD6FE',
        paddingHorizontal: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: '#7C3AED',
    },

    headerTextBlock: {
        alignItems: 'center',
        flex: 1,
    },

    title: {
        color: TEXT,
        fontSize: 21,
        fontWeight: '900',
        textAlign: 'center',
    },

    pendingChip: {
        alignSelf: 'center',
        marginTop: 6,
        backgroundColor: ORANGE_SOFT,
        borderWidth: 1,
        borderColor: ORANGE_BORDER,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },

    pendingChipText: {
        color: ORANGE,
        fontSize: 12,
        fontWeight: '900',
    },

    content: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },

    card: {
        backgroundColor: CARD,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.07,
        shadowRadius: 5,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    cardAccent: {
        height: 7,
        backgroundColor: PURPLE,
    },

    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    animalBlock: {
        flex: 1,
        minWidth: 0,
    },

    label: {
        color: MUTED,
        fontSize: 12,
        fontWeight: '900',
    },

    value: {
        color: TEXT,
        fontSize: 20,
        fontWeight: '900',
        marginTop: 2,
    },

    crotal: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },

    corralChip: {
        backgroundColor: '#F3E8FF',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#C4B5FD',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },

    corralChipText: {
        color: PURPLE,
        fontSize: 14,
        fontWeight: '900',
    },

    piensoBox: {
        marginTop: 14,
        marginBottom: 18,
        alignSelf: 'center',
        width: '82%',
        maxWidth: 330,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    fijarBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    fijarText: {
        color: '#1E293B',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: -0.3,
    },

    arrowBox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    piensoDestinoBox: {
        flex: 1.1,
        maxWidth: 155,
        minWidth: 115,
        minHeight: 60,
        borderRadius: 18,
        borderWidth: 2,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    piensoLabelDestino: {
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 2,
    },

    piensoText: {
        color: TEXT,
        fontSize: 15,
        fontWeight: '900',
        textAlign: 'center',
    },

    emptyBox: {
        backgroundColor: CARD,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 24,
        alignItems: 'center',
        marginTop: 12,
    },

    emptyTitle: {
        color: TEXT,
        fontSize: 18,
        fontWeight: '900',
        marginTop: 8,
    },

    emptyText: {
        color: MUTED,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },
});