import GSTR3B from './GSTR3BDocument';

export default class GSTR3BServer extends GSTR3B {
  async validate() {
    if (this.month.length === 0 || this.year.length != 4) {
      throw new Error('Month or Year is not valid');
    }
  }
  async beforeInsert() {
    this.name = `${this.doctype} Report ${this.month} ${this.year}`;
  }
};
