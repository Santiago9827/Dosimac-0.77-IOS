/* eslint-disable prettier/prettier */
import React from 'react';
import { Platform, TextStyle } from 'react-native';
import { Button, MD3Theme, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface Props {
  onPress: () => void;
  label: string;   // texto a mostrar (NO i18n si es un código como bf8E)
  size?: number;
}

const sevenSegIOS = 'Digital-7';   // Nombre PostScript en iOS (confírmalo en Font Book)
const sevenSegAndroid = 'Digital-7'; // Nombre de archivo TTF sin extensión en Android

export const MainButton = ({ onPress, label, size }: Props) => {
  useTranslation(); // lo mantengo por si lo usas en otros casos
  const theme = useTheme<MD3Theme>();

  let myls: TextStyle = { lineHeight: 40, fontFamily: 'Poppins-Medium', fontSize: 16 };

  if (size != null) {
    switch (size) {
      case 0:
        myls = { lineHeight: 40, fontFamily: 'Poppins-Medium', fontSize: 16, letterSpacing: 2 };
        break;
      case 1:
        myls = { lineHeight: 60, fontFamily: 'Poppins-Medium', fontSize: 30, letterSpacing: 3 };
        break;
      case 2:
        myls = {
          lineHeight: 80,
          fontFamily: Platform.OS === 'ios' ? sevenSegIOS : sevenSegAndroid,
          fontSize: 54,
          letterSpacing: 4,
          fontWeight: 'normal',
        };
        break;
      case 3:
        myls = {
          lineHeight: 80,
          fontFamily: Platform.OS === 'ios' ? sevenSegIOS : sevenSegAndroid,
          fontSize: 66,
          letterSpacing: 5,
          fontWeight: 'normal',
        };
        break;
    }
  }

  return (
    <Button
      mode="contained"
      onPress={onPress}
      textColor="white"
      rippleColor={theme.colors.primary}
      disabled={false}
      labelStyle={myls}
    >
      {label}
    </Button>
  );
};
