/* eslint-disable prettier/prettier */

const formatearFechaApi = (fecha?: string | null) => {
  if (!fecha) {
    return '—';
  }

  const soloFecha = String(fecha).split('T')[0];

  return soloFecha || '—';
};

const formatearSubEstado = (subState?: string | null) => {
  const valor = String(subState ?? '')
    .trim()
    .toLowerCase();

  const mapa: Record<string, string> = {
    prepartum: 'PREPARTO',
    farrowing: 'PARTO',
    lactation: 'LACTANCIA',
    weaning: 'DESTETE',
  };

  return mapa[valor] ?? (valor ? valor.toUpperCase() : '—');
};

const calcularPorcentaje = (
  actual: number,
  objetivo: number,
) => {
  if (
    !Number.isFinite(actual) ||
    !Number.isFinite(objetivo) ||
    objetivo <= 0
  ) {
    return 0;
  }

  return Math.round((actual / objetivo) * 100);
};

const obtenerHoraUltimaAlimentacion = (
  listDosage?: any[],
) => {
  if (!Array.isArray(listDosage) || listDosage.length === 0) {
    return '—';
  }

  const ultimoRegistro = listDosage[listDosage.length - 1];
  const fecha = String(ultimoRegistro?.date ?? '');

  if (!fecha.includes('T')) {
    return '—';
  }

  const horaCompleta =
    fecha.split('T')[1]?.split('Z')[0] ?? '';

  const [hora, minutos] = horaCompleta.split(':');

  if (!hora || !minutos) {
    return '—';
  }

  return `${hora}:${minutos}`;
};

export const mapearMaternidadADetalleAnimal = (
  datosApi: any,
  nombreCurva: string,
) => {
  const animalApi = datosApi?.animal ?? {};

  const totalFeeding = Number(datosApi?.totalFeeding ?? 0);
  const plannedFeeding = Number(datosApi?.plannedFeeding ?? 0);

  const porcentajesIntervalos = Array.isArray(
    datosApi?.totalFeedingByIntervalPercentage,
  )
    ? datosApi.totalFeedingByIntervalPercentage
    : [];

  const currentInterval = Number(
    datosApi?.currentInterval ?? -1,
  );

  const intervalosConfigurados = Array.isArray(
    datosApi?.intervals,
  )
    ? datosApi.intervals
    : [];

  const vivos = Number(datosApi?.totalLivePiglets ?? 0);
  const presentes = Number(
    datosApi?.totalPigletsPresent ??
      animalApi?.totalPigletsPresent ??
      vivos,
  );

  return {
    animal: {
      id: String(
        animalApi?.animalId ??
          datosApi?.animalId ??
          '—',
      ),

      diasSinAlimentar: Number(
        animalApi?.daysWithoutFeeding ?? 0,
      ),

      crotal:
        animalApi?.crotal !== null &&
        animalApi?.crotal !== undefined &&
        String(animalApi.crotal).trim() !== ''
          ? String(animalApi.crotal)
          : '—',

      dia:
        datosApi?.day !== null &&
        datosApi?.day !== undefined
          ? Number(datosApi.day)
          : '—',

      ciclo:
        animalApi?.cycle !== null &&
        animalApi?.cycle !== undefined
          ? Number(animalApi.cycle)
          : Number(datosApi?.cycle ?? 0),

      curva: nombreCurva || '—',

      correccion:
        animalApi?.bodyConditionCorrection !== null &&
        animalApi?.bodyConditionCorrection !== undefined &&
        String(animalApi.bodyConditionCorrection).trim() !== ''
          ? String(animalApi.bodyConditionCorrection)
          : '—',

      condicion:
        animalApi?.bodyConditionCorrection !== null &&
        animalApi?.bodyConditionCorrection !== undefined &&
        String(animalApi.bodyConditionCorrection).trim() !== ''
          ? String(animalApi.bodyConditionCorrection)
          : '—',

      subEstado: formatearSubEstado(animalApi?.subState),

      subEstadoFecha: formatearFechaApi(
        animalApi?.stateChangeDate,
      ),

      fechas: {
        entrada: formatearFechaApi(
          animalApi?.systemEntryDate,
        ),
        parto: formatearFechaApi(datosApi?.farrowingDate),
        inseminacion: '—',
      },

      nave:
        animalApi?.houseName !== null &&
        animalApi?.houseName !== undefined &&
        String(animalApi.houseName).trim() !== ''
          ? String(animalApi.houseName)
          : '—',

      corral:
        animalApi?.corralName !== null &&
        animalApi?.corralName !== undefined &&
        String(animalApi.corralName).trim() !== ''
          ? String(animalApi.corralName)
          : '—',

      ultimaAlimentacion: obtenerHoraUltimaAlimentacion(
        datosApi?.listDosage,
      ),

      lechonesPresentes: Number.isFinite(presentes)
        ? presentes
        : '—',

      numeroTetas: '—',

      consumo: {
        actual: totalFeeding,
        objetivo: plannedFeeding,
        porcentaje: calcularPorcentaje(
          totalFeeding,
          plannedFeeding,
        ),
        extra: Number(datosApi?.totalextraFeeding ?? 0),
      },

      intervalos: intervalosConfigurados
        .map((valorIntervalo: any, indexOriginal: number) => {
          const valorLimpio = String(valorIntervalo ?? '')
            .trim()
            .toLowerCase();

          const intervaloExiste =
            valorLimpio !== '' &&
            valorLimpio !== 'null' &&
            Number(valorLimpio) > 0;

          if (!intervaloExiste) {
            return null;
          }

          const porcentaje = Number(
            porcentajesIntervalos[indexOriginal] ?? 0,
          );

          return {
            index: indexOriginal,
            porcentaje,
            pct: Math.max(
              0,
              Math.min(1, porcentaje / 100),
            ),
            activo: indexOriginal === currentInterval,
            color:
              porcentaje <= 0
                ? '#CBD5E1'
                : porcentaje >= 50
                  ? '#10B981'
                  : '#EF4444',
          };
        })
        .filter((item: any) => item !== null),
    },

    datosOriginales: datosApi,
  };
};