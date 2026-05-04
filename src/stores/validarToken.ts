import AsyncStorage from "@react-native-async-storage/async-storage";
import { extraerOrigin } from "./ipConfig";

const STORAGE_KEY = "@cti_portal_base_url";
const TIMEOUT_INICIO_MS = 2000;
const TIMEOUT_NORMAL_MS = 8000;

function construirUrlValidateToken(baseUrl: string) {
    //const url = new URL(baseUrl);

    //url.pathname = "/CtiAlimentacionAPI/api/espada/validateToken";
    //url.search = "";

    //return url.toString();
    const origin = extraerOrigin(baseUrl);
    return `${origin}/CtiAlimentacionAPI/api/espada/validateToken`;

}

export async function validarTokenEspada(
    token: string,
    timeoutMs = TIMEOUT_INICIO_MS
) {
    const baseUrlGuardada = await AsyncStorage.getItem(STORAGE_KEY);

    if (!baseUrlGuardada) {
        return {
            ok: false,
            status: 0,
            data: null,
            rawText: "No hay IP configurada",
        };
    }

    const endpoint = construirUrlValidateToken(baseUrlGuardada);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const respuesta = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let datos: any = null;
        let textoPlano = "";

        try {
            textoPlano = await respuesta.text();

            if (textoPlano) {
                try {
                    datos = JSON.parse(textoPlano);
                } catch {
                    datos = textoPlano;
                }
            }
        } catch {
            textoPlano = "";
            datos = null;
        }

        return {
            ok: respuesta.ok,
            status: respuesta.status,
            data: datos,
            rawText: textoPlano,
        };
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error?.name === "AbortError") {
            throw new Error("Tiempo de espera agotado al validar la sesión.");
        }

        throw new Error("No se pudo conectar con el servidor.");
    }
}

export { TIMEOUT_INICIO_MS, TIMEOUT_NORMAL_MS };