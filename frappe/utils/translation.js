import {
  getIndexFormat,
  getIndexList,
  getSnippets,
  getWhitespaceSanitized,
} from '../../scripts/helpers';
import { ValueError } from './errors';

class TranslationString {
  constructor(...args) {
    this.args = args;
  }

  get s() {
    return this.toString();
  }

  ctx(context) {
    this.context = context;
    return this;
  }

  #formatArg(arg) {
    return arg ?? '';
  }

  #translate() {
    let indexFormat = getIndexFormat(this.args[0]);
    indexFormat = getWhitespaceSanitized(indexFormat);

    const translatedIndexFormat =
      this.languageMap[indexFormat]?.translation ?? indexFormat;

    this.argList = getIndexList(translatedIndexFormat).map(
      (i) => this.argList[i]
    );
    this.strList = getSnippets(translatedIndexFormat);
  }

  #stitch() {
    if (!(this.args[0] instanceof Array)) {
      throw new ValueError(
        `invalid args passed to TranslationString ${
          this.args
        } of type ${typeof this.args[0]}`
      );
    }

    this.strList = this.args[0];
    this.argList = this.args.slice(1);

    if (this.languageMap) {
      this.#translate();
    }

    return this.strList
      .map((s, i) => s + this.#formatArg(this.argList[i]))
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

export function T(...args) {
  return new TranslationString(...args);
}

export function t(...args) {
  return new TranslationString(...args).s;
}

export function setLanguageMapOnTranslationString(languageMap) {
  TranslationString.prototype.languageMap = languageMap;
}
