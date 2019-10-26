const frappe = require('frappejs');
const Observable = require('frappejs/utils/observable');
const triggerEvent = name => frappe.events.trigger(`http:${name}`);

module.exports = class HTTPClient extends Observable {
  constructor({ server, protocol = 'http' }) {
    super();

    this.server = server;
    this.protocol = protocol;
    frappe.config.serverURL = this.getURL();

    // if the backend is http, then always client!
    frappe.isServer = false;

    this.initTypeMap();
  }

  connect() {

  }

  async insert(doctype, doc) {
    doc.doctype = doctype;
    let filesToUpload = this.getFilesToUpload(doc);
    let url = this.getURL('/api/resource', doctype);

    const responseDoc = await this.fetch(url, {
      method: 'POST',
      body: JSON.stringify(doc)
    });

    await this.uploadFilesAndUpdateDoc(filesToUpload, doctype, responseDoc);

    return responseDoc;
  }

  async get(doctype, name) {
    name = encodeURIComponent(name);
    let url = this.getURL('/api/resource', doctype, name);
    return await this.fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
  }

  async getAll({ doctype, fields, filters, start, limit, sortBy, order }) {
    let url = this.getURL('/api/resource', doctype);

    url = url + '?' + frappe.getQueryString({
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      start: start,
      limit: limit,
      sortBy: sortBy,
      order: order
    });

    return await this.fetch(url, {
      method: 'GET',
    });
  }

  async update(doctype, doc) {
    doc.doctype = doctype;
    let filesToUpload = this.getFilesToUpload(doc);
    let url = this.getURL('/api/resource', doctype, doc.name);

    const responseDoc = await this.fetch(url, {
      method: 'PUT',
      body: JSON.stringify(doc)
    });

    await this.uploadFilesAndUpdateDoc(filesToUpload, doctype, responseDoc);

    return responseDoc;
  }

  async delete(doctype, name) {
    let url = this.getURL('/api/resource', doctype, name);

    return await this.fetch(url, {
      method: 'DELETE',
    });
  }

  async deleteMany(doctype, names) {
    let url = this.getURL('/api/resource', doctype);

    return await this.fetch(url, {
      method: 'DELETE',
      body: JSON.stringify(names)
    });
  }

  async exists(doctype, name) {
    return (await this.getValue(doctype, name, 'name')) ? true : false;
  }

  async getValue(doctype, name, fieldname) {
    let url = this.getURL('/api/resource', doctype, name, fieldname);

    return (await this.fetch(url, {
      method: 'GET',
    })).value;
  }

  async fetch(url, args) {
    triggerEvent('ajaxStart');

    args.headers = this.getHeaders();
    let response = await frappe.fetch(url, args);

    triggerEvent('ajaxStop');

    if (response.status === 200) {
      let data = await response.json();
      return data;
    }

    if (response.status === 401) {
      triggerEvent('unauthorized');
    }

    throw Error(await response.text());
  }

  getFilesToUpload(doc) {
    const meta = frappe.getMeta(doc.doctype);
    const fileFields = meta.getFieldsWith({ fieldtype: 'File' });
    const filesToUpload = [];

    if (fileFields.length > 0) {
      fileFields.forEach(df => {
        const files = doc[df.fieldname] || [];
        if (files.length) {
          filesToUpload.push({
            fieldname: df.fieldname,
            files: files
          })
        }
        delete doc[df.fieldname];
      });
    }

    return filesToUpload;
  }

  async uploadFilesAndUpdateDoc(filesToUpload, doctype, doc) {
    if (filesToUpload.length > 0) {
      // upload files
      for (const fileToUpload of filesToUpload) {
        const files = await this.uploadFiles(fileToUpload.files, doctype, doc.name, fileToUpload.fieldname);
        doc[fileToUpload.fieldname] = files[0].name;
      }
    }
  }

  async uploadFiles(fileList, doctype, name, fieldname) {
    let url = this.getURL('/api/upload', doctype, name, fieldname);

    let formData = new FormData();
    for (const file of fileList) {
      formData.append('files', file, file.name);
    }

    let response = await frappe.fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (response.status !== 200) {
      throw Error(data.error);
    }
    return data;
  }

  getURL(...parts) {
    return this.protocol + '://' + this.server + (parts || []).join('/');
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    if (frappe.session && frappe.session.token) {
      headers.token = frappe.session.token;
    };
    return headers;
  }

  initTypeMap() {
    this.typeMap = {
      'AutoComplete': true
      , 'Currency': true
      , 'Int': true
      , 'Float': true
      , 'Percent': true
      , 'Check': true
      , 'Small Text': true
      , 'Long Text': true
      , 'Code': true
      , 'Text Editor': true
      , 'Date': true
      , 'Datetime': true
      , 'Time': true
      , 'Text': true
      , 'Data': true
      , 'Link': true
      , 'DynamicLink': true
      , 'Password': true
      , 'Select': true
      , 'Read Only': true
      , 'File': true
      , 'Attach': true
      , 'Attach Image': true
      , 'Signature': true
      , 'Color': true
      , 'Barcode': true
      , 'Geolocation': true
    }
  }

  close() {

  }

}
