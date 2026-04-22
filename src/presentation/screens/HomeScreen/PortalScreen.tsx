import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../../stores/authStore";
import { extraerOrigin } from "../../../stores/ipConfig";
import Ionicons from "react-native-vector-icons/Ionicons";

const STORAGE_KEY = "@cti_portal_base_url";

function construirUrlPortalDesdeApi(baseUrl: string, token: string) {
  const origin = extraerOrigin(baseUrl);
  const origin8080 = origin.replace(/:\d+$/, ":8080");
  return `${origin8080}/CtiAlimentacion/login.xhtml?type=espada&token=${encodeURIComponent(token)}`;
}

async function comprobarPortalConTimeout(url: string, timeoutMs = 10000) {
  const controlador = new AbortController();

  const timeout = setTimeout(() => {
    controlador.abort();
  }, timeoutMs);

  try {
    const respuesta = await fetch(url, {
      method: "GET",
      signal: controlador.signal,
    });

    clearTimeout(timeout);

    return {
      ok: respuesta.ok,
      status: respuesta.status,
    };
  } catch (error: any) {
    clearTimeout(timeout);

    if (error?.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        timeout: true,
      };
    }

    return {
      ok: false,
      status: 0,
      timeout: false,
    };
  }
}

export const PortalScreen = () => {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const [urlPortal, setUrlPortal] = useState<string | null>(null);
  const [preparandoUrl, setPreparandoUrl] = useState(true);
  const [comprobandoPortal, setComprobandoPortal] = useState(false);
  const [portalDisponible, setPortalDisponible] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errorPortal, setErrorPortal] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const prepararUrl = async () => {
      try {
        setPreparandoUrl(true);
        setError(null);
        setErrorPortal(null);
        setPortalDisponible(false);

        if (!isHydrated) return;

        if (!token) {
          setError("No hay token de sesión. Inicia sesión de nuevo.");
          return;
        }

        const baseUrlGuardada = await AsyncStorage.getItem(STORAGE_KEY);

        if (!baseUrlGuardada) {
          setError("No hay IP configurada. Configura primero la IP del servidor.");
          return;
        }

        const urlFinal = construirUrlPortalDesdeApi(baseUrlGuardada, token);

        console.log("PORTAL iOS baseUrlGuardada:", baseUrlGuardada);
        console.log("PORTAL iOS urlFinal:", urlFinal);

        setUrlPortal(urlFinal);
      } catch (e: any) {
        console.log("PORTAL iOS error preparando URL:", e);
        setError(e?.message || "No se pudo preparar la URL del portal.");
      } finally {
        setPreparandoUrl(false);
      }
    };

    prepararUrl();
  }, [token, isHydrated]);

  useEffect(() => {
    const validarPortal = async () => {
      if (!urlPortal) return;

      try {
        setComprobandoPortal(true);
        setErrorPortal(null);
        setPortalDisponible(false);

        const resultado = await comprobarPortalConTimeout(urlPortal, 10000);

        if (resultado.ok || resultado.status === 200 || resultado.status === 302) {
          setPortalDisponible(true);
          return;
        }

        if (resultado.timeout) {
          setErrorPortal("No se ha podido conectar con el portal. Verifica la red o la IP configurada.");
          return;
        }

        if (resultado.status > 0) {
          setErrorPortal(`No se ha podido abrir el portal. Error HTTP ${resultado.status}.`);
          return;
        }

        setErrorPortal("No se ha podido conectar con el portal. Verifica la red o la IP configurada.");
      } finally {
        setComprobandoPortal(false);
      }
    };

    validarPortal();
  }, [urlPortal, reloadKey]);

  if (!isHydrated || preparandoUrl) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Preparando portal...</Text>
      </View>
    );
  }

  if (!urlPortal) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ textAlign: "center", color: "#DC2626", fontWeight: "700" }}>
          {error ?? "No se pudo cargar el portal."}
        </Text>
      </View>
    );
  }

  if (comprobandoPortal) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#4B5563" }}>
          Comprobando conexión con el portal...
        </Text>
      </View>
    );
  }

  if (errorPortal) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          backgroundColor: "#F8FAFC",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 430,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <Ionicons name="cloud-offline-outline" size={32} color="#6B7280" />
          </View>

          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              color: "#111827",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            No hay conexión
          </Text>

          <Text
            style={{
              color: "#4B5563",
              fontSize: 18,
              lineHeight: 28,
              textAlign: "center",
            }}
          >
            {errorPortal}
          </Text>

          <TouchableOpacity
            onPress={() => {
              setErrorPortal(null);
              setPortalDisponible(false);
              setReloadKey((prev) => prev + 1);
            }}
            style={{
              marginTop: 28,
              backgroundColor: "#4F46E5",
              borderRadius: 14,
              paddingVertical: 14,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 17 }}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!portalDisponible) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        key={reloadKey}
        source={{ uri: urlPortal }}
        onError={(e) => {
          console.log("WEBVIEW iOS onError:", e.nativeEvent);
          setPortalDisponible(false);
          setErrorPortal("No se ha podido conectar con el portal. Verifica la red o la IP configurada.");
        }}
        onHttpError={(e) => {
          console.log("WEBVIEW iOS onHttpError:", e.nativeEvent);
          setPortalDisponible(false);
          setErrorPortal(`No se ha podido abrir el portal. Error HTTP ${e.nativeEvent.statusCode}.`);
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Cargando portal...</Text>
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
    </View>
  );
};