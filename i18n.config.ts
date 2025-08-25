import en from './locales/en/index'
import es from './locales/es/index'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en,
    es
  }
}))