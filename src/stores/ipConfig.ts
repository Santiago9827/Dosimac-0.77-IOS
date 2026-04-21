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