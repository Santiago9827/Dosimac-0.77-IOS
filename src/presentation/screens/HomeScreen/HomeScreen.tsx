import React from "react";
import { Text, View } from "react-native";
import { Divider } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HamburgerMenu } from "../../components/shared/HamburgerMenu";
import { farmStore } from "../../../stores/store";
import { globalColors } from "../../theme/theme"; // ajusta la ruta si cambia
import { useNavigation } from "@react-navigation/native";
import { AvisoAplicacionNoConfigurada } from "../../routes/AvisoAplicacionNoConfigurada";

export const HomeScreen = () => {
  const sfarm = farmStore((state) => state.farm);
  const { t } = useTranslation(["common"]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const irAInstalaciones = () => {
    navigation.navigate("FarmList");
  };

  return (
    <View className="flex-1">
      {/* ✅ Botón drawer (inline) */}

      <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <HamburgerMenu variant="inline" color={globalColors.primary} size={32} />
        <AvisoAplicacionNoConfigurada
          visible={!sfarm}
          top={insets.top + 70}
          onPress={irAInstalaciones}
        />
      </View>

      <View className="flex-1 flex-col justify-center items-center">
        <Text className="text-6xl text-slate-700 font-bold">DOSIMAC</Text>
        <Text className="text-3xl text-slate-700 font-bold">CTIFEED</Text>

        <View className="flex flex-row pt-10 space-x-1">
          <View className="h-[80px] w-5 rounded-t-lg bg-red-600" />
          <View className="h-[80px] w-5 rounded-t-lg bg-cyan-500" />
          <View className="h-[80px] w-5 rounded-t-lg bg-cyan-600" />
          <View className="h-[80px] w-5 rounded-t-lg bg-cyan-800" />
        </View>

        <View>
          <View className="-mt-[110px] h-5 w-5 rounded-full bg-orange-400" />
        </View>

        <Divider className="w-44 bg-black my-10" />

        {sfarm ? (
          <View className="flex flex-col pt-6 px-6 py-4 rounded-xl border-gray-400">
            <Text className="text-lg mb-2 font-bold text-blue-800 text-center">
              {t("common:Instalación_seleccionada")}
            </Text>
            <Text className="text-lg text-center text-slate-700">{sfarm.name}</Text>
            <Text className="text-lg text-center text-slate-700">{sfarm.location}</Text>
          </View>
        ) : (
          <View className="flex flex-col pt-6 px-6 py-4 rounded-xl border-gray-400">
            <Text className="text-lg mb-2 font-bold text-red-800 text-center">
              {t("common:NoInstalacionSeleccionada")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// const styles = StyleSheet.create({

//   headerText: {
//     color: 'black',

//     fontSize: 56,
//     fontWeight: 'bold',
//     textAlign: 'left',
//     paddingVertical: 10,

//   },
//   Container:{
//     flex: 1,
//     alignContent: 'center',
//     justifyContent: 'center',

//     alignItems: 'center',
//     //marginTop: 30,
//     //backgroundColor:'lightgrey',
//     paddingHorizontal: 10,
//   }
// });
