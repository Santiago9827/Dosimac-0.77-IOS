import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "@cti_portal_base_url";
export const DEFAULT_PATH = "/CtiAlimentacion/";
export const DEFAULT_PORT = "6060";

export function stripDefaultPort(host: string) {
  const [h, p] = host.split(":");
  if (p === DEFAULT_PORT) return h;
  return host;
}

export function toInputHost(raw: string) {
  const v = raw.trim();
  if (!v) return "";

  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      return stripDefaultPort(u.host);
    } catch {
      return v;
    }
  }

  const hostOnly = v.split("/")[0];
  return stripDefaultPort(hostOnly);
}

export function normalizeToUrl(inputRaw: string) {
  const input = inputRaw.trim();

  if (/^https?:\/\//i.test(input)) return input;

  const hasPort = input.includes(":");
  const base = hasPort ? input : `${input}:${DEFAULT_PORT}`;

  return `http://${base}${DEFAULT_PATH}`;
}

export function isValidIpOrHost(inputRaw: string) {
  const input = inputRaw.trim();
  if (!input) return false;

  if (/^https?:\/\//i.test(input)) {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }

  const [host, port] = input.split(":");

  const ipRegex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

  const hostRegex = /^[a-zA-Z0-9.-]+$/;

  const okHost = ipRegex.test(host) || hostRegex.test(host);
  if (!okHost) return false;

  if (port) {
    const p = Number(port);
    if (!Number.isFinite(p) || p < 1 || p > 65535) return false;
  }

  return true;
}

export function extraerOrigin(urlGuardada: string) {
  const valor = urlGuardada.trim().replace(/\/+$/, "");

  try {
    return new URL(valor).origin;
  } catch {
    const match = valor.match(/^(https?:\/\/[^/]+)/i);

    if (match?.[1]) return match[1];

    throw new Error("La URL guardada no es válida.");
  }
}

export async function obtenerBaseUrlGuardada() {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function guardarBaseUrl(input: string) {
  const finalUrl = normalizeToUrl(input);

  await AsyncStorage.setItem(STORAGE_KEY, finalUrl);

  return finalUrl;
}

export async function guardarBaseUrlDesdeServerIp(serverIp: string) {
  const ipLimpia = serverIp.trim();

  if (!ipLimpia) {
    throw new Error("La instalación no tiene Server IP configurada");
  }

  return guardarBaseUrl(ipLimpia);
}

export async function borrarBaseUrlGuardada() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function construirEndpointValidateTokenDesdeBase(baseUrl: string) {
  const origin = extraerOrigin(baseUrl);

  return `${origin}/CtiAlimentacionAPI/api/espada/validateToken`;
}

async function fetchConTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 4500
) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function validarInstalacionActiva() {
  const baseUrlGuardada = await obtenerBaseUrlGuardada();

  if (!baseUrlGuardada) {
    return {
      ok: false,
      tipo: "sin_ip" as const,
      mensaje: "No hay una IP configurada.",
    };
  }

  try {
    const endpoint = construirEndpointValidateTokenDesdeBase(baseUrlGuardada);

    console.log("========== DEBUG VALIDAR INSTALACION ==========");
    console.log("baseUrlGuardada:", baseUrlGuardada);
    console.log("endpoint validateToken:", endpoint);

    const respuesta = await fetchConTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "" }),
      },
      3500
    );

    console.log("validateToken status:", respuesta.status);
    console.log("validateToken ok:", respuesta.ok);
    console.log("==============================================");

    if (respuesta.status === 404) {
      return {
        ok: false,
        tipo: "endpoint_no_disponible" as const,
        mensaje:
          "La instalación responde, pero no se encontró el servicio esperado.",
      };
    }

    return {
      ok: true,
      tipo: "disponible" as const,
      mensaje: "Instalación disponible.",
      status: respuesta.status,
    };
  } catch (error: any) {
    console.log("========== ERROR VALIDAR INSTALACION ==========");
    console.log("error name:", error?.name);
    console.log("error message:", error?.message);
    console.log("error completo:", error);
    console.log("==============================================");

    return {
      ok: false,
      tipo: "sin_conexion" as const,
      mensaje:
        "No se puede conectar con la instalación seleccionada. Comprueba que estás conectado a la red WiFi correcta o revisa la IP del servidor.",
    };
  }
}