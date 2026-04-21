import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cti_portal_base_url";

function construirUrlValidateToken(baseUrl: string) {
    const url = new URL(baseUrl);

    url.pathname = "/CtiAlimentacionAPI/api/espada/validateToken";
    url.search = "";

    return url.toString();
}

export async function validarTokenEspada(token: string) {
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

    const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
    });

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
}