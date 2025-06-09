import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { setLanguageMapOnTranslationString } from 'fyo/utils/translation';
import { fyo } from 'src/initFyo';
import { systemLanguageRef } from './refs';

// Language: Language Code in books/translations
export const languageCodeMap: Record<string, string> = {
  Arabic: 'ar',
  Catalan: 'ca-ES',
  Danish: 'da',
  Dutch: 'nl',
  English: 'en',
  French: 'fr',
  German: 'de',
  Gujarati: 'gu',
  Hindi: 'hi',
  Indonesian: 'id',
  Korean: 'ko',
  Nepali: 'np',
  Persian: 'fa',
  Portuguese: 'pt',
  'Simplified Chinese': 'zh-CN',
  'Traditional Chinese': 'zh-Hant',
  Spanish: 'es',
  Swedish: 'sv',
  Turkish: 'tr',
};

export async function setLanguageMap(
  initLanguage?: string,
  dontReload = false
) {
  const oldLanguage = fyo.config.get('language') as string;
  initLanguage ??= oldLanguage;
  const { code, language, usingDefault } = getLanguageCode(
    initLanguage,
    oldLanguage
  );

  let success = true;
  if (code === 'en') {
    setLanguageMapOnTranslationString(undefined);
  } else {
    success = await fetchAndSetLanguageMap(code);
  }

  if (success && !usingDefault) {
    fyo.config.set('language', language);
    systemLanguageRef.value = language;
  }

  if (!dontReload && success && initLanguage !== oldLanguage) {
    ipc.reloadWindow();
  }
  return success;
}

function getLanguageCode(initLanguage: string, oldLanguage: string) {
  let language = initLanguage ?? oldLanguage;
  let usingDefault = false;

  if (!language) {
    language = DEFAULT_LANGUAGE;
    usingDefault = true;
  }
  const code = languageCodeMap[language] ?? 'en';
  return { code, language, usingDefault };
}

async function fetchAndSetLanguageMap(code: string) {
  const { success, message, languageMap } = await ipc.getLanguageMap(code);

  if (!success) {
    const { showToast } = await import('src/utils/interactive');
    showToast({ type: 'error', message });
  } else {
    setLanguageMapOnTranslationString(languageMap);
    await fyo.db.translateSchemaMap(languageMap);
  }

  return success;
}
