import React, { useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { HamburgerMenu } from "../../components/shared/HamburgerMenu";

const URL = "http://192.168.11.203:8080/CtiAlimentacion/";

export const PortalScreen = () => {
  const webRef = useRef<WebView>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      {/* Botón drawer */}
      {/* <View style={{ position: "absolute", top: 12, left: 12, zIndex: 50 }}>
        <HamburgerMenu variant="inline" color="white" size={30} />
      </View> */}

      {/* WebView */}
      <WebView
        ref={webRef}
        source={{ uri: URL }}
        onLoadStart={() => {
          setCargando(true);
          setError(null);
        }}
        onLoadEnd={() => setCargando(false)}
        onError={() => {
          setCargando(false);
          setError("No se pudo cargar el portal. Revisa que estés en la misma Wi-Fi.");
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Cargando portal...</Text>
          </View>
        )}
        // útil para formularios/login
        javaScriptEnabled
        domStorageEnabled
        // Android: si tu portal hace redirecciones http
        mixedContentMode="always"
      />

      {/* Overlay de error */}
      {error && (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <Text style={{ color: "white", marginBottom: 10 }}>{error}</Text>
          <TouchableOpacity
            onPress={() => webRef.current?.reload()}
            style={{
              backgroundColor: "white",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};