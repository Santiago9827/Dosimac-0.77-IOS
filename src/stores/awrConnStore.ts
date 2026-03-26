// stores/awrConnStore.ts
/* eslint-disable prettier/prettier */
import { create } from 'zustand';
import { Buffer } from 'buffer';
import * as ble from '../device/ble/bleLibrary';

// const SVC_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
// const CHR_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

const SVC_UUID = '180f';
const CHR_UUID = '2a19';

let notifHandle: { remove?: () => Promise<void> | void } | null = null;
let acc = '';
let unbind: null | (() => void) = null;
let listenersBound = false;

type State = {
    currentId: string | null;
    connecting: boolean;
    isConnected: boolean;
    error: string | null;

    lastTag: string | null;
    history: string[];

    ensureBle: () => Promise<void>;
    connect: (id: string) => Promise<void>;
    disconnect: () => Promise<void>;
    startReading: () => Promise<void>;
    stopReading: () => Promise<void>;
    clearHistory: () => void;
    clearLastTag: () => void;

};
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const useAwrConn = create<State>((set, get) => ({
    currentId: null,
    connecting: false,
    isConnected: false,
    error: null,

    lastTag: null,
    history: [],

    ensureBle: async () => {
        try { await ble.BleStart(); } catch { }
        if (!listenersBound) {
            unbind = ble.addConnectionListeners(
                (id) => {
                    const { currentId } = get();
                    if (currentId && id?.toLowerCase?.() === currentId.toLowerCase()) {
                        set({ isConnected: true, error: null });
                    }
                },
                (id) => {
                    const { currentId } = get();
                    if (currentId && id?.toLowerCase?.() === currentId.toLowerCase()) {
                        // se cortó -> marcar desconectado y parar lecturas
                        set({ isConnected: false });
                        get().stopReading().catch(() => { });
                    }
                }
            );
            // si apagan BT -> marcar desconectado
            ble.addBtStateListener((state) => {
                if (state !== 'on') {
                    set({ isConnected: false });
                    get().stopReading().catch(() => { });
                }
            });
            listenersBound = true;
        }
    },

    // connect: async (id: string) => {
    //     set({ connecting: true, error: null, currentId: id });
    //     try {
    //         await get().ensureBle();
    //         await ble.bleConnection(id);
    //         const ok = await ble.bleIsConnected(id);
    //         set({ isConnected: !!ok });
    //         if (!ok) throw new Error('El dispositivo no quedó conectado');
    //     } catch (e: any) {
    //         set({ error: String(e?.message || e), isConnected: false });
    //         throw e;
    //     } finally {
    //         set({ connecting: false });
    //     }
    // },


connect: async (id: string) => {
  set({ connecting: true, error: null, currentId: id });

  try {
    await get().ensureBle();
    await ble.bleConnection(id);

    // ✅ iOS: dale un poco de margen
    await sleep(250);

    const ok = await ble.bleIsConnected(id);
    set({ isConnected: !!ok });

    if (!ok) throw new Error('El dispositivo no quedó conectado');
  } catch (e: any) {
    set({ error: String(e?.message || e), isConnected: false });
    throw e;
  } finally {
    set({ connecting: false });
  }
},

    disconnect: async () => {
        const id = get().currentId;
        try { await get().stopReading(); } catch { }
        if (id) { try { await ble.bleDisconnection?.(id); } catch { } }
        set({ isConnected: false, currentId: null });
    },

    startReading: async () => {
        const id = get().currentId;
        if (!id) throw new Error('No hay dispositivo conectado');
        if (notifHandle) return;

        notifHandle = await ble.bleSubscribeGeneric(SVC_UUID, CHR_UUID, (value: number[]) => {
            const chunk = Buffer.from(value).toString('utf8');
            acc += chunk;
            const parts = acc.split(/\r?\n/);
            acc = parts.pop() ?? '';
            parts.forEach((line) => {
                const clean = line.trim();
                if (!clean) return;
                const m = clean.match(/\d{15}/g);
                if (m && m.length) {
                    set((s) => ({
                        lastTag: m[m.length - 1],
                        history: [...m.reverse(), ...s.history].slice(0, 50),
                    }));
                } else {
                    set({ lastTag: clean });
                }
            });
        });
    },

    stopReading: async () => {
        try { await notifHandle?.remove?.(); } catch { }
        notifHandle = null;
        acc = '';
    },

    clearHistory: () => set({ history: [], lastTag: null }),
    clearLastTag: () => set({ lastTag: null }),

}));