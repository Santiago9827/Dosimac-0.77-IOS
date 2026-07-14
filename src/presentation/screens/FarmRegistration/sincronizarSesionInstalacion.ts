import {
  guardarBaseUrlDesdeServerIp,
  borrarBaseUrlGuardada,
} from "../../../stores/ipConfig";

import { useAuthStore } from "../../../stores/authStore";
import { farmFacility } from "../../../sharedTypes/farmInterface";
import { loginEspada } from "../login/loginEspada";

export async function sincronizarSesionInstalacion(instalacion: farmFacility) {
  const serverIpLimpia = String(instalacion.serverIp ?? "").trim();
  const usernameLimpio = String(instalacion.userName ?? "").trim();
  const passwordLimpia = String(instalacion.password ?? "").trim();

  const { login, logout } = useAuthStore.getState();

  /**
   * Muy importante:
   * Siempre limpiamos el token anterior antes de cambiar de instalación.
   * Así evitamos abrir CTIFEED con un token de otra instalación.
   */
  logout();

  if (!serverIpLimpia) {
    await borrarBaseUrlGuardada();

    return {
      ok: false,
      tipo: "sin_ip" as const,
      mensaje: "La instalación no tiene Server IP configurada.",
    };
  }

  /**
   * Guardamos siempre la IP activa de la instalación seleccionada.
   */
  await guardarBaseUrlDesdeServerIp(serverIpLimpia);

  const tieneUsername = !!usernameLimpio;
  const tienePassword = !!passwordLimpia;

  /**
   * Tiene IP, pero no tiene usuario ni clave.
   * La instalación puede quedar seleccionada, pero CTIFEED no podrá abrir sesión.
   */
  if (!tieneUsername && !tienePassword) {
    return {
      ok: true,
      tipo: "sin_login" as const,
      mensaje: "La instalación tiene IP, pero no tiene Username y Clave.",
    };
  }

  /**
   * Tiene solo uno de los dos campos.
   * Esto lo consideramos configuración incompleta.
   */
  if (tieneUsername !== tienePassword) {
    return {
      ok: false,
      tipo: "login_incompleto" as const,
      mensaje: "La instalación debe tener Username y Clave, o ambos campos vacíos.",
    };
  }

  const respuestaLogin = await loginEspada({
    username: usernameLimpio,
    password: passwordLimpia,
  });

  if (respuestaLogin.errorMessage) {
    logout();

    return {
      ok: false,
      tipo: "login_error" as const,
      mensaje: respuestaLogin.errorMessage,
    };
  }

  if (!respuestaLogin.ok) {
    logout();

    return {
      ok: false,
      tipo: "login_error" as const,
      mensaje: "El usuario o la clave de esta instalación no son correctos.",
    };
  }

  const token =
    respuestaLogin.data?.token ??
    respuestaLogin.data?.accessToken ??
    respuestaLogin.data?.jwt ??
    null;

  if (!token) {
    logout();

    return {
      ok: false,
      tipo: "sin_token" as const,
      mensaje: "El servidor respondió, pero no devolvió token.",
    };
  }

  const rol = Array.isArray(respuestaLogin.data?.rol)
    ? respuestaLogin.data.rol.map(String)
    : [];

  login(token, { username: usernameLimpio }, rol);

  return {
    ok: true,
    tipo: "login_ok" as const,
    mensaje: "Sesión iniciada correctamente.",
    rol,
  };
}