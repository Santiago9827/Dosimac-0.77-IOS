/* eslint-disable prettier/prettier */
import { create } from 'zustand';

type AjustesEnvioGestacionState = {
    detectarDesconocidos: boolean;
    confirmar: boolean;
    setDetectarDesconocidos: (value: boolean) => void;
    setConfirmar: (value: boolean) => void;
};

export const useAjustesEnvioGestacionStore = create<AjustesEnvioGestacionState>((set) => ({
    detectarDesconocidos: true,
    confirmar: false,

    setDetectarDesconocidos: (value) => {
        set({ detectarDesconocidos: value });
    },

    setConfirmar: (value) => {
        set({ confirmar: value });
    },
}));