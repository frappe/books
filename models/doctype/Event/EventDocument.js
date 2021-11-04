import frappe from 'frappejs';
import BaseDocument from 'frappejs/model/document';

export default class Event extends BaseDocument {
    alertEvent() {
        alert(this.title);
    }
};
