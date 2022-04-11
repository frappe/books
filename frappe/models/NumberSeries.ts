import frappe from 'frappe';
import Doc from 'frappe/model/doc';

function getPaddedName(prefix: string, next: number, padZeros: number): string {
  return prefix + next.toString().padStart(padZeros ?? 4, '0');
}

export default class NumberSeries extends Doc {
  validate() {
    const current = this.get('current') as number | null;
    if (current) {
      this.current = this.get('start');
    }
  }

  async next(schemaName: string) {
    this.validate();

    const exists = await this.checkIfCurrentExists(schemaName);
    if (!exists) {
      return this.getPaddedName(this.current as number);
    }

    this.current = (this.current as number) + 1;
    await this.update();
    return this.getPaddedName(this.current as number);
  }

  async checkIfCurrentExists(schemaName: string) {
    if (!schemaName) {
      return true;
    }

    const name = this.getPaddedName(this.current as number);
    return await frappe.db.exists(schemaName, name);
  }

  getPaddedName(next: number): string {
    return getPaddedName(this.name as string, next, this.padZeros as number);
  }
}
