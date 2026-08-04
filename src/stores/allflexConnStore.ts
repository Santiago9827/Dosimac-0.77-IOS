// stores/allflexConnStore.ts
/* eslint-disable prettier/prettier */
import { create } from 'zustand';
import {
    conectarAllflexLpr,
    desconectarAllflexLpr,
    ModoBusquedaLector,
} from '../device/ble/allflexIosLibrary';

type State = {
    currentId: string | null;
    currentName: string | null;
    connecting: boolean;
    isConnected: boolean;
    error: string | null;

    lastTag: string | null;
    history: string[];

    modoBusqueda: ModoBusquedaLector;
    setModoBusqueda: (modo: ModoBusquedaLector) => void;

    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    clearHistory: () => void;
    clearLastTag: () => void;
};

export const useAllflexConn = create<State>((set, get) => ({
    currentId: null,
    currentName: null,
    connecting: false,
    isConnected: false,
    error: null,

    lastTag: null,
    history: [],

    modoBusqueda: 'lpr',

    setModoBusqueda: (modo) => set({ modoBusqueda: modo }),

    connect: async () => {
        set({
            connecting: true,
            error: null,
        });

        try {
            const modoBusqueda = get().modoBusqueda;

            const dispositivo = await conectarAllflexLpr(
                (crotal) => {
                    set((s) => ({
                        lastTag: crotal,
                        history: [crotal, ...s.history].slice(0, 50),
                    }));
                },
                () => {
                    // Texto recibido del lector. De momento no lo usamos.
                },
                modoBusqueda
            );

            set({
                currentId: dispositivo.id || dispositivo.address || null,
                currentName: dispositivo.name || 'Allflex LPR',
                isConnected: true,
                error: null,
            });
        } catch (e: any) {
            set({
                error: String(e?.message || e),
                isConnected: false,
            });

            throw e;
        } finally {
            set({
                connecting: false,
            });
        }
    },

    disconnect: async () => {
        try {
            await desconectarAllflexLpr();
        } catch {}

        set({
            currentId: null,
            currentName: null,
            isConnected: false,
            lastTag: null,
        });
    },

    clearHistory: () => set({ history: [], lastTag: null }),
    clearLastTag: () => set({ lastTag: null }),
}));