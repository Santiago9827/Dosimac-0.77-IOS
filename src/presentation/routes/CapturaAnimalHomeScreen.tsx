import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { consultarNumeroPiensosMaternidad } from '../../stores/apiApp';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useApiMovilVersionStore } from '../../stores/useApiMovilVersionStore';
import { obtenerBaseUrlGuardada } from '../../stores/ipConfig';

const MORADO = '#4C1D95';
const TEXTO = '#0F172A';
const TEXTO_SECUNDARIO = '#64748B';
const FONDO = '#F6F8FC';

function TarjetaFuncionalidad({
  titulo,
  descripcion,
  icono,
  color,
  fondoIcono,
  onPress,
}: {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  fondoIcono: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOpacity: 0.07,
        shadowRadius: 4,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      }}
    >
      <View
        style={{
          height: 5,
          backgroundColor: color,
        }}
      />

      <View
        style={{
          paddingVertical: 18,
          paddingHorizontal: 18,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: fondoIcono,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons
            name={icono as any}
            size={27}
            color={color}
          />
        </View>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '900',
            color: TEXTO,
            textAlign: 'center',
            marginBottom: 5,
          }}
        >
          {titulo}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: TEXTO_SECUNDARIO,
            textAlign: 'center',
            lineHeight: 18,
            fontWeight: '600',
          }}
        >
          {descripcion}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const CapturaAnimalHomeScreen = ({ navigation }: any) => {
  const { t } = useTranslation();

  const rol = useAuthStore((s) => s.rol ?? []);
  const esAdmin = rol.includes('admin');

  const consultarVersionApiMovil = useApiMovilVersionStore(
    s => s.consultarVersionApiMovil,
  );

  const limpiarVersionActual = useApiMovilVersionStore(
    s => s.limpiarVersionActual,
  );

  const compatibleActual = useApiMovilVersionStore(
    s => s.compatibleActual,
  );

  const versionComprobada = useApiMovilVersionStore(
    s => s.versionComprobada,
  );

  const errorVersion = useApiMovilVersionStore(
    s => s.errorVersion,
  );

  const [numeroPiensosMaternidad, setNumeroPiensosMaternidad] =
    useState<number | null>(null);

  const [modalPermisoVisible, setModalPermisoVisible] =
    useState(false);

  const [modalVersionVisible, setModalVersionVisible] =
    useState(false);

  const mostrarAvisoServidorDesactualizado =
    versionComprobada &&
    !compatibleActual;

  const cargarNumeroPiensosMaternidad = useCallback(async () => {
    try {
      const numero = await consultarNumeroPiensosMaternidad();

      console.log('Número piensos maternidad:', numero);

      setNumeroPiensosMaternidad(numero);
    } catch (error) {
      console.log('No se pudo consultar el número de piensos:', error);

      setNumeroPiensosMaternidad(null);
    }
  }, []);

  const comprobarVersionServidor = useCallback(async () => {
    const baseUrlGuardada = await obtenerBaseUrlGuardada();

    if (!baseUrlGuardada) {
      limpiarVersionActual();
      return;
    }

    await consultarVersionApiMovil();
  }, [consultarVersionApiMovil, limpiarVersionActual]);
  useFocusEffect(
    useCallback(() => {
      cargarNumeroPiensosMaternidad();
      comprobarVersionServidor();
    }, [cargarNumeroPiensosMaternidad, comprobarVersionServidor]),
  );
  const bloquearSiNoEsAdmin = () => {
    if (!esAdmin) {
      setModalPermisoVisible(true);
      return true;
    }

    return false;
  };
  const bloquearSiVersionNoCompatible = async () => {
    const infoVersion = await consultarVersionApiMovil();

    if (!infoVersion.compatible) {
      setModalVersionVisible(true);
      return true;
    }

    return false;
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: FONDO,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 22,
          paddingBottom: 100,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 390,
            alignSelf: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: TEXTO_SECUNDARIO,
              textAlign: 'center',
              marginBottom: 16,
              fontWeight: '700',
            }}
          >
            {t('capturaAnimalHome.selectOption')}
          </Text>

          {mostrarAvisoServidorDesactualizado && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setModalVersionVisible(true)}
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#FECACA',
                paddingHorizontal: 15,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14,
                shadowColor: '#991B1B',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color="#DC2626"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: '#7F1D1D',
                    fontSize: 13,
                    fontWeight: '700',
                    lineHeight: 18,
                  }}
                >
                  {errorVersion ||
                    t('capturaAnimalHome.serverOutdatedText', {
                      defaultValue:
                        'Esta funcionalidad no es soportada por la versión actual del servidor CTIFEED. Actualice para el uso de esta aplicación.',
                    })}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TarjetaFuncionalidad
            titulo={t('capturaAnimalHome.unfedAnimalsTitle')}
            descripcion={t('capturaAnimalHome.unfedAnimalsDescription')}
            icono="alert-circle-outline"
            color="#EA580C"
            fondoIcono="#FFEDD5"
            onPress={async () => {
              if (await bloquearSiVersionNoCompatible()) return;

              navigation.navigate('AnimalesNoAlimentados');
            }}
          />

          <TarjetaFuncionalidad
            titulo={t('capturaAnimalHome.animalStatusTitle')}
            descripcion={t('capturaAnimalHome.animalStatusDescription')}
            icono="pulse-outline"
            color="#BE123C"
            fondoIcono="#FFE4E6"
            onPress={async () => {
              if (await bloquearSiVersionNoCompatible()) return;

              navigation.navigate('EstadoAnimal');
            }}
          />

          {numeroPiensosMaternidad === 2 ? (
            <TarjetaFuncionalidad
              titulo={t('capturaAnimalHome.twoFeedsTitle')}
              descripcion={t('capturaAnimalHome.twoFeedsDescription')}
              icono="funnel-outline"
              color="#7C3AED"
              fondoIcono="#F3E8FF"
              onPress={async () => {
                if (await bloquearSiVersionNoCompatible()) return;

                navigation.navigate('CambioPiensoMaternidad');
              }}
            />
          ) : null}

          <TarjetaFuncionalidad
            titulo={t('capturaAnimalHome.birthCaptureTitle')}
            descripcion={t('capturaAnimalHome.birthCaptureDescription')}
            icono="clipboard-outline"
            color="#0F766E"
            fondoIcono="#DDF3EF"
            onPress={async () => {
              if (await bloquearSiVersionNoCompatible()) return;

              if (bloquearSiNoEsAdmin()) return;

              navigation.navigate('CapturaDatosMaternidad');
            }}
          />

          <View
            style={{
              marginTop: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="paw-outline"
              size={22}
              color={MORADO}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalPermisoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPermisoVisible(false)}
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
              borderRadius: 24,
              padding: 22,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={28}
                  color={MORADO}
                />
              </View>

              <Text
                style={{
                  fontSize: 23,
                  fontWeight: '900',
                  color: TEXTO,
                  textAlign: 'center',
                }}
              >
                {t('capturaAnimalHome.modalReadOnlyTitle', {
                  defaultValue: 'Permiso solo lectura',
                })}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                color: TEXTO_SECUNDARIO,
                textAlign: 'center',
                lineHeight: 23,
                marginBottom: 22,
                fontWeight: '600',
              }}
            >
              {t('capturaAnimalHome.modalReadOnlyText', {
                defaultValue:
                  'Tu usuario no tiene permisos de administrador para acceder a esta funcionalidad.',
              })}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setModalPermisoVisible(false)}
              style={{
                height: 44,
                borderRadius: 14,
                backgroundColor: MORADO,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '900',
                }}
              >
                {t('capturaAnimalHome.accept', {
                  defaultValue: 'Aceptar',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={modalVersionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVersionVisible(false)}
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
              borderRadius: 24,
              padding: 22,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 5 },
            }}
          >
            <View
              style={{
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="warning-outline"
                  size={28}
                  color="#DC2626"
                />
              </View>

              <Text
                style={{
                  fontSize: 23,
                  fontWeight: '900',
                  color: TEXTO,
                  textAlign: 'center',
                }}
              >
                {t('capturaAnimalHome.serverOutdatedTitle', {
                  defaultValue: 'Servidor CTIFEED desactualizado',
                })}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                color: TEXTO_SECUNDARIO,
                textAlign: 'center',
                lineHeight: 23,
                marginBottom: 22,
                fontWeight: '600',
              }}
            >
              {errorVersion ||
                t('capturaAnimalHome.serverOutdatedText', {
                  defaultValue:
                    'Esta funcionalidad no es soportada por la versión actual del servidor CTIFEED. Actualice para el uso de esta aplicación.',
                })}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setModalVersionVisible(false)}
              style={{
                height: 44,
                borderRadius: 14,
                backgroundColor: '#DC2626',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: '900',
                }}
              >
                {t('capturaAnimalHome.accept', {
                  defaultValue: 'Aceptar',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};