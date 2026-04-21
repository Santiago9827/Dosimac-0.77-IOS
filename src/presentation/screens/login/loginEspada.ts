/* eslint-disable prettier/prettier */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cti_portal_base_url";

function extraerOrigin(urlGuardada: string) {
    const valor = urlGuardada.trim().replace(/\/+$/, "");

    try {
        const url = new URL(valor);
        return url.origin;
    } catch {
        const match = valor.match(/^(https?:\/\/[^/]+)/i);
        if (match?.[1]) return match[1];
        throw new Error("La URL guardada no es válida.");
    }
}

export async function loginEspada(payload: {
    username: string;
    password: string;
}) {
    const urlGuardada = await AsyncStorage.getItem(STORAGE_KEY);

    if (!urlGuardada) {
        return {
            ok: false,
            status: 0,
            data: null,
            rawText: "",
            errorMessage: "No hay una IP configurada. Ve a Configuración IP primero.",
        };
    }

    const origin = extraerOrigin(urlGuardada);
    const endpoint = `${origin}/CtiAlimentacionAPI/api/espada/login`;

    console.log("LOGIN urlGuardada:", urlGuardada);
    console.log("LOGIN origin:", origin);
    console.log("LOGIN endpoint:", endpoint);

    const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        errorMessage: null,
    };
}