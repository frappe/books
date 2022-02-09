import { ValueError } from '../common/errors';

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

  #translate(segment) {
    const startSpace = segment.match(/^\s+/)?.[0] ?? '';
    const endSpace = segment.match(/\s+$/)?.[0] ?? '';
    segment = segment.replace(/\s+/g, ' ').trim();
    // TODO: implement translation backend
    // segment = translate(segment)
    return startSpace + segment + endSpace;
  }

  #formatArg(arg) {
    return arg ?? '';
  }

  #stitch() {
    if (!(this.args[0] instanceof Array)) {
      return this.args.join(' ');
      throw new ValueError(
        `invalid args passed to TranslationString ${
          this.args
        } of type ${typeof this.args[0]}`
      );
    }

    const strList = this.args[0];
    const argList = this.args.slice(1);
    return strList
      .map((s, i) => this.#translate(s) + this.#formatArg(argList[i]))
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
