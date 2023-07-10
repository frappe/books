import { DEFAULT_LANGUAGE } from 'fyo/utils/consts';
import { setLanguageMapOnTranslationString } from 'fyo/utils/translation';
import { fyo } from 'src/initFyo';
import { systemLanguageRef } from './refs';

// Language: Language Code in books/translations
export const languageCodeMap: Record<string, string> = {
  English: 'en',
  French: 'fr',
  German: 'de',
  Portuguese: 'pt',
  Arabic: 'ar',
  Catalan: 'ca-ES',
  Spanish: 'es',
  Dutch: 'nl',
  Gujarati: 'gu',
  Turkish: 'tr',
  Korean: 'ko',
  Swedish: 'sv',
  'Simplified Chinese': 'zh-CN',
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
