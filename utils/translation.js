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
    if (this.context) {
      // do something
    }
    return segment;
  }

  #stitch() {
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

function T(...args) {
  if (typeof args[0] === 'string') {
    return stringReplace(args[0], args.slice(1));
  }

  return new TranslationString(...args);
}
