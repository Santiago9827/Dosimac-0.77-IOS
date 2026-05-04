import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../../../stores/authStore";

import { useTranslation } from "react-i18next";
import Ionicons from "react-native-vector-icons/Ionicons";
import { extraerOrigin } from "../../../stores/ipConfig";


const STORAGE_KEY = "@cti_portal_base_url";
const TIMEOUT_PORTAL_INICIAL_MS = 1500;
const TIMEOUT_PORTAL_REINTENTO_MS = 5000;

/* function construirUrlPortalDesdeApi(baseUrl: string, token: string) {
  const urlApi = new URL(baseUrl);

  urlApi.port = "8080";
  urlApi.pathname = "/CtiAlimentacion/login.xhtml";
  urlApi.search = "";

  urlApi.searchParams.set("type", "espada");
  urlApi.searchParams.set("token", token);

  return urlApi.toString();
} */

  function construirUrlPortalDesdeApi(baseUrl: string, token: string) {
  const origin = extraerOrigin(baseUrl);
  const origin8080 = origin.replace(/:\d+$/, ":8080");
  return `${origin8080}/CtiAlimentacion/login.xhtml?type=espada&token=${encodeURIComponent(token)}`;
}

async function comprobarPortalConTimeout(url: string, timeoutMs = TIMEOUT_PORTAL_INICIAL_MS) {
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
  const { t } = useTranslation();

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
           setError(t("portal_noSessionToken"));
          return;
        }

        const baseUrlGuardada = await AsyncStorage.getItem(STORAGE_KEY);

        if (!baseUrlGuardada) {
           setError(t("portal_noIpConfigured"));
          return;
        }

        const urlFinal = construirUrlPortalDesdeApi(baseUrlGuardada, token);
        setUrlPortal(urlFinal);
      } catch {
          setError(t("portal_prepareUrlError"));
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

      const timeoutActual =
        reloadKey === 0 ? TIMEOUT_PORTAL_INICIAL_MS : TIMEOUT_PORTAL_REINTENTO_MS;

      const resultado = await comprobarPortalConTimeout(urlPortal, timeoutActual);

      if (resultado.ok || resultado.status === 200 || resultado.status === 302) {
        setPortalDisponible(true);
        return;
      }

      if (resultado.timeout) {
        setErrorPortal(t("portal_connectionTimeout"));
        return;
      }

      if (resultado.status > 0) {
        setErrorPortal(t("portal_httpError", { status: resultado.status }));
        return;
      }

      setErrorPortal(t("portal_connectionError"));
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
        <Text style={{ marginTop: 10 }}>{t("portal_preparing")}</Text>
      </View>
    );
  }

  if (!urlPortal) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ textAlign: "center", color: "#DC2626", fontWeight: "700" }}>
          {error ?? t("portal_loadError")}
        </Text>
      </View>
    );
  }

  if (comprobandoPortal) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#4B5563" }}>{t("portal_checkingConnection")}</Text>
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
            {t("portal_noConnectionTitle")}
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
             {t("portal_retry")}
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
        source={{ uri: urlPortal }}
        onError={() => {
          setPortalDisponible(false);
          setErrorPortal(t("portal_connectionError"));
        }}
        onHttpError={(e) => {
          setPortalDisponible(false);
         setErrorPortal(t("portal_httpError", { status: e.nativeEvent.statusCode }));
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}> {t("portal_loading")}</Text>
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
    </View>
  );
};