// /* eslint-disable react/no-unstable-nested-components */
// /* eslint-disable prettier/prettier */
// import { DrawerActions, useNavigation } from '@react-navigation/native';
// import React, { useEffect } from 'react'
// import { Pressable, Text } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { globalColors } from '../../theme/theme';
// import { IonIcon } from './IonIcon';

// export const HamburgerMenu = () => {

//    const navigation=useNavigation()

//       useEffect(()=>{

//          navigation.setOptions({
//             // Icon:()=><Icon name="rocket-outline" size={30} />,
//             headerLeft:()=>(
//                // <Icon 
//                //    style={{paddingLeft:10}}
//                //    name="menu-outline" size={25}
//                //    onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
//                // />
//                <Pressable
//                   style={{marginLeft:10}}
//                   onPress={() => navigation.dispatch(DrawerActions.toggleDrawer)}>
//                   <IonIcon name="menu-outline" color={globalColors.primary}  size={35}/>
//                   {/* <Text>Menu</Text> */}
//                </Pressable>
//             ),
//          })

//       }   
//       ,[]);
      
//   return ( <></> )
// }

/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import React, { useEffect } from "react";
import { Pressable, ViewStyle } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { globalColors } from "../../theme/theme";
import { IonIcon } from "./IonIcon";

type Props = {
  variant?: "header" | "inline";
  color?: string;
  size?: number;
  style?: ViewStyle;
};

export const HamburgerMenu = ({
  variant = "header",
  color = globalColors.primary,
  size = 35,
  style,
}: Props) => {
  const navigation = useNavigation<any>();

  const toggleDrawer = () => {
    // ✅ abre/cierra el drawer padre (si existe)
    const parent = navigation.getParent?.();
    if (parent) {
      parent.dispatch(DrawerActions.toggleDrawer());
      return;
    }
    // ✅ fallback
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  useEffect(() => {
    if (variant !== "header") return;
    navigation.setOptions?.({
      headerLeft: () => (
        <Pressable style={{ marginLeft: 10 }} onPress={toggleDrawer}>
          <IonIcon name="menu-outline" color={color} size={size} />
        </Pressable>
      ),
    });
  }, [navigation, variant, color, size]);

  if (variant !== "inline") return null;

  return (
    <Pressable onPress={toggleDrawer} style={[{ padding: 6 }, style]}>
      <IonIcon name="menu-outline" color={color} size={size} />
    </Pressable>
  );
};