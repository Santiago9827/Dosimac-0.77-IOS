/* eslint-disable prettier/prettier */
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Switch,
  Text,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useAjustesEnvioMaternidadStore } from '../../stores/ajustesEnvioMaternidadStore';

const BRAND = '#0F766E';
const BG = '#F6F7FB';
const CARD = '#FFFFFF';
const BORDER = '#E5E7EB';
const TEXT = '#0F172A';
const MUTED = '#64748B';

const SHADOW_CARD = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

const SHADOW_SOFT = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

function SwitchLine({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchLine}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.switchTitle}>
          {title}
        </Text>

        <Text style={styles.switchDescription}>
          {description}
        </Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} color={BRAND} />
    </View>
  );
}

export const AjustesEnvioMaternidadScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const detectarDesconocidos = useAjustesEnvioMaternidadStore(
    (s) => s.detectarDesconocidos
  );

  const confirmar = useAjustesEnvioMaternidadStore(
    (s) => s.confirmar
  );

  const setDetectarDesconocidos = useAjustesEnvioMaternidadStore(
    (s) => s.setDetectarDesconocidos
  );

  const setConfirmar = useAjustesEnvioMaternidadStore(
    (s) => s.setConfirmar
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back-outline" size={24} color={TEXT} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {t('ajustesEnvioMaternidad.headerTitle')}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t('ajustesEnvioMaternidad.headerSubtitle')}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="settings-outline" size={24} color={BRAND} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {t('ajustesEnvioMaternidad.cardTitle') || 'Envío de registros'}
              </Text>

              <Text style={styles.cardSubtitle}>
                {t('ajustesEnvioMaternidad.cardSubtitle') || 'Estos ajustes se aplican al continuar con la lectura.'}
              </Text>
            </View>
          </View>

          <View style={{ height: 14 }} />

          <SwitchLine
            title={t('maternidadConfig_detectUnknownTitle') || 'Identificar animales desconocidos'}
            description={t('maternidadConfig_detectUnknownDescription') || 'Cuando leas un animal sin identificar, podrás asignarle un ID'}
            value={detectarDesconocidos}
            onValueChange={setDetectarDesconocidos}
          />

          <View style={{ height: 10 }} />

          <SwitchLine
            title={t('maternidadConfig_confirmTitle') || 'Confirmar envío'}
            description={t('maternidadConfig_confirmDescription') || 'Pedirá confirmación antes de enviar cada registro.'}
            value={confirmar}
            onValueChange={setConfirmar}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  content: {
    padding: 12,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    ...SHADOW_CARD,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },

  cardSubtitle: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },

  switchLine: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...SHADOW_SOFT,
  },

  switchTitle: {
    color: TEXT,
    fontWeight: '900',
    fontSize: 14,
  },

  switchDescription: {
    color: MUTED,
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
  },
});