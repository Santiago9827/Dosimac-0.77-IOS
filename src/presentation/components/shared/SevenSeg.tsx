/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';

type SegMask = [boolean, boolean, boolean, boolean, boolean, boolean, boolean]; // A..G

// Orden de segmentos:  A, B, C, D, E, F, G
const SEG: Record<string, SegMask> = {
  // Dígitos
  '0': [true,  true,  true,  true,  true,  true,  false],
  '1': [false, true,  true,  false, false, false, false],
  '2': [true,  true,  false, true,  true,  false, true ],
  '3': [true,  true,  true,  true,  false, false, true ],
  '4': [false, true,  true,  false, false, true,  true ],
  '5': [true,  false, true,  true,  false, true,  true ],
  '6': [true,  false, true,  true,  true,  true,  true ],
  '7': [true,  true,  true,  false, false, false, false],
  '8': [true,  true,  true,  true,  true,  true,  true ],
  '9': [true,  true,  true,  true,  false, true,  true ],

  // Letras que sí quieres en “mayúscula” de 7 segmentos
  'A': [true,  true,  true,  false, true,  true,  true ],
  'C': [true,  false, false, true,  true,  true,  false],
  'E': [true,  false, false, true,  true,  true,  true ],
  'F': [true,  false, false, false, true,  true,  true ],

  // SOLO estas dos “rebajadas” (estilo minúscula)
  'B': [false, false, true,  true,  true,  true,  true ], // ≈ “b”
  'D': [false, true,  true,  true,  true,  false, true ], // ≈ “d”

  // (opcionales) alias en minúscula por si alguna vez llegan así
//   'b': [false, false, true,  true,  true,  true,  true ],
//   'd': [false, true,  true,  true,  true,  false, true ],
};

// Identidad: no necesitamos transformar el texto, porque SEG ya mapea B/D
export function normalizeLabelForBD(s: string) {
  return (s || '')
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      if (lower === 'b') return 'B'; // usamos la clave 'B' que ya dibuja “b” minúscula
      if (lower === 'd') return 'D'; // idem “d”
      return lower.toUpperCase();    // A, C, E, F, y dígitos
    })
    .join('');
}



type SevenSegCharProps = {
  ch: string;
  size?: number;        // alto de la “celda” (aprox 2*size)
  thickness?: number;   // grosor del segmento
  color?: string;       // encendido
  offColor?: string;    // apagado
  rounded?: number;     // radio de borde en segmentos
};

export const SevenSegChar: React.FC<SevenSegCharProps> = ({
  ch,
  size = 40,
  thickness = 8,
  color = '#ffffff',
  rounded = 4,
}) => {
  const mask = SEG[ch] ?? [false, false, false, false, false, false, false];

  // Geometría base: alto total ≈ 2*size + 3*thickness
  const W = size;                    // ancho de zona útil (sin bordes)
  const H = size * 2 + thickness * 3; // alto total del contenedor del carácter
  const T = thickness;

const segBase: ViewStyle = { position: 'absolute', borderRadius: rounded };

  // Horizontales (A,G,D) => ancho W, alto T
  const A: ViewStyle = { ...segBase, width: W, height: T, left: T, top: 0 };
  const G: ViewStyle = { ...segBase, width: W, height: T, left: T, top: size + T };
  const D: ViewStyle = { ...segBase, width: W, height: T, left: T, top: size * 2 + T * 2 };

  // Verticales (B,C) lado derecho; (F,E) lado izquierdo => alto size, ancho T
  const B: ViewStyle = { ...segBase, width: T, height: size, left: W + T, top: T };
  const C: ViewStyle = { ...segBase, width: T, height: size, left: W + T, top: size + T * 2 };
  const F: ViewStyle = { ...segBase, width: T, height: size, left: 0, top: T };
  const E: ViewStyle = { ...segBase, width: T, height: size, left: 0, top: size + T * 2 };

const renderSeg = (style: ViewStyle, on: boolean) =>
  on ? <View style={[style, { backgroundColor: color }]} /> : null;

return (
  <View style={{ width: W + T * 2, height: H }}>
    {renderSeg(A, mask[0])}
    {renderSeg(B, mask[1])}
    {renderSeg(C, mask[2])}
    {renderSeg(D, mask[3])}
    {renderSeg(E, mask[4])}
    {renderSeg(F, mask[5])}
    {renderSeg(G, mask[6])}
  </View>
);
};

type SevenSegTextProps = {
  text: string;
  size?: number;
  thickness?: number;
  color?: string;
  offColor?: string;
  letterSpacing?: number; // separación entre caracteres (px)
  rounded?: number;
};

export const SevenSegText: React.FC<SevenSegTextProps> = ({
  text,
  size = 40,
  thickness = 8,
  color = '#ffffff',
  offColor = 'rgba(255,255,255,0.16)',
  letterSpacing = 8,
  rounded = 4,
}) => {
  const normalized = normalizeLabelForBD(text);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {normalized.split('').map((c, idx) => (
        <View key={`${c}-${idx}`} style={{ marginRight: idx < normalized.length - 1 ? letterSpacing : 0 }}>
          <SevenSegChar
            ch={c}
            size={size}
            thickness={thickness}
            color={color}
            offColor={offColor}
            rounded={rounded}
          />
        </View>
      ))}
    </View>
  );
};

type SevenSegButtonProps = {
  text: string;
  onPress: () => void;
  size?: number;        // pasa al texto (alto de “media celda”)
  thickness?: number;
  letterSpacing?: number;
  containerPadding?: number;
  backgroundColor?: string;
  borderRadius?: number;
};

export const SevenSegButton: React.FC<SevenSegButtonProps> = ({
  text,
  onPress,
  size = 40,
  thickness = 8,
  letterSpacing = 10,
  containerPadding = 18,
  backgroundColor = '#006d75',
  borderRadius = 28,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor,
        borderRadius,
        paddingHorizontal: containerPadding,
        paddingVertical: containerPadding,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SevenSegText
        text={text}
        size={size}
        thickness={thickness}
        letterSpacing={letterSpacing}
        color="#fff"
        offColor="rgba(255,255,255,0.15)"
      />
    </Pressable>
  );
};
