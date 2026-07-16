/* eslint-disable prettier/prettier */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import {
  consultarAnimalesNoAlimentadosMaternidad,
  consultarNumeroAnimalesMaternidad,
} from '../../stores/apiApp';

const FONDO = '#F6F8FC';
const BLANCO = '#FFFFFF';
const BORDE = '#E2E8F0';
const TEXTO = '#0F172A';
const SECUNDARIO = '#64748B';
const VERDE = '#22C55E';
const MORADO = '#4C1D95';
const AZUL = '#2563EB';

type AnimalNoAlimentado = {
  animal?: {
    animalId?: string;
    crotal?: string | number;
    corralName?: number | string;
    daysWithoutFeeding?: number;
    id?: number;
  };

  id?: number;
  posix?: number;
  percentageTotalFeeding?: number;
  plannedFeeding?: number;
  totalFeeding?: number;
};

type TipoOrden = 'dias' | 'corral';
type DireccionOrden = 'asc' | 'desc';
type TipoFiltroVistos = 'todos' | 'noMarcados';

type AnimalesVistosMap = Record<string, boolean>;

type EstadoVistosNoAlimentados = {
  posix: number | null;
  animalesVistos: AnimalesVistosMap;
};

const STORAGE_NO_ALIMENTADOS_MATERNIDAD =
  '@no_alimentados_maternidad_vistos';

const obtenerDiasSinAlimentar = (
  item: AnimalNoAlimentado,
): number => {
  const dias = Number(item.animal?.daysWithoutFeeding ?? 0);

  return Number.isFinite(dias) ? dias : 0;
};

const obtenerPorcentaje = (
  item: AnimalNoAlimentado,
): number => {
  const porcentaje = Number(item.percentageTotalFeeding ?? 0);

  return Number.isFinite(porcentaje) ? porcentaje : 0;
};

const obtenerCorralOrden = (
  item: AnimalNoAlimentado,
): number => {
  const corral = Number(item.animal?.corralName ?? 0);

  return Number.isFinite(corral) ? corral : 0;
};

const formatearNumero = (
  valor: number | undefined | null,
): string => {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) {
    return '0';
  }

  return numero.toLocaleString('es-ES');
};

const limitarPorcentaje = (
  valor: number | undefined,
): number => {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(numero), 0), 100);
};

const obtenerClaveAnimalNoAlimentado = (
  item: AnimalNoAlimentado,
): string => {
  return String(
    item.animal?.id ??
      item.id ??
      item.animal?.animalId ??
      item.animal?.crotal ??
      item.animal?.corralName,
  );
};

const obtenerPosixListado = (
  lista: AnimalNoAlimentado[],
): number | null => {
  const elemento = lista.find(
    item =>
      item.posix !== undefined &&
      item.posix !== null,
  );

  const posix = Number(elemento?.posix);

  return Number.isFinite(posix) ? posix : null;
};

function TarjetaAnimalNoAlimentado({
  item,
  visto,
  onCambiarVisto,
}: {
  item: AnimalNoAlimentado;
  visto: boolean;
  onCambiarVisto: () => void;
}) {
      const { t } = useTranslation();
  const animalId = item.animal?.animalId ?? '—';
  const crotal = item.animal?.crotal ?? '—';
  const corral = item.animal?.corralName ?? '—';

  const diasSinAlimentar = Number(
    item.animal?.daysWithoutFeeding ?? 0,
  );

  const porcentaje = limitarPorcentaje(
    item.percentageTotalFeeding,
  );

  const alimentoConsumido = Number(
    item.totalFeeding ?? 0,
  );

  const alimentoPlanificado = Number(
    item.plannedFeeding ?? 0,
  );

  return (
    <View
      style={[
        styles.tarjetaAnimal,
        visto && styles.tarjetaAnimalVista,
      ]}
    >
      <View style={styles.cabeceraTarjeta}>
        <View style={styles.contenedorIdentificacion}>
          <View style={styles.contenedorIconoIdentificacion}>
            <Ionicons
              name="finger-print-outline"
              size={23}
              color={MORADO}
            />
          </View>

          <View style={styles.datosIdentificacion}>
            <Text style={styles.etiquetaIdentificacion}>
  {t('noAlimentadosMaternidad.animalId')}
</Text>

            <Text
              style={styles.valorIdentificacion}
              numberOfLines={1}
            >
              {animalId}
            </Text>

            <Text
              style={styles.valorCrotal}
              numberOfLines={1}
            >
              {String(crotal)}
            </Text>
          </View>
        </View>

        <View style={styles.cabeceraDerecha}>
          <View style={styles.chipCorral}>
           <Text style={styles.textoChipCorral}>
  {t('noAlimentadosMaternidad.corral')} {corral}
</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onCambiarVisto}
            style={styles.botonVisto}
          >
            <Ionicons
              name={
                visto
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              size={38}
              color={visto ? AZUL : SECUNDARIO}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filaInformacion}>
        <View
          style={[
            styles.cajaInformacion,
            styles.cajaConsumo,
          ]}
        >
         <Text style={styles.etiquetaInformacion}>
  {t('noAlimentadosMaternidad.consumption')}
</Text>

          <Text style={styles.valorInformacion}>
            {formatearNumero(alimentoConsumido)}
            {' / '}
            {formatearNumero(alimentoPlanificado)}
          </Text>
        </View>

        <View
          style={[
            styles.cajaDias,
            diasSinAlimentar === 0
              ? styles.cajaDiasCorrecta
              : styles.cajaDiasAlerta,
          ]}
        >
         <Text
  style={[
    styles.etiquetaInformacion,
    diasSinAlimentar === 0
      ? styles.textoDiasCorrecto
      : styles.textoDiasAlerta,
  ]}
>
  {t('noAlimentadosMaternidad.withoutFeeding')}
</Text>

         <Text
  style={[
    styles.valorInformacion,
    diasSinAlimentar === 0
      ? styles.textoDiasCorrecto
      : styles.textoDiasAlerta,
  ]}
>
  {diasSinAlimentar}{' '}
  {diasSinAlimentar === 1
    ? t('noAlimentadosMaternidad.day')
    : t('noAlimentadosMaternidad.days')}
</Text>
        </View>
      </View>

      <View style={styles.contenedorProgreso}>
        <View style={styles.pistaProgreso}>
          <View
            style={[
              styles.rellenoProgreso,
              {
                width: `${porcentaje}%`,
              },
            ]}
          />

          <Text style={styles.textoProgreso}>
            {porcentaje}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export const NoAlimentadosMaternidadScreen = () => {
      const { t } = useTranslation();
  const [animales, setAnimales] = useState<
    AnimalNoAlimentado[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] =
    useState(false);

  const [tipoOrden, setTipoOrden] =
    useState<TipoOrden>('dias');

  const [direccionOrden, setDireccionOrden] =
    useState<DireccionOrden>('desc');

  const [modalOrdenVisible, setModalOrdenVisible] =
    useState(false);

  const [modalFiltroVisible, setModalFiltroVisible] =
    useState(false);

  const [
    modalLimpiarVisible,
    setModalLimpiarVisible,
  ] = useState(false);

  const [tipoFiltroVistos, setTipoFiltroVistos] =
    useState<TipoFiltroVistos>('todos');

  const [animalesVistos, setAnimalesVistos] =
    useState<AnimalesVistosMap>({});

  const [posixActual, setPosixActual] =
    useState<number | null>(null);

  const [
    animalesPendientesOcultar,
    setAnimalesPendientesOcultar,
  ] = useState<Record<string, boolean>>({});

  const [
    totalAnimalesMaternidad,
    setTotalAnimalesMaternidad,
  ] = useState<number | null>(null);

  const timeoutsOcultarRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const totalAnimalesVistos = useMemo(() => {
    return Object.values(animalesVistos).filter(
      Boolean,
    ).length;
  }, [animalesVistos]);

  const sincronizarVistosConPosix = useCallback(
    async (
      listaAnimales: AnimalNoAlimentado[],
    ) => {
      const nuevoPosix =
        obtenerPosixListado(listaAnimales);

      if (nuevoPosix === null) {
        setPosixActual(null);
        setAnimalesVistos({});
        return;
      }

      try {
        const textoGuardado =
          await AsyncStorage.getItem(
            STORAGE_NO_ALIMENTADOS_MATERNIDAD,
          );

        const estadoGuardado:
          | EstadoVistosNoAlimentados
          | null = textoGuardado
          ? JSON.parse(textoGuardado)
          : null;

        if (
          !estadoGuardado ||
          estadoGuardado.posix !== nuevoPosix
        ) {
          const nuevoEstado: EstadoVistosNoAlimentados =
            {
              posix: nuevoPosix,
              animalesVistos: {},
            };

          await AsyncStorage.setItem(
            STORAGE_NO_ALIMENTADOS_MATERNIDAD,
            JSON.stringify(nuevoEstado),
          );

          setPosixActual(nuevoPosix);
          setAnimalesVistos({});
          return;
        }

        setPosixActual(estadoGuardado.posix);

        setAnimalesVistos(
          estadoGuardado.animalesVistos ?? {},
        );
      } catch (error) {
        console.log(
          'Error leyendo animales marcados:',
          error,
        );

        setPosixActual(nuevoPosix);
        setAnimalesVistos({});
      }
    },
    [],
  );

  const cargarAnimales = useCallback(async () => {
    try {
      const [datos, totalMaternidad] =
        await Promise.all([
          consultarAnimalesNoAlimentadosMaternidad(),

          consultarNumeroAnimalesMaternidad().catch(
            error => {
              console.log(
                'Error consultando total de maternidad:',
                error,
              );

              return null;
            },
          ),
        ]);

      const lista = Array.isArray(datos)
        ? datos
        : [];

      setAnimales(lista);

      setTotalAnimalesMaternidad(
        totalMaternidad,
      );

      await sincronizarVistosConPosix(lista);
    } catch (error: any) {
      console.log(
        'Error cargando animales no alimentados:',
        error,
      );

     Alert.alert(
  t('noAlimentadosMaternidad.error'),
  error?.message ??
    t('noAlimentadosMaternidad.serverConnectionError'),
);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [sincronizarVistosConPosix]);

  useEffect(() => {
    cargarAnimales();
  }, [cargarAnimales]);

  useEffect(() => {
    return () => {
      Object.values(
        timeoutsOcultarRef.current,
      ).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargarAnimales();
  }, [cargarAnimales]);

  const cambiarAnimalVisto = useCallback(
    (item: AnimalNoAlimentado) => {
      const clave =
        obtenerClaveAnimalNoAlimentado(item);

      setAnimalesVistos(actual => {
        const nuevoValor = !actual[clave];

        const siguiente = {
          ...actual,
          [clave]: nuevoValor,
        };

        const nuevoEstado: EstadoVistosNoAlimentados =
          {
            posix: posixActual,
            animalesVistos: siguiente,
          };

        void AsyncStorage.setItem(
          STORAGE_NO_ALIMENTADOS_MATERNIDAD,
          JSON.stringify(nuevoEstado),
        );

        if (
          tipoFiltroVistos === 'noMarcados' &&
          nuevoValor
        ) {
          setAnimalesPendientesOcultar(
            pendientes => ({
              ...pendientes,
              [clave]: true,
            }),
          );

          if (
            timeoutsOcultarRef.current[clave]
          ) {
            clearTimeout(
              timeoutsOcultarRef.current[clave],
            );
          }

          timeoutsOcultarRef.current[clave] =
            setTimeout(() => {
              setAnimalesPendientesOcultar(
                pendientes => {
                  const copia = {
                    ...pendientes,
                  };

                  delete copia[clave];

                  return copia;
                },
              );

              delete timeoutsOcultarRef.current[
                clave
              ];
            }, 1000);
        }

        return siguiente;
      });
    },
    [posixActual, tipoFiltroVistos],
  );

  const limpiarAnimalesVistos =
    useCallback(async () => {
      const nuevoEstado: EstadoVistosNoAlimentados =
        {
          posix: posixActual,
          animalesVistos: {},
        };

      await AsyncStorage.setItem(
        STORAGE_NO_ALIMENTADOS_MATERNIDAD,
        JSON.stringify(nuevoEstado),
      );

      setAnimalesVistos({});
      setAnimalesPendientesOcultar({});
      setModalLimpiarVisible(false);
    }, [posixActual]);

  const animalesOrdenados = useMemo(() => {
    const copia = [...animales];

    copia.sort((animalA, animalB) => {
      if (tipoOrden === 'dias') {
        const diasA =
          obtenerDiasSinAlimentar(animalA);

        const diasB =
          obtenerDiasSinAlimentar(animalB);

        if (diasA !== diasB) {
          return direccionOrden === 'desc'
            ? diasB - diasA
            : diasA - diasB;
        }

        const porcentajeA =
          obtenerPorcentaje(animalA);

        const porcentajeB =
          obtenerPorcentaje(animalB);

        return porcentajeA - porcentajeB;
      }

      const corralA =
        obtenerCorralOrden(animalA);

      const corralB =
        obtenerCorralOrden(animalB);

      if (corralA !== corralB) {
        return direccionOrden === 'desc'
          ? corralB - corralA
          : corralA - corralB;
      }

      return (
        obtenerDiasSinAlimentar(animalB) -
        obtenerDiasSinAlimentar(animalA)
      );
    });

    return copia;
  }, [
    animales,
    tipoOrden,
    direccionOrden,
  ]);

  const animalesVisibles = useMemo(() => {
    if (tipoFiltroVistos === 'todos') {
      return animalesOrdenados;
    }

    return animalesOrdenados.filter(item => {
      const clave =
        obtenerClaveAnimalNoAlimentado(item);

      const estaVisto =
        Boolean(animalesVistos[clave]);

      const estaPendienteDeOcultar =
        Boolean(
          animalesPendientesOcultar[clave],
        );

      return (
        !estaVisto || estaPendienteDeOcultar
      );
    });
  }, [
    animalesOrdenados,
    tipoFiltroVistos,
    animalesVistos,
    animalesPendientesOcultar,
  ]);

  if (cargando) {
    return (
      <View style={styles.pantallaCarga}>
        <ActivityIndicator
          size="large"
          color={MORADO}
        />

       <Text style={styles.textoCarga}>
  {t('noAlimentadosMaternidad.loadingAnimals')}
</Text>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.tarjetaCabecera}>
       <Text style={styles.titulo}>
  {t('noAlimentadosMaternidad.title')}
</Text>

        {totalAnimalesMaternidad !== null && (
          <View style={styles.tarjetaTotal}>
           <Text style={styles.etiquetaTotal}>
  {t('noAlimentadosMaternidad.totalAnimalsMaternity')}
</Text>

            <Text style={styles.valorTotal}>
              {formatearNumero(
                totalAnimalesMaternidad,
              )}
            </Text>
          </View>
        )}

        <View style={styles.filaBotonesCabecera}>
          <View style={styles.botonContador}>
            <Ionicons
              name="alert-circle-outline"
              size={15}
              color={SECUNDARIO}
            />

            <Text style={styles.textoContador}>
              {animalesVisibles.length}/
              {animales.length}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              setModalFiltroVisible(true)
            }
            style={[
              styles.botonCabecera,
              tipoFiltroVistos ===
                'noMarcados' &&
                styles.botonCabeceraAzul,
            ]}
          >
            <Ionicons
              name={
                tipoFiltroVistos ===
                'noMarcados'
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={18}
              color={
                tipoFiltroVistos ===
                'noMarcados'
                  ? AZUL
                  : MORADO
              }
            />

         <Text
  style={[
    styles.textoBotonCabecera,
    tipoFiltroVistos === 'noMarcados' &&
      styles.textoBotonAzul,
  ]}
>
  {tipoFiltroVistos === 'noMarcados'
    ? t('noAlimentadosMaternidad.notSeen')
    : t('noAlimentadosMaternidad.all')}
</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={
              totalAnimalesVistos === 0
            }
            onPress={() =>
              setModalLimpiarVisible(true)
            }
            style={[
              styles.botonLimpiar,
              totalAnimalesVistos === 0 &&
                styles.botonDesactivado,
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color={
                totalAnimalesVistos === 0
                  ? SECUNDARIO
                  : AZUL
              }
            />

            <Text
              style={[
                styles.textoLimpiar,
                totalAnimalesVistos === 0 &&
                  styles.textoDesactivado,
              ]}
            >
              {totalAnimalesVistos}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              setModalOrdenVisible(true)
            }
            style={styles.botonCabecera}
          >
            <Ionicons
              name="filter-outline"
              size={17}
              color={MORADO}
            />

         <Text style={styles.textoBotonCabecera}>
  {t('noAlimentadosMaternidad.sort')}
</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={animalesVisibles}
        keyExtractor={(item, index) =>
          String(
            item.animal?.id ??
              item.id ??
              item.animal?.animalId ??
              index,
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.contenidoLista
        }
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            tintColor={MORADO}
          />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.contenedorVacio}>
            <Ionicons
              name="checkmark-circle-outline"
              size={42}
              color={VERDE}
            />
<Text style={styles.tituloVacio}>
  {t('noAlimentadosMaternidad.emptyTitle')}
</Text>

<Text style={styles.textoVacio}>
  {t('noAlimentadosMaternidad.emptyText')}
</Text>
          </View>
        }
        renderItem={({ item }) => {
          const clave =
            obtenerClaveAnimalNoAlimentado(
              item,
            );

          return (
            <TarjetaAnimalNoAlimentado
              item={item}
              visto={Boolean(
                animalesVistos[clave],
              )}
              onCambiarVisto={() =>
                cambiarAnimalVisto(item)
              }
            />
          );
        }}
      />

      <Modal
        visible={modalOrdenVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalOrdenVisible(false)
        }
      >
        <Pressable
          style={styles.fondoModalMenu}
          onPress={() =>
            setModalOrdenVisible(false)
          }
        >
          <Pressable style={styles.menuModal}>
          <Text style={styles.tituloMenu}>
  {t('noAlimentadosMaternidad.sortBy')}
</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setTipoOrden('dias');
                setModalOrdenVisible(false);
              }}
              style={styles.opcionMenu}
            >
              <Ionicons
                name="time-outline"
                size={22}
                color={
                  tipoOrden === 'dias'
                    ? MORADO
                    : TEXTO
                }
              />

              <View style={styles.textosOpcion}>
               <Text style={styles.textoOpcion}>
  {t('noAlimentadosMaternidad.daysWithoutFeeding')}
</Text>

<Text style={styles.ayudaOpcion}>
  {t('noAlimentadosMaternidad.sortDaysHelp')}
</Text>
              </View>

              {tipoOrden === 'dias' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={MORADO}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setTipoOrden('corral');
                setModalOrdenVisible(false);
              }}
              style={styles.opcionMenu}
            >
              <Ionicons
                name="home-outline"
                size={22}
                color={
                  tipoOrden === 'corral'
                    ? MORADO
                    : TEXTO
                }
              />

              <View style={styles.textosOpcion}>
                <Text style={styles.textoOpcion}>
  {t('noAlimentadosMaternidad.corral')}
</Text>

<Text style={styles.ayudaOpcion}>
  {t('noAlimentadosMaternidad.sortCorralHelp')}
</Text>
              </View>

              {tipoOrden === 'corral' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={MORADO}
                />
              )}
            </TouchableOpacity>

            <View style={styles.separadorMenu} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setDireccionOrden(actual =>
                  actual === 'desc'
                    ? 'asc'
                    : 'desc',
                )
              }
              style={styles.botonDireccion}
            >
              <Ionicons
                name={
                  direccionOrden === 'desc'
                    ? 'arrow-down-outline'
                    : 'arrow-up-outline'
                }
                size={20}
                color={MORADO}
              />

             <Text style={styles.textoDireccion}>
  {direccionOrden === 'desc'
    ? t('noAlimentadosMaternidad.descending')
    : t('noAlimentadosMaternidad.ascending')}
</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={modalFiltroVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalFiltroVisible(false)
        }
      >
        <Pressable
          style={styles.fondoModalMenu}
          onPress={() =>
            setModalFiltroVisible(false)
          }
        >
          <Pressable style={styles.menuModal}>
          <Text style={styles.tituloMenu}>
  {t('noAlimentadosMaternidad.filterAnimals')}
</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setTipoFiltroVistos('todos');
                setModalFiltroVisible(false);
              }}
              style={styles.opcionMenu}
            >
              <Ionicons
                name="list-outline"
                size={22}
                color={
                  tipoFiltroVistos ===
                  'todos'
                    ? MORADO
                    : TEXTO
                }
              />

              <View style={styles.textosOpcion}>
                <Text style={styles.textoOpcion}>
  {t('noAlimentadosMaternidad.all')}
</Text>

<Text style={styles.ayudaOpcion}>
  {t('noAlimentadosMaternidad.allHelp')}
</Text>
              </View>

              {tipoFiltroVistos ===
                'todos' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={MORADO}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setTipoFiltroVistos(
                  'noMarcados',
                );

                setModalFiltroVisible(false);
              }}
              style={styles.opcionMenu}
            >
              <Ionicons
                name="eye-off-outline"
                size={22}
                color={
                  tipoFiltroVistos ===
                  'noMarcados'
                    ? AZUL
                    : TEXTO
                }
              />

              <View style={styles.textosOpcion}>
              <Text style={styles.textoOpcion}>
  {t('noAlimentadosMaternidad.unmarked')}
</Text>

<Text style={styles.ayudaOpcion}>
  {t('noAlimentadosMaternidad.unmarkedHelp')}
</Text>
              </View>

              {tipoFiltroVistos ===
                'noMarcados' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={AZUL}
                />
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={modalLimpiarVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalLimpiarVisible(false)
        }
      >
        <View style={styles.fondoModalConfirmacion}>
          <View style={styles.tarjetaConfirmacion}>
            <View
              style={
                styles.iconoModalConfirmacion
              }
            >
              <Ionicons
                name="checkmark-done-outline"
                size={34}
                color={VERDE}
              />
            </View>

          <Text style={styles.tituloModalConfirmacion}>
  {t('noAlimentadosMaternidad.clearMarkedTitle')}
</Text>

<Text style={styles.textoModalConfirmacion}>
  {t('noAlimentadosMaternidad.clearMarkedText')}
</Text>
            <View
              style={
                styles.accionesModalConfirmacion
              }
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  setModalLimpiarVisible(false)
                }
                style={styles.botonCancelar}
              >
              <Text style={styles.textoCancelar}>
  {t('noAlimentadosMaternidad.cancel')}
</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={limpiarAnimalesVistos}
                style={styles.botonAceptar}
              >
               <Text style={styles.textoAceptar}>
  {t('noAlimentadosMaternidad.clear')}
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
  pantalla: {
    flex: 1,
    backgroundColor: FONDO,
  },

  pantallaCarga: {
    flex: 1,
    backgroundColor: FONDO,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCarga: {
    color: SECUNDARIO,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
  },

  tarjetaCabecera: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: BLANCO,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDE,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },

  titulo: {
    color: TEXTO,
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },

  tarjetaTotal: {
    alignSelf: 'center',
    minWidth: 260,
    maxWidth: '100%',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  etiquetaTotal: {
    color: SECUNDARIO,
    fontSize: 13,
    fontWeight: '900',
  },

  valorTotal: {
    color: MORADO,
    fontSize: 20,
    fontWeight: '900',
  },

  filaBotonesCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  botonContador: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  textoContador: {
    color: SECUNDARIO,
    fontSize: 13,
    fontWeight: '900',
  },

  botonCabecera: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  botonCabeceraAzul: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  textoBotonCabecera: {
    color: MORADO,
    fontSize: 12,
    fontWeight: '900',
  },

  textoBotonAzul: {
    color: AZUL,
  },

  botonLimpiar: {
    minWidth: 58,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  botonDesactivado: {
    backgroundColor: '#F8FAFC',
    borderColor: BORDE,
  },

  textoLimpiar: {
    color: AZUL,
    fontSize: 14,
    fontWeight: '900',
  },

  textoDesactivado: {
    color: SECUNDARIO,
  },

  contenidoLista: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },

  tarjetaAnimal: {
    backgroundColor: BLANCO,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDE,
    padding: 15,
    marginBottom: 12,
    shadowColor: TEXTO,
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  tarjetaAnimalVista: {
    borderColor: AZUL,
    borderWidth: 2,
  },

  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },

  contenedorIdentificacion: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  contenedorIconoIdentificacion: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  datosIdentificacion: {
    flex: 1,
    minWidth: 0,
  },

  etiquetaIdentificacion: {
    color: SECUNDARIO,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  valorIdentificacion: {
    color: TEXTO,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },

  valorCrotal: {
    color: SECUNDARIO,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  cabeceraDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  chipCorral: {
    backgroundColor: '#EDE9FE',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },

  textoChipCorral: {
    color: MORADO,
    fontSize: 14,
    fontWeight: '900',
  },

  botonVisto: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filaInformacion: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },

  cajaInformacion: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  cajaConsumo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  cajaDias: {
    width: 112,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  cajaDiasCorrecta: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },

  cajaDiasAlerta: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  etiquetaInformacion: {
    color: SECUNDARIO,
    fontSize: 12,
    fontWeight: '800',
  },

  valorInformacion: {
    color: TEXTO,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },

  textoDiasCorrecto: {
    color: '#0F766E',
  },

  textoDiasAlerta: {
    color: '#991B1B',
  },

  contenedorProgreso: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDE,
    padding: 10,
  },

  pistaProgreso: {
    height: 25,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    justifyContent: 'center',
  },

  rellenoProgreso: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: VERDE,
    minWidth: 8,
  },

  textoProgreso: {
    color: TEXTO,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  contenedorVacio: {
    backgroundColor: BLANCO,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDE,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },

  tituloVacio: {
    color: TEXTO,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },

  textoVacio: {
    color: SECUNDARIO,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },

  fondoModalMenu: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    alignItems: 'flex-end',
    paddingTop: 115,
    paddingRight: 16,
  },

  menuModal: {
    width: 300,
    backgroundColor: BLANCO,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDE,
    padding: 14,
    shadowColor: TEXTO,
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  tituloMenu: {
    color: SECUNDARIO,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },

  opcionMenu: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },

  textosOpcion: {
    flex: 1,
  },

  textoOpcion: {
    color: TEXTO,
    fontSize: 15,
    fontWeight: '900',
  },

  textoActivo: {
    color: MORADO,
  },

  textoActivoAzul: {
    color: AZUL,
  },

  ayudaOpcion: {
    color: SECUNDARIO,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  separadorMenu: {
    height: 1,
    backgroundColor: BORDE,
    marginVertical: 8,
  },

  botonDireccion: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  textoDireccion: {
    color: MORADO,
    fontSize: 14,
    fontWeight: '900',
  },

  fondoModalConfirmacion: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  tarjetaConfirmacion: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: BLANCO,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDE,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  iconoModalConfirmacion: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  tituloModalConfirmacion: {
    color: TEXTO,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },

  textoModalConfirmacion: {
    color: SECUNDARIO,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  accionesModalConfirmacion: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },

  botonCancelar: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCancelar: {
    color: SECUNDARIO,
    fontSize: 15,
    fontWeight: '900',
  },

  botonAceptar: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: VERDE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoAceptar: {
    color: BLANCO,
    fontSize: 15,
    fontWeight: '900',
  },
});