import { create } from 'zustand';
import {
    FiltrosTareasMovimientos,
    crearFiltrosTareasIniciales,
} from './useFiltrosTareasMovimientosStore';

type FiltrosHistorialMovimientosStore = {
    filtrosHistorial: FiltrosTareasMovimientos;
    aplicarFiltrosHistorial: (filtros: FiltrosTareasMovimientos) => void;
    restablecerFiltrosHistorial: () => void;
};

export const useFiltrosHistorialMovimientosStore =
    create<FiltrosHistorialMovimientosStore>((set) => ({
        filtrosHistorial: crearFiltrosTareasIniciales(),

        aplicarFiltrosHistorial: (filtros) => {
            set({
                filtrosHistorial: {
                    ...filtros,
                },
            });
        },

        restablecerFiltrosHistorial: () => {
            set({
                filtrosHistorial: crearFiltrosTareasIniciales(),
            });
        },
    }));