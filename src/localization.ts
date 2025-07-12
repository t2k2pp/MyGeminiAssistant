import en from './locales/en.json' with { type: 'json' };
import ja from './locales/ja.json' with { type: 'json' };
import { Language } from './types.ts';

const translations = { en, ja };

export const translate = (key: string, lang: Language): string => {
  const keys = key.split('.');
  let result: any = translations[lang];
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) {
      // Fallback to English if translation is missing
      let fallbackResult: any = translations.en;
      for (const fk of keys) {
          fallbackResult = fallbackResult?.[fk];
      }
      return fallbackResult || key;
    }
  }
  return result || key;
};