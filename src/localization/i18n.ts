import i18n, { type LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en';
import es from './es';
import ca from './ca';
import fr from './fr';
import pl from './pl';
import ru from './ru';
import ko from './ko';
import uk from './uk';
import zhTW from './zh-TW';
import PT from './pt-PT';
import it from './it';

const resources = {
  en, es, ca, fr, pl, ru, ko, uk,
  'zh-TW': zhTW,
  'pt-PT': PT, it
};

const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: (cb) => {
    AsyncStorage.getItem('@lang')
      .then((lng) => { /* console.log('LANG@boot:', lng); */ cb(lng || 'es'); })
      .catch(() => cb('es'));
  },
  init: () => { },
  cacheUserLanguage: (lng) => {
    // console.log('LANG@save:', lng);
    AsyncStorage.setItem('@lang', lng).catch(() => { });
  },
};

if (!i18n.isInitialized) {
  i18n
    //.use(languageDetector)
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      initImmediate: false,
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'es', 'ca', 'fr', 'pl', 'ru', 'ko', 'uk', 'zh-TW', 'pt-PT', 'pt', 'it'],
      nonExplicitSupportedLngs: true,
      lowerCaseLng: false,
      load: 'currentOnly',
      interpolation: { escapeValue: false },
      defaultNS: 'common',
      ns: ['common', 'navigate', 'language'],
      returnNull: false,
      debug: __DEV__, // te da pistas en consola
    });
}

export default i18n;