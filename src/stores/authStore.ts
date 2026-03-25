import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Usuario = {
  email?: string;
};

type AuthState = {
  token: string | null;
  usuario: Usuario | null;
  isHydrated: boolean;

  setHydrated: (v: boolean) => void;
  login: (token: string, usuario?: Usuario) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isHydrated: false,

      setHydrated: (v) => set({ isHydrated: v }),

      login: (token, usuario) => set({ token, usuario: usuario ?? null }),
      logout: () => set({ token: null, usuario: null }),
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