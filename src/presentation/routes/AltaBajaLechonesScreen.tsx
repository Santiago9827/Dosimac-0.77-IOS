import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { construirEndpointAppV1 } from '../../stores/apiApp';

const BG = '#F5F7FB';
const CARD = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const MUTED_DARK = '#475569';

const VERDE = '#16A34A';
const VERDE_SOFT = '#ECFDF5';
const ROJO = '#DC2626';
const ROJO_SOFT = '#FEF2F2';
const AZUL = '#2563EB';
const MORADO = '#7C3AED';
const CYAN = '#0891B2';

type ModoFormulario = 'alta' | 'baja';

type AltaBajaParams = {
  corral?: string;
  id?: string;
  tipoBusqueda?: 'corral' | 'id';
  datosMaternidad?: any;
};

type BajaOtrosItem = {
  uid: string;
  descripcion: string;
  lechones: number;
};

const MOTIVOS_BAJA = [
  'Aplastamiento',
  'Diarrea',
  'Baja viabilidad',
  'Deformidades',
  'Otros',
];

const formatearFechaHoy = () => {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();

  return `${dia}/${mes}/${anio}`;
};

const formatearFechaApi = () => {
  const hoy = new Date();

  const fechaUtc = new Date(
    Date.UTC(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate(),
      0,
      0,
      0,
    ),
  );

  return fechaUtc.toISOString().replace('.000Z', 'Z');
};

const obtenerPkidAnimal = (datos: any) => {
  const pkid = Number(datos?.animal?.id ?? datos?.id ?? 0);

  return Number.isFinite(pkid) && pkid > 0 ? pkid : null;
};

const obtenerMensajeBackend = (
  texto: string,
  status: number,
  mensajePorDefecto: string,
) => {
  if (!texto || texto.trim() === '') {
    return `${mensajePorDefecto} (${status})`;
  }

  try {
    const datos = JSON.parse(texto);

    if (typeof datos === 'string') {
      return datos;
    }

    const mensaje =
      datos?.message ??
      datos?.mensaje ??
      datos?.error ??
      datos?.detail ??
      datos?.title;

    if (mensaje) {
      return String(mensaje);
    }

    return texto;
  } catch {
    return texto;
  }
};

export const AltaBajaLechonesScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();

  const params = (route.params ?? {}) as AltaBajaParams;

  const animalApi = params.datosMaternidad?.animal ?? {};
  const pkidMadre = obtenerPkidAnimal(params.datosMaternidad);

  const corral =
    animalApi?.corralName !== null &&
    animalApi?.corralName !== undefined &&
    String(animalApi.corralName).trim() !== ''
      ? String(animalApi.corralName)
      : params.corral && String(params.corral).trim() !== ''
        ? String(params.corral)
        : '—';

  const idAnimal =
    animalApi?.animalId !== null &&
    animalApi?.animalId !== undefined &&
    String(animalApi.animalId).trim() !== ''
      ? String(animalApi.animalId)
      : params.id && String(params.id).trim() !== ''
        ? String(params.id)
        : '—';

  const fechaHoy = useMemo(() => formatearFechaHoy(), []);

  const [modo, setModo] = useState<ModoFormulario>('alta');

  const [idMadreDonante, setIdMadreDonante] = useState('');
  const [totalLechones, setTotalLechones] = useState('');

  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [contadorBajaPorMotivo, setContadorBajaPorMotivo] = useState<
    Record<string, number>
  >({});

  const [bajasOtros, setBajasOtros] = useState<BajaOtrosItem[]>([]);
  const [modalOtrosVisible, setModalOtrosVisible] = useState(false);
  const [detalleOtrosTemporal, setDetalleOtrosTemporal] = useState('');
  const [lechonesOtrosTemporal, setLechonesOtrosTemporal] = useState('1');
  const [otrosEditandoUid, setOtrosEditandoUid] = useState<string | null>(
    null,
  );

  const [guardando, setGuardando] = useState(false);

  const [modalAvisoVisible, setModalAvisoVisible] = useState(false);
  const [modalAvisoTitulo, setModalAvisoTitulo] = useState('');
  const [modalAvisoMensaje, setModalAvisoMensaje] = useState('');

  const esAlta = modo === 'alta';
  const colorPrincipal = esAlta ? VERDE : ROJO;
  const colorSuave = esAlta ? VERDE_SOFT : ROJO_SOFT;

  const mostrarModalAviso = (titulo: string, mensaje: string) => {
    setModalAvisoTitulo(titulo);
    setModalAvisoMensaje(mensaje);
    setModalAvisoVisible(true);
  };

  const traducirMotivoBaja = (motivo: string) => {
    const mapa: Record<string, string> = {
      Aplastamiento: t('altaBajaLechones.reasonCrushing', {
        defaultValue: 'Aplastamiento',
      }),
      Diarrea: t('altaBajaLechones.reasonDiarrhea', {
        defaultValue: 'Diarrea',
      }),
      'Baja viabilidad': t('altaBajaLechones.reasonLowViability', {
        defaultValue: 'Baja viabilidad',
      }),
      Deformidades: t('altaBajaLechones.reasonDeformities', {
        defaultValue: 'Deformidades',
      }),
      Otros: t('altaBajaLechones.reasonOther', {
        defaultValue: 'Otros',
      }),
    };

    return mapa[motivo] ?? motivo;
  };

  const obtenerContadorMotivo = (motivo: string) => {
    if (motivo === 'Otros') {
      return bajasOtros.reduce((total, item) => total + item.lechones, 0);
    }

    return contadorBajaPorMotivo[motivo] ?? 0;
  };

  const cambiarModo = (nuevoModo: ModoFormulario) => {
    setModo(nuevoModo);

    if (nuevoModo === 'alta') {
      setMotivoSeleccionado('');
      setContadorBajaPorMotivo({});
      setBajasOtros([]);
      return;
    }

    setIdMadreDonante('');
    setTotalLechones('');
  };

  const cambiarContadorMotivo = (motivo: string, cambio: number) => {
    setMotivoSeleccionado(motivo);

    if (motivo === 'Otros') {
      if (cambio > 0) {
        abrirModalOtrosNuevo();
        return;
      }

      setBajasOtros(prev => prev.slice(0, -1));
      return;
    }

    setContadorBajaPorMotivo(prev => {
      const actual = prev[motivo] ?? 0;
      const siguiente = Math.max(0, actual + cambio);

      const nuevo = {
        ...prev,
        [motivo]: siguiente,
      };

      if (siguiente === 0) {
        delete nuevo[motivo];
      }

      return nuevo;
    });
  };

  const abrirModalOtrosNuevo = () => {
    setMotivoSeleccionado('Otros');
    setOtrosEditandoUid(null);
    setDetalleOtrosTemporal('');
    setLechonesOtrosTemporal('1');
    setModalOtrosVisible(true);
  };

  const abrirModalOtrosEditar = (item: BajaOtrosItem) => {
    setMotivoSeleccionado('Otros');
    setOtrosEditandoUid(item.uid);
    setDetalleOtrosTemporal(item.descripcion);
    setLechonesOtrosTemporal(String(item.lechones));
    setModalOtrosVisible(true);
  };

  const cancelarModalOtros = () => {
    setModalOtrosVisible(false);
    setOtrosEditandoUid(null);
    setDetalleOtrosTemporal('');
    setLechonesOtrosTemporal('1');
  };

  const aceptarModalOtros = () => {
    const descripcion = detalleOtrosTemporal.trim();
    const lechones = Number(lechonesOtrosTemporal.trim());

    if (!descripcion) {
      mostrarModalAviso(
        t('altaBajaLechones.missingDescriptionTitle', {
          defaultValue: 'Descripción obligatoria',
        }),
        t('altaBajaLechones.missingDescriptionText', {
          defaultValue: 'Introduce la descripción del motivo.',
        }),
      );
      return;
    }

    if (!Number.isFinite(lechones) || lechones <= 0) {
      mostrarModalAviso(
        t('altaBajaLechones.invalidQuantityTitle', {
          defaultValue: 'Cantidad no válida',
        }),
        t('altaBajaLechones.invalidPigletQuantity', {
          defaultValue: 'Introduce una cantidad válida de lechones.',
        }),
      );
      return;
    }

    if (otrosEditandoUid) {
      setBajasOtros(prev =>
        prev.map(item =>
          item.uid === otrosEditandoUid
            ? {
                ...item,
                descripcion,
                lechones,
              }
            : item,
        ),
      );
    } else {
      setBajasOtros(prev => [
        ...prev,
        {
          uid: `${Date.now()}-${Math.random()}`,
          descripcion,
          lechones,
        },
      ]);
    }

    cancelarModalOtros();
  };

  const eliminarOtrosItem = (uid: string) => {
    setBajasOtros(prev => prev.filter(item => item.uid !== uid));
  };

  const enviarAltaBaja = async (payload: any) => {
    const endpoint = await construirEndpointAppV1(
      'maternity/altaBajaLechones',
    );

    console.log('POST alta/baja lechones:', endpoint);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const respuesta = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const texto = await respuesta.text();

    console.log('Respuesta alta/baja:', respuesta.status, texto);

    if (!respuesta.ok) {
      throw new Error(
        obtenerMensajeBackend(
          texto,
          respuesta.status,
          t('altaBajaLechones.saveError', {
            defaultValue: 'No se pudo guardar la operación.',
          }),
        ),
      );
    }

    return texto;
  };

  const aceptarFormulario = async () => {
    if (guardando) {
      return;
    }

    if (!pkidMadre) {
      mostrarModalAviso(
        t('altaBajaLechones.error', {
          defaultValue: 'Error',
        }),
        t('altaBajaLechones.selectedAnimalPkidNotFound', {
          defaultValue:
            'No se encontró el identificador interno del animal seleccionado.',
        }),
      );
      return;
    }

    if (modo === 'alta') {
      const donante = idMadreDonante.trim();
      const total = totalLechones.trim();

      if (!total) {
        mostrarModalAviso(
          t('altaBajaLechones.missingData', {
            defaultValue: 'Faltan datos',
          }),
          t('altaBajaLechones.enterTransferredPiglets', {
            defaultValue: 'Introduce el número de lechones transferidos.',
          }),
        );
        return;
      }

      const totalNumero = Number(total);

      if (!Number.isFinite(totalNumero) || totalNumero <= 0) {
        mostrarModalAviso(
          t('altaBajaLechones.invalidTotalTitle', {
            defaultValue: 'Total no válido',
          }),
          t('altaBajaLechones.invalidPigletsNumber', {
            defaultValue: 'Introduce un número válido de lechones.',
          }),
        );
        return;
      }

      const payload = {
        pkid: pkidMadre,
        tipo: 'ADOPCIÓN',
        opcion: donante,
        descripcion: '',
        lechones: totalNumero,
        fecha: formatearFechaApi(),
      };

      try {
        Keyboard.dismiss();
        setGuardando(true);

        await enviarAltaBaja(payload);

        mostrarModalAviso(
          t('altaBajaLechones.adoptionSavedTitle', {
            defaultValue: 'Alta guardada',
          }),
          t('altaBajaLechones.adoptionSavedMessage', {
            count: totalNumero,
            defaultValue: `Se han registrado ${totalNumero} lechones correctamente.`,
          }),
        );

        setIdMadreDonante('');
        setTotalLechones('');
      } catch (error: any) {
        console.log('Error guardando alta:', error);

        mostrarModalAviso(
          t('altaBajaLechones.saveError', {
            defaultValue: 'Error al guardar',
          }),
          error?.message ??
            t('altaBajaLechones.saveErrorText', {
              defaultValue: 'No se pudo guardar la operación.',
            }),
        );
      } finally {
        setGuardando(false);
      }

      return;
    }

    const bajasNormales = Object.entries(contadorBajaPorMotivo)
      .filter(([motivo, cantidad]) => motivo !== 'Otros' && cantidad > 0)
      .map(([motivo, cantidad]) => ({
        opcion: motivo,
        descripcion: '',
        lechones: cantidad,
      }));

    const bajasOtrosPayload = bajasOtros
      .filter(
        item => item.lechones > 0 && item.descripcion.trim().length > 0,
      )
      .map(item => ({
        opcion: 'Otros',
        descripcion: item.descripcion.trim(),
        lechones: item.lechones,
      }));

    const bajasAEnviar = [...bajasNormales, ...bajasOtrosPayload];

    if (bajasAEnviar.length === 0) {
      mostrarModalAviso(
        t('altaBajaLechones.missingData', {
          defaultValue: 'Faltan datos',
        }),
        t('altaBajaLechones.selectReasonRequired', {
          defaultValue: 'Selecciona al menos un motivo de baja.',
        }),
      );
      return;
    }

    const payloadsBaja = bajasAEnviar.map(baja => ({
      pkid: pkidMadre,
      tipo: 'BAJA',
      opcion: baja.opcion,
      descripcion: baja.descripcion,
      lechones: baja.lechones,
      fecha: formatearFechaApi(),
    }));

    try {
      Keyboard.dismiss();
      setGuardando(true);

      for (const payload of payloadsBaja) {
        try {
          await enviarAltaBaja(payload);
        } catch (error: any) {
          throw new Error(
            `${traducirMotivoBaja(payload.opcion)}: ${
              error?.message ??
              t('altaBajaLechones.saveErrorText', {
                defaultValue: 'No se pudo guardar la operación.',
              })
            }`,
          );
        }
      }

      const totalLechonesBaja = bajasAEnviar.reduce(
        (total, baja) => total + baja.lechones,
        0,
      );

      mostrarModalAviso(
        t('altaBajaLechones.bajasSavedTitle', {
          defaultValue: 'Bajas guardadas',
        }),
        t('altaBajaLechones.bajasSavedMessage', {
          piglets: totalLechonesBaja,
          reasons: bajasAEnviar.length,
          defaultValue: `Se han registrado ${totalLechonesBaja} bajas correctamente.`,
        }),
      );

      setMotivoSeleccionado('');
      setContadorBajaPorMotivo({});
      setBajasOtros([]);
    } catch (error: any) {
      console.log('Error guardando bajas:', error);

      mostrarModalAviso(
        t('altaBajaLechones.saveError', {
          defaultValue: 'Error al guardar',
        }),
        error?.message ??
          t('altaBajaLechones.saveErrorText', {
            defaultValue: 'No se pudo guardar la operación.',
          }),
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>
              {t('altaBajaLechones.heroTitle', {
                defaultValue: 'Movimiento de lechones',
              })}
            </Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: colorSuave,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: colorPrincipal,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: colorPrincipal,
                  },
                ]}
              >
                {esAlta
                  ? t('altaBajaLechones.statusAlta', {
                      defaultValue: 'Alta',
                    })
                  : t('altaBajaLechones.statusBaja', {
                      defaultValue: 'Baja',
                    })}
              </Text>
            </View>
          </View>

          <View style={styles.infoCompactCard}>
            <InfoCompacto
              icono="home-outline"
              label={t('altaBajaLechones.corralUpper', {
                defaultValue: 'CORRAL',
              })}
              value={corral}
              color={AZUL}
              fondo="#EFF6FF"
            />

            <View style={styles.infoCompactDivider} />

            <InfoCompacto
              icono="finger-print-outline"
              label={t('altaBajaLechones.idUpper', {
                defaultValue: 'ID',
              })}
              value={idAnimal}
              color={MORADO}
              fondo="#F3E8FF"
            />

            <View style={styles.infoCompactDivider} />

            <InfoCompacto
              icono="calendar-outline"
              label={t('altaBajaLechones.dateUpper', {
                defaultValue: 'FECHA',
              })}
              value={fechaHoy}
              color={CYAN}
              fondo="#ECFEFF"
              small
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('altaBajaLechones.movementType', {
              defaultValue: 'Tipo de movimiento',
            })}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {t('altaBajaLechones.movementSubtitle', {
              defaultValue: 'Selecciona si quieres registrar alta o baja.',
            })}
          </Text>

          <View style={styles.segmentContainer}>
            <SegmentButton
              title={t('altaBajaLechones.adoption', {
                defaultValue: 'Adopción',
              })}
              icono="add-circle-outline"
              selected={modo === 'alta'}
              color={VERDE}
              softColor={VERDE_SOFT}
              onPress={() => cambiarModo('alta')}
            />

            <SegmentButton
              title={t('altaBajaLechones.baja', {
                defaultValue: 'Baja',
              })}
              icono="remove-circle-outline"
              selected={modo === 'baja'}
              color={ROJO}
              softColor={ROJO_SOFT}
              onPress={() => cambiarModo('baja')}
            />
          </View>
        </View>

        {modo === 'alta' ? (
          <View style={styles.card}>
            <View style={styles.formHeader}>
              <View
                style={[
                  styles.formIconBox,
                  {
                    backgroundColor: VERDE_SOFT,
                  },
                ]}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color={VERDE}
                />
              </View>

              <Text style={styles.formTitle}>
                {t('altaBajaLechones.adoptionData', {
                  defaultValue: 'Datos de adopción',
                })}
              </Text>
            </View>

            <CampoFormulario
              icono="log-out-outline"
              titulo={t('altaBajaLechones.donorMother', {
                defaultValue: 'Madre donante',
              })}
              subtitulo={t('altaBajaLechones.donatesPiglets', {
                defaultValue: 'Dona lechones',
              })}
              label={t('altaBajaLechones.id', {
                defaultValue: 'ID',
              })}
              value={idMadreDonante}
              onChangeText={setIdMadreDonante}
              placeholder="1987"
            />

            <CampoFormulario
              icono="paw-outline"
              titulo={t('altaBajaLechones.transferredPiglets', {
                defaultValue: 'Lechones transferidos',
              })}
              subtitulo={t('altaBajaLechones.totalAdopted', {
                defaultValue: 'Total adoptados',
              })}
              label={t('altaBajaLechones.total', {
                defaultValue: 'Total',
              })}
              value={totalLechones}
              onChangeText={texto =>
                setTotalLechones(texto.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
              placeholder="0"
              last
            />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.formHeader}>
              <View
                style={[
                  styles.formIconBox,
                  {
                    backgroundColor: ROJO_SOFT,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={ROJO}
                />
              </View>

              <Text style={styles.formTitle}>
                {t('altaBajaLechones.bajaReason', {
                  defaultValue: 'Motivo de baja',
                })}
              </Text>
            </View>

            <View style={styles.reasonList}>
              {MOTIVOS_BAJA.map(motivo => {
                const seleccionado = motivoSeleccionado === motivo;
                const contador = obtenerContadorMotivo(motivo);

                return (
                  <TouchableOpacity
                    key={motivo}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (motivo === 'Otros') {
                        abrirModalOtrosNuevo();
                      } else {
                        setMotivoSeleccionado(motivo);
                      }
                    }}
                    style={[
                      styles.reasonItem,
                      {
                        borderColor: seleccionado ? ROJO : BORDER,
                        backgroundColor: seleccionado
                          ? ROJO_SOFT
                          : '#F8FAFC',
                      },
                    ]}
                  >
                    <View style={styles.reasonLeft}>
                      <View
                        style={[
                          styles.reasonDot,
                          {
                            borderColor: seleccionado ? ROJO : '#CBD5E1',
                            backgroundColor: seleccionado
                              ? ROJO
                              : '#FFFFFF',
                          },
                        ]}
                      >
                        {seleccionado ? (
                          <Ionicons
                            name="checkmark-outline"
                            size={12}
                            color="#FFFFFF"
                          />
                        ) : null}
                      </View>

                      <Text style={styles.reasonText}>
                        {traducirMotivoBaja(motivo)}
                      </Text>
                    </View>

                    <View style={styles.reasonCounter}>
                      {motivo === 'Otros' ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => cambiarContadorMotivo(motivo, 1)}
                          style={styles.reasonCounterButton}
                        >
                          <Text style={styles.reasonCounterButtonText}>
                            +
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                              cambiarContadorMotivo(motivo, -1)
                            }
                            style={styles.reasonCounterButton}
                          >
                            <Text style={styles.reasonCounterButtonText}>
                              −
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.reasonCounterValue}>
                            {contador}
                          </Text>

                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() =>
                              cambiarContadorMotivo(motivo, 1)
                            }
                            style={styles.reasonCounterButton}
                          >
                            <Text style={styles.reasonCounterButtonText}>
                              +
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {bajasOtros.length > 0 ? (
              <View style={styles.otrosLista}>
                {bajasOtros.map(item => (
                  <TouchableOpacity
                    key={item.uid}
                    activeOpacity={0.85}
                    onPress={() => abrirModalOtrosEditar(item)}
                    style={styles.otrosPreviewItem}
                  >
                    <View style={styles.otrosPreviewIcon}>
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={ROJO}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.otrosPreviewTitle}>
                        {item.descripcion} - {item.lechones}{' '}
                        {item.lechones === 1
                          ? t('altaBajaLechones.piglet', {
                              defaultValue: 'lechón',
                            })
                          : t('altaBajaLechones.piglets', {
                              defaultValue: 'lechones',
                            })}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => eliminarOtrosItem(item.uid)}
                      style={styles.otrosDeleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={ROJO}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.92}
          disabled={guardando}
          onPress={aceptarFormulario}
          style={[
            styles.primaryButton,
            {
              backgroundColor: guardando ? '#CBD5E1' : colorPrincipal,
            },
          ]}
        >
          <Ionicons
            name={esAlta ? 'checkmark-circle-outline' : 'save-outline'}
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.primaryButtonText}>
            {guardando
              ? t('altaBajaLechones.saving', {
                  defaultValue: 'Guardando...',
                })
              : esAlta
                ? t('altaBajaLechones.saveAlta', {
                    defaultValue: 'Guardar alta',
                  })
                : t('altaBajaLechones.saveBaja', {
                    defaultValue: 'Guardar baja',
                  })}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalAvisoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAvisoVisible(false)}
      >
        <View style={styles.modalAvisoOverlay}>
          <View style={styles.modalAvisoCard}>
            <View style={styles.modalAvisoIconBox}>
              <Ionicons
                name="alert-circle-outline"
                size={42}
                color={ROJO}
              />
            </View>

            <Text style={styles.modalAvisoTitle}>
              {modalAvisoTitulo}
            </Text>

            <Text style={styles.modalAvisoText}>
              {modalAvisoMensaje}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalAvisoButton}
              onPress={() => setModalAvisoVisible(false)}
            >
              <Text style={styles.modalAvisoButtonText}>
                {t('altaBajaLechones.accept', {
                  defaultValue: 'Aceptar',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalOtrosVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelarModalOtros}
      >
        <View style={styles.modalAvisoOverlay}>
          <View style={styles.modalOtrosCard}>
            <View style={styles.modalOtrosIconBox}>
              <Ionicons
                name="create-outline"
                size={36}
                color={ROJO}
              />
            </View>

            <Text style={styles.modalAvisoTitle}>
              {otrosEditandoUid
                ? t('altaBajaLechones.editReason', {
                    defaultValue: 'Editar motivo',
                  })
                : t('altaBajaLechones.addReason', {
                    defaultValue: 'Añadir motivo',
                  })}
            </Text>

            <Text style={styles.modalAvisoText}>
              {t('altaBajaLechones.reasonModalText', {
                defaultValue:
                  'Indica la cantidad de lechones y describe el motivo.',
              })}
            </Text>

            <TextInput
              value={lechonesOtrosTemporal}
              onChangeText={texto =>
                setLechonesOtrosTemporal(texto.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
              placeholder={t('altaBajaLechones.piglets', {
                defaultValue: 'Lechones',
              })}
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
            />

            <TextInput
              value={detalleOtrosTemporal}
              onChangeText={setDetalleOtrosTemporal}
              placeholder={t('altaBajaLechones.description', {
                defaultValue: 'Descripción',
              })}
              placeholderTextColor="#94A3B8"
              multiline
              style={[styles.modalInput, styles.modalTextArea]}
            />

            <View style={styles.modalOtrosButtons}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.modalOtrosCancelButton}
                onPress={cancelarModalOtros}
              >
                <Text style={styles.modalOtrosCancelText}>
                  {t('altaBajaLechones.cancel', {
                    defaultValue: 'Cancelar',
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.modalOtrosAcceptButton}
                onPress={aceptarModalOtros}
              >
                <Text style={styles.modalOtrosAcceptText}>
                  {t('altaBajaLechones.accept', {
                    defaultValue: 'Aceptar',
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

function InfoCompacto({
  icono,
  label,
  value,
  color,
  fondo,
  small,
}: {
  icono: string;
  label: string;
  value: string;
  color: string;
  fondo: string;
  small?: boolean;
}) {
  return (
    <View style={styles.infoCompactItem}>
      <View
        style={[
          styles.infoCompactIconBox,
          {
            backgroundColor: fondo,
          },
        ]}
      >
        <Ionicons name={icono as any} size={19} color={color} />
      </View>

      <Text style={styles.infoCompactLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoCompactValue,
          small && styles.infoCompactDate,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function SegmentButton({
  title,
  icono,
  selected,
  color,
  softColor,
  onPress,
}: {
  title: string;
  icono: string;
  selected: boolean;
  color: string;
  softColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.segmentButton,
        {
          borderColor: selected ? color : BORDER,
          backgroundColor: selected ? softColor : '#F8FAFC',
        },
      ]}
    >
      <View
        style={[
          styles.segmentIconBox,
          {
            backgroundColor: selected ? color : '#FFFFFF',
            borderColor: selected ? color : BORDER,
          },
        ]}
      >
        <Ionicons
          name={icono as any}
          size={19}
          color={selected ? '#FFFFFF' : MUTED_DARK}
        />
      </View>

      <Text
        style={[
          styles.segmentTitle,
          {
            color: selected ? color : TEXT,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function CampoFormulario({
  icono,
  titulo,
  subtitulo,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  last,
}: {
  icono: string;
  titulo: string;
  subtitulo: string;
  label: string;
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.campoAltaRow,
        last && styles.campoAltaRowLast,
      ]}
    >
      <View style={styles.campoAltaInfo}>
        <View style={styles.campoAltaIcon}>
          <Ionicons name={icono as any} size={23} color={VERDE} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.campoAltaTitle}>
            {titulo}
          </Text>

          <Text style={styles.campoAltaSubtitle}>
            {subtitulo}
          </Text>
        </View>
      </View>

      <View style={styles.campoAltaInputBox}>
        <Text style={styles.campoInputLabel}>
          {label}
        </Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.campoInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 8,
  },

  hero: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE6F3',
    padding: 10,
  },

  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },

  heroTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
  },

  statusBadge: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '900',
  },

  infoCompactCard: {
    marginTop: 6,
    width: '100%',
    minHeight: 76,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  infoCompactItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoCompactIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  infoCompactLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    textAlign: 'center',
  },

  infoCompactValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 1,
    textAlign: 'center',
  },

  infoCompactDate: {
    fontSize: 13,
  },

  infoCompactDivider: {
    width: 1,
    height: '58%',
    backgroundColor: BORDER,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE6F3',
    padding: 12,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 10,
  },

  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  segmentButton: {
    flex: 1,
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1.3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },

  segmentIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  segmentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },

  formHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },

  formIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
  },

  campoAltaRow: {
    minHeight: 78,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  campoAltaRowLast: {
    paddingBottom: 0,
  },

  campoAltaInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  campoAltaIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: VERDE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  campoAltaTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '900',
  },

  campoAltaSubtitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  campoAltaInputBox: {
    width: 128,
  },

  campoInputLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },

  campoInput: {
    height: 42,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
  },

  reasonList: {
    gap: 8,
  },

  reasonItem: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1.3,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },

  reasonDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reasonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },

  reasonCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  reasonCounterButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reasonCounterButtonText: {
    color: MUTED_DARK,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },

  reasonCounterValue: {
    minWidth: 28,
    textAlign: 'center',
    color: TEXT,
    fontSize: 17,
    fontWeight: '900',
  },

  otrosLista: {
    marginTop: 12,
    gap: 8,
  },

  otrosPreviewItem: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: ROJO_SOFT,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  otrosPreviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  otrosPreviewTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },

  otrosDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    backgroundColor: 'rgba(245, 247, 251, 0.96)',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  modalAvisoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  modalAvisoCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalAvisoIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  modalAvisoTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 10,
  },

  modalAvisoText: {
    fontSize: 16,
    fontWeight: '700',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 23,
  },

  modalAvisoButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: ROJO,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  modalAvisoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  modalOtrosCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalOtrosIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  modalInput: {
    width: '100%',
    minHeight: 48,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    backgroundColor: '#FFFFFF',
    marginTop: 14,
  },

  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },

  modalOtrosButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 22,
  },

  modalOtrosCancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOtrosAcceptButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: ROJO,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOtrosCancelText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '900',
  },

  modalOtrosAcceptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});