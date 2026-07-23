import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { construirEndpointAppV1 } from "./stores/apiApp";

export const VERSION_MINIMA_API_MOVIL = 39;
export const VERSION_API_TAREAS = 39;

type InfoVersionServidor = {
   version: number;
   versionTexto: string;
   compatible: boolean;
   revisadoEn: string;
   error?: string;
};

type ApiMovilVersionStore = {
   versionesPorInstalacion: Record<string, InfoVersionServidor>;

   instalacionActualKey: string;
   versionActual: number;
   versionActualTexto: string;
   compatibleActual: boolean;
   versionComprobada: boolean;
   cargandoVersion: boolean;
   errorVersion: string;

   consultarVersionApiMovil: () => Promise<InfoVersionServidor>;
   puedeUsarFuncionalidad: (versionMinima: number) => boolean;
   limpiarVersionActual: () => void;
};

const obtenerKeyInstalacion = (endpoint: string) => {
   try {
      const url = new URL(endpoint);

      return `${url.protocol}//${url.host}`;
   } catch {
      return endpoint;
   }
};

const extraerVersion = (datos: any, textoPlano: string) => {
   const valor =
      datos?.version ??
      datos?.apiVersion ??
      datos?.mobileApiVersion ??
      datos?.data ??
      datos ??
      textoPlano;

   const texto = String(valor ?? "").trim();

   const match = texto.match(/\d+/);
   const version = match ? Number(match[0]) : 0;

   return {
      version: Number.isFinite(version) ? version : 0,
      versionTexto: texto,
   };
};

export const useApiMovilVersionStore = create<ApiMovilVersionStore>()(
   persist(
      (set, get) => ({
         versionesPorInstalacion: {},

         instalacionActualKey: "",
         versionActual: 0,
         versionActualTexto: "",
         compatibleActual: false,
         versionComprobada: false,
         cargandoVersion: false,
         errorVersion: "",

         consultarVersionApiMovil: async () => {
            let instalacionKey = "";

            try {
               set({
                  cargandoVersion: true,
                  errorVersion: "",
                  versionComprobada: false,
               });

               const endpoint = await construirEndpointAppV1("version");

               instalacionKey = obtenerKeyInstalacion(endpoint);

               console.log("Consultando versión API móvil:", endpoint);
               console.log("Instalación actual:", instalacionKey);

               const respuesta = await fetch(endpoint, {
                  method: "GET",
                  headers: {
                     Accept: "application/json",
                  },
               });

               const textoPlano = await respuesta.text();

               let datos: any = null;

               try {
                  datos = textoPlano ? JSON.parse(textoPlano) : null;
               } catch {
                  datos = textoPlano;
               }

               if (!respuesta.ok) {
                  const endpointNoExiste =
                     respuesta.status === 400 ||
                     respuesta.status === 404 ||
                     respuesta.status === 405;

                  if (endpointNoExiste) {
                     throw new Error("VERSION_ENDPOINT_NOT_FOUND");
                  }

                  const mensajeBackend =
                     datos?.message ??
                     datos?.mensaje ??
                     datos?.error ??
                     textoPlano ??
                     "No se pudo consultar la versión de la API móvil.";

                  throw new Error(String(mensajeBackend));
               }

               const { version, versionTexto } = extraerVersion(
                  datos,
                  textoPlano
               );

               const compatible = version >= VERSION_MINIMA_API_MOVIL;

               const infoVersion: InfoVersionServidor = {
                  version,
                  versionTexto,
                  compatible,
                  revisadoEn: new Date().toISOString(),
                  error: compatible
                     ? ""
                     : "El servidor no tiene una versión compatible.",
               };

               set((state) => ({
                  versionesPorInstalacion: {
                     ...state.versionesPorInstalacion,
                     [instalacionKey]: infoVersion,
                  },
                  instalacionActualKey: instalacionKey,
                  versionActual: infoVersion.version,
                  versionActualTexto: infoVersion.versionTexto,
                  compatibleActual: infoVersion.compatible,
                  versionComprobada: true,
                  cargandoVersion: false,
                  errorVersion: infoVersion.error ?? "",
               }));

               return infoVersion;
            } catch (error: any) {
               console.log("Error consultando versión API móvil:", error);

               const esServidorSinVersion =
                  error?.message === "VERSION_ENDPOINT_NOT_FOUND";

               const mensajeError = esServidorSinVersion
                  ? "Esta funcionalidad no es soportada por  la versión actual del servidor CTIFEED. Debe actualizar para el uso de esta aplicación."
                  : error?.message || "No se pudo comprobar la versión del servidor.";

               const infoVersion: InfoVersionServidor = {
                  version: 0,
                  versionTexto: "",
                  compatible: false,
                  revisadoEn: new Date().toISOString(),
                  error: mensajeError,
               };

               set((state) => ({
                  versionesPorInstalacion: instalacionKey
                     ? {
                          ...state.versionesPorInstalacion,
                          [instalacionKey]: infoVersion,
                       }
                     : state.versionesPorInstalacion,
                  instalacionActualKey: instalacionKey,
                  versionActual: 0,
                  versionActualTexto: "",
                  compatibleActual: false,
                  versionComprobada: true,
                  cargandoVersion: false,
                  errorVersion: mensajeError,
               }));

               return infoVersion;
            }
         },

         puedeUsarFuncionalidad: (versionMinima: number) => {
            const { compatibleActual, versionActual } = get();

            return compatibleActual && versionActual >= versionMinima;
         },

         limpiarVersionActual: () => {
            set({
               instalacionActualKey: "",
               versionActual: 0,
               versionActualTexto: "",
               compatibleActual: false,
               versionComprobada: false,
               cargandoVersion: false,
               errorVersion: "",
            });
         },
      }),
      {
         name: "api-movil-version-store",
         storage: createJSONStorage(() => AsyncStorage),
         partialize: (state) => ({
            versionesPorInstalacion: state.versionesPorInstalacion,
         }),
      }
   )
);