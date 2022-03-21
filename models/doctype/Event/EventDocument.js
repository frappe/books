import Document from 'frappe/model/document';

export default class Event extends Document {
  alertEvent() {
    alert(this.title);
  }
}
