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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { awrStore } from '../../stores/awrStore';
import { useAwrConn } from '../../stores/awrConnStore';

const GAP = 16;
const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - GAP * 2;

const BG = '#F6F7FB';
const CARD_BG = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const SUCCESS_BORDER = '#86EFAC';
const SUCCESS_BG = '#F0FDF4';
const SUCCESS_SOFT = '#DCFCE7';
const SUCCESS_TEXT = '#15803D';

const DANGER_SOFT = '#FEE2E2';
const DANGER_TEXT = '#DC2626';

const ICON_SOFT = '#F3F4F6';

const SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const AWRSavedListScreen = ({ navigation }: any) => {
  const { t } = useTranslation();

  const saved = awrStore((s) => s.devices);
  const remove = awrStore((s) => s.remove);
  const rename = awrStore((s) => s.rename);

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

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    ensureBle();
  }, []);

  const handleConnect = async (id: string) => {
    try {
      await connect(id);
      await startReading();
    } catch {}
  };

  const openRename = (id: string, currentLabel?: string, currentName?: string) => {
    setSelectedId(id);
    setDraftName((currentName || currentLabel || '').toString());
    setRenameOpen(true);
  };

  const confirmRename = () => {
    const nombre = draftName.trim();
    if (selectedId && nombre) rename(selectedId, nombre);
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
      try {
        await disconnect();
      } catch {}
    }

    remove(id);
    setDeleteOpen(false);
    setSelectedId(null);
  };

  const data = useMemo(() => saved, [saved]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Appbar.Header
        elevated
        style={{
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <Appbar.BackAction onPress={navigation.goBack} />
        <Appbar.Content
          title={t('awrSavedList_title')}
          titleStyle={{ color: TEXT, fontWeight: '900', fontSize: 18 }}
        />
      </Appbar.Header>

      {connecting && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: '#EEF2FF',
            borderWidth: 1,
            borderColor: '#C7D2FE',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" />
          <Text style={{ color: '#4F46E5', fontWeight: '700', marginLeft: 8 }}>
            {t('awrSavedList_connecting')}
          </Text>
        </View>
      )}

      {!!error && (
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
          }}
        >
          <Text style={{ color: '#B91C1C', fontWeight: '700' }}>{error}</Text>
        </View>
      )}

      {data.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name="bluetooth-outline" size={34} color="#4F46E5" />
          </View>

          <Text
            style={{
              textAlign: 'center',
              color: TEXT,
              fontWeight: '800',
              fontSize: 18,
            }}
          >
            {t('awrSavedList_empty')}
          </Text>

          <Text
            style={{
              textAlign: 'center',
              color: MUTED,
              marginTop: 8,
              lineHeight: 22,
              maxWidth: 320,
            }}
          >
            {t('awrSavedList_emptyDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: GAP, paddingBottom: GAP + 8 }}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const titulo = item.name || item.label || item.id;
            const esActual = currentId && currentId.toLowerCase() === item.id.toLowerCase();
            const conectado = esActual && isConnected;

            return (
              <Card
                mode="elevated"
                style={{
                  width: CARD_W,
                  borderRadius: 24,
                  marginBottom: GAP,
                  backgroundColor: CARD_BG,
                  borderWidth: 1.5,
                  borderColor: conectado ? SUCCESS_BORDER : BORDER,
                  ...SHADOW,
                }}
              >
                <Pressable
                  android_ripple={{ color: '#E5E7EB' }}
                  onPress={() => handleConnect(item.id)}
                  style={{ borderRadius: 24, overflow: 'hidden' }}
                >
                  <View style={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 }}>
                    {/* Fila superior */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: conectado ? SUCCESS_SOFT : '#EEF2FF',
                          marginRight: 14,
                        }}
                      >
                        <Ionicons
                          name="bluetooth-outline"
                          size={28}
                          color={conectado ? '#10B981' : '#4F46E5'}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 22,
                            fontWeight: '900',
                            color: TEXT,
                          }}
                          numberOfLines={1}
                        >
                          {titulo}
                        </Text>

                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 14,
                            fontWeight: '700',
                            color: conectado ? SUCCESS_TEXT : MUTED,
                          }}
                        >
                          {conectado
                            ? t('awrSavedList_connected')
                            : t('awrSavedList_disconnected')}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                        <IconButton
                          size={24}
                          style={{
                            margin: 0,
                            marginRight: 8,
                            backgroundColor: ICON_SOFT,
                            borderRadius: 24,
                          }}
                          icon={(props) => (
                            <Ionicons name="pencil-outline" size={props.size} color="#475569" />
                          )}
                          onPress={() => openRename(item.id, item.label, item.name)}
                          accessibilityLabel={t('awrSavedList_renameAccessibility')}
                        />

                        <IconButton
                          size={24}
                          style={{
                            margin: 0,
                            backgroundColor: '#FEECEC',
                            borderRadius: 24,
                          }}
                          icon={(props) => (
                            <Ionicons name="trash-outline" size={props.size} color={DANGER_TEXT} />
                          )}
                          onPress={() => openDelete(item.id)}
                          accessibilityLabel={t('awrSavedList_deleteAccessibility')}
                        />
                      </View>
                    </View>

                    {/* línea */}
                    <View
                      style={{
                        height: 1,
                        backgroundColor: '#E5E7EB',
                        marginTop: 16,
                        marginBottom: 16,
                      }}
                    />

                    {/* MAC */}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: MUTED,
                        marginBottom: 10,
                        letterSpacing: 0.3,
                      }}
                    >
                      Mac
                    </Text>

                    <View
                      style={{
                        borderRadius: 22,
                        borderWidth: 1.5,
                        borderColor: conectado ? '#A7F3D0' : '#E5E7EB',
                        backgroundColor: conectado ? '#F0FDF4' : '#F8FAFC',
                        paddingVertical: 18,
                        paddingHorizontal: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '900',
                          color: TEXT,
                          letterSpacing: 0.6,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {item.id}
                      </Text>
                    </View>

                    {/* chip abajo */}
                    <View style={{ marginTop: 16, alignSelf: 'flex-start' }}>
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: conectado ? '#DCFCE7' : '#E5E7EB',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '900',
                            color: conectado ? SUCCESS_TEXT : '#4B5563',
                          }}
                        >
                          {conectado
                            ? t('awrSavedList_connected')
                            : t('awrSavedList_disconnected')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Card>
            );
          }}
        />
      )}

      <Portal>
        <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)}>
          <Dialog.Title>{t('awrSavedList_renameTitle')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label={t('awrSavedList_nameLabel')}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameOpen(false)}>{t('Cancelar')}</Button>
            <Button onPress={confirmRename}>{t('Guardar')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteOpen} onDismiss={() => setDeleteOpen(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>{t('awrSavedList_deleteTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('awrSavedList_deleteMessage')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteOpen(false)}>{t('Cancelar')}</Button>
            <Button onPress={confirmDelete}>{t('awrSavedList_deleteAction')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};