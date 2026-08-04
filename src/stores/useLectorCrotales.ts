// stores/useLectorCrotales.ts
/* eslint-disable prettier/prettier */
import React from 'react';
import { useAwrConn } from './awrConnStore';
import { useAllflexConn } from './allflexConnStore';

export type TipoLectorCrotal = 'AWR' | 'ALLFLEX' | null;

export const useLectorCrotales = () => {
    // AWR BLE
    const awrConectado = useAwrConn((s) => s.isConnected);
    const awrId = useAwrConn((s) => s.currentId);
    const awrConnecting = useAwrConn((s) => s.connecting);
    const awrError = useAwrConn((s) => s.error);
    const awrCrotal = useAwrConn((s) => s.lastTag);
    const awrHistorial = useAwrConn((s) => s.history);
    const awrIniciarLectura = useAwrConn((s) => s.startReading);
    const awrDetenerLectura = useAwrConn((s) => s.stopReading);
    const awrLimpiarCrotal = useAwrConn((s) => s.clearLastTag);
    const awrLimpiarHistorial = useAwrConn((s) => s.clearHistory);

    // Allflex LPR iOS
    const allflexConectado = useAllflexConn((s) => s.isConnected);
    const allflexId = useAllflexConn((s) => s.currentId);
    const allflexNombre = useAllflexConn((s) => s.currentName);
    const allflexCrotal = useAllflexConn((s) => s.lastTag);
    const allflexHistorial = useAllflexConn((s) => s.history);
    const allflexLimpiarCrotal = useAllflexConn((s) => s.clearLastTag);
    const allflexLimpiarHistorial = useAllflexConn((s) => s.clearHistory);

    const tipoLectorActivo: TipoLectorCrotal = allflexConectado
        ? 'ALLFLEX'
        : awrConectado
            ? 'AWR'
            : null;

    const lectorConectado = awrConectado || allflexConectado;

    const idLector = tipoLectorActivo === 'ALLFLEX'
        ? allflexId
        : awrId;

    const nombreLector = tipoLectorActivo === 'ALLFLEX'
        ? allflexNombre || 'Allflex LPR'
        : awrId || 'AWR';

    const crotalLeido = tipoLectorActivo === 'ALLFLEX'
        ? allflexCrotal
        : awrCrotal;

    const historial = tipoLectorActivo === 'ALLFLEX'
        ? allflexHistorial
        : awrHistorial;

    const iniciarLectura = React.useCallback(async () => {
        // Allflex ya escucha desde que está conectado.
        // No necesita startReading.
        if (allflexConectado) return;

        if (awrConectado || awrId) {
            await awrIniciarLectura();
        }
    }, [
        allflexConectado,
        awrConectado,
        awrId,
        awrIniciarLectura,
    ]);

    const detenerLectura = React.useCallback(async () => {
        // No desconectamos Allflex desde aquí.
        // La conexión se gestiona desde la pantalla Bluetooth.
        if (allflexConectado) return;

        await awrDetenerLectura();
    }, [
        allflexConectado,
        awrDetenerLectura,
    ]);

    const limpiarCrotalLeido = React.useCallback(() => {
        awrLimpiarCrotal();
        allflexLimpiarCrotal();
    }, [
        awrLimpiarCrotal,
        allflexLimpiarCrotal,
    ]);

    const limpiarHistorial = React.useCallback(() => {
        awrLimpiarHistorial();
        allflexLimpiarHistorial();
    }, [
        awrLimpiarHistorial,
        allflexLimpiarHistorial,
    ]);

    return {
        lectorConectado,
        idLector,
        nombreLector,
        tipoLectorActivo,
        crotalLeido,
        historial,
        iniciarLectura,
        detenerLectura,
        limpiarCrotalLeido,
        limpiarHistorial,

        awrConectado,
        awrId,
        awrConnecting,
        awrError,
        awrCrotal,
        awrHistorial,

        allflexConectado,
        allflexId,
        allflexNombre,
        allflexCrotal,
        allflexHistorial,
    };
};