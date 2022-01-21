import { ValueError } from '../common/errors';

function stringReplace(str, args) {
  if (!Array.isArray(args)) {
    args = [args];
  }

  if (str == undefined) return str;

  let unkeyed_index = 0;
  return str.replace(/\{(\w*)\}/g, (match, key) => {
    if (key === '') {
      key = unkeyed_index;
      unkeyed_index++;
    }
    if (key == +key) {
      return args[key] !== undefined ? args[key] : match;
    }
  });
}

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
    // TODO: implement translation backend
    return segment;
  }

  #stitch() {
    if (typeof this.args[0] === 'string') {
      return stringReplace(this.args[0], this.args.slice(1));
    }

    if (!(this.args[0] instanceof Array)) {
      throw new ValueError(
        `invalid args passed to TranslationString ${
          this.args
        } of type ${typeof this.args[0]}`
      );
    }

    const strList = this.args[0];
    const argList = this.args.slice(1);
    return strList
      .map((s, i) => this.#translate(s) + (argList[i] ?? ''))
      .join('');
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
