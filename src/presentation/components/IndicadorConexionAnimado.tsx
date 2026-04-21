import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

type Props = {
    color?: string;
    fondo?: string;
    borde?: string;
    texto?: string;
    velocidadMs?: number;

    tamanoTexto?: number;
    anchoBarra?: number;
    alturaBarra1?: number;
    alturaBarra2?: number;
    alturaBarra3?: number;
    altoIcono?: number;
    separacion?: number;
    paddingVertical?: number;
    paddingHorizontal?: number;
};

export const IndicadorConexionAnimado = ({
    color = "#16A34A",
    fondo = "#ECFDF5",
    borde = "#BBF7D0",
    texto = "AWR",
    velocidadMs = 350,

    tamanoTexto = 13,
    anchoBarra = 4,
    alturaBarra1 = 7,
    alturaBarra2 = 12,
    alturaBarra3 = 17,
    altoIcono = 18,
    separacion = 3,
    paddingVertical = 8,
    paddingHorizontal = 12,
}: Props) => {
    const [paso, setPaso] = useState(0);

    useEffect(() => {
        const secuencia = [1, 2, 3, 2];
        let indice = 0;

        const temporizador = setInterval(() => {
            indice = (indice + 1) % secuencia.length;
            setPaso(secuencia[indice]);
        }, velocidadMs);

        return () => clearInterval(temporizador);
    }, [velocidadMs]);

    const barraActiva = (nivel: number) => paso >= nivel;

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical,
                paddingHorizontal,
                borderRadius: 999,
                backgroundColor: fondo,
                borderWidth: 1,
                borderColor: borde,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: separacion,
                    height: altoIcono,
                }}
            >
                <View
                    style={{
                        width: anchoBarra,
                        height: alturaBarra1,
                        borderRadius: 999,
                        backgroundColor: barraActiva(1) ? color : "#D1D5DB",
                    }}
                />
                <View
                    style={{
                        width: anchoBarra,
                        height: alturaBarra2,
                        borderRadius: 999,
                        backgroundColor: barraActiva(2) ? color : "#D1D5DB",
                    }}
                />
                <View
                    style={{
                        width: anchoBarra,
                        height: alturaBarra3,
                        borderRadius: 999,
                        backgroundColor: barraActiva(3) ? color : "#D1D5DB",
                    }}
                />
            </View>

            <Text style={{ color, fontWeight: "900", fontSize: tamanoTexto }}>
                {texto}
            </Text>
        </View>
    );
};