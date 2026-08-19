import { Fyo } from 'fyo';
import { TranslationLiteral } from 'fyo/utils/translation';

declare module 'vue' {
  interface ComponentCustomProperties {
    t: (...args: TranslationLiteral[]) => string;
    fyo: Fyo;
    platform: 'Windows' | 'Linux' | 'Mac';
  }
}
