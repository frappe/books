import BaseDocument from 'frappe/model/document';

export default class Event extends BaseDocument {
  alertEvent() {
    alert(this.title);
  }
}
