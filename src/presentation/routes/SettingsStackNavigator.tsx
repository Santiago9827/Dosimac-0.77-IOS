import { createStackNavigator } from '@react-navigation/stack';
import { LanguageSettingsScreen } from '../screens/settings/Languagesettings';
import { HeaderBackButton } from '@react-navigation/elements';
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Surface, List, Divider } from 'react-native-paper';
import { IonIcon } from '../components/shared/IonIcon'; // ya lo tienes
import { globalColors } from '../theme/theme'; // si no lo tienes, usa tu color primario

//banderas
const flagByLang: Record<string, string> = {
    es: '🇪🇸 Español',
    en: '🇬🇧 English',
    pt: '🇵🇹 Português',
    'pt-PT': '🇵🇹 Português',
    fr: '🇫🇷 Français',
    ca: '🇪🇸 Català',
    pl: '🇵🇱 Polski',
    ru: '🇷🇺 Русский',
    ko: '🇰🇷 한국어',
    'zh-TW': '🇹🇼 繁體中文',
    uk: '🇺🇦 Українська',
};


const Stack = createStackNavigator();
const SettingsHome = ({ navigation }: any) => {
    const { t, i18n } = useTranslation();
    const current = flagByLang[i18n.language] ?? i18n.language;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* --- TARJETA: Idioma --- */}
            <Surface style={styles.card} elevation={2}>
                <Text style={styles.cardTitle}>{t('common:change_language')}</Text>
                <View style={styles.cardBody}>
                    <List.Item
                        title={current}
                        titleStyle={styles.itemTitle}
                        left={(props) => (
                            <View style={styles.leftIcon}>
                                <IonIcon name="language-outline" color={globalColors.primary} />
                            </View>
                        )}
                        right={() => (
                            <IonIcon name="chevron-forward" color="#B0B0B0" />
                        )}
                        onPress={() => navigation.navigate('LanguageSettings')}
                        style={styles.listItem}
                    />
                </View>
            </Surface>

            {/* --- (Opcional) otra tarjeta para permisos como tu ejemplo --- */}
            {/* 
      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>{t('Permisos')}</Text>
        <View style={styles.cardBody}>
          <List.Item
            title={t('Permisos de Ubicación')}
            left={() => <IonIcon name="map-outline" color={globalColors.primary} />}
            right={() => <Switch value={enabled} onValueChange={setEnabled} />}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title={t('Notificaciones')}
            left={() => <IonIcon name="notifications-outline" color={globalColors.primary} />}
            right={() => <Switch value={notif} onValueChange={setNotif} />}
            style={styles.listItem}
          />
        </View>
      </Surface>
      */}
        </ScrollView>
    );
};
export default SettingsHome;
const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 24,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2B2B2B',
        marginBottom: 12,
    },
    cardBody: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F9F9FB',
    },
    listItem: {
        backgroundColor: 'transparent',
    },
    itemTitle: {
        fontSize: 16,
        color: '#2B2B2B',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E6E6E6',
        marginLeft: 56, // alinea con el icono
    },
    leftIcon: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});


export const SettingsStackNavigator = () => {
    const { t } = useTranslation();
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="SettingsHome"
                component={SettingsHome}
                options={({ navigation }) => ({
                    title: t('common:settings'),
                    headerLeft: (props) => (
                        <HeaderBackButton
                            {...props}
                            onPress={() => {
                                if (navigation.canGoBack()) navigation.goBack();
                                else navigation.getParent()?.openDrawer();
                            }}
                        />
                    ),
                })}
            /><Stack.Screen
                name="LanguageSettings"
                component={LanguageSettingsScreen}
                options={({ navigation }) => ({
                    title: t('common:change_language'),
                    headerLeft: (props) => (
                        <HeaderBackButton {...props} onPress={() => navigation.goBack()} />
                    ),
                    headerBackTitleVisible: false,
                })}
            />
        </Stack.Navigator>
    );
};