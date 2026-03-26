import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AwrDevice = {
    id: string;          // MAC / device id
    name?: string;       // nombre que ponga el usuario (futuro)
    label?: string;      // sufijo MAC o nombre BLE
    localName?: string;  // nombre del advertising
    lastSeen: number;    // timestamp
};

type AwrState = {
    devices: AwrDevice[];
    upsert: (d: AwrDevice) => void;
    remove: (id: string) => void;
    rename: (id: string, name: string) => void; // lo usaremos después
    clear: () => void;
};

function upsertUnique(list: AwrDevice[], d: AwrDevice) {
    const i = list.findIndex(x => x.id === d.id);
    if (i >= 0) {
        const updated = { ...list[i], ...d, lastSeen: Date.now() };
        const arr = list.slice(); arr[i] = updated; return arr;
    }
    return [{ ...d, lastSeen: Date.now() }, ...list];
}

export const awrStore = create<AwrState>()(
    persist(
        (set, get) => ({
            devices: [],
            upsert: (d) => set({ devices: upsertUnique(get().devices, d) }),
            remove: (id) => set({ devices: get().devices.filter(x => x.id !== id) }),
            rename: (id, name) => set({
                devices: get().devices.map(x => x.id === id ? { ...x, name } : x)
            }),
            clear: () => set({ devices: [] }),
        }),
        {
            name: 'awr-devices',
            storage: createJSONStorage(() => AsyncStorage),
            version: 1,
        }
    )
);