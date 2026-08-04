// /* eslint-disable prettier/prettier */
// import React, { useState } from "react";
// import {
//     View,
//     ScrollView,
//     TouchableOpacity,
//     Modal,
//     Alert,
// } from "react-native";
// import {
//     Button,
//     Card,
//     Text,
// } from "react-native-paper";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import { useAllflexConn } from "../../stores/allflexConnStore";
// import { obtenerAccesoriosAllflexIos } from "../../device/ble/allflexIosLibrary";

// const BRAND = "#0F766E";
// const BLUE = "#0284C7";
// const PURPLE = "#5B21B6";
// const BG = "#F1F5F9";
// const CARD = "#FFFFFF";
// const TEXT = "#0F172A";
// const MUTED = "#64748B";
// const BORDER = "#E2E8F0";

// const SHADOW_CARD = {
//     shadowColor: "#0F172A",
//     shadowOpacity: 0.08,
//     shadowRadius: 14,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 4,
// };

// const CARD_STYLE = {
//     borderRadius: 24,
//     backgroundColor: CARD,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     ...SHADOW_CARD,
// };

// export const AllflexBluetoothScreen = () => {
//     const {
//         currentName,
//         connecting,
//         isConnected,
//         error,
//         connect,
//         disconnect,
//     } = useAllflexConn();

//     const verAccesoriosDetectados = async () => {
//         try {
//             const accesorios = await obtenerAccesoriosAllflexIos();

//             Alert.alert(
//                 "Accesorios detectados",
//                 JSON.stringify(accesorios, null, 2)
//             );
//         } catch (e: any) {
//             Alert.alert(
//                 "Error",
//                 String(e?.message || e)
//             );
//         }
//     };

//     const [avisoVisible, setAvisoVisible] = useState(false);
//     const [avisoTitulo, setAvisoTitulo] = useState("");
//     const [avisoMensaje, setAvisoMensaje] = useState("");
//     const [avisoTipo, setAvisoTipo] = useState<"info" | "error">("info");

//     const mostrarAviso = (
//         titulo: string,
//         mensaje: string,
//         tipo: "info" | "error" = "info"
//     ) => {
//         setAvisoTitulo(titulo);
//         setAvisoMensaje(mensaje);
//         setAvisoTipo(tipo);
//         setAvisoVisible(true);
//     };

//     const cerrarAviso = () => {
//         setAvisoVisible(false);
//         setAvisoTitulo("");
//         setAvisoMensaje("");
//     };

//     const conectarLpr = async () => {
//         try {
//             await connect();

//             mostrarAviso(
//                 "Conectado",
//                 "El lector LPR se ha conectado correctamente.",
//                 "info"
//             );
//         } catch (e: any) {
//             mostrarAviso(
//                 "Error",
//                 String(e?.message || "No se pudo conectar con el lector LPR."),
//                 "error"
//             );
//         }
//     };

//     const desconectarLpr = async () => {
//         try {
//             await disconnect();

//             mostrarAviso(
//                 "Desconectado",
//                 "El lector LPR se ha desconectado correctamente.",
//                 "info"
//             );
//         } catch {
//             mostrarAviso(
//                 "Error",
//                 "No se pudo desconectar el lector LPR.",
//                 "error"
//             );
//         }
//     };

//     return (
//         <View style={{ flex: 1, backgroundColor: BG }}>
//             <ScrollView
//                 contentContainerStyle={{
//                     paddingHorizontal: 18,
//                     paddingTop: 22,
//                     paddingBottom: 30,
//                     gap: 18,
//                 }}
//                 showsVerticalScrollIndicator={false}
//             >
//                 <Text
//                     style={{
//                         fontSize: 32,
//                         fontWeight: "900",
//                         color: TEXT,
//                         marginBottom: 4,
//                     }}
//                 >
//                     Conexión Bluetooth
//                 </Text>

//                 <Card mode="contained" style={CARD_STYLE}>
//                     <Card.Content style={{ paddingVertical: 24 }}>
//                         <View
//                             style={{
//                                 height: 5,
//                                 backgroundColor: PURPLE,
//                                 borderTopLeftRadius: 24,
//                                 borderTopRightRadius: 24,
//                                 position: "absolute",
//                                 left: 0,
//                                 right: 0,
//                                 top: 0,
//                             }}
//                         />

//                         <Text
//                             style={{
//                                 textAlign: "center",
//                                 fontSize: 28,
//                                 fontWeight: "900",
//                                 color: TEXT,
//                             }}
//                         >
//                             Selecciona el lector
//                         </Text>

//                         <Text
//                             style={{
//                                 textAlign: "center",
//                                 fontSize: 17,
//                                 color: MUTED,
//                                 fontWeight: "700",
//                                 marginTop: 8,
//                                 marginBottom: 22,
//                             }}
//                         >
//                             Elige el tipo de espada que quieres conectar.
//                         </Text>

//                         <View
//                             style={{
//                                 borderRadius: 18,
//                                 borderWidth: 1,
//                                 borderColor: BORDER,
//                                 backgroundColor: "#F8FAFC",
//                                 padding: 14,
//                                 flexDirection: "row",
//                                 alignItems: "center",
//                                 gap: 14,
//                             }}
//                         >
//                             <View
//                                 style={{
//                                     width: 46,
//                                     height: 46,
//                                     borderRadius: 23,
//                                     backgroundColor: "#E0F2FE",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                 }}
//                             >
//                                 <Ionicons
//                                     name="bluetooth-outline"
//                                     size={26}
//                                     color={BLUE}
//                                 />
//                             </View>

//                             <Text
//                                 style={{
//                                     flex: 1,
//                                     fontSize: 22,
//                                     fontWeight: "900",
//                                     color: TEXT,
//                                 }}
//                             >
//                                 LPR
//                             </Text>

//                             <Ionicons
//                                 name="chevron-down-outline"
//                                 size={26}
//                                 color={TEXT}
//                             />
//                         </View>
//                     </Card.Content>
//                 </Card>

//                 <Card mode="contained" style={CARD_STYLE}>
//                     <Card.Content style={{ paddingVertical: 30 }}>
//                         <View
//                             style={{
//                                 height: 5,
//                                 backgroundColor: BLUE,
//                                 borderTopLeftRadius: 24,
//                                 borderTopRightRadius: 24,
//                                 position: "absolute",
//                                 left: 0,
//                                 right: 0,
//                                 top: 0,
//                             }}
//                         />

//                         <View
//                             style={{
//                                 alignItems: "center",
//                             }}
//                         >
//                             <View
//                                 style={{
//                                     width: 86,
//                                     height: 86,
//                                     borderRadius: 43,
//                                     backgroundColor: "#E0F2FE",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     marginBottom: 18,
//                                 }}
//                             >
//                                 <Ionicons
//                                     name="bluetooth-outline"
//                                     size={44}
//                                     color={BLUE}
//                                 />
//                             </View>

//                             <Text
//                                 style={{
//                                     fontSize: 32,
//                                     fontWeight: "900",
//                                     color: TEXT,
//                                     textAlign: "center",
//                                 }}
//                             >
//                                 Lector LPR
//                             </Text>

//                             <Text
//                                 style={{
//                                     marginTop: 12,
//                                     fontSize: 17,
//                                     lineHeight: 24,
//                                     color: MUTED,
//                                     fontWeight: "700",
//                                     textAlign: "center",
//                                 }}
//                             >
//                                 Conecta el lector LPR para poder leer crotales desde la aplicación.
//                             </Text>

//                             <View
//                                 style={{
//                                     marginTop: 20,
//                                     borderRadius: 999,
//                                     paddingHorizontal: 24,
//                                     paddingVertical: 10,
//                                     backgroundColor: isConnected ? "#DCFCE7" : "#E5E7EB",
//                                 }}
//                             >
//                                 <Text
//                                     style={{
//                                         fontSize: 16,
//                                         fontWeight: "900",
//                                         color: isConnected ? "#166534" : MUTED,
//                                     }}
//                                 >
//                                     {isConnected
//                                         ? `Conectada${currentName ? ` · ${currentName}` : ""}`
//                                         : "No conectada"}
//                                 </Text>
//                             </View>

//                             {!!error && (
//                                 <Text
//                                     style={{
//                                         marginTop: 12,
//                                         color: "#DC2626",
//                                         fontWeight: "700",
//                                         textAlign: "center",
//                                     }}
//                                 >
//                                     {error}
//                                 </Text>
//                             )}

//                             <Button
//                                 mode="contained"
//                                 onPress={conectarLpr}
//                                 disabled={connecting || isConnected}
//                                 loading={connecting}
//                                 style={{
//                                     width: "100%",
//                                     marginTop: 28,
//                                     borderRadius: 16,
//                                     backgroundColor: BLUE,
//                                 }}
//                                 contentStyle={{ height: 56 }}
//                                 labelStyle={{
//                                     fontSize: 18,
//                                     fontWeight: "900",
//                                 }}
//                             >
//                                 {connecting ? "Conectando..." : "Conectar a LPR"}
//                             </Button>
//                             <Button
//                                 mode="outlined"
//                                 onPress={verAccesoriosDetectados}
//                                 style={{
//                                     width: "100%",
//                                     marginTop: 14,
//                                     borderRadius: 16,
//                                     borderColor: "#CBD5E1",
//                                 }}
//                                 contentStyle={{ height: 50 }}
//                                 labelStyle={{
//                                     fontSize: 16,
//                                     fontWeight: "900",
//                                     color: "#0F766E",
//                                 }}
//                             >
//                                 Ver accesorios detectados
//                             </Button>

//                             <Button
//                                 mode="outlined"
//                                 onPress={desconectarLpr}
//                                 disabled={!isConnected}
//                                 style={{
//                                     width: "100%",
//                                     marginTop: 14,
//                                     borderRadius: 16,
//                                     borderColor: "#CBD5E1",
//                                 }}
//                                 contentStyle={{ height: 56 }}
//                                 labelStyle={{
//                                     fontSize: 18,
//                                     fontWeight: "900",
//                                     color: BRAND,
//                                 }}
//                             >
//                                 Desconectar
//                             </Button>
//                         </View>
//                     </Card.Content>
//                 </Card>
//             </ScrollView>

//             <Modal
//                 visible={avisoVisible}
//                 transparent
//                 animationType="fade"
//                 onRequestClose={cerrarAviso}
//             >
//                 <View
//                     style={{
//                         flex: 1,
//                         backgroundColor: "rgba(15, 23, 42, 0.45)",
//                         justifyContent: "center",
//                         alignItems: "center",
//                         paddingHorizontal: 24,
//                     }}
//                 >
//                     <View
//                         style={{
//                             width: "100%",
//                             maxWidth: 390,
//                             backgroundColor: "#FFFFFF",
//                             borderRadius: 24,
//                             padding: 20,
//                             ...SHADOW_CARD,
//                         }}
//                     >
//                         <View
//                             style={{
//                                 alignItems: "center",
//                                 marginBottom: 14,
//                             }}
//                         >
//                             <View
//                                 style={{
//                                     width: 54,
//                                     height: 54,
//                                     borderRadius: 27,
//                                     backgroundColor:
//                                         avisoTipo === "error" ? "#FEF2F2" : "#ECFDF5",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     marginBottom: 10,
//                                 }}
//                             >
//                                 <Ionicons
//                                     name={
//                                         avisoTipo === "error"
//                                             ? "alert-circle-outline"
//                                             : "checkmark-circle-outline"
//                                     }
//                                     size={28}
//                                     color={avisoTipo === "error" ? "#DC2626" : BRAND}
//                                 />
//                             </View>

//                             <Text
//                                 style={{
//                                     fontSize: 24,
//                                     fontWeight: "900",
//                                     color: TEXT,
//                                     textAlign: "center",
//                                 }}
//                             >
//                                 {avisoTitulo}
//                             </Text>
//                         </View>

//                         <Text
//                             style={{
//                                 fontSize: 16,
//                                 lineHeight: 23,
//                                 color: MUTED,
//                                 textAlign: "center",
//                                 marginBottom: 18,
//                             }}
//                         >
//                             {avisoMensaje}
//                         </Text>

//                         <TouchableOpacity
//                             onPress={cerrarAviso}
//                             activeOpacity={0.9}
//                             style={{
//                                 height: 46,
//                                 borderRadius: 14,
//                                 backgroundColor: BRAND,
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                             }}
//                         >
//                             <Text
//                                 style={{
//                                     color: "#FFFFFF",
//                                     fontWeight: "900",
//                                     fontSize: 16,
//                                 }}
//                             >
//                                 Aceptar
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </Modal>
//         </View>
//     );
// };