import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ar } from './ar'
import { en } from './en'

const KEY = 'numrati.lang'

function savedLanguage() {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function applyDirection(lang: string) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // storage can be unavailable in private windows
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

applyDirection(i18n.language)
i18n.on('languageChanged', applyDirection)

export default i18n
