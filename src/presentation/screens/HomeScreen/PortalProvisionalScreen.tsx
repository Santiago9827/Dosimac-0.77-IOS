// import React from "react";
// import { View, Text, TouchableOpacity } from "react-native";
// import { useAuthStore } from "../../../stores/authStore";
// import { HamburgerMenu } from "../../components/shared/HamburgerMenu";

// export const PortalProvisionalScreen = () => {
//   const logout = useAuthStore((s) => s.logout);

//   return (
//     <View className="flex-1">
//       <HamburgerMenu />

//       <View className="flex-1 items-center justify-center px-6">
//         <Text className="text-3xl font-bold text-slate-700 mb-2">Portal</Text>
//         <Text className="text-slate-500 text-center mb-8">
//           Aquí irá el WebView (provisional).
//         </Text>

//         <TouchableOpacity
//           onPress={logout}
//           className="bg-slate-800 rounded-xl py-3 px-6"
//         >
//           <Text className="text-white font-bold">Cerrar sesión</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };