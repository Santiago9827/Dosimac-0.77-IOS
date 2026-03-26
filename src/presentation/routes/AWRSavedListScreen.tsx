// screens/awr/AWRSavedListScreen.tsx
/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, Dimensions, Pressable } from 'react-native';
import {
    Appbar,
    Text,
    ActivityIndicator,
    IconButton,
    Portal,
    Dialog,
    TextInput,
    Button,
    Card,
} from 'react-native-paper';
import { awrStore } from '../../stores/awrStore';
import { useAwrConn } from '../../stores/awrConnStore';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GAP = 16;
const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - GAP * 2; // ancho completo con márgenes laterales

export const AWRSavedListScreen = ({ navigation }: any) => {
    const saved = awrStore(s => s.devices);
    const remove = awrStore(s => s.remove);
    const rename = awrStore(s => s.rename);

    const {
        ensureBle,
        connect,
        startReading,
        disconnect,
        isConnected,
        currentId,
        connecting,
        error,
    } = useAwrConn();

    // dialogs
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => { ensureBle(); }, []);

    const handleConnect = async (id: string) => {
        try {
            await connect(id);
            await startReading();
        } catch { }
    };

    const openRename = (id: string, currentLabel?: string, currentName?: string) => {
        setSelectedId(id);
        setDraftName((currentName || currentLabel || '').toString());
        setRenameOpen(true);
    };

    const confirmRename = () => {
        const name = draftName.trim();
        if (selectedId && name) rename(selectedId, name);
        setRenameOpen(false);
        setSelectedId(null);
    };

    const openDelete = (id: string) => {
        setSelectedId(id);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        const id = selectedId;
        if (!id) return;
        if (currentId && currentId.toLowerCase() === id.toLowerCase() && isConnected) {
            try { await disconnect(); } catch { }
        }
        remove(id);
        setDeleteOpen(false);
        setSelectedId(null);
    };

    const renderStatusChip = (label: string, kind: 'ok' | 'off') => (
        <View
            style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: kind === 'ok' ? '#D1FAE5' : '#E5E7EB',
            }}
        >
            <Text style={{ fontSize: 12, fontWeight: '600', color: kind === 'ok' ? '#0F766E' : '#4B5563' }}>
                {label}
            </Text>
        </View>
    );

    const data = useMemo(() => saved, [saved]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <Appbar.Header elevated>
                <Appbar.BackAction onPress={navigation.goBack} />
                <Appbar.Content title="AWR escaneados" />
            </Appbar.Header>

            {connecting && (
                <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator />
                    <Text>Conectando…</Text>
                </View>
            )}
            {!!error && <Text style={{ color: 'red', paddingHorizontal: 16 }}>{error}</Text>}

            {data.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <Text style={{ textAlign: 'center', opacity: 0.75 }}>
                        No hay AWR guardados. Escanea uno desde “Prueba AWR300”.
                    </Text>
                </View>
            ) : (
                <FlatList
                    contentContainerStyle={{ padding: GAP, paddingBottom: GAP + 8 }}
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const title = item.name || item.label || item.id;
                        const isThis = currentId && currentId.toLowerCase() === item.id.toLowerCase();
                        const connected = isThis && isConnected;

                        return (
                            <Card
                                mode="elevated"
                                style={{
                                    width: CARD_W,
                                    borderRadius: 18,
                                    marginBottom: GAP,
                                    backgroundColor: connected ? '#ECFDF5' : '#FFFFFF',
                                    borderWidth: connected ? 1 : 0,
                                    borderColor: connected ? '#10B981' : 'transparent',
                                }}
                            >
                                <Pressable
                                    android_ripple={{ color: '#e5e7eb' }}
                                    onPress={() => handleConnect(item.id)}
                                    style={{ borderRadius: 18, overflow: 'hidden' }}
                                >
                                    <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 }}>
                                        {/* Fila: icono + título */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <Ionicons
                                                name={connected ? 'checkmark-circle' : 'bluetooth-outline'}
                                                size={20}
                                                color={connected ? '#10B981' : '#374151'}
                                            />
                                            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                                                {title}
                                            </Text>
                                        </View>

                                        {/* MAC */}
                                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                                            {item.id}
                                        </Text>

                                        {/* Fila: chip de estado a la izq + acciones a la dcha */}
                                        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                                            <View
                                                style={{
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 3,
                                                    borderRadius: 999,
                                                    backgroundColor: connected ? '#D1FAE5' : '#E5E7EB',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: '600',
                                                        color: connected ? '#0F766E' : '#4B5563',
                                                    }}
                                                >
                                                    {connected ? 'Conectado' : 'Desconectado'}
                                                </Text>
                                            </View>

                                            {/* Empujar acciones a la derecha */}
                                            <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                                                <IconButton
                                                    size={20}
                                                    style={{ margin: 0 }}
                                                    icon={(props) => (
                                                        <Ionicons name="pencil-outline" size={props.size} color={props.color} />
                                                    )}
                                                    onPress={() => openRename(item.id, item.label, item.name)}
                                                    accessibilityLabel="Renombrar"
                                                />
                                                <IconButton
                                                    size={20}
                                                    style={{ margin: 0 }}
                                                    icon={(props) => (
                                                        <Ionicons name="trash-outline" size={props.size} color={props.color} />
                                                    )}
                                                    onPress={() => openDelete(item.id)}
                                                    accessibilityLabel="Eliminar"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </Card>
                        );
                    }}
                />
            )}

            {/* Dialogo Renombrar */}
            <Portal>
                <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)}>
                    <Dialog.Title>Renombrar AWR</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            mode="outlined"
                            label="Nombre"
                            value={draftName}
                            onChangeText={setDraftName}
                            autoFocus
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setRenameOpen(false)}>Cancelar</Button>
                        <Button onPress={confirmRename}>Guardar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Dialogo Eliminar */}
            <Portal>
                <Dialog visible={deleteOpen} onDismiss={() => setDeleteOpen(false)}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Title>Eliminar AWR guardado</Dialog.Title>
                    <Dialog.Content>
                        <Text>¿Seguro que quieres eliminar este AWR de la lista?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button onPress={confirmDelete}>Eliminar</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};