import { create } from 'zustand';

/* =========================
   Tipos generales
========================= */

export type TipoSeccionTareas =
    | 'gestacion'
    | 'maternidad';

export type TipoFiltroMovimiento =
    | 'todos'
    | 'entrada'
    | 'salida';

export type TipoFiltroFecha =
    | 'todas'
    | 'hoy'
    | 'manana'
    | 'concreta';

export type TipoFiltroCorral =
    | 'todos'
    | 'especifico';

export type TipoFiltroAnimal =
    | 'todos'
    | 'especifico';

/* =========================
   Estructura de los filtros
========================= */

export type FiltrosTareasMovimientos = {
    tipoMovimiento: TipoFiltroMovimiento;

    tipoFecha: TipoFiltroFecha;
    fechaConcreta: string;

    tipoCorral: TipoFiltroCorral;
    corralEspecifico: string;

    tipoAnimal: TipoFiltroAnimal;
    idAnimalEspecifico: string;
};

/* =========================
   Valores iniciales
========================= */

export const crearFiltrosTareasIniciales =
    (): FiltrosTareasMovimientos => ({
        tipoMovimiento: 'todos',

        tipoFecha: 'todas',
        fechaConcreta: '',

        tipoCorral: 'todos',
        corralEspecifico: '',

        tipoAnimal: 'todos',
        idAnimalEspecifico: '',
    });

/* =========================
   Store
========================= */

type FiltrosTareasMovimientosStore = {
    filtrosGestacion: FiltrosTareasMovimientos;
    filtrosMaternidad: FiltrosTareasMovimientos;

    aplicarFiltros: (
        tipo: TipoSeccionTareas,
        filtros: FiltrosTareasMovimientos
    ) => void;

    restablecerFiltros: (
        tipo: TipoSeccionTareas
    ) => void;
};

export const useFiltrosTareasMovimientosStore =
    create<FiltrosTareasMovimientosStore>((set) => ({
        /*
         * Cada sección tiene su propio objeto.
         * Los filtros de Gestación y Maternidad
         * no se comparten.
         */
        filtrosGestacion:
            crearFiltrosTareasIniciales(),

        filtrosMaternidad:
            crearFiltrosTareasIniciales(),

        aplicarFiltros: (tipo, filtros) => {
            if (tipo === 'gestacion') {
                set({
                    filtrosGestacion: {
                        ...filtros,
                    },
                });

                return;
            }

            set({
                filtrosMaternidad: {
                    ...filtros,
                },
            });
        },

        restablecerFiltros: (tipo) => {
            if (tipo === 'gestacion') {
                set({
                    filtrosGestacion:
                        crearFiltrosTareasIniciales(),
                });

                return;
            }

            set({
                filtrosMaternidad:
                    crearFiltrosTareasIniciales(),
            });
        },
    }));