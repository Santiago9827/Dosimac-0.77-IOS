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

import {
  enviarReporteNacidos,
  consultarMaternidadPorId,
  consultarMaternidadPorCorral,
} from '../../stores/apiApp';

const BG = '#F3F6FB';
const CARD = '#FFFFFF';
const BORDER = '#E2E8F0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const BRAND = '#4F46E5';

const BLUE = '#2563EB';
const PURPLE = '#7C3AED';
const CYAN = '#0891B2';
const ORANGE = '#EA580C';
const GREEN = '#16A34A';
const RED = '#DC2626';
const AMBER = '#D97706';

type CapturaPartoParams = {
  corral?: string;
  id?: string;
  tipoBusqueda?: 'corral' | 'id';
  datosMaternidad?: any;
};

type ContadorProps = {
  titulo: string;
  valor: number;
  icono: string;
  color: string;
  fondoIcono: string;
  soloLectura?: boolean;
  onSumar?: () => void;
  onRestar?: () => void;
  onCambiarTexto?: (texto: string) => void;
};

const crearFechaDesdeBackend = (valor: any) => {
  if (!valor) {
    return new Date();
  }

  const textoLimpio = String(valor).replace('[UTC]', '').trim();
  const fecha = new Date(textoLimpio);

  if (Number.isNaN(fecha.getTime())) {
    return new Date();
  }

  return fecha;
};

const pad2 = (numero: number) => String(numero).padStart(2, '0');

const formatearFechaVista = (fecha: Date) => {
  return `${pad2(fecha.getDate())}/${pad2(
    fecha.getMonth() + 1,
  )}/${fecha.getFullYear()}`;
};

const obtenerFechaIsoDesdeDate = (fecha: Date) => {
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

const obtenerInicioDelDia = (fecha: Date) => {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  ).getTime();
};

const esFechaPosteriorAHoy = (fecha: Date) => {
  const hoy = new Date();

  return obtenerInicioDelDia(fecha) > obtenerInicioDelDia(hoy);
};

function ResumenItem({
  icono,
  etiqueta,
  valor,
  color,
  fondo,
  editable,
  onPress,
}: {
  icono: string;
  etiqueta: string;
  valor: string;
  color: string;
  fondo: string;
  editable?: boolean;
  onPress?: () => void;
}) {
  const contenido = (
    <>
      <View style={[styles.resumenIcono, { backgroundColor: fondo }]}>
        <Ionicons name={icono as any} size={17} color={color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.resumenEtiquetaRow}>
          <Text style={styles.resumenEtiqueta} numberOfLines={1}>
            {etiqueta}
          </Text>

          {editable ? (
            <Ionicons name="create-outline" size={13} color={color} />
          ) : null}
        </View>

        <Text
          style={styles.resumenValor}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {valor}
        </Text>
      </View>
    </>
  );

  if (editable) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.resumenItem, styles.resumenItemEditable]}
      >
        {contenido}
      </TouchableOpacity>
    );
  }

  return <View style={styles.resumenItem}>{contenido}</View>;
}

function FilaContador({
  titulo,
  valor,
  icono,
  color,
  fondoIcono,
  soloLectura,
  onSumar,
  onRestar,
  onCambiarTexto,
}: ContadorProps) {
  return (
    <View
      style={[
        styles.filaContador,
        soloLectura && styles.filaContadorLectura,
      ]}
    >
      <View style={styles.filaInfo}>
        <View style={[styles.filaIcono, { backgroundColor: fondoIcono }]}>
          <Ionicons name={icono as any} size={19} color={color} />
        </View>

        <Text style={styles.filaTitulo} numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      {soloLectura ? (
        <View style={styles.totalBox}>
          <Text style={styles.totalTexto}>{valor}</Text>
        </View>
      ) : (
        <View style={styles.controles}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onRestar}
            style={styles.botonMenos}
          >
            <Ionicons name="remove-outline" size={21} color={TEXT} />
          </TouchableOpacity>

          <View style={styles.inputBox}>
            <TextInput
              value={String(valor)}
              onChangeText={onCambiarTexto}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              textAlign="center"
              selectTextOnFocus
              maxLength={3}
              style={styles.inputTexto}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSumar}
            style={styles.botonMas}
          >
            <Ionicons name="add-outline" size={22} color={color} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export const CapturaPartoScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();

  const params = (route.params ?? {}) as CapturaPartoParams;

  const [datosMaternidadActual, setDatosMaternidadActual] = useState<any>(
    params.datosMaternidad ?? null,
  );

  const animalApi = datosMaternidadActual?.animal ?? {};

  const pkidAnimal = Number(
    animalApi?.id ?? datosMaternidadActual?.id ?? 0,
  );

  const obtenerNumeroBackend = (valor: any) => {
    const numero = Number(valor);

    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  };

  const corral =
    animalApi?.corralName !== null &&
    animalApi?.corralName !== undefined &&
    String(animalApi.corralName).trim() !== ''
      ? String(animalApi.corralName)
      : params.corral && String(params.corral).trim() !== ''
        ? String(params.corral)
        : '—';

  const id =
    animalApi?.animalId !== null &&
    animalApi?.animalId !== undefined &&
    String(animalApi.animalId).trim() !== ''
      ? String(animalApi.animalId)
      : params.id && String(params.id).trim() !== ''
        ? String(params.id)
        : '—';

  const formatearSubEstado = (subState?: string | null) => {
    const valor = String(subState ?? '').trim().toLowerCase();

    if (valor.includes('lact')) {
      return 'LACTANCIA';
    }

    if (valor.includes('wean') || valor.includes('destete')) {
      return 'DESTETE';
    }

    if (valor.includes('farrowing') || valor.includes('parto')) {
      return 'PARTO';
    }

    return 'PREPARTO';
  };

  const subEstado = formatearSubEstado(animalApi?.subState);

  const traducirSubEstado = (valor: string) => {
    const mapa: Record<string, string> = {
      PREPARTO: t('capturaParto.prepartum', {
        defaultValue: 'Preparto',
      }),
      PARTO: t('capturaParto.farrowing', {
        defaultValue: 'Parto',
      }),
      LACTANCIA: t('capturaParto.lactation', {
        defaultValue: 'Lactancia',
      }),
      DESTETE: t('capturaParto.weaning', {
        defaultValue: 'Destete',
      }),
    };

    return mapa[valor] ?? valor;
  };

  const esPreparto = subEstado === 'PREPARTO';
  const esDestete = subEstado === 'DESTETE';

  const farrowingDateBackend =
    datosMaternidadActual?.farrowingDate ??
    animalApi?.farrowingDate ??
    null;

  const [fechaParto, setFechaParto] = useState<Date>(() =>
    crearFechaDesdeBackend(farrowingDateBackend),
  );

  const [fechaTemporal, setFechaTemporal] = useState<Date>(() =>
    crearFechaDesdeBackend(farrowingDateBackend),
  );

  const [vivos, setVivos] = useState(
    obtenerNumeroBackend(datosMaternidadActual?.totalLivePiglets),
  );

  const [muertos, setMuertos] = useState(
    obtenerNumeroBackend(datosMaternidadActual?.totalDeadPiglets),
  );

  const [momificados, setMomificados] = useState(
    obtenerNumeroBackend(datosMaternidadActual?.totalMummifiedPiglets),
  );

  const [guardando, setGuardando] = useState(false);
  const [modalFechaVisible, setModalFechaVisible] = useState(false);
  const [modalFechaPosteriorVisible, setModalFechaPosteriorVisible] =
    useState(false);
  const [modalEnviadoVisible, setModalEnviadoVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  const fechaPartoTexto = useMemo(() => {
    return formatearFechaVista(fechaParto);
  }, [fechaParto]);

  const fechaPartoIso = useMemo(() => {
    return obtenerFechaIsoDesdeDate(fechaParto);
  }, [fechaParto]);

  const nacidosTotales = useMemo(() => {
    return vivos + muertos + momificados;
  }, [vivos, muertos, momificados]);

  const cambiarValor = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
  ) => {
    setter(prev => Math.max(0, prev + delta));
  };

  const cambiarValorManual = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    texto: string,
  ) => {
    const soloNumeros = texto.replace(/[^0-9]/g, '');

    setter(soloNumeros === '' ? 0 : Number(soloNumeros));
  };

  const abrirModalFecha = () => {
    if (!esPreparto) {
      return;
    }

    setFechaTemporal(new Date(fechaParto));
    setModalFechaVisible(true);
  };

  const cambiarFechaTemporal = (dias: number) => {
    setFechaTemporal(prev => {
      const nuevaFecha = new Date(prev);

      nuevaFecha.setDate(nuevaFecha.getDate() + dias);

      return nuevaFecha;
    });
  };

  const aceptarFechaTemporal = () => {
    setFechaParto(new Date(fechaTemporal));
    setModalFechaVisible(false);
  };

  const aplicarDatosBackend = (datos: any) => {
    setDatosMaternidadActual(datos);

    setVivos(obtenerNumeroBackend(datos?.totalLivePiglets));
    setMuertos(obtenerNumeroBackend(datos?.totalDeadPiglets));
    setMomificados(obtenerNumeroBackend(datos?.totalMummifiedPiglets));

    const nuevaFecha = crearFechaDesdeBackend(
      datos?.farrowingDate ?? datos?.animal?.farrowingDate,
    );

    setFechaParto(nuevaFecha);
    setFechaTemporal(nuevaFecha);
  };

  const recargarDatosAnimal = async () => {
    const idAnimal = String(id).trim();
    const corralAnimal = String(corral).trim();

    if (idAnimal && idAnimal !== '—') {
      return consultarMaternidadPorId(idAnimal);
    }

    if (corralAnimal && corralAnimal !== '—') {
      return consultarMaternidadPorCorral(corralAnimal);
    }

    return null;
  };

  const onAceptar = async () => {
    if (esDestete || guardando) {
      return;
    }

    if (!Number.isFinite(pkidAnimal) || pkidAnimal <= 0) {
      setMensajeError(
        t('capturaParto.invalidAnimalText', {
          defaultValue:
            'No se encontró el identificador interno del animal.',
        }),
      );
      setModalErrorVisible(true);
      return;
    }

    if (esPreparto && esFechaPosteriorAHoy(fechaParto)) {
      setModalFechaPosteriorVisible(true);
      return;
    }

    try {
      Keyboard.dismiss();
      setGuardando(true);

      const payload = {
        pkid: pkidAnimal,
        nacidosTotales,
        vivos,
        muertos,
        momificados,
        fecha: fechaPartoIso,
      };

      console.log('===== CAPTURA PARTO =====');
      console.log('Payload reporte nacidos:', JSON.stringify(payload, null, 2));

      await enviarReporteNacidos(payload);

      try {
        const datosActualizados = await recargarDatosAnimal();

        if (datosActualizados) {
          aplicarDatosBackend(datosActualizados);
        }
      } catch (errorRecarga) {
        console.log('No se pudo recargar el animal:', errorRecarga);
      }

      setModalEnviadoVisible(true);
    } catch (error: any) {
      console.log('Error guardando captura parto:', error);

      setMensajeError(
        error?.message ??
          t('capturaParto.reportSendError', {
            defaultValue:
              'No se pudo guardar la captura de parto.',
          }),
      );

      setModalErrorVisible(true);
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {t('capturaParto.birthDataTitle', {
                  defaultValue: 'Datos del parto',
                })}
              </Text>

              <Text style={styles.cardSubtitle}>
                {t('capturaParto.birthDataSubtitle', {
                  defaultValue:
                    'Revisa los datos del animal antes de registrar el parto.',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.resumenGrid}>
            <ResumenItem
              icono="home-outline"
              etiqueta={t('capturaParto.corral', {
                defaultValue: 'Corral',
              })}
              valor={String(corral)}
              color={BLUE}
              fondo="#EFF6FF"
            />

            <ResumenItem
              icono="finger-print-outline"
              etiqueta={t('capturaParto.id', {
                defaultValue: 'ID',
              })}
              valor={String(id)}
              color={PURPLE}
              fondo="#F3E8FF"
            />

            <ResumenItem
              icono="calendar-outline"
              etiqueta={t('capturaParto.date', {
                defaultValue: 'Fecha',
              })}
              valor={fechaPartoTexto}
              color={CYAN}
              fondo="#ECFEFF"
              editable={esPreparto}
              onPress={abrirModalFecha}
            />

            <ResumenItem
              icono="flag-outline"
              etiqueta={t('capturaParto.subState', {
                defaultValue: 'SubEstado',
              })}
              valor={traducirSubEstado(subEstado)}
              color={ORANGE}
              fondo="#FFF7ED"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>
                {t('capturaParto.dataCollectionTitle', {
                  defaultValue: 'Recogida de datos',
                })}
              </Text>

              <Text style={styles.cardSubtitle}>
                {t('capturaParto.dataCollectionSubtitle', {
                  defaultValue:
                    'Introduce los nacidos vivos, muertos y momificados.',
                })}
              </Text>

              {esDestete ? (
                <Text style={styles.readOnlyText}>
                  {t('capturaParto.weaningReadOnly', {
                    defaultValue:
                      'En destete solo se pueden consultar los datos.',
                  })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.filasContainer}>
            <FilaContador
              titulo={t('capturaParto.totalBorn', {
                defaultValue: 'Nacidos totales',
              })}
              valor={nacidosTotales}
              icono="stats-chart-outline"
              color={BRAND}
              fondoIcono="#EEF2FF"
              soloLectura
            />

            <FilaContador
              titulo={t('capturaParto.live', {
                defaultValue: 'Vivos',
              })}
              valor={vivos}
              icono="heart-outline"
              color={GREEN}
              fondoIcono="#DCFCE7"
              soloLectura={esDestete}
              onSumar={() => cambiarValor(setVivos, 1)}
              onRestar={() => cambiarValor(setVivos, -1)}
              onCambiarTexto={texto => cambiarValorManual(setVivos, texto)}
            />

            <FilaContador
              titulo={t('capturaParto.dead', {
                defaultValue: 'Muertos',
              })}
              valor={muertos}
              icono="close-circle-outline"
              color={RED}
              fondoIcono="#FEE2E2"
              soloLectura={esDestete}
              onSumar={() => cambiarValor(setMuertos, 1)}
              onRestar={() => cambiarValor(setMuertos, -1)}
              onCambiarTexto={texto => cambiarValorManual(setMuertos, texto)}
            />

            <FilaContador
              titulo={t('capturaParto.mummified', {
                defaultValue: 'Momificados',
              })}
              valor={momificados}
              icono="ellipse-outline"
              color={AMBER}
              fondoIcono="#FEF3C7"
              soloLectura={esDestete}
              onSumar={() => cambiarValor(setMomificados, 1)}
              onRestar={() => cambiarValor(setMomificados, -1)}
              onCambiarTexto={texto =>
                cambiarValorManual(setMomificados, texto)
              }
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={esDestete || guardando}
          onPress={onAceptar}
          activeOpacity={0.9}
          style={[
            styles.botonAceptar,
            (esDestete || guardando) && styles.botonAceptarDisabled,
          ]}
        >
          <Text style={styles.botonAceptarTexto}>
            {guardando
              ? t('capturaParto.saving', {
                  defaultValue: 'Guardando...',
                })
              : t('capturaParto.accept', {
                  defaultValue: 'Aceptar',
                })}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalEnviadoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEnviadoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons
                name="checkmark-circle-outline"
                size={38}
                color={GREEN}
              />
            </View>

            <Text style={styles.modalTitle}>
              {t('capturaParto.sentTitle', {
                defaultValue: 'Captura enviada',
              })}
            </Text>

            <Text style={styles.modalMessage}>
              {t('capturaParto.sentMessage', {
                defaultValue:
                  'La captura de parto se ha guardado correctamente.',
              })}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalButtonFull}
              onPress={() => setModalEnviadoVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                {t('capturaParto.accept', {
                  defaultValue: 'Aceptar',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalErrorIconBox}>
              <Ionicons
                name="alert-circle-outline"
                size={38}
                color={RED}
              />
            </View>

            <Text style={styles.modalTitle}>
              {t('capturaParto.errorTitle', {
                defaultValue: 'Error',
              })}
            </Text>

            <Text style={styles.modalMessage}>
              {mensajeError}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalButtonFull}
              onPress={() => setModalErrorVisible(false)}
            >
              <Text style={styles.modalButtonText}>
                {t('capturaParto.accept', {
                  defaultValue: 'Aceptar',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalFechaPosteriorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFechaPosteriorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalErrorIconBox}>
              <Ionicons
                name="alert-circle-outline"
                size={38}
                color={RED}
              />
            </View>

            <Text style={styles.modalTitle}>
              {t('capturaParto.invalidDateTitle', {
                defaultValue: 'Fecha no válida',
              })}
            </Text>

            <Text style={styles.modalMessage}>
              {t('capturaParto.invalidDateMessage', {
                defaultValue:
                  'La fecha de parto no puede ser posterior a hoy.',
              })}
            </Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.modalButtonFull}
              onPress={() => {
                setModalFechaPosteriorVisible(false);
                abrirModalFecha();
              }}
            >
              <Text style={styles.modalButtonText}>
                {t('capturaParto.changeDate', {
                  defaultValue: 'Cambiar fecha',
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalFechaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFechaVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fechaModalCard}>
            <View style={styles.fechaModalIconBox}>
              <Ionicons
                name="calendar-outline"
                size={34}
                color={CYAN}
              />
            </View>

            <Text style={styles.modalTitle}>
              {t('capturaParto.selectDateTitle', {
                defaultValue: 'Seleccionar fecha',
              })}
            </Text>

            <Text style={styles.modalMessage}>
              {t('capturaParto.selectDateMessage', {
                defaultValue:
                  'Ajusta la fecha del parto con los botones.',
              })}
            </Text>

            <View style={styles.fechaSelectorRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.fechaStepButton}
                onPress={() => cambiarFechaTemporal(-1)}
              >
                <Ionicons name="remove-outline" size={24} color={TEXT} />
              </TouchableOpacity>

              <View style={styles.fechaValueBox}>
                <Text style={styles.fechaValueText}>
                  {formatearFechaVista(fechaTemporal)}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.fechaStepButton}
                onPress={() => cambiarFechaTemporal(1)}
              >
                <Ionicons name="add-outline" size={24} color={CYAN} />
              </TouchableOpacity>
            </View>

            <View style={styles.fechaModalButtons}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.fechaCancelButton}
                onPress={() => setModalFechaVisible(false)}
              >
                <Text style={styles.fechaCancelButtonText}>
                  {t('capturaParto.cancel', {
                    defaultValue: 'Cancelar',
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.fechaAcceptButton}
                onPress={aceptarFechaTemporal}
              >
                <Text style={styles.fechaAcceptButtonText}>
                  {t('capturaParto.accept', {
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE3EE',
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  cardHeader: {
    marginBottom: 12,
  },

  cardTitle: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
    lineHeight: 18,
  },

  resumenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },

  resumenItem: {
    width: '48.7%',
    minHeight: 66,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  resumenItemEditable: {
    backgroundColor: '#F0FDFA',
    borderColor: '#67E8F9',
    borderWidth: 1.4,
  },

  resumenIcono: {
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resumenEtiquetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  resumenEtiqueta: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    marginBottom: 3,
  },

  resumenValor: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
  },

  readOnlyText: {
    marginTop: 6,
    color: '#EA580C',
    fontWeight: '800',
    fontSize: 13,
  },

  filasContainer: {
    gap: 9,
  },

  filaContador: {
    minHeight: 66,
    borderWidth: 1.2,
    borderRadius: 17,
    paddingLeft: 12,
    paddingRight: 9,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },

  filaContadorLectura: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C7D2FE',
  },

  filaInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  filaIcono: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaTitulo: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },

  totalBox: {
    minWidth: 68,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  totalTexto: {
    color: '#312E81',
    fontSize: 20,
    fontWeight: '900',
  },

  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  botonMenos: {
    width: 35,
    height: 35,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  botonMas: {
    width: 35,
    height: 35,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  inputBox: {
    width: 52,
    height: 35,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  inputTexto: {
    width: '100%',
    color: TEXT,
    fontSize: 16,
    fontWeight: '900',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 22 : 14,
    backgroundColor: 'rgba(243, 246, 251, 0.96)',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  botonAceptar: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND,
  },

  botonAceptarDisabled: {
    backgroundColor: '#CBD5E1',
  },

  botonAceptarTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalErrorIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT,
    textAlign: 'center',
  },

  modalMessage: {
    color: MUTED,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },

  modalButtonFull: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  fechaModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  fechaModalIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  fechaSelectorRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },

  fechaStepButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fechaValueBox: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  fechaValueText: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '900',
  },

  fechaModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  fechaCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fechaAcceptButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fechaCancelButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '900',
  },

  fechaAcceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});