import { obtenerBaseUrlGuardada } from './ipConfig';

/**
 * Construye una URL perteneciente a:
 *
 * /CtiAlimentacionAPI/api/app/v1/
 */
export async function construirEndpointAppV1(
    ruta: string,
): Promise<string> {
    const baseGuardada = await obtenerBaseUrlGuardada();

    if (!baseGuardada) {
        throw new Error('No hay IP configurada');
    }

    const baseLimpia = baseGuardada
        .trim()
        .replace(/^https?:\/\//i, '');

    const hostConPuerto = baseLimpia.split('/')[0];

    const host = hostConPuerto.split(':')[0];

    if (!host) {
        throw new Error(
            'La dirección de la instalación no es válida.',
        );
    }

    const rutaLimpia = ruta.replace(/^\/+/, '');

    const endpoint =
        `http://${host}:6060` +
        `/CtiAlimentacionAPI/api/app/v1/${rutaLimpia}`;

    console.log('BASE GUARDADA:', baseGuardada);
    console.log('HOST EXTRAÍDO:', host);
    console.log('ENDPOINT APP V1:', endpoint);

    return endpoint;
}

/**
 * Construye el endpoint utilizado para consultar las curvas.
 */
export async function construirEndpointCurvas(): Promise<string> {
    const baseGuardada = await obtenerBaseUrlGuardada();

    if (!baseGuardada) {
        throw new Error('No hay IP configurada');
    }

    const baseLimpia = baseGuardada
        .trim()
        .replace(/^https?:\/\//i, '');

    const hostConPuerto = baseLimpia.split('/')[0];

    const host = hostConPuerto.split(':')[0];

    if (!host) {
        throw new Error(
            'La dirección de la instalación no es válida.',
        );
    }

    const endpoint =
        `http://${host}:6060` +
        '/CtiAlimentacionAPI/api/curve/';

    console.log('ENDPOINT CURVAS:', endpoint);

    return endpoint;
}
/**
 * Convierte la respuesta del servidor a JSON cuando sea posible.
 */
async function leerRespuesta(
    respuesta: Response,
    mensajePorDefecto: string,
): Promise<any> {
    const texto = await respuesta.text();

    let datos: any = null;

    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = texto;
    }

    if (!respuesta.ok) {
        const mensajeBackend =
            datos?.message ??
            datos?.mensaje ??
            datos?.error ??
            datos?.detail ??
            datos?.title ??
            texto ??
            mensajePorDefecto;

        throw new Error(String(mensajeBackend));
    }

    return datos;
}

/* =========================================================
   NO ALIMENTADOS — MATERNIDAD
   ========================================================= */

export async function consultarAnimalesNoAlimentadosMaternidad(): Promise<
    any[]
> {
    const endpoint = await construirEndpointAppV1(
        'readMaternityUnfedAnimals',
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const datos = await leerRespuesta(
        respuesta,
        'No se pudieron cargar los animales no alimentados de maternidad.',
    );

    return Array.isArray(datos) ? datos : [];
}

export async function consultarMaternidadPorId(
    animalId: string | number,
): Promise<any> {
    const endpoint = await construirEndpointAppV1(
        `readMaternityId/${encodeURIComponent(String(animalId))}`,
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    return leerRespuesta(
        respuesta,
        'No se encontró el animal de maternidad.',
    );
}

export async function consultarMaternidadPorPkid(
    pkid: number,
): Promise<any> {
    const endpoint = await construirEndpointAppV1(
        `readMaternityPkId/${encodeURIComponent(String(pkid))}`,
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    return leerRespuesta(
        respuesta,
        'No se encontró el animal por su pkid.',
    );
}

export type ReporteNacidosPayload = {
    pkid: number;
    nacidosTotales: number;
    muertos: number;
    vivos: number;
    momificados: number;
    fecha: string;
};

export async function enviarReporteNacidos(
    payload: ReporteNacidosPayload,
): Promise<any> {
    const endpoint = await construirEndpointAppV1('reporteNacidos');

    console.log('===== ENVIAR REPORTE NACIDOS =====');
    console.log('ENDPOINT:', endpoint);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

    const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return leerRespuesta(
        respuesta,
        'No se pudo enviar la captura de lechones.',
    );
}

export async function consultarNumeroAnimalesMaternidad(): Promise<number> {
    const endpoint = await construirEndpointAppV1(
        'maternityNumberOfAnimals',
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const datos = await leerRespuesta(
        respuesta,
        'No se pudo consultar el número de animales en maternidad.',
    );

    const numero = Number(datos);

    if (!Number.isFinite(numero)) {
        throw new Error(
            'La respuesta del servidor no es un número válido.',
        );
    }

    return numero;
}

/* =========================================================
   NO ALIMENTADOS — GESTACIÓN
   ========================================================= */

export async function consultarAnimalesNoAlimentadosGestacion(): Promise<
    any[]
> {
    const endpoint = await construirEndpointAppV1(
        'readGestationUnfedAnimals',
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const datos = await leerRespuesta(
        respuesta,
        'No se pudieron cargar los animales no alimentados de gestación.',
    );

    return Array.isArray(datos) ? datos : [];
}

export async function consultarNumeroAnimalesGestacion(): Promise<number> {
    const endpoint = await construirEndpointAppV1(
        'gestationNumberOfAnimals',
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const datos = await leerRespuesta(
        respuesta,
        'No se pudo consultar el número de animales en gestación.',
    );

    const numero = Number(datos);

    if (!Number.isFinite(numero)) {
        throw new Error(
            'La respuesta del servidor no es un número válido.',
        );
    }

    return numero;
}

/* =========================================================
   CURVAS
   ========================================================= */

export async function consultarCurvas(): Promise<any[]> {
    const endpoint = await construirEndpointCurvas();

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const datos = await leerRespuesta(
        respuesta,
        'No se pudieron cargar las curvas.',
    );

    return Array.isArray(datos) ? datos : [];
}

export async function consultarNumeroPiensosMaternidad(): Promise<number> {
    const endpoint = await construirEndpointAppV1('maternityNumberOfFeed');

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const texto = await respuesta.text();

    let datosApi: any = null;

    try {
        datosApi = texto ? JSON.parse(texto) : null;
    } catch {
        datosApi = texto;
    }

    if (!respuesta.ok) {
        throw new Error('No se pudo consultar el número de piensos.');
    }

    const numero = Number(datosApi);

    return Number.isFinite(numero) ? numero : 1;
}

export type TareaCambioPiensoMaternidad = {
    corral: number;
    crotal: number;
    fecha: string;
    idAnimal: string;

    piensoDestino: string;
    piensoOrigen: string;

    piensoDestinoId: number;
    piensoOrigenId: number;

    posix: number;
    realizado: number;
};

function obtenerHostDesdeBaseGuardada(baseGuardada: string): string {
    const baseLimpia = baseGuardada
        .trim()
        .replace(/^https?:\/\//i, '');

    const hostConPuerto = baseLimpia.split('/')[0];

    const host = hostConPuerto.split(':')[0];

    if (!host) {
        throw new Error('La dirección de la instalación no es válida.');
    }

    return host;
}

async function construirEndpointApiDirecta(
    ruta: string,
): Promise<string> {
    const baseGuardada = await obtenerBaseUrlGuardada();

    if (!baseGuardada) {
        throw new Error('No hay IP configurada');
    }

    const host = obtenerHostDesdeBaseGuardada(baseGuardada);

    const rutaLimpia = ruta.replace(/^\/+/, '');

    const endpoint =
        `http://${host}:6060` +
        `/CtiAlimentacionAPI/api/${rutaLimpia}`;

    console.log('ENDPOINT API DIRECTA:', endpoint);

    return endpoint;
}

export async function consultarTareasCambioPiensoMaternidad(): Promise<
    TareaCambioPiensoMaternidad[]
> {
    const endpoint = await construirEndpointApiDirecta(
        'maternidad-tareas-cambio-pienso',
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const texto = await respuesta.text();

    let datos: any = [];

    try {
        datos = texto ? JSON.parse(texto) : [];
    } catch {
        datos = [];
    }

    if (!respuesta.ok) {
        throw new Error(
            'No se pudieron consultar las tareas de cambio de pienso.',
        );
    }

    return Array.isArray(datos) ? datos : [];
}
export async function consultarMaternidadPorCorral(
    corral: string | number,
): Promise<any> {
    const endpoint = await construirEndpointAppV1(
        `readMaternityPen/${encodeURIComponent(String(corral))}`,
    );

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const texto = await respuesta.text();

    let datos: any = null;

    try {
        datos = texto ? JSON.parse(texto) : null;
    } catch {
        datos = texto;
    }

    if (!respuesta.ok) {
        throw new Error('No se encontró el animal de maternidad.');
    }

    return datos;
}
export type OperacionMaternidadPayload = {
    op: string;
    key: string | number;
    value: string | number;
};

export async function ejecutarOperacionMaternidad(
    payload: OperacionMaternidadPayload,
): Promise<any> {
    const endpoint = await construirEndpointAppV1('maternity/operations/');

    const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            op: String(payload.op),
            key: String(payload.key),
            value: String(payload.value),
        }),
    });

    const texto = await respuesta.text();

    let datosRespuesta: any = null;

    try {
        datosRespuesta = texto ? JSON.parse(texto) : null;
    } catch {
        datosRespuesta = texto;
    }

    if (!respuesta.ok) {
        const mensajeBackend =
            datosRespuesta?.message ??
            datosRespuesta?.mensaje ??
            datosRespuesta?.error ??
            datosRespuesta?.detail ??
            datosRespuesta?.title ??
            texto ??
            'No se pudo realizar la operación.';

        throw new Error(String(mensajeBackend));
    }

    return datosRespuesta;
}

export async function construirEndpointCondicionCorporal(): Promise<string> {
    const baseGuardada = await obtenerBaseUrlGuardada();

    if (!baseGuardada) {
        throw new Error('No hay IP configurada');
    }

    const baseLimpia = baseGuardada
        .trim()
        .replace(/^https?:\/\//i, '');

    const hostConPuerto = baseLimpia.split('/')[0];
    const host = hostConPuerto.split(':')[0];

    if (!host) {
        throw new Error(
            'La dirección de la instalación no es válida.',
        );
    }

    const endpoint =
        `http://${host}:6060` +
        '/CtiAlimentacionAPI/api/bodyCondition/';

    console.log('ENDPOINT CONDICIÓN CORPORAL:', endpoint);

    return endpoint;
}

export async function consultarCondicionesCorporales() {
    const endpoint = await construirEndpointCondicionCorporal();

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const texto = await respuesta.text();

    let datosApi: any = [];

    try {
        datosApi = texto ? JSON.parse(texto) : [];
    } catch {
        datosApi = [];
    }

    if (!respuesta.ok) {
        throw new Error(
            'No se pudieron cargar las condiciones corporales.',
        );
    }

    return Array.isArray(datosApi) ? datosApi : [];
}