/* eslint-disable prettier/prettier */
import { create } from 'zustand';

type AjustesEnvioMaternidadState = {
  detectarDesconocidos: boolean;
  confirmar: boolean;
  setDetectarDesconocidos: (value: boolean) => void;
  setConfirmar: (value: boolean) => void;
};

export const useAjustesEnvioMaternidadStore = create<AjustesEnvioMaternidadState>((set) => ({
  detectarDesconocidos: true,
  confirmar: false,

  setDetectarDesconocidos: (value) => {
    set({ detectarDesconocidos: value });
  },

  setConfirmar: (value) => {
    set({ confirmar: value });
  },
}));