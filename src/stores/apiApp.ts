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
        const mensajeBackend =
            typeof datos === 'string'
                ? datos
                : datos?.message ??
                datos?.error ??
                datos?.mensaje ??
                datos?.detail ??
                texto;

        const mensajeNormalizado = String(mensajeBackend ?? '')
            .trim()
            .toLowerCase();

        if (mensajeNormalizado === 'the corral does not exist') {
            throw new Error('El corral no existe');
        }

        throw new Error(
            mensajeBackend ||
            'No se encontró el animal de maternidad.',
        );
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

/* =========================================================
   MOVIMIENTO ANIMAL — GESTACIÓN
   ========================================================= */

export type EntradaGestacionPayload = {
    id: string | number;
    corral: string | number;
};

export async function enviarEntradaGestacion(
    payload: EntradaGestacionPayload,
): Promise<any> {
    const endpoint = await construirEndpointAppV1('gestation');

    console.log('===== ENVIAR ENTRADA GESTACIÓN =====');
    console.log('ENDPOINT:', endpoint);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

    const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: String(payload.id),
            corral: Number(payload.corral),
        }),
    });

    return leerRespuesta(
        respuesta,
        'No se pudo enviar la entrada de gestación.',
    );
}

export async function enviarSalidaGestacionPorId(
    animalId: string | number,
): Promise<any> {
    const endpoint = await construirEndpointAppV1(
        `gestation/exitById/${encodeURIComponent(String(animalId))}`,
    );

    console.log('===== ENVIAR SALIDA GESTACIÓN POR ID =====');
    console.log('ENDPOINT:', endpoint);
    console.log('ID:', animalId);

    const respuesta = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    return leerRespuesta(
        respuesta,
        'No se pudo enviar la salida de gestación.',
    );
}

export async function consultarGestacionPorIdAnimal(
    animalId: string | number,
): Promise<any> {
    const idLimpio = String(animalId ?? '').trim();

    if (!idLimpio) {
        throw new Error('ID de animal no válido.');
    }

    const endpoint = await construirEndpointAppV1(
        `readGestationByIdAnimal/${encodeURIComponent(idLimpio)}`,
    );

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
        datosApi = null;
    }

    if (!respuesta.ok) {
        const mensajeBackend =
            datosApi?.message ??
            datosApi?.mensaje ??
            datosApi?.error ??
            datosApi?.detail ??
            texto ??
            'Animal de gestación no encontrado.';

        throw new Error(String(mensajeBackend));
    }

    return datosApi;
}
export type OperacionGestacionPayload = {
    op: string;
    key: string | number;
    value: string | number;
};

export async function ejecutarOperacionGestacion(
    payload: OperacionGestacionPayload,
): Promise<any> {
    const endpoint = await construirEndpointAppV1(
        'gestation/operations/',
    );

    console.log('===== EJECUTAR OPERACIÓN GESTACIÓN =====');
    console.log('ENDPOINT:', endpoint);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

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

    return leerRespuesta(
        respuesta,
        'No se pudo realizar la operación de gestación.',
    );
}
export type CurvaGestacionApi = {
    id: number;
    name: string;
};

export async function consultarCurvasGestacion(): Promise<CurvaGestacionApi[]> {
    const datos = await consultarCurvas();

    return Array.isArray(datos)
        ? datos
            .map((curva: any) => ({
                id: Number(curva.id),
                name: String(
                    curva.name ??
                    curva.description ??
                    '',
                ).trim(),
            }))
            .filter((curva: CurvaGestacionApi) =>
                Number.isFinite(curva.id) &&
                curva.name,
            )
        : [];
}

export type RespuestaCorralGestacion = {
    ok: boolean;
    status: number;
    data: any;
    rawText: string;
};

export async function consultarCorralGestacion(
    corral: string | number,
): Promise<RespuestaCorralGestacion> {
    const corralLimpio = String(corral ?? '').trim();

    if (!corralLimpio) {
        throw new Error('Corral no válido.');
    }

    const endpoint = await construirEndpointApiDirecta(
        `espada/readPenGestation/${encodeURIComponent(corralLimpio)}`,
    );

    console.log('===== CONSULTAR CORRAL GESTACIÓN =====');
    console.log('ENDPOINT:', endpoint);
    console.log('CORRAL:', corralLimpio);

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

    return {
        ok: respuesta.ok,
        status: respuesta.status,
        data: datos,
        rawText: texto,
    };
}

/* =========================================================
   TAREAS DE MOVIMIENTO ANIMAL
   ========================================================= */

export type TipoTareaMovimientoAnimal =
    | 'Entrada'
    | 'Salida'
    | 'Traslado Entrada'
    | 'Traslado Salida';

export type TareaMovimientoAnimalApi = {
    id: string;
    tipoOperacion: TipoTareaMovimientoAnimal;
    idAnimal: string;
    crotal: string;
    corralDestino?: string;
    fecha: string;
    raw?: any;
};

type TipoEndpointTareasMovimientoAnimal =
    | 'gestacion'
    | 'maternidad'
    | 'todos'
    | 'realizada'
    | 'operation'
    | 'gestacion/historico'
    | 'maternidad/historico';

async function construirEndpointTareasMovimientoAnimal(
    tipo: TipoEndpointTareasMovimientoAnimal,
): Promise<string> {
    return construirEndpointApiDirecta(
        `tareas-movimiento-animal/${tipo}`,
    );
}

function normalizarTipoOperacion(
    valor: any,
): TipoTareaMovimientoAnimal {
    const texto = String(valor ?? '')
        .trim()
        .toLowerCase();

    if (
        texto === 'entrada' ||
        texto === 'gestation' ||
        texto === 'maternity' ||
        texto === 'gestacion entrada' ||
        texto === 'maternidad entrada'
    ) {
        return 'Entrada';
    }

    if (
        texto === 'salida' ||
        texto === 'out_of_gestation' ||
        texto === 'out_of_maternity'
    ) {
        return 'Salida';
    }

    if (
        texto === 'traslado entrada' ||
        texto === 'traslado_entrada' ||
        texto === 'trasladoentrada'
    ) {
        return 'Traslado Entrada';
    }

    if (
        texto === 'traslado salida' ||
        texto === 'traslado_salida' ||
        texto === 'trasladosalida'
    ) {
        return 'Traslado Salida';
    }

    return 'Salida';
}

function normalizarTipoOperacionDesdeTarea(
    tarea: any,
): TipoTareaMovimientoAnimal {
    const texto = String(
        tarea.tipoOperacion ??
        tarea.tipo_operacion ??
        tarea.operacion ??
        tarea.tipo ??
        tarea.movimiento ??
        tarea.tarea ??
        '',
    )
        .trim()
        .toLowerCase();

    const esTraslado =
        Number(tarea.traslado ?? 0) === 1 ||
        texto.includes('traslado');

    const esSalida =
        texto === 'salida' ||
        texto === 'out_of_gestation' ||
        texto === 'out_of_maternity' ||
        texto.includes('out_of');

    if (esSalida) {
        return esTraslado
            ? 'Traslado Salida'
            : 'Salida';
    }

    return esTraslado
        ? 'Traslado Entrada'
        : 'Entrada';
}

function normalizarTareaMovimientoAnimal(
    tarea: any,
    index: number,
): TareaMovimientoAnimalApi {
   const tipoOperacion =
    normalizarTipoOperacionDesdeTarea(tarea);

    const idAnimal =
        tarea.idAnimal ??
        tarea.id_animal ??
        tarea.animalId ??
        tarea.animal_id ??
        tarea.pkIdAnimal ??
        tarea.pkidAnimal ??
        tarea.id ??
        '';

    const crotal =
        tarea.crotal ??
        tarea.numeroCrotal ??
        tarea.numero_crotal ??
        tarea.earTag ??
        '';

    const corralDestino =
        tarea.corral ??
        tarea.corralDestino ??
        tarea.corral_destino ??
        tarea.corralDestinoId ??
        tarea.corralOrigen ??
        tarea.corral_origen ??
        tarea.pen ??
        undefined;

    const fecha =
        tarea.fecha ??
        tarea.date ??
        tarea.fechaMovimiento ??
        tarea.fecha_movimiento ??
        '';

    return {
        id: String(
            tarea.id ??
            tarea.pkid ??
            tarea.tareaId ??
            tarea.tarea_id ??
            `${tipoOperacion}-${idAnimal}-${fecha}-${index}`,
        ),
        tipoOperacion,
        idAnimal: String(idAnimal),
        crotal: String(crotal),
        corralDestino:
            corralDestino !== undefined &&
            corralDestino !== null
                ? String(corralDestino)
                : undefined,
        fecha: String(fecha),
        raw: tarea,
    };
}

async function consultarTareasMovimientoAnimal(
    tipo: 'gestacion' | 'maternidad',
): Promise<TareaMovimientoAnimalApi[]> {
    const endpoint =
        await construirEndpointTareasMovimientoAnimal(tipo);

    console.log('===== CONSULTAR TAREAS MOVIMIENTO =====');
    console.log('TIPO:', tipo);
    console.log('ENDPOINT:', endpoint);

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
        const mensajeBackend =
            datosApi?.message ??
            datosApi?.mensaje ??
            datosApi?.error ??
            datosApi?.detail ??
            texto ??
            'No se pudieron cargar las tareas de movimiento animal.';

        const errorConsulta: any = new Error(
            String(mensajeBackend),
        );

        errorConsulta.status = respuesta.status;

        throw errorConsulta;
    }

    const lista = Array.isArray(datosApi)
        ? datosApi
        : Array.isArray(datosApi?.data)
          ? datosApi.data
          : Array.isArray(datosApi?.content)
            ? datosApi.content
            : [];

    return lista
        .filter(
            (tarea: any) =>
                Number(tarea.realizado ?? 0) === 0,
        )
        .map((tarea: any, index: number) =>
            normalizarTareaMovimientoAnimal(tarea, index),
        );
}

export async function consultarTareasMovimientoGestacion(): Promise<
    TareaMovimientoAnimalApi[]
> {
    return consultarTareasMovimientoAnimal('gestacion');
}

export async function consultarTareasMovimientoMaternidad(): Promise<
    TareaMovimientoAnimalApi[]
> {
    return consultarTareasMovimientoAnimal('maternidad');
}

export async function consultarTareasMovimientoTodos(): Promise<
    TareaMovimientoAnimalApi[]
> {
    const tareas =
        await consultarTareasMovimientoAnimalRaw('todos');

    return tareas
        .filter(
            (tarea: any) =>
                Number(tarea.realizado ?? 0) === 0,
        )
        .map((tarea: any, index: number) =>
            normalizarTareaMovimientoAnimal(
                tarea,
                index,
            ),
        );
}

/* =========================================================
   CONTEO DE TAREAS
   ========================================================= */

export type TareaMovimientoAnimalBackend = {
    corral?: number;
    corralOrigen?: number;
    corralDestino?: number;
    fecha?: string;
    idAnimal?: string;
    pkIdAnimal?: number;
    crotal?: number;
    realizado?: number;
    tarea?: string;
    traslado?: number;

};

export type ConteoMovimiento = {
    entrada: number;
    salida: number;
};

export type ConteosTareasMovimientoAnimal = {
    gestacion: ConteoMovimiento;
    maternidad: ConteoMovimiento;
};

async function consultarTareasMovimientoAnimalRaw(
    tipo: TipoEndpointTareasMovimientoAnimal,
): Promise<TareaMovimientoAnimalBackend[]> {
    const endpoint =
        await construirEndpointTareasMovimientoAnimal(tipo);

    console.log('===== CONSULTAR TAREAS RAW =====');
    console.log('TIPO:', tipo);
    console.log('ENDPOINT:', endpoint);

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
        const mensajeBackend =
            datosApi?.message ??
            datosApi?.mensaje ??
            datosApi?.error ??
            datosApi?.detail ??
            texto ??
            'No se pudieron cargar las tareas de movimiento animal.';

        const errorConsulta: any = new Error(
            String(mensajeBackend),
        );

        errorConsulta.status = respuesta.status;

        throw errorConsulta;
    }

    return Array.isArray(datosApi)
        ? datosApi
        : Array.isArray(datosApi?.data)
          ? datosApi.data
          : Array.isArray(datosApi?.content)
            ? datosApi.content
            : [];
}

function crearConteosTareasMovimiento(): ConteosTareasMovimientoAnimal {
    return {
        gestacion: {
            entrada: 0,
            salida: 0,
        },
        maternidad: {
            entrada: 0,
            salida: 0,
        },
    };
}

function contarTareasMovimientoTodos(
    tareas: TareaMovimientoAnimalBackend[],
): ConteosTareasMovimientoAnimal {
    const conteos = crearConteosTareasMovimiento();

    tareas.forEach(tareaActual => {
        const tareaTexto = String(
            tareaActual.tarea ?? '',
        )
            .trim()
            .toLowerCase();

        const realizado = Number(
            tareaActual.realizado ?? 0,
        );

        if (realizado !== 0) {
            return;
        }

        const esSalida =
            tareaTexto.startsWith('out_of_');

        const tipoBase = tareaTexto.replace(
            /^out_of_/,
            '',
        );

        if (tipoBase === 'gestation') {
            if (esSalida) {
                conteos.gestacion.salida += 1;
            } else {
                conteos.gestacion.entrada += 1;
            }

            return;
        }

        if (tipoBase === 'maternity') {
            if (esSalida) {
                conteos.maternidad.salida += 1;
            } else {
                conteos.maternidad.entrada += 1;
            }
        }
    });

    return conteos;
}

export async function consultarConteosTareasMovimientoTodos(): Promise<
    ConteosTareasMovimientoAnimal
> {
    const tareas =
        await consultarTareasMovimientoAnimalRaw('todos');

    return contarTareasMovimientoTodos(tareas);
}

/* =========================================================
   CORRALES DE MOVIMIENTO ANIMAL
   ========================================================= */

export type TipoCorralMovimientoAnimal =
    | 'gestation'
    | 'maternity';

export type CorralMovimientoAnimalApi = {
    id: number;
    idHouse: number;
    name: number;
    tagRfid: number;
};

async function construirEndpointCorralesMovimientoAnimal(
    tipo: TipoCorralMovimientoAnimal,
): Promise<string> {
    return construirEndpointApiDirecta(
        `corral/${tipo}`,
    );
}

async function consultarCorralesMovimientoAnimal(
    tipo: TipoCorralMovimientoAnimal,
): Promise<CorralMovimientoAnimalApi[]> {
    const endpoint =
        await construirEndpointCorralesMovimientoAnimal(tipo);

    console.log('===== CONSULTAR CORRALES =====');
    console.log('TIPO:', tipo);
    console.log('ENDPOINT:', endpoint);

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
        const mensajeBackend =
            datosApi?.message ??
            datosApi?.mensaje ??
            datosApi?.error ??
            datosApi?.detail ??
            texto ??
            'No se pudieron cargar los corrales.';

        const errorConsulta: any = new Error(
            String(mensajeBackend),
        );

        errorConsulta.status = respuesta.status;

        throw errorConsulta;
    }

    const lista = Array.isArray(datosApi)
        ? datosApi
        : Array.isArray(datosApi?.data)
          ? datosApi.data
          : Array.isArray(datosApi?.content)
            ? datosApi.content
            : [];

    return lista
        .map((corral: any) => ({
            id: Number(corral.id),
            idHouse: Number(corral.idHouse),
            name: Number(corral.name),
            tagRfid: Number(corral.tagRfid),
        }))
        .filter(
            (corral: CorralMovimientoAnimalApi) =>
                Number.isFinite(corral.id) &&
                Number.isFinite(corral.name),
        );
}

export async function consultarCorralesGestacion(): Promise<
    CorralMovimientoAnimalApi[]
> {
    return consultarCorralesMovimientoAnimal(
        'gestation',
    );
}

export async function consultarCorralesMaternidad(): Promise<
    CorralMovimientoAnimalApi[]
> {
    return consultarCorralesMovimientoAnimal(
        'maternity',
    );
}

export function crearMapaCorralesPorId(
    corrales: CorralMovimientoAnimalApi[],
): Record<number, number> {
    return corrales.reduce<Record<number, number>>(
        (acumulado, corral) => {
            acumulado[corral.id] = corral.name;

            return acumulado;
        },
        {},
    );
}

/* =========================================================
   MARCAR TAREA COMO REALIZADA
   ========================================================= */

export async function enviarTareaMovimientoAnimalRealizada(
    idTarea: string | number,
    value: string | number = '',
): Promise<any> {

    const endpoint =
        await construirEndpointTareasMovimientoAnimal(
            'operation',
        );

    const payload = {
        op: 'marcar_realizado',
        key: String(idTarea),
        value: String(value ?? ''),
    };

    console.log('===== MARCAR TAREA =====');
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

    const texto = await respuesta.text();

    let datosRespuesta: any = null;

    try {
        datosRespuesta = texto
            ? JSON.parse(texto)
            : null;
    } catch {
        datosRespuesta = texto;
    }

    if (!respuesta.ok) {
        const mensajeBackend =
            datosRespuesta?.message ??
            datosRespuesta?.mensaje ??
            datosRespuesta?.error ??
            datosRespuesta?.detail ??
            texto ??
            'No se pudo marcar la tarea como realizada.';

        const errorConsulta: any = new Error(
            String(mensajeBackend),
        );

        errorConsulta.status = respuesta.status;

        throw errorConsulta;
    }

    return datosRespuesta;
}


export async function obtenerIdCorralMaternidadPorNombre(
    corralName: string | number,
): Promise<number> {
    const corralNameNumero = Number(corralName);

    if (
        !Number.isFinite(corralNameNumero) ||
        corralNameNumero <= 0
    ) {
        throw new Error('Corral no válido.');
    }

    const corrales =
        await consultarCorralesMaternidad();

    const corralEncontrado = corrales.find(
        corral =>
            Number(corral.name) ===
            corralNameNumero,
    );

    if (!corralEncontrado) {
        throw new Error(
            'No se encontró el identificador interno de ese corral.',
        );
    }

    return corralEncontrado.id;
}
export type RespuestaValidacionCorralMaternidad = {
    ok: boolean;
    status: number;
    data: any;
    rawText: string;
};

export async function validarCorralMaternidadParaTarea(
    corral: string | number,
): Promise<RespuestaValidacionCorralMaternidad> {
    const corralLimpio = String(corral ?? '').trim();

    if (!corralLimpio) {
        throw new Error('Corral no válido.');
    }

    const endpoint = await construirEndpointAppV1(
        `readMaternityPen/${encodeURIComponent(corralLimpio)}`,
    );

    console.log('===== VALIDAR CORRAL MATERNIDAD PARA TAREA =====');
    console.log('ENDPOINT:', endpoint);
    console.log('CORRAL:', corralLimpio);

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

    console.log('RESPUESTA VALIDACIÓN CORRAL:', {
        ok: respuesta.ok,
        status: respuesta.status,
        data: datosApi,
        rawText: texto,
    });

    return {
        ok: respuesta.ok,
        status: respuesta.status,
        data: datosApi,
        rawText: texto,
    };
}

export type TipoSeccionHistorialMovimiento =
    | 'Gestación'
    | 'Maternidad';

export type HistorialMovimientoAnimalApi = {
    id: string;
    tipoOperacion: 'Entrada' | 'Salida';
    seccion: TipoSeccionHistorialMovimiento;
    idAnimal: string;
    crotal: string;
    corralId?: string;
    fecha: string;
    fechaRealizado: string;
    raw?: any;
};

function normalizarFechaHistorialMovimiento(
    fechaApi: string,
): string {
    const texto = String(fechaApi ?? '').trim();

    const coincidencia = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/,
    );

    if (!coincidencia) {
        return texto;
    }

    const [, anio, mes, dia] = coincidencia;

    return `${dia}/${mes}/${anio}`;
}

function normalizarHistorialMovimientoAnimal(
    tarea: any,
    seccion: TipoSeccionHistorialMovimiento,
    index: number,
): HistorialMovimientoAnimalApi {
    const tareaTexto = String(
        tarea?.tarea ?? '',
    )
        .trim()
        .toLowerCase();

    const tipoOperacion: 'Entrada' | 'Salida' =
        tareaTexto.startsWith('out_of_')
            ? 'Salida'
            : 'Entrada';

    const corral =
        tarea?.corral ??
        tarea?.corralDestino ??
        tarea?.corralOrigen ??
        undefined;

    return {
        id: String(
            tarea?.id ??
            `${seccion}-${tarea?.idAnimal ?? ''}-${index}`,
        ),
        tipoOperacion,
        seccion,
        idAnimal: String(
            tarea?.idAnimal ??
            tarea?.pkIdAnimal ??
            '',
        ),
        crotal: String(
            tarea?.crotal ??
            '',
        ),
        corralId:
            corral !== undefined &&
            corral !== null
                ? String(corral)
                : undefined,
        fecha: normalizarFechaHistorialMovimiento(
            String(tarea?.fecha ?? ''),
        ),
        fechaRealizado: normalizarFechaHistorialMovimiento(
        String(
            tarea?.fechaRealizado ??
            tarea?.fecha_realizado ??
            '',
        ),
    ),
        raw: tarea,
    };
}

async function consultarHistorialMovimientoAnimal(
    tipo: 'gestacion' | 'maternidad',
): Promise<HistorialMovimientoAnimalApi[]> {
    const endpoint =
        await construirEndpointTareasMovimientoAnimal(
            `${tipo}/historico`,
        );

    console.log('===== CONSULTAR HISTORIAL MOVIMIENTO =====');
    console.log('TIPO:', tipo);
    console.log('ENDPOINT:', endpoint);

    const respuesta = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    const texto = await respuesta.text();

    let datosApi: any = [];

    try {
        datosApi = texto
            ? JSON.parse(texto)
            : [];
    } catch {
        datosApi = [];
    }

    if (!respuesta.ok) {
        const mensajeBackend =
            datosApi?.message ??
            datosApi?.mensaje ??
            datosApi?.error ??
            datosApi?.detail ??
            'No se pudo cargar el historial de movimientos.';

        const errorConsulta: any =
            new Error(String(mensajeBackend));

        errorConsulta.status =
            respuesta.status;

        throw errorConsulta;
    }

    const lista = Array.isArray(datosApi)
        ? datosApi
        : Array.isArray(datosApi?.data)
          ? datosApi.data
          : Array.isArray(datosApi?.content)
            ? datosApi.content
            : [];

    const seccion: TipoSeccionHistorialMovimiento =
        tipo === 'gestacion'
            ? 'Gestación'
            : 'Maternidad';

    return lista.map(
        (tarea: any, index: number) =>
            normalizarHistorialMovimientoAnimal(
                tarea,
                seccion,
                index,
            ),
    );
}

export async function consultarHistorialMovimientoGestacion(): Promise<
    HistorialMovimientoAnimalApi[]
> {
    return consultarHistorialMovimientoAnimal(
        'gestacion',
    );
}

export async function consultarHistorialMovimientoMaternidad(): Promise<
    HistorialMovimientoAnimalApi[]
> {
    return consultarHistorialMovimientoAnimal(
        'maternidad',
    );
}