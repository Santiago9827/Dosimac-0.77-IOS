/* eslint-disable prettier/prettier */
import React, { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Dimensions,
    StyleSheet,
    Platform,
    TouchableOpacity,
    Pressable,
    Animated,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { consultarCondicionesCorporales, consultarCurvas, consultarCurvasGestacion, consultarGestacionPorIdAnimal, ejecutarOperacionGestacion } from './apiApp';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type CurvaGestacionApi = {
    id: number;
    name: string;
};
type CondicionCorporalApi = {
    description: string;
    id: string;
    position: number;
    value: number;
};

const CARD_BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const BRAND = '#4C1D95';
const pad2 = (n: number) => String(n).padStart(2, '0');
const crearFechaSoloDia = (fecha = new Date()) =>
    new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

const formatearFechaOperacion = (fecha: Date) =>
    `${pad2(fecha.getDate())}-${pad2(fecha.getMonth() + 1)}-${fecha.getFullYear()}`;

const sumarDiasOperacion = (fecha: Date, dias: number) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    return crearFechaSoloDia(nuevaFecha);
};

const esMismaFecha = (fechaA: Date, fechaB: Date) =>
    fechaA.getFullYear() === fechaB.getFullYear() &&
    fechaA.getMonth() === fechaB.getMonth() &&
    fechaA.getDate() === fechaB.getDate();

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

const useRightDrawer = () => {
    const width = Math.min(
        340,
        Math.round(Dimensions.get('window').width * 0.88),
    );

    const [open, setOpen] = useState(false);
    const translateX = useRef(new Animated.Value(width)).current;

    const show = () => {
        setOpen(true);

        Animated.timing(translateX, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
        }).start();
    };

    const hide = (after?: () => void) => {
        Animated.timing(translateX, {
            toValue: width,
            duration: 220,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                setOpen(false);

                requestAnimationFrame(() => {
                    after?.();
                });
            }
        });
    };

    return {
        open,
        show,
        hide,
        translateX,
        width,
    };
};

function DrawerGrabber() {
    return (
        <View style={styles.drawerGrabberContainer}>
            <View style={styles.drawerGrabber} />
        </View>
    );
}

function SectionTitle({
    icon,
    title,
    subtitle,
}: {
    icon: IoniconName;
    title: string;
    subtitle?: string;
}) {
    return (
        <View style={styles.drawerSectionTitle}>
            <View style={styles.drawerSectionIconBox}>
                <Ionicons
                    name={icon}
                    size={18}
                    color={BRAND}
                />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.drawerSectionTitleText}>
                    {title}
                </Text>

                {!!subtitle && (
                    <Text style={styles.drawerSectionSubtitle}>
                        {subtitle}
                    </Text>
                )}
            </View>
        </View>
    );
}

function ListItem({
    icon,
    label,
    onPress,
    disabled,
}: {
    icon: IoniconName;
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) {
    return (
        <Pressable
            disabled={disabled}
            onPress={disabled ? undefined : onPress}
            style={[
                styles.drawerListItem,
                disabled && styles.drawerListItemDisabled,
            ]}
        >
            <Ionicons
                name={icon}
                size={18}
                color={disabled ? '#94A3B8' : '#334155'}
            />

            <Text
                style={[
                    styles.drawerListItemText,
                    disabled && styles.drawerListItemTextDisabled,
                ]}
            >
                {label}
            </Text>

            <Ionicons
                name="chevron-forward-outline"
                size={18}
                color="#94A3B8"
            />
        </Pressable>
    );
}

function ListGroup({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <View style={styles.drawerListGroup}>
            {children}
        </View>
    );
}

const Divider = () => <View style={styles.drawerDivider} />;

function CurvaDialog({
    visible,
    title,
    curvas,
    currentId,
    loading,
    onClose,
    onAccept,
}: {
    visible: boolean;
    title: string;
    curvas: CurvaGestacionApi[];
    currentId: number;
    loading?: boolean;
    onClose: () => void;
    onAccept: (curva: CurvaGestacionApi) => void;
}) {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<number>(currentId);

    useEffect(() => {
        if (visible) {
            setSelectedId(currentId);
        }
    }, [visible, currentId]);

    const curvaSeleccionada =
        curvas.find(curva => Number(curva.id) === Number(selectedId)) ??
        curvas[0];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 16,
                        }}
                    >
                        {title}
                    </Text>

                    {loading ? (
                        <Text
                            style={{
                                color: '#64748B',
                                fontWeight: '800',
                                paddingVertical: 18,
                            }}
                        >
                            {t('gestCorralDetail.loadingCurves')}
                        </Text>
                    ) : curvas.length === 0 ? (
                        <Text
                            style={{
                                color: '#64748B',
                                fontWeight: '800',
                                paddingVertical: 18,
                            }}
                        >
                            {t('gestCorralDetail.noCurvesAvailable')}
                        </Text>
                    ) : (
                        curvas.map(curva => {
                            const activo =
                                Number(selectedId) === Number(curva.id);

                            return (
                                <Pressable
                                    key={curva.id}
                                    onPress={() => setSelectedId(curva.id)}
                                    style={{
                                        minHeight: 58,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 8,
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    <Ionicons
                                        name={
                                            activo
                                                ? 'radio-button-on-outline'
                                                : 'radio-button-off-outline'
                                        }
                                        size={24}
                                        color={activo ? BRAND : '#64748B'}
                                    />

                                    <Text
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                        style={{
                                            flex: 1,
                                            marginLeft: 18,
                                            color: '#0F172A',
                                            fontSize: 18,
                                            fontWeight: '900',
                                        }}
                                    >
                                        {curva.name}
                                    </Text>
                                </Pressable>
                            );
                        })
                    )}

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 12,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.9}
                            disabled={loading}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={!curvaSeleccionada || loading}
                            onPress={() => {
                                if (curvaSeleccionada) {
                                    onAccept(curvaSeleccionada);
                                }
                            }}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor:
                                    !curvaSeleccionada || loading
                                        ? '#A5B4FC'
                                        : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
function CondicionCorporalDialog({
    visible,
    title,
    condiciones,
    currentId,
    loading,
    onClose,
    onAccept,
}: {
    visible: boolean;
    title: string;
    condiciones: CondicionCorporalApi[];
    currentId: string;
    loading?: boolean;
    onClose: () => void;
    onAccept: (condicion: CondicionCorporalApi) => void;
}) {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<string>(currentId);

    useEffect(() => {
        if (visible) {
            setSelectedId(currentId);
        }
    }, [visible, currentId]);

    const condicionSeleccionada =
        condiciones.find(
            condicion => String(condicion.id) === String(selectedId),
        ) ?? condiciones[0];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 16,
                        }}
                    >
                        {title}
                    </Text>

                    {loading ? (
                        <Text
                            style={{
                                color: '#64748B',
                                fontWeight: '800',
                                paddingVertical: 18,
                            }}
                        >
                            {t('gestCorralDetail.loadingBodyConditions')}
                        </Text>
                    ) : condiciones.length === 0 ? (
                        <Text
                            style={{
                                color: '#64748B',
                                fontWeight: '800',
                                paddingVertical: 18,
                            }}
                        >
                            {t('gestCorralDetail.noBodyConditionsAvailable')}
                        </Text>
                    ) : (
                        condiciones.map(condicion => {
                            const activo =
                                String(selectedId) === String(condicion.id);

                            return (
                                <Pressable
                                    key={condicion.id}
                                    onPress={() => setSelectedId(condicion.id)}
                                    style={{
                                        minHeight: 58,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 8,
                                        paddingHorizontal: 2,
                                    }}
                                >
                                    <Ionicons
                                        name={
                                            activo
                                                ? 'radio-button-on'
                                                : 'radio-button-off'
                                        }
                                        size={24}
                                        color={activo ? BRAND : '#64748B'}
                                    />

                                    <Text
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.85}
                                        style={{
                                            flex: 1,
                                            marginLeft: 18,
                                            color: '#0F172A',
                                            fontSize: 18,
                                            fontWeight: '900',
                                        }}
                                    >
                                        {`${condicion.id} ${condicion.description}`}
                                    </Text>
                                </Pressable>
                            );
                        })
                    )}

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 12,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.9}
                            disabled={loading}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={!condicionSeleccionada || loading}
                            onPress={() => {
                                if (condicionSeleccionada) {
                                    onAccept(condicionSeleccionada);
                                }
                            }}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor:
                                    !condicionSeleccionada || loading
                                        ? '#A5B4FC'
                                        : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function CambioCorralDialog({
    visible,
    corralActual,
    value,
    loading,
    errorMessage,
    onChangeText,
    onClose,
    onAccept,
}: {
    visible: boolean;
    corralActual: string;
    value: string;
    loading?: boolean;
    errorMessage?: string;
    onChangeText: (texto: string) => void;
    onClose: () => void;
    onAccept: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.changePenTitle')}
                    </Text>

                    <Text
                        style={{
                            color: '#64748B',
                            fontSize: 14,
                            fontWeight: '800',
                            marginBottom: 14,
                        }}
                    >
                        {t('gestCorralDetail.currentPen', {
                            corral: corralActual || '—',
                        })}
                    </Text>

                    <Text
                        style={{
                            color: '#0F172A',
                            fontSize: 15,
                            fontWeight: '900',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.newPen')}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        editable={!loading}
                        keyboardType="number-pad"
                        placeholder={t('gestCorralDetail.changePenPlaceholder')}
                        placeholderTextColor="#94A3B8"
                        style={{
                            height: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: CARD_BORDER,
                            paddingHorizontal: 14,
                            color: '#0F172A',
                            fontSize: 18,
                            fontWeight: '900',
                            backgroundColor: '#FFFFFF',
                        }}
                    />
                    {!!errorMessage && (
                        <Text
                            style={{
                                marginTop: 8,
                                color: '#EF4444',
                                fontSize: 13,
                                fontWeight: '800',
                            }}
                        >
                            {errorMessage}
                        </Text>
                    )}

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 18,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading || !value.trim()}
                            onPress={onAccept}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor:
                                    loading || !value.trim()
                                        ? '#A5B4FC'
                                        : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function SustituirCrotalDialog({
    visible,
    crotalActual,
    value,
    loading,
    errorMessage,
    onChangeText,
    onClose,
    onAccept,
}: {
    visible: boolean;
    crotalActual: string;
    value: string;
    loading?: boolean;
    errorMessage?: string;
    onChangeText: (texto: string) => void;
    onClose: () => void;
    onAccept: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.replaceEarTagTitle')}
                    </Text>

                    <Text
                        style={{
                            color: '#64748B',
                            fontSize: 14,
                            fontWeight: '800',
                            marginBottom: 14,
                        }}
                    >
                        {t('gestCorralDetail.currentEarTag', {
                            crotal: crotalActual || '—',
                        })}
                    </Text>

                    <Text
                        style={{
                            color: '#0F172A',
                            fontSize: 15,
                            fontWeight: '900',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.newEarTag')}
                    </Text>

                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        editable={!loading}
                        keyboardType="default"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        placeholder={t('gestCorralDetail.replaceEarTagPlaceholder')}
                        placeholderTextColor="#94A3B8"
                        style={{
                            height: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: CARD_BORDER,
                            paddingHorizontal: 14,
                            color: '#0F172A',
                            fontSize: 18,
                            fontWeight: '900',
                            backgroundColor: '#FFFFFF',
                        }}
                    />
                    {!!errorMessage && (
                        <Text
                            style={{
                                marginTop: 8,
                                color: '#EF4444',
                                fontSize: 13,
                                fontWeight: '800',
                            }}
                        >
                            {errorMessage}
                        </Text>
                    )}

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 18,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading || !value.trim()}
                            onPress={onAccept}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor:
                                    loading || !value.trim()
                                        ? '#A5B4FC'
                                        : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function FechaInseminacionDialog({
    visible,
    fecha,
    loading,
    onRestarDia,
    onSumarDia,
    onClose,
    onAccept,
}: {
    visible: boolean;
    fecha: Date;
    loading?: boolean;
    onRestarDia: () => void;
    onSumarDia: () => void;
    onClose: () => void;
    onAccept: () => void;
}) {
    const { t } = useTranslation();
    const hoy = crearFechaSoloDia();
    const fechaSeleccionada = crearFechaSoloDia(fecha);

    const bloquearMas =
        esMismaFecha(fechaSeleccionada, hoy) ||
        fechaSeleccionada > hoy;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 14,
                        }}
                    >
                        {t('gestCorralDetail.inseminationDateTitle')}
                    </Text>

                    <Text
                        style={{
                            color: '#0F172A',
                            fontSize: 15,
                            fontWeight: '900',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.selectDate')}
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading}
                            onPress={onRestarDia}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            <Ionicons
                                name="remove-outline"
                                size={26}
                                color="#0F172A"
                            />
                        </TouchableOpacity>

                        <View
                            style={{
                                flex: 1,
                                height: 48,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: CARD_BORDER,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#F8FAFC',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 18,
                                    fontWeight: '900',
                                }}
                            >
                                {formatearFechaOperacion(fechaSeleccionada)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading || bloquearMas}
                            onPress={onSumarDia}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading || bloquearMas ? 0.4 : 1,
                            }}
                        >
                            <Ionicons
                                name="add-outline"
                                size={26}
                                color="#0F172A"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{
                            marginTop: 10,
                            color: '#64748B',
                            fontSize: 13,
                            fontWeight: '700',
                        }}
                    >
                        {t('gestCorralDetail.noFutureInseminationDate')}
                    </Text>

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 18,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading}
                            onPress={onAccept}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: loading ? '#A5B4FC' : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function SalidaAnimalGestacionDialog({
    visible,
    fecha,
    loading,
    onRestarDia,
    onSumarDia,
    onClose,
    onAccept,
}: {
    visible: boolean;
    fecha: Date;
    loading?: boolean;
    onRestarDia: () => void;
    onSumarDia: () => void;
    onClose: () => void;
    onAccept: () => void;
}) {
    const { t } = useTranslation();
    const hoy = crearFechaSoloDia();
    const fechaSeleccionada = crearFechaSoloDia(fecha);

    const bloquearMas =
        esMismaFecha(fechaSeleccionada, hoy) ||
        fechaSeleccionada > hoy;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                }}
            >
                <Pressable
                    onPress={onClose}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                />

                <View
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        alignSelf: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: CARD_BORDER,
                        shadowColor: '#000000',
                        shadowOpacity: 0.15,
                        shadowRadius: 16,
                        shadowOffset: {
                            width: 0,
                            height: 8,
                        },
                    }}
                >
                    <Text
                        style={{
                            fontWeight: '900',
                            fontSize: 18,
                            color: '#0F172A',
                            marginBottom: 14,
                        }}
                    >
                        {t('gestCorralDetail.exitAnimalTitle')}
                    </Text>

                    <View
                        style={{
                            minHeight: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: '#22C55E',
                            backgroundColor: '#FFFFFF',
                            paddingHorizontal: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 14,
                        }}
                    >
                        <Text
                            style={{
                                color: '#0F172A',
                                fontSize: 16,
                                fontWeight: '800',
                            }}
                        >
                            {t('gestCorralDetail.exitAnimalGestation')}
                        </Text>

                        <Ionicons
                            name="exit-outline"
                            size={22}
                            color="#64748B"
                        />
                    </View>

                    <Text
                        style={{
                            color: '#0F172A',
                            fontSize: 15,
                            fontWeight: '900',
                            marginBottom: 8,
                        }}
                    >
                        {t('gestCorralDetail.exitDate')}
                    </Text>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading}
                            onPress={onRestarDia}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            <Ionicons
                                name="remove-outline"
                                size={26}
                                color="#0F172A"
                            />
                        </TouchableOpacity>

                        <View
                            style={{
                                flex: 1,
                                height: 48,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: CARD_BORDER,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#F8FAFC',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 18,
                                    fontWeight: '900',
                                }}
                            >
                                {formatearFechaOperacion(fechaSeleccionada)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading || bloquearMas}
                            onPress={onSumarDia}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading || bloquearMas ? 0.4 : 1,
                            }}
                        >
                            <Ionicons
                                name="add-outline"
                                size={26}
                                color="#0F172A"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text
                        style={{
                            marginTop: 10,
                            color: '#64748B',
                            fontSize: 13,
                            fontWeight: '700',
                        }}
                    >
                        {t('gestCorralDetail.noFutureExitDate')}
                    </Text>

                    <View
                        style={{
                            height: 1,
                            backgroundColor: CARD_BORDER,
                            marginTop: 18,
                            marginBottom: 14,
                        }}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.9}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            <Text
                                style={{
                                    color: '#0F172A',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {t('gestCorralDetail.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            disabled={loading}
                            onPress={onAccept}
                            style={{
                                flex: 1,
                                height: 50,
                                borderRadius: 14,
                                backgroundColor: loading ? '#A5B4FC' : BRAND,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: 16,
                                    fontWeight: '900',
                                }}
                            >
                                {loading
                                    ? t('gestCorralDetail.saving')
                                    : t('gestCorralDetail.accept')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

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
    const drawer = useRightDrawer();
    const [dlgCurva, setDlgCurva] = useState(false);
    const [curvasGestacion, setCurvasGestacion] = useState<CurvaGestacionApi[]>([]);
    const [cargandoCurvas, setCargandoCurvas] = useState(false);
    const [guardandoCambioCurva, setGuardandoCambioCurva] = useState(false);
    const [dlgCondicionCorporal, setDlgCondicionCorporal] = useState(false);
    const [condicionesCorporales, setCondicionesCorporales] =
        useState<CondicionCorporalApi[]>([]);
    const [cargandoCondicionesCorporales, setCargandoCondicionesCorporales] =
        useState(false);
    const [guardandoCondicionCorporal, setGuardandoCondicionCorporal] =
        useState(false);

    const [dlgCambioCorral, setDlgCambioCorral] = useState(false);
    const [nuevoCorralGestacion, setNuevoCorralGestacion] = useState('');
    const [guardandoCambioCorral, setGuardandoCambioCorral] = useState(false);
    const [errorCambioCorral, setErrorCambioCorral] = useState('');
    const [dlgSustituirCrotal, setDlgSustituirCrotal] = useState(false);
    const [nuevoCrotalGestacion, setNuevoCrotalGestacion] = useState('');
    const [guardandoSustituirCrotal, setGuardandoSustituirCrotal] =
        useState(false);
    const [errorSustituirCrotal, setErrorSustituirCrotal] = useState('');

    const [dlgFechaInseminacion, setDlgFechaInseminacion] = useState(false);
    const [fechaInseminacionOperacion, setFechaInseminacionOperacion] =
        useState<Date>(crearFechaSoloDia());
    const [guardandoFechaInseminacion, setGuardandoFechaInseminacion] =
        useState(false);

    const [dlgSalidaAnimal, setDlgSalidaAnimal] = useState(false);
    const [fechaSalidaAnimal, setFechaSalidaAnimal] =
        useState<Date>(crearFechaSoloDia());
    const [guardandoSalidaAnimal, setGuardandoSalidaAnimal] =
        useState(false);

    const datosGestacionInicial = useMemo(() => {
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

    const [datosGestacionLocal, setDatosGestacionLocal] =
        useState<any>(datosGestacionInicial);

    useEffect(() => {
        setDatosGestacionLocal(datosGestacionInicial);
    }, [datosGestacionInicial]);

    const datosGestacion = datosGestacionLocal;
    const animal = datosGestacion?.animal ?? null;
    const hasAnimal = !!animal;
    const curveIdAnimal = obtenerIdCurvaGestacion(datosGestacion);
    const pkidAnimalOperacion = String(
        animal?.pkid ??
        animal?.pkId ??
        animal?.PKID ??
        animal?.id ??
        datosGestacion?.pkid ??
        datosGestacion?.pkId ??
        datosGestacion?.animalPkid ??
        '',
    ).trim();



    const cargarCurvasGestacion = async () => {
        try {
            setCargandoCurvas(true);

            const curvas = await consultarCurvasGestacion();

            setCurvasGestacion(curvas);
        } catch (error: any) {
            console.log('Error cargando curvas de gestación:', error);

            Alert.alert(
                'Error',
                error?.message || 'No se pudieron cargar las curvas.',
            );
        } finally {
            setCargandoCurvas(false);
        }
    };

    const cargarCondicionesCorporales = async () => {
        try {
            setCargandoCondicionesCorporales(true);

            const datos = await consultarCondicionesCorporales();

            const condicionesNormalizadas = Array.isArray(datos)
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
                        (condicion: CondicionCorporalApi) =>
                            condicion.description &&
                            condicion.id &&
                            Number.isFinite(condicion.position),
                    )
                    .sort(
                        (
                            a: CondicionCorporalApi,
                            b: CondicionCorporalApi,
                        ) => a.position - b.position,
                    )
                : [];

            setCondicionesCorporales(condicionesNormalizadas);
        } catch (error: any) {
            console.log(
                'Error cargando condiciones corporales:',
                error,
            );

            Alert.alert(
                'Error',
                error?.message ||
                'No se pudieron cargar las condiciones corporales.',
            );
        } finally {
            setCargandoCondicionesCorporales(false);
        }
    };

    const refrescarDatosGestacion = async (
        curvaSeleccionada?: CurvaGestacionApi,
    ) => {
        const idParaRefrescar = String(
            animal?.animalId ??
            datosGestacion?.animalId ??
            animal?.id ??
            '',
        ).trim();

        if (!idParaRefrescar) {
            console.log('No se puede refrescar gestación: falta animalId');
            return;
        }

        const datosActualizados =
            await consultarGestacionPorIdAnimal(idParaRefrescar);

        const datosConNombreCurva = {
            ...datosActualizados,
            curveName:
                curvaSeleccionada?.name ??
                datosActualizados?.curveName,
            animal: {
                ...(datosActualizados?.animal ?? {}),
                curveName:
                    curvaSeleccionada?.name ??
                    datosActualizados?.animal?.curveName,
            },
        };

        setDatosGestacionLocal(datosConNombreCurva);

        if (curvaSeleccionada?.name) {
            setNombreCurvaApi(curvaSeleccionada.name);
        }
    };

    const guardarCambioCurva = async (curva: CurvaGestacionApi) => {
        if (!pkidAnimalOperacion) {
            Alert.alert(
                'Error',
                'No se encontró el pkid del animal para cambiar la curva.',
            );

            console.log('Datos gestación sin pkid:', datosGestacion);
            return;
        }

        try {
            setGuardandoCambioCurva(true);

            await ejecutarOperacionGestacion({
                op: 'curve',
                key: pkidAnimalOperacion,
                value: curva.id,
            });

            setDlgCurva(false);

            await refrescarDatosGestacion(curva);
        } catch (error: any) {
            console.log('Error cambiando curva de gestación:', error);

            Alert.alert(
                'Error',
                error?.message || 'No se pudo cambiar la curva.',
            );
        } finally {
            setGuardandoCambioCurva(false);
        }
    };

    const guardarCambioCondicionCorporal = async (
        condicion: CondicionCorporalApi,
    ) => {
        if (!pkidAnimalOperacion) {
            Alert.alert(
                'Error',
                'No se encontró el pkid del animal para cambiar la condición corporal.',
            );

            console.log('Datos gestación sin pkid:', datosGestacion);
            return;
        }

        try {
            setGuardandoCondicionCorporal(true);

            await ejecutarOperacionGestacion({
                op: 'bodyCondition',
                key: pkidAnimalOperacion,
                value: String(condicion.id),
            });

            setDlgCondicionCorporal(false);

            await refrescarDatosGestacion();
        } catch (error: any) {
            console.log(
                'Error cambiando condición corporal de gestación:',
                error,
            );

            Alert.alert(
                'Error',
                error?.message ||
                'No se pudo cambiar la condición corporal.',
            );
        } finally {
            setGuardandoCondicionCorporal(false);
        }
    };

    const guardarCambioCorral = async () => {
        const corralDestino = nuevoCorralGestacion.trim();

        setErrorCambioCorral('');

        if (!pkidAnimalOperacion) {
            setErrorCambioCorral(
                'No se encontró el pkid del animal para cambiar el corral.',
            );
            return;
        }

        if (!corralDestino) {
            setErrorCambioCorral(
                'Introduce el corral destino.',
            );
            return;
        }

        const corralNumero = Number(corralDestino);

        if (!Number.isFinite(corralNumero) || corralNumero <= 0) {
            setErrorCambioCorral(
                'Introduce un número de corral válido.',
            );
            return;
        }

        try {
            setGuardandoCambioCorral(true);

            await ejecutarOperacionGestacion({
                op: 'changePen',
                key: pkidAnimalOperacion,
                value: corralDestino,
            });

            setDlgCambioCorral(false);
            setNuevoCorralGestacion('');
            setErrorCambioCorral('');

            await refrescarDatosGestacion();
        } catch (error: any) {
            console.log('Error cambiando corral de gestación:', error);

            const mensajeError = String(error?.message ?? '').toLowerCase();

            if (
                mensajeError.includes('corral not found') ||
                mensajeError.includes('not found')
            ) {
                setErrorCambioCorral(
                    t('gestCorralDetail.penNotFound'),
                );
                return;
            }

            setErrorCambioCorral(
                error?.message ||
                t('gestCorralDetail.changePenGenericError'),
            );
        } finally {
            setGuardandoCambioCorral(false);
        }
    };

    const guardarSustituirCrotal = async () => {
        const crotalNuevo = nuevoCrotalGestacion.trim();

        setErrorSustituirCrotal('');

        if (!pkidAnimalOperacion) {
            setErrorSustituirCrotal(
                'No se encontró el pkid del animal para sustituir el crotal.',
            );
            return;
        }

        if (!crotalNuevo) {
            setErrorSustituirCrotal(
                'Introduce el nuevo crotal.',
            );
            return;
        }

        try {
            setGuardandoSustituirCrotal(true);

            await ejecutarOperacionGestacion({
                op: 'replaceEarTag',
                key: pkidAnimalOperacion,
                value: crotalNuevo,
            });

            setDlgSustituirCrotal(false);
            setNuevoCrotalGestacion('');
            setErrorSustituirCrotal('');

            await refrescarDatosGestacion();
        } catch (error: any) {
            console.log('Error sustituyendo crotal de gestación:', error);

            const mensajeError = String(error?.message ?? '').toLowerCase();

            if (
                mensajeError.includes('crotal asignado a otro animal') ||
                mensajeError.includes('asignado a otro animal') ||
                mensajeError.includes('assigned to another animal')
            ) {
                setErrorSustituirCrotal(
                    t('gestCorralDetail.earTagAlreadyAssigned'),
                );
                return;
            }

            setErrorSustituirCrotal(
                error?.message ||
                t('gestCorralDetail.replaceEarTagGenericError'),
            );
        } finally {
            setGuardandoSustituirCrotal(false);
        }
    };

    const guardarFechaInseminacionGestacion = async () => {
        const fechaSeleccionada = crearFechaSoloDia(fechaInseminacionOperacion);
        const hoy = crearFechaSoloDia();

        if (!pkidAnimalOperacion) {
            Alert.alert(
                'Error',
                'No se encontró el pkid del animal para cambiar la fecha de inseminación.',
            );

            console.log('Datos gestación sin pkid:', datosGestacion);
            return;
        }

        if (fechaSeleccionada > hoy) {
            Alert.alert(
                'Fecha inválida',
                'La fecha de inseminación no puede ser superior a la fecha actual.',
            );
            return;
        }

        try {
            setGuardandoFechaInseminacion(true);

            await ejecutarOperacionGestacion({
                op: 'inseminationDate',
                key: pkidAnimalOperacion,
                value: formatearFechaOperacion(fechaSeleccionada),
            });

            setDlgFechaInseminacion(false);

            await refrescarDatosGestacion();
        } catch (error: any) {
            console.log('Error cambiando fecha de inseminación:', error);

            Alert.alert(
                'Error',
                error?.message || 'No se pudo cambiar la fecha de inseminación.',
            );
        } finally {
            setGuardandoFechaInseminacion(false);
        }
    };

    const guardarSalidaAnimalGestacion = async () => {
        const fechaSeleccionada = crearFechaSoloDia(fechaSalidaAnimal);
        const hoy = crearFechaSoloDia();

        if (!pkidAnimalOperacion) {
            Alert.alert(
                'Error',
                'No se encontró el pkid del animal para realizar la salida.',
            );

            console.log('Datos gestación sin pkid:', datosGestacion);
            return;
        }

        if (fechaSeleccionada > hoy) {
            Alert.alert(
                'Fecha inválida',
                'La fecha de salida no puede ser superior a la fecha actual.',
            );
            return;
        }

        try {
            setGuardandoSalidaAnimal(true);

            await ejecutarOperacionGestacion({
                op: 'changeExit',
                key: pkidAnimalOperacion,
                value: JSON.stringify({
                    type: '0',
                    date: formatearFechaOperacion(fechaSeleccionada),
                }),
            });

            setDlgSalidaAnimal(false);

            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        } catch (error: any) {
            console.log(
                'Error realizando salida de animal de gestación:',
                error,
            );

            Alert.alert(
                'Error',
                error?.message ||
                'No se pudo realizar la salida del animal.',
            );
        } finally {
            setGuardandoSalidaAnimal(false);
        }
    };
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

    const curvaActual = curvasGestacion.find(
        curva =>
            Number(curva.id) === Number(curveIdAnimal) ||
            curva.name.trim().toUpperCase() ===
            String(curvaValor).trim().toUpperCase(),
    );

    const curvaActualId =
        curvaActual?.id ??
        (Number.isFinite(curveIdAnimal) && curveIdAnimal >= 0
            ? curveIdAnimal
            : curvasGestacion[0]?.id ?? -1);

    const correccionValor = textoDato(
        animal?.bodyConditionCorrection ??
        datosGestacion?.bodyConditionCorrection ??
        animal?.correccion ??
        animal?.bodyConditionId,
    );

    const condicionActual = condicionesCorporales.find(
        condicion =>
            String(condicion.id).trim().toUpperCase() ===
            String(correccionValor).trim().toUpperCase() ||
            String(condicion.description).trim().toUpperCase() ===
            String(correccionValor).trim().toUpperCase(),
    );

    const condicionActualId =
        condicionActual?.id ??
        (condicionesCorporales.length > 0
            ? condicionesCorporales[0].id
            : '');

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
            {hasAnimal && (
                <TouchableOpacity
                    onPress={drawer.show}
                    activeOpacity={0.9}
                    style={[
                        styles.operationsFab,
                        {
                            bottom: 18 + insets.bottom,
                        },
                    ]}
                >
                    <Text style={styles.operationsFabText}>
                        {t('gestCorralDetail.operationsButton')}
                    </Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={drawer.open}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => drawer.hide()}
            >
                <Pressable
                    style={styles.drawerBackdrop}
                    onPress={() => drawer.hide()}
                />

                <Animated.View
                    style={[
                        styles.drawerContainer,
                        {
                            width: drawer.width,
                            paddingTop: insets.top + 32,
                            transform: [
                                {
                                    translateX: drawer.translateX,
                                },
                            ],
                        },
                    ]}
                >
                    <DrawerGrabber />

                    <SectionTitle
                        icon="options-outline"
                        title={t('gestCorralDetail.operationsTitle')}
                        subtitle={t('gestCorralDetail.operationsSubtitle')}
                    />

                    <ListGroup>
                        <ListItem
                            icon="calendar-outline"
                            label={t('gestCorralDetail.operationInseminationDate')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setFechaInseminacionOperacion(crearFechaSoloDia());
                                    setDlgFechaInseminacion(true);
                                })
                            }
                            disabled={!hasAnimal}
                        />

                        <Divider />

                        <ListItem
                            icon="pulse-outline"
                            label={t('gestCorralDetail.operationCurve')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setDlgCurva(true);
                                    void cargarCurvasGestacion();
                                })
                            }
                            disabled={!hasAnimal}
                        />

                        <Divider />

                        <ListItem
                            icon="body-outline"
                            label={t('gestCorralDetail.operationBodyCondition')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setDlgCondicionCorporal(true);
                                    void cargarCondicionesCorporales();
                                })
                            }
                            disabled={!hasAnimal}
                        />

                        <Divider />

                        <ListItem
                            icon="home-outline"
                            label={t('gestCorralDetail.operationChangePen')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setNuevoCorralGestacion('');
                                    setErrorCambioCorral('');
                                    setDlgCambioCorral(true);
                                })
                            }
                            disabled={!hasAnimal}
                        />

                        <Divider />

                        <ListItem
                            icon="exit-outline"
                            label={t('gestCorralDetail.operationExitAnimal')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setFechaSalidaAnimal(crearFechaSoloDia());
                                    setDlgSalidaAnimal(true);
                                })
                            }
                            disabled={!hasAnimal}
                        />

                        <Divider />

                        <ListItem
                            icon="pricetags-outline"
                            label={t('gestCorralDetail.operationReplaceEarTag')}
                            onPress={() =>
                                drawer.hide(() => {
                                    setNuevoCrotalGestacion('');
                                    setErrorSustituirCrotal('');
                                    setDlgSustituirCrotal(true);
                                })
                            }
                            disabled={!hasAnimal}
                        />
                    </ListGroup>
                </Animated.View>
            </Modal>
            <CurvaDialog
                visible={dlgCurva}
                title={t('gestCorralDetail.selectCurve')}
                curvas={curvasGestacion}
                currentId={curvaActualId}
                loading={cargandoCurvas || guardandoCambioCurva}
                onClose={() => {
                    if (!guardandoCambioCurva) {
                        setDlgCurva(false);
                    }
                }}
                onAccept={curva => {
                    void guardarCambioCurva(curva);
                }}
            />
            <CondicionCorporalDialog
                visible={dlgCondicionCorporal}
                title={t('gestCorralDetail.selectBodyCondition')}
                condiciones={condicionesCorporales}
                currentId={condicionActualId}
                loading={
                    cargandoCondicionesCorporales ||
                    guardandoCondicionCorporal
                }
                onClose={() => {
                    if (!guardandoCondicionCorporal) {
                        setDlgCondicionCorporal(false);
                    }
                }}
                onAccept={condicion => {
                    void guardarCambioCondicionCorporal(condicion);
                }}
            />
            <CambioCorralDialog
                visible={dlgCambioCorral}
                corralActual={corralValor}
                value={nuevoCorralGestacion}
                loading={guardandoCambioCorral}
                errorMessage={errorCambioCorral}
                onChangeText={texto => {
                    setNuevoCorralGestacion(texto);

                    if (errorCambioCorral) {
                        setErrorCambioCorral('');
                    }
                }}
                onClose={() => {
                    if (!guardandoCambioCorral) {
                        setDlgCambioCorral(false);
                        setErrorCambioCorral('');
                    }
                }}
                onAccept={() => {
                    void guardarCambioCorral();
                }}
            />
            <SustituirCrotalDialog
                visible={dlgSustituirCrotal}
                crotalActual={crotalAnimal}
                value={nuevoCrotalGestacion}
                loading={guardandoSustituirCrotal}
                errorMessage={errorSustituirCrotal}
                onChangeText={texto => {
                    setNuevoCrotalGestacion(texto);

                    if (errorSustituirCrotal) {
                        setErrorSustituirCrotal('');
                    }
                }}
                onClose={() => {
                    if (!guardandoSustituirCrotal) {
                        setDlgSustituirCrotal(false);
                        setErrorSustituirCrotal('');
                    }
                }}
                onAccept={() => {
                    void guardarSustituirCrotal();
                }}
            />
            <FechaInseminacionDialog
                visible={dlgFechaInseminacion}
                fecha={fechaInseminacionOperacion}
                loading={guardandoFechaInseminacion}
                onRestarDia={() => {
                    setFechaInseminacionOperacion(fechaActual =>
                        sumarDiasOperacion(fechaActual, -1),
                    );
                }}
                onSumarDia={() => {
                    setFechaInseminacionOperacion(fechaActual => {
                        const hoy = crearFechaSoloDia();
                        const nuevaFecha = sumarDiasOperacion(fechaActual, 1);

                        return nuevaFecha > hoy ? hoy : nuevaFecha;
                    });
                }}
                onClose={() => {
                    if (!guardandoFechaInseminacion) {
                        setDlgFechaInseminacion(false);
                    }
                }}
                onAccept={() => {
                    void guardarFechaInseminacionGestacion();
                }}
            />
            <SalidaAnimalGestacionDialog
                visible={dlgSalidaAnimal}
                fecha={fechaSalidaAnimal}
                loading={guardandoSalidaAnimal}
                onRestarDia={() => {
                    setFechaSalidaAnimal(fechaActual =>
                        sumarDiasOperacion(fechaActual, -1),
                    );
                }}
                onSumarDia={() => {
                    setFechaSalidaAnimal(fechaActual => {
                        const hoy = crearFechaSoloDia();
                        const nuevaFecha = sumarDiasOperacion(fechaActual, 1);

                        return nuevaFecha > hoy ? hoy : nuevaFecha;
                    });
                }}
                onClose={() => {
                    if (!guardandoSalidaAnimal) {
                        setDlgSalidaAnimal(false);
                    }
                }}
                onAccept={() => {
                    void guardarSalidaAnimalGestacion();
                }}
            />
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
    operationsFab: {
        position: 'absolute',
        right: 18,
        minWidth: 160,
        height: 58,
        paddingHorizontal: 22,
        borderRadius: 24,
        backgroundColor: BRAND,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        shadowColor: '#000000',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5,
        },
    },

    operationsFabText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 17,
        textAlign: 'center',
    },

    drawerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },

    drawerContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: {
            width: 0,
            height: 6,
        },
    },

    drawerGrabberContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },

    drawerGrabber: {
        width: 42,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#CBD5E1',
    },

    drawerSectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        backgroundColor: '#EEF2FF',
        marginBottom: 10,
    },

    drawerSectionIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    drawerSectionTitleText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '900',
    },

    drawerSectionSubtitle: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 1,
    },

    drawerListGroup: {
        borderWidth: 1,
        borderColor: CARD_BORDER,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },

    drawerListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        minHeight: 50,
    },

    drawerListItemDisabled: {
        opacity: 0.45,
    },

    drawerListItemText: {
        marginLeft: 10,
        color: '#0F172A',
        fontWeight: '800',
        flex: 1,
    },

    drawerListItemTextDisabled: {
        color: '#94A3B8',
    },

    drawerDivider: {
        height: 1,
        backgroundColor: CARD_BORDER,
    },
});