// device/ble/bluetoothClassic/allflexIosLibrary.ts
/* eslint-disable prettier/prettier */
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type DispositivoClasico = {
    id: string;
    name?: string;
    address?: string;
};

export type ModoBusquedaLector = 'lpr';

export const OPCIONES_BUSQUEDA_LECTOR = [
    { value: 'lpr', label: 'LPR' },
];

let subscription: { remove: () => void } | null = null;

const obtenerModuloNativo = () => {
    const modulo = NativeModules.AllflexExternalAccessory;

    if (!modulo) {
        throw new Error(
            'El módulo nativo AllflexExternalAccessory todavía no está configurado en iOS.'
        );
    }

    return modulo;
};

const extraerCrotal = (texto: string) => {
    const limpio = String(texto ?? '').trim();
    const encontrados = limpio.match(/\d{15}/g);

    if (!encontrados || encontrados.length === 0) {
        return null;
    }

    return encontrados[encontrados.length - 1];
};

export async function conectarAllflexLpr(
    onCrotal: (crotal: string) => void,
    onTextoRecibido?: (texto: string) => void,
    _modoBusqueda: ModoBusquedaLector = 'lpr'
): Promise<DispositivoClasico> {
    if (Platform.OS !== 'ios') {
        throw new Error('Este conector Allflex es solo para iOS.');
    }

    const modulo = obtenerModuloNativo();
    const eventEmitter = new NativeEventEmitter(modulo);

    subscription?.remove?.();

    subscription = eventEmitter.addListener('AllflexDataReceived', (event) => {
        const texto = String(event?.text ?? event?.data ?? '');

        if (texto) {
            onTextoRecibido?.(texto);
        }

        const crotal = extraerCrotal(texto);

        if (crotal) {
            onCrotal(crotal);
        }
    });

    const dispositivo = await modulo.connect();

    return {
        id: String(dispositivo?.id ?? dispositivo?.name ?? 'allflex-lpr-ios'),
        name: String(dispositivo?.name ?? 'Allflex LPR'),
        address: String(dispositivo?.id ?? ''),
    };
}

export async function desconectarAllflexLpr() {
    try {
        subscription?.remove?.();
    } catch {}

    subscription = null;

    try {
        const modulo = obtenerModuloNativo();
        await modulo.disconnect?.();
    } catch {}
}

export async function obtenerAccesoriosAllflexIos() {
    const modulo = obtenerModuloNativo();
    return await modulo.getConnectedAccessories();
}