import AsyncStorage from "@react-native-async-storage/async-storage";
import { extraerOrigin } from "./ipConfig";

const STORAGE_KEY = "@cti_portal_base_url";

export async function construirEndpointEspada(ruta: string) {
  const baseGuardada = await AsyncStorage.getItem(STORAGE_KEY);

  if (!baseGuardada) {
    throw new Error("No hay IP configurada");
  }

  const origin = extraerOrigin(baseGuardada);
  return `${origin}/CtiAlimentacionAPI/api/espada/${ruta.replace(/^\/+/, "")}`;
}