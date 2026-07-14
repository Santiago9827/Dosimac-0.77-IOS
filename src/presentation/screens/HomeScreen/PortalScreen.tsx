import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuthStore } from '../../../stores/authStore';
import { obtenerBaseUrlGuardada } from '../../../stores/ipConfig';

const TIMEOUT_PORTAL_INICIAL_MS = 1500;
const TIMEOUT_PORTAL_REINTENTO_MS = 5000;
const TIMEOUT_NAVEGACION_WEBVIEW_MS = 4000;

function construirUrlPortalDesdeApi(baseUrl: string, token: string) {
    const valor = baseUrl.trim();

    const match = valor.match(/^(https?):\/\/([^/:]+)(?::\d+)?/i);

    if (!match) {
        throw new Error('URL base no válida');
    }

    const protocolo = match[1];
    const host = match[2];

    const tokenSeguro = encodeURIComponent(token);

    return `${protocolo}://${host}:8080/CtiAlimentacion/login.xhtml?type=espada&token=${tokenSeguro}`;
}

async function comprobarPortalConTimeout(
    url: string,
    timeoutMs = TIMEOUT_PORTAL_INICIAL_MS
) {
    const controlador = new AbortController();

    const timeout = setTimeout(() => {
        controlador.abort();
    }, timeoutMs);

    try {
        const respuesta = await fetch(url, {
            method: 'GET',
            signal: controlador.signal,
        });

        clearTimeout(timeout);

        return {
            ok: respuesta.ok,
            status: respuesta.status,
            timeout: false,
        };
    } catch (error: any) {
        clearTimeout(timeout);

        if (error?.name === 'AbortError') {
            return {
                ok: false,
                status: 0,
                timeout: true,
            };
        }

        return {
            ok: false,
            status: 0,
            timeout: false,
        };
    }
}

export const PortalScreen = () => {
    const token = useAuthStore((s) => s.token);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    const [urlPortal, setUrlPortal] = useState<string | null>(null);
    const [preparandoUrl, setPreparandoUrl] = useState(true);
    const [comprobandoPortal, setComprobandoPortal] = useState(false);
    const [portalDisponible, setPortalDisponible] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [errorPortal, setErrorPortal] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const webViewRef = useRef<WebView | null>(null);
    const timeoutNavegacionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const navegandoRef = useRef(false);

    const limpiarTimeoutNavegacion = () => {
        if (timeoutNavegacionRef.current) {
            clearTimeout(timeoutNavegacionRef.current);
            timeoutNavegacionRef.current = null;
        }
    };

    const iniciarTimeoutNavegacion = () => {
        limpiarTimeoutNavegacion();
        navegandoRef.current = true;

        timeoutNavegacionRef.current = setTimeout(() => {
            if (!navegandoRef.current) return;

            webViewRef.current?.stopLoading();
            setErrorPortal('La conexión con CTIFEED ha tardado demasiado.');
        }, TIMEOUT_NAVEGACION_WEBVIEW_MS);
    };

    const finalizarNavegacion = () => {
        navegandoRef.current = false;
        limpiarTimeoutNavegacion();
    };

    useEffect(() => {
        return () => {
            limpiarTimeoutNavegacion();
        };
    }, []);

    useEffect(() => {
        const prepararUrl = async () => {
            try {
                setPreparandoUrl(true);
                setError(null);
                setErrorPortal(null);
                setPortalDisponible(false);

                if (!isHydrated) return;

                if (!token) {
                    setError('No hay sesión iniciada. Revisa el usuario y la clave de la instalación.');
                    return;
                }

                const baseUrlGuardada = await obtenerBaseUrlGuardada();

                if (!baseUrlGuardada) {
                    setError('No hay una IP configurada. Ve a instalaciones y selecciona una.');
                    return;
                }

                const urlFinal = construirUrlPortalDesdeApi(baseUrlGuardada, token);

                console.log('CTIFEED baseUrlGuardada:', baseUrlGuardada);
                console.log('CTIFEED urlFinal:', urlFinal);

                setUrlPortal(urlFinal);
                setPortalDisponible(false);
                setErrorPortal(null);
                setReloadKey((prev) => prev + 1);
            } catch (e: any) {
                console.log('Error preparando URL CTIFEED:', e);
                setError('No se pudo preparar la URL del portal.');
            } finally {
                setPreparandoUrl(false);
            }
        };

        prepararUrl();
    }, [token, isHydrated]);

    useEffect(() => {
        const validarPortal = async () => {
            if (!urlPortal) return;

            try {
                setComprobandoPortal(true);
                setErrorPortal(null);
                setPortalDisponible(false);

                const timeoutActual =
                    reloadKey <= 1
                        ? TIMEOUT_PORTAL_INICIAL_MS
                        : TIMEOUT_PORTAL_REINTENTO_MS;

                const resultado = await comprobarPortalConTimeout(urlPortal, timeoutActual);

                if (resultado.ok || resultado.status === 200 || resultado.status === 302) {
                    setPortalDisponible(true);
                    return;
                }

                if (resultado.timeout) {
                    setErrorPortal('La conexión con CTIFEED ha tardado demasiado.');
                    return;
                }

                if (resultado.status > 0) {
                    setErrorPortal(`CTIFEED respondió con error HTTP ${resultado.status}.`);
                    return;
                }

                setErrorPortal('No se puede conectar con CTIFEED.');
            } finally {
                setComprobandoPortal(false);
            }
        };

        validarPortal();
    }, [urlPortal, reloadKey]);

    if (!isHydrated || preparandoUrl) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Preparando CTIFEED...</Text>
            </View>
        );
    }

    if (!urlPortal) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>No se puede abrir CTIFEED</Text>
                <Text style={styles.errorText}>
                    {error ?? 'No se pudo cargar el portal.'}
                </Text>
            </View>
        );
    }

    if (comprobandoPortal) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>
                    Comprobando conexión con CTIFEED...
                </Text>
            </View>
        );
    }

    const mostrarPantallaErrorCompleta = !!errorPortal && !portalDisponible;
    const mostrarOverlayError = !!errorPortal && portalDisponible;

    if (mostrarPantallaErrorCompleta) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="cloud-offline-outline"
                            size={34}
                            color="#6B7280"
                        />
                    </View>

                    <Text style={styles.errorTitle}>
                        Sin conexión
                    </Text>

                    <Text style={styles.errorText}>
                        {errorPortal}
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={styles.retryButton}
                        onPress={() => {
                            finalizarNavegacion();
                            setErrorPortal(null);
                            setPortalDisponible(false);
                            setReloadKey((prev) => prev + 1);
                        }}
                    >
                        <Text style={styles.retryButtonText}>
                            Reintentar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!portalDisponible) {
        return null;
    }

    return (
        <View style={styles.container}>
            <WebView
                key={`${token}-${urlPortal}-${reloadKey}`}
                ref={webViewRef}
                source={{ uri: urlPortal }}
                incognito
                cacheEnabled={false}
                sharedCookiesEnabled={false}
                thirdPartyCookiesEnabled={false}
                onShouldStartLoadWithRequest={() => {
                    setErrorPortal(null);
                    iniciarTimeoutNavegacion();
                    return true;
                }}
                onLoadStart={() => {
                    setErrorPortal(null);
                    iniciarTimeoutNavegacion();
                }}
                onLoadEnd={() => {
                    finalizarNavegacion();
                }}
                onNavigationStateChange={(estado) => {
                    if (estado.loading) {
                        iniciarTimeoutNavegacion();
                    } else {
                        finalizarNavegacion();
                    }
                }}
                onError={() => {
                    finalizarNavegacion();
                    setErrorPortal('No se puede conectar con CTIFEED.');
                }}
                onHttpError={(e) => {
                    finalizarNavegacion();
                    setErrorPortal(
                        `CTIFEED respondió con error HTTP ${e.nativeEvent.statusCode}.`
                    );
                }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.loadingText}>Cargando CTIFEED...</Text>
                    </View>
                )}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
            />

            {mostrarOverlayError && (
                <View style={styles.overlayError}>
                    <View style={styles.errorCard}>
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name="cloud-offline-outline"
                                size={34}
                                color="#6B7280"
                            />
                        </View>

                        <Text style={styles.errorTitle}>
                            Sin conexión
                        </Text>

                        <Text style={styles.errorText}>
                            {errorPortal}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.retryButton}
                            onPress={() => {
                                finalizarNavegacion();
                                setErrorPortal(null);
                                setPortalDisponible(false);
                                setReloadKey((prev) => prev + 1);
                            }}
                        >
                            <Text style={styles.retryButtonText}>
                                Reintentar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
    },

    loadingText: {
        marginTop: 10,
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#F8FAFC',
    },

    errorCard: {
        width: '100%',
        maxWidth: 430,
        alignItems: 'center',
    },

    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },

    errorTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 14,
    },

    errorText: {
        color: '#4B5563',
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
        fontWeight: '600',
    },

    retryButton: {
        marginTop: 28,
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
    },

    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 17,
    },

    overlayError: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
});