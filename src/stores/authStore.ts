import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Usuario = {
  email?: string;
  username?: string;
};

type AuthState = {
  token: string | null;
  usuario: Usuario | null;
  rol: string[];
  isHydrated: boolean;

  setHydrated: (v: boolean) => void;
  login: (token: string, usuario?: Usuario, rol?: string[]) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      rol: [],
      isHydrated: false,

      setHydrated: (v) => set({ isHydrated: v }),

      login: (token, usuario, rol = []) =>
        set({
          token,
          usuario: usuario ?? null,
          rol,
        }),

      logout: () =>
        set({
          token: null,
          usuario: null,
          rol: [],
        }),
    }),
    {
      name: "dosimac-auth",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);