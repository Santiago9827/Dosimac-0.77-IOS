/* eslint-disable prettier/prettier */

import { construirEndpointEspada } from "../../stores/apiConfig";

export async function obtenerLecturaEspada(crotal: string) {
    const baseUrl = await construirEndpointEspada("readCrotal");

    const respuesta = await fetch(`${baseUrl}/${encodeURIComponent(crotal)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
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

export async function obtenerAnimalPorId(id: string) {
    const baseUrl = await construirEndpointEspada("readId");

    const respuesta = await fetch(`${baseUrl}/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
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

export async function postActualizarId(
    payload: { crotal: number; id: string }
) {
    const endpoint = await construirEndpointEspada("updateId");

    const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await res.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = rawText;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return { ok: res.ok, status: res.status, data, rawText };
}

export async function obtenerCorralMaternidad(corral: string) {
    const baseUrl = await construirEndpointEspada("readPenMaternity");

    const respuesta = await fetch(`${baseUrl}/${encodeURIComponent(corral)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
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

export async function putActualizarCrotal(
    payload: { crotal: number; id: string | number }
) {
    const endpoint = await construirEndpointEspada("updateCrotal");

    const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await res.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = rawText;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return {
        ok: res.ok,
        status: res.status,
        data,
        rawText,
    };
}

export async function comprobarCrotalLibre(crotal: string) {
    const baseReadCrotal = await construirEndpointEspada("readCrotal");

    const baseFreeCrotal = baseReadCrotal.replace(
        /\/api\/espada\/readCrotal\/?$/i,
        "/api/app/v1/freeCrotal"
    );

    const respuesta = await fetch(`${baseFreeCrotal}/${encodeURIComponent(crotal)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await respuesta.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = rawText;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return {
        ok: respuesta.ok,
        status: respuesta.status,
        data,
        rawText,
    };
}

export async function postMaternityPorId(
    payload: { id: string | number; corral: number }
) {
    const baseReadCrotal = await construirEndpointEspada("readCrotal");

    const endpoint = baseReadCrotal.replace(
        /\/api\/espada\/readCrotal\/?$/i,
        "/api/app/v1/maternity"
    );

    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await res.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = rawText;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return {
        ok: res.ok,
        status: res.status,
        data,
        rawText,
    };
}

export async function postMaternitySalidaPorId(id: string | number) {
    const baseReadCrotal = await construirEndpointEspada("readCrotal");

    const endpoint = baseReadCrotal.replace(
        /\/api\/espada\/readCrotal\/?$/i,
        "/api/app/v1/maternity/exitById"
    );

    const res = await fetch(`${endpoint}/${encodeURIComponent(String(id))}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    let data: any = null;
    let rawText = "";

    try {
        rawText = await res.text();

        if (rawText) {
            try {
                data = JSON.parse(rawText);
            } catch {
                data = rawText;
            }
        }
    } catch {
        rawText = "";
        data = null;
    }

    return {
        ok: res.ok,
        status: res.status,
        data,
        rawText,
    };
}

// Función para mostrar solo fecha
export function formatearSoloFecha(fecha?: string) {
    if (!fecha) return "—";

    const fechaLimpia = String(fecha).replace("Z[UTC]", "Z");
    const d = new Date(fechaLimpia);

    if (Number.isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("es-ES");
}

export const formatearFecha = (fecha?: string) => {
    if (!fecha) return "—";

    try {
        const fechaLimpia = fecha.replace("[UTC]", "");
        const d = new Date(fechaLimpia);

        if (Number.isNaN(d.getTime())) return fecha;

        return d.toLocaleString("es-ES");
    } catch {
        return fecha;
    }
};

export const limpiarMensajeBackend = (mensaje?: string) => {
    if (!mensaje) return "";
    return mensaje.replace(/^Error:\s*/i, "").trim();
};