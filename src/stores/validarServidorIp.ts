import { extraerOrigin, normalizeToUrl } from "./ipConfig";

function construirUrlValidateTokenDesdeBase(baseUrl: string) {
  const origin = extraerOrigin(baseUrl);
  return `${origin}/CtiAlimentacionAPI/api/espada/validateToken`;
}

export async function validarServidorPorIp(inputIp: string) {
  const baseUrl = normalizeToUrl(inputIp);
  const endpoint = construirUrlValidateTokenDesdeBase(baseUrl);

  try {
    const respuesta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: "" }),
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
      baseUrl,
      endpoint,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      rawText: error?.message || "No se pudo conectar con el servidor",
      baseUrl,
      endpoint,
    };
  }
}