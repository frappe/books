import { LanguageMap, UnknownMap } from 'utils/types';
import {
  getIndexFormat,
  getIndexList,
  getSnippets,
  getWhitespaceSanitized,
} from '../../utils/translationHelpers';
import { ValueError } from './errors';

export type TranslationArgs = boolean | number | string;
export type TranslationLiteral = TemplateStringsArray | TranslationArgs;

class TranslationString {
  args: TranslationLiteral[];
  argList?: TranslationArgs[];
  strList?: string[];
  context?: string;
  languageMap?: LanguageMap;

  constructor(...args: TranslationLiteral[]) {
    this.args = args;
  }

  get s() {
    return this.toString();
  }

  ctx(context?: string) {
    this.context = context;
    return this;
  }

  #formatArg(arg: string | number | boolean) {
    return arg ?? '';
  }

  #translate() {
    let indexFormat = getIndexFormat(this.args[0] as string);
    indexFormat = getWhitespaceSanitized(indexFormat);

    const translatedIndexFormat =
      this.languageMap![indexFormat]?.translation ?? indexFormat;

    this.argList = getIndexList(translatedIndexFormat).map(
      (i) => this.argList![i]
    );
    this.strList = getSnippets(translatedIndexFormat);
  }

  #stitch() {
    if (!((this.args[0] as any) instanceof Array)) {
      throw new ValueError(
        `invalid args passed to TranslationString ${
          this.args
        } of type ${typeof this.args[0]}`
      );
    }

    this.strList = this.args[0] as any as string[];
    this.argList = this.args.slice(1) as TranslationArgs[];

    if (this.languageMap) {
      this.#translate();
    }

    return this.strList!.map((s, i) => s + this.#formatArg(this.argList![i]))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  toString() {
    return this.#stitch();
  }

  toJSON() {
    return this.#stitch();
  }

  valueOf() {
    return this.#stitch();
  }
}

export function T(...args: string[]): TranslationString {
  return new TranslationString(...args);
}

export function t(...args: TranslationLiteral[]): string {
  return new TranslationString(...args).s;
}

export function setLanguageMapOnTranslationString(
  languageMap: LanguageMap | undefined
) {
  TranslationString.prototype.languageMap = languageMap;
}

export function translateSchema(
  map: UnknownMap | UnknownMap[],
  languageMap: LanguageMap,
  translateables: string[]
) {
  if (Array.isArray(map)) {
    for (const item of map) {
      translateSchema(item, languageMap, translateables);
    }
    return;
  }

  if (typeof map !== 'object') {
    return;
  }

  for (const key of Object.keys(map)) {
    const value = map[key];
    if (
      typeof value === 'string' &&
      translateables.includes(key) &&
      languageMap[value]?.translation
    ) {
      map[key] = languageMap[value].translation;
    }

    if (typeof value !== 'object') {
      continue;
    }

    translateSchema(
      value as UnknownMap | UnknownMap[],
      languageMap,
      translateables
    );
  }
}
