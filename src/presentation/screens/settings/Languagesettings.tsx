/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */
import React, { useLayoutEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DefaultTheme, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← añade esto

type Lang = { code: string; flag?: string };

const LANGS: Lang[] = [
	{ code: 'en', flag: '🇬🇧' },
	{ code: 'es', flag: '🇪🇸' },
	{ code: 'ca', flag: '🇪🇸' },
	{ code: 'fr', flag: '🇫🇷' },
	{ code: 'pl', flag: '🇵🇱' },
	{ code: 'ru', flag: '🇷🇺' },
	{ code: 'ko', flag: '🇰🇷' },
	{ code: 'zh-TW', flag: '🇹🇼' },
	{ code: 'uk', flag: '🇺🇦' },
	{ code: 'pt-PT', flag: '🇵🇹' },
	{ code: 'it', flag: '🇮🇹' },

];

export const LanguageSettingsScreen = () => {
	const { t, i18n } = useTranslation(['common', 'language']);
	const navigation = useNavigation();

	const selectedLanguageCode = i18n.resolvedLanguage ?? i18n.language;

	// ← ahora también guardamos en AsyncStorage
	const setLanguage = async (code: string) => {
		await i18n.changeLanguage(code);
		await AsyncStorage.setItem('@lang', code);
	};

	useLayoutEffect(() => {
		navigation.setOptions?.({
			headerShown: true,
			headerTitle: t('common:change_language'),
		});
	}, [navigation, i18n.language, t]);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t('common:change_language')}</Text>

			{LANGS.map((lang) => {
				const selected = lang.code === selectedLanguageCode;
				const label = t(`language:${lang.code}`);
				return (
					<Pressable
						key={lang.code}
						onPress={() => setLanguage(lang.code)}
						style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
					>
						<Text style={styles.flag}>{lang.flag ?? '🌐'}</Text>
						<Text
							style={[
								styles.label,
								{ color: selected ? DefaultTheme.colors.primary : '#333' },
								selected && styles.selected,
							]}
						>
							{label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16 },
	title: { fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'left' },
	row: {
		paddingVertical: 12,
		paddingHorizontal: 8,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: '#eee',
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	flag: { width: 28, fontSize: 18, marginRight: 8, textAlign: 'center' },
	label: { fontSize: 16 },
	selected: { fontWeight: '700' },
});