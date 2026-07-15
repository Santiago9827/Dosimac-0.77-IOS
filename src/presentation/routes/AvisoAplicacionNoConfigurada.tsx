import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  visible: boolean;
  top?: number;
  onPress: () => void;
  modo?: "flotante" | "normal";
};

export const AvisoAplicacionNoConfigurada = ({
  visible,
  top = 0,
  onPress,
  modo = "flotante",
}: Props) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        modo === "flotante"
          ? [styles.containerFlotante, { top }]
          : styles.containerNormal,
      ]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={22} color="#92400E" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          Aplicación no configurada
        </Text>

        <Text style={styles.text}>
          Configure la Dirección IP del Servidor
        </Text>

        <Text style={styles.link}>
          Pulse aquí
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 82,
    borderRadius: 24,

    backgroundColor: "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#F59E0B",

    paddingVertical: 10,
    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",
    gap: 14,

    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  containerFlotante: {
    position: "absolute",
    right: 16,
    left: 16,
    zIndex: 80,
  },

  containerNormal: {
    width: "100%",
    marginBottom: 18,
    alignSelf: "center",
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },

  textContainer: {
    flex: 1,
  },

  title: {
    color: "#78350F",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 3,
  },

  text: {
    color: "#92400E",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },

  link: {
    color: "#B45309",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
    textDecorationLine: "underline",
  },
});