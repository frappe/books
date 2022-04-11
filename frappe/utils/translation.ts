import { LanguageMap } from 'utils/types';
import {
  getIndexFormat,
  getIndexList,
  getSnippets,
  getWhitespaceSanitized,
} from '../../scripts/helpers';
import { ValueError } from './errors';

type TranslationArgs = boolean | number | string;
type TranslationLiteral = TemplateStringsArray | TranslationArgs;

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
    let indexFormat = getIndexFormat(this.args[0]);
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

export function setLanguageMapOnTranslationString(languageMap: LanguageMap) {
  TranslationString.prototype.languageMap = languageMap;
}
