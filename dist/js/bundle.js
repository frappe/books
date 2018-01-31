var desk = (function () {
'use strict';

const number_formats = {
	"#,###.##": { fraction_sep: ".", group_sep: ",", precision: 2 },
	"#.###,##": { fraction_sep: ",", group_sep: ".", precision: 2 },
	"# ###.##": { fraction_sep: ".", group_sep: " ", precision: 2 },
	"# ###,##": { fraction_sep: ",", group_sep: " ", precision: 2 },
	"#'###.##": { fraction_sep: ".", group_sep: "'", precision: 2 },
	"#, ###.##": { fraction_sep: ".", group_sep: ", ", precision: 2 },
	"#,##,###.##": { fraction_sep: ".", group_sep: ",", precision: 2 },
	"#,###.###": { fraction_sep: ".", group_sep: ",", precision: 3 },
	"#.###": { fraction_sep: "", group_sep: ".", precision: 0 },
	"#,###": { fraction_sep: "", group_sep: ",", precision: 0 },
};

var number_format = {
	// parse a formatted number string
	// from "4,555,000.34" -> 4555000.34
	parse_number(number, format='#,###.##') {
		if (!number) {
			return 0;
		}
		if (typeof number === 'number') {
			return number;
		}
		const info = this.get_format_info(format);
		return parseFloat(this.remove_separator(number, info.group_sep));
	},

	format_number(number, format = '#,###.##', precision = null) {
		if (!number) {
			number = 0;
		}
		let info = this.get_format_info(format);
		if (precision) {
			info.precision = precision;
		}
		let is_negative = false;

		number = this.parse_number(number);
		if (number < 0) {
			is_negative = true;
		}
		number = Math.abs(number);
		number = number.toFixed(info.precision);

		var parts = number.split('.');

		// get group position and parts
		var group_position = info.group_sep ? 3 : 0;

		if (group_position) {
			var integer = parts[0];
			var str = '';
			var offset = integer.length % group_position;
			for (var i = integer.length; i >= 0; i--) {
				var l = this.remove_separator(str, info.group_sep).length;
				if (format == "#,##,###.##" && str.indexOf(",") != -1) { // INR
					group_position = 2;
					l += 1;
				}

				str += integer.charAt(i);

				if (l && !((l + 1) % group_position) && i != 0) {
					str += info.group_sep;
				}
			}
			parts[0] = str.split("").reverse().join("");
		}
		if (parts[0] + "" == "") {
			parts[0] = "0";
		}

		// join decimal
		parts[1] = (parts[1] && info.fraction_sep) ? (info.fraction_sep + parts[1]) : "";

		// join
		return (is_negative ? "-" : "") + parts[0] + parts[1];
	},

	get_format_info(format) {
		let format_info = number_formats[format];

		if (!format_info) {
			throw `Unknown number format "${format}"`;
		}

		return format_info;
	},

	round(num, precision) {
        var is_negative = num < 0 ? true : false;
        var d = parseInt(precision || 0);
        var m = Math.pow(10, d);
        var n = +(d ? Math.abs(num) * m : Math.abs(num)).toFixed(8); // Avoid rounding errors
        var i = Math.floor(n), f = n - i;
        var r = ((!precision && f == 0.5) ? ((i % 2 == 0) ? i : i + 1) : Math.round(n));
        r = d ? r / m : r;
        return is_negative ? -r : r;
	},

	remove_separator(text, sep) {
		return text.replace(new RegExp(sep === "." ? "\\." : sep, "g"), '');
	}
};

let utils = {};

Object.assign(utils, number_format);

Object.assign(utils, {
    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
    },

    async_handler(fn) {
        return (req, res, next) => Promise.resolve(fn(req, res, next))
            .catch((err) => {
                console.log(err);
                // handle error
                res.status(err.status_code || 500).send({error: err.message});
            });
    },

    async sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    }
});

var utils_1 = utils;

var model = {
    standard_fields: [
        {
            fieldname: 'name', fieldtype: 'Data', reqd: 1
        },
        {
            fieldname: 'owner', fieldtype: 'Link', reqd: 1, options: 'User'
        },
        {
            fieldname: 'modified_by', fieldtype: 'Link', reqd: 1, options: 'User'
        },
        {
            fieldname: 'creation', fieldtype: 'Datetime', reqd: 1
        },
        {
            fieldname: 'modified', fieldtype: 'Datetime', reqd: 1
        },
        {
            fieldname: 'keywords', fieldtype: 'Text'
        },
        {
            fieldname: 'docstatus', fieldtype: 'Int', reqd: 1, default: 0
        }
    ],
    child_fields: [
        {
            fieldname: 'idx', fieldtype: 'Int', reqd: 1
        },
        {
            fieldname: 'parent', fieldtype: 'Data', reqd: 1
        },
        {
            fieldname: 'parenttype', fieldtype: 'Link', reqd: 1, options: 'DocType'
        },
        {
            fieldname: 'parentfield', fieldtype: 'Data', reqd: 1
        }
    ]
};

var frappejs = {
    async init() {
        if (this._initialized) return;
        this.init_config();
        this.init_globals();
        this._initialized = true;
    },

    init_config() {
        this.config = {
            backend: 'sqlite',
            port: 8000
        };
    },

    init_globals() {
        this.meta_cache = {};
        this.modules = {};
        this.docs = {};
        this.flags = {
            cache_docs: false
        };
    },

    add_to_cache(doc) {
        if (!this.flags.cache_docs) return;

        // add to `docs` cache
        if (doc.doctype && doc.name) {
            if (!this.docs[doc.doctype]) {
                this.docs[doc.doctype] = {};
            }
            this.docs[doc.doctype][doc.name] = doc;
        }
    },

    get_doc_from_cache(doctype, name) {
        if (this.docs[doctype] && this.docs[doctype][name]) {
            return this.docs[doctype][name];
        }
    },

    get_meta(doctype) {
        if (!this.meta_cache[doctype]) {
            this.meta_cache[doctype] = new (this.get_meta_class(doctype))();
        }
        return this.meta_cache[doctype];
    },

    get_meta_class(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Meta) {
            return this.modules[doctype].Meta;
        } else {
            return this.BaseMeta;
        }
    },

    async get_doc(data, name) {
        if (typeof data==='string' && typeof name==='string') {
            let doc = this.get_doc_from_cache(data, name);
            if (!doc) {
                let controller_class = this.get_controller_class(data);
                doc = new controller_class({doctype:data, name: name});
                await doc.load();
                this.add_to_cache(doc);
            }
            return doc;
        } else {
            let controller_class = this.get_controller_class(data.doctype);
            var doc = new controller_class(data);
        }
        return doc;
    },

    get_controller_class(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Document) {
            return this.modules[doctype].Document;
        } else {
            return this.BaseDocument;
        }
    },

    async get_new_doc(doctype) {
        let doc = await frappe.get_doc({doctype: doctype});
        doc.set_name();
        doc.__not_inserted = true;
        this.add_to_cache(doc);
        return doc;
    },

    async insert(data) {
        const doc = await this.get_doc(data);
        return await doc.insert();
    },

    login(user='guest', user_key) {
        this.session = new this._session.Session(user);
        if (user && user_key) {
            this.authenticate(user_key);
        }
    },

    close() {
        this.db.close();

        if (this.server) {
            this.server.close();
        }
    }
};

var document$1 = class BaseDocument {
    constructor(data) {
        this.handlers = {};
        this.setup();
        Object.assign(this, data);
    }

    setup() {
        // add handlers
    }

    clear_handlers() {
        this.handlers = {};
    }

    add_handler(key, method) {
        if (!this.handlers[key]) {
            this.handlers[key] = [];
        }
        this.handlers[key].push(method || key);
    }

    get(fieldname) {
        return this[fieldname];
    }

    // set value and trigger change
    async set(fieldname, value) {
        this[fieldname] = await this.validate_field(fieldname, value);
        await this.trigger('change', {doc: this, fieldname: fieldname, value: value});
    }

    set_name() {
        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = Math.random().toString(36).substr(3);
        }
    }

    set_keywords() {
        let keywords = [];
        for (let fieldname of this.meta.get_keyword_fields()) {
            keywords.push(this[fieldname]);
        }
        this.keywords = keywords.join(', ');
    }

    get meta() {
        if (!this._meta) {
            this._meta = frappejs.get_meta(this.doctype);
        }
        return this._meta;
    }

    append(key, document) {
        if (!this[key]) {
            this[key] = [];
        }
        this[key].push(this.init_doc(document));
    }

    init_doc(data) {
        if (data.prototype instanceof Document) {
            return data;
        } else {
            return new Document(d);
        }
    }

    async validate_field (key, value) {
        let df = this.meta.get_field(key);
        if (df && df.fieldtype=='Select') {
            return this.meta.validate_select(df, value);
        }
        return value;
    }

    get_valid_dict() {
        let doc = {};
        for(let df of this.meta.get_valid_fields()) {
            doc[df.fieldname] = this.get(df.fieldname);
        }
        return doc;
    }

    set_standard_values() {
        let now = new Date();
        if (this.docstatus === null || this.docstatus === undefined) {
            this.docstatus = 0;
        }
        if (!this.owner) {
            this.owner = frappejs.session.user;
            this.creation = now;
        }
        this.modified_by = frappejs.session.user;
        this.modified = now;
    }

    async load() {
        let data = await frappejs.db.get(this.doctype, this.name);
        if (data.name) {
            Object.assign(this, data);
        } else {
            throw new frappejs.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    async insert() {
        this.set_name();
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_insert');
        await frappejs.db.insert(this.doctype, this.get_valid_dict());
        await this.trigger('after_insert');
        await this.trigger('after_save');
    }

    async delete() {
        await this.trigger('before_delete');
        await frappejs.db.delete(this.doctype, this.name);
        await this.trigger('after_delete');
    }

    async trigger(key, params) {
        if (this.handlers[key]) {
            for (let method of this.handlers[key]) {
                if (typeof method === 'string') {
                    await this[method](params);
                } else {
                    await method(params);
                }
            }
        }
    }

    async update() {
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_update');
        await frappejs.db.update(this.doctype, this.get_valid_dict());
        await this.trigger('after_update');
        await this.trigger('after_save');
        return this;
    }
};

var meta = class BaseMeta extends document$1 {
    constructor(data) {
        super(data);
        this.event_handlers = {};
        this.list_options = {
            fields: ['name', 'modified']
        };
        if (this.setup_meta)  {
            this.setup_meta();
        }
    }

    get_field(fieldname) {
        if (!this.field_map) {
            this.field_map = {};
            for (let df of this.fields) {
                this.field_map[df.fieldname] = df;
            }
        }
        return this.field_map[fieldname];
    }

    on(key, fn) {
        if (!this.event_handlers[key]) {
            this.event_handlers[key] = [];
        }
        this.event_handlers[key].push(fn);
    }

    async set(fieldname, value) {
        this[fieldname] = value;
        await this.trigger(fieldname);
    }

    get(fieldname) {
        return this[fieldname];
    }

    get_valid_fields() {
        if (!this._valid_fields) {
            this._valid_fields = [];

            const doctype_fields = this.fields.map((df) => df.fieldname);

            // standard fields
            for (let df of frappejs.model.standard_fields) {
                if (frappejs.db.type_map[df.fieldtype] && !doctype_fields.includes(df.fieldname)) {
                    this._valid_fields.push(df);
                }
            }

            // parent fields
            if (this.istable) {
                for (let df of frappejs.model.child_fields) {
                    if (frappejs.db.type_map[df.fieldtype] && !doctype_fields.includes(df.fieldname)) {
                        this._valid_fields.push(df);
                    }
                }
            }

            // doctype fields
            for (let df of this.fields) {
                if (frappejs.db.type_map[df.fieldtype]) {
                    this._valid_fields.push(df);
                }
            }
        }

        return this._valid_fields;
    }

    get_keyword_fields() {
        return this.keyword_fields || this.meta.fields.filter(df => df.reqd).map(df => df.fieldname);
    }

    validate_select(df, value) {
        let options = df.options;
        if (typeof options === 'string') {
            // values given as string
            options = df.options.split('\n');
        }
        if (!options.includes(value)) {
            throw new frappejs.errors.ValueError(`${value} must be one of ${options.join(", ")}`);
        }
        return value;
    }

    async trigger(key, event = {}) {
        Object.assign(event, {
            doc: this,
            name: key
        });

        if (this.event_handlers[key]) {
            for (var handler of this.event_handlers[key]) {
                await handler(event);
            }
        }
    }
};

class Session {
    constructor(user, user_key) {
        this.user = user || 'guest';
        if (this.user !== 'guest') {
            this.login(user_key);
        }
    }

    login(user_key) {
        // could be password, sessionid, otp
    }

}

var session = { Session: Session };

class BaseError extends Error {
	constructor(status_code, ...params) {
		super(...params);
		this.status_code = status_code;
	}
}

class ValidationError extends BaseError {
	constructor(...params) { super(417, ...params); }
}

var errors = {
	ValidationError: ValidationError,
	ValueError: class ValueError extends ValidationError { },
	NotFound: class NotFound extends BaseError {
		constructor(...params) { super(404, ...params); }
	},
	Forbidden: class Forbidden extends BaseError {
		constructor(...params) { super(403, ...params); }
	},
};

var common = {
    init_libs(frappe) {
        Object.assign(frappe, utils_1);
        frappe.model = model;
        frappe.BaseDocument = document$1;
        frappe.BaseMeta = meta;
        frappe._session = session;
        frappe.errors = errors;
    }
};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
function resolve() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : '/';

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
}

// path.normalize(path)
// posix version
function normalize(path) {
  var isPathAbsolute = isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}

// posix version
function isAbsolute(path) {
  return path.charAt(0) === '/';
}

// posix version
function join() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
}


// path.relative(from, to)
// posix version
function relative(from, to) {
  from = resolve(from).substr(1);
  to = resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
}

var sep = '/';
var delimiter = ':';

function dirname(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}

function basename(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
}


function extname(path) {
  return splitPath(path)[3];
}
var path = {
  extname: extname,
  basename: basename,
  dirname: dirname,
  sep: sep,
  delimiter: delimiter,
  relative: relative,
  join: join,
  isAbsolute: isAbsolute,
  normalize: normalize,
  resolve: resolve
};
function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b' ?
    function (str, start, len) { return str.substr(start, len) } :
    function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    };


var path$1 = Object.freeze({
	resolve: resolve,
	normalize: normalize,
	isAbsolute: isAbsolute,
	join: join,
	relative: relative,
	sep: sep,
	delimiter: delimiter,
	dirname: dirname,
	basename: basename,
	extname: extname,
	default: path
});

var path$2 = ( path$1 && path ) || path$1;

var rest_client = class RESTClient {
    constructor({server, protocol='http'}) {
        this.server = server;
        this.protocol = protocol;

        this.init_type_map();

        this.json_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    connect() {

    }

    async insert(doctype, doc) {
        doc.doctype = doctype;
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}`);
        let response = await frappejs.fetch(url, {
            method: 'POST',
            headers: this.json_headers,
            body: JSON.stringify(doc)
        });

        return await response.json();
    }

    async get(doctype, name) {
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}/${name}`);
        let response = await frappejs.fetch(url, {
            method: 'GET',
            headers: this.json_headers
        });
        return await response.json();
    }

    async get_all({doctype, fields, filters, start, limit, sort_by, order}) {
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}`);

        url = url + "?" + this.get_query_string({
            fields: JSON.stringify(fields),
            filters: JSON.stringify(filters),
            start: start,
            limit: limit,
            sort_by: sort_by,
            order: order
        });

        let response = await frappejs.fetch(url, {
            method: 'GET',
            headers: this.json_headers
        });
        return await response.json();

    }

    async update(doctype, doc) {
        doc.doctype = doctype;
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}/${doc.name}`);
        let response = await frappejs.fetch(url, {
            method: 'PUT',
            headers: this.json_headers,
            body: JSON.stringify(doc)
        });

        return await response.json();
    }

    async delete(doctype, name) {
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}/${name}`);

        let response = await frappejs.fetch(url, {
            method: 'DELETE',
            headers: this.json_headers
        });

        return await response.json();
    }

    get_query_string(params) {
        return Object.keys(params)
            .map(k => params[k] != null ? encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) : null)
            .filter(v => v)
            .join('&');
    }

    async get_value(doctype, name, fieldname) {
        let url = this.protocol + '://' + path$2.join(this.server, `/api/resource/${frappejs.slug(doctype)}/${name}/${fieldname}`);
        let response = await frappejs.fetch(url, {
            method: 'GET',
            headers: this.json_headers
        });
        return (await response.json()).value;
    }

    init_type_map() {
        this.type_map = {
            'Currency':        true
            ,'Int':            true
            ,'Float':        true
            ,'Percent':        true
            ,'Check':        true
            ,'Small Text':    true
            ,'Long Text':    true
            ,'Code':        true
            ,'Text Editor':    true
            ,'Date':        true
            ,'Datetime':    true
            ,'Time':        true
            ,'Text':        true
            ,'Data':        true
            ,'Link':        true
            ,'Dynamic Link':true
            ,'Password':    true
            ,'Select':        true
            ,'Read Only':    true
            ,'Attach':        true
            ,'Attach Image':true
            ,'Signature':    true
            ,'Color':        true
            ,'Barcode':        true
            ,'Geolocation':    true
        };
    }

    close() {

    }

};

class Dropdown {
    constructor({parent, label, btn_class = 'btn-secondary', items = []}) {
        Object.assign(this, arguments[0]);

        this.dropdown_items = [];
        this.setup_background_click();
        this.make();

        // init items
        if (this.items) {
            for (item of this.items) {
                this.add_item(item.label, item.action);
            }
        }
    }

    setup_background_click() {
        if (!document.dropdown_setup) {
            frappejs.dropdowns = [];
            // setup hiding all dropdowns on click
            document.addEventListener('click', (event) => {
                for (let d of frappejs.dropdowns) {
                    if (d.button !== event.target) {
                        d.collapse();
                    }
                }
            });
            document.dropdown_setup = true;
        }
        frappejs.dropdowns.push(this);
    }

    make() {
        this.dropdown = frappejs.ui.add('div', 'dropdown', this.parent);
        this.make_button();
        this.dropdown_menu = frappejs.ui.add('div', 'dropdown-menu', this.dropdown);
    }

    make_button() {
        this.button = frappejs.ui.add('button', 'btn ' + this.btn_class,
            this.dropdown);
        frappejs.ui.add_class(this.button, 'dropdown-toggle');
        this.button.textContent = this.label;
        this.button.addEventListener('click', () => {
            this.toggle();
        });
    }

    expand() {
        this.dropdown.classList.add('show');
        this.dropdown_menu.classList.add('show');
    }

    collapse() {
        this.dropdown.classList.remove('show');
        this.dropdown_menu.classList.remove('show');
    }

    toggle() {
        this.dropdown.classList.toggle('show');
        this.dropdown_menu.classList.toggle('show');
    }

    add_item(label, action) {
        let item = frappejs.ui.add('button', 'dropdown-item', this.dropdown_menu);
        item.textContent = label;
        item.setAttribute('type', 'button');
        if (typeof action === 'string') {
            item.src = action;
            item.addEventListener('click', async () => {
                await frappejs.router.set_route(action);
                this.toggle();
            });
        } else {
            item.addEventListener('click', async () => {
                await action();
                this.toggle();
            });
        }
        this.dropdown_items.push(item);
    }

    float_right() {
        frappejs.ui.add_class(this.dropdown, 'float-right');
        frappejs.ui.add_class(this.dropdown_menu, 'dropdown-menu-right');
    }
}

var dropdown = Dropdown;

var ui = {
    add(tag, className, parent) {
        let element = document.createElement(tag);
        if (className) {
            for (let c of className.split(' ')) {
                this.add_class(element, c);
            }
        }
        if (parent) {
            parent.appendChild(element);
        }
        return element;
    },

    remove(element) {
        element.parentNode.removeChild(element);
    },

    add_class(element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += " " + className;
        }
    },

    remove_class(element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    },

    toggle(element, default_display = '') {
        element.style.display = element.style.display === 'none' ? default_display : 'none';
    },

    make_dropdown(label, parent, btn_class = 'btn-secondary') {
        return new dropdown({parent: parent, label:label, btn_class:btn_class});
    }

};

var router = class Router {
    constructor() {
        this.last_route = null;
        this.current_page = null;
        this.static_routes = [];
        this.dynamic_routes = [];
    }

    add(route, handler) {
        let page = {handler: handler, route: route};

        // '/todo/:name/:place'.match(/:([^/]+)/g);
        page.param_keys = route.match(/:([^/]+)/g);

        if (page.param_keys) {
            // make expression
            // '/todo/:name/:place'.replace(/\/:([^/]+)/g, "\/([^/]+)");
            page.depth = route.split('/').length;
            page.expression = route.replace(/\/:([^/]+)/g, "\/([^/]+)");
            this.dynamic_routes.push(page);
            this.sort_dynamic_routes();
        } else {
            this.static_routes.push(page);
            this.sort_static_routes();
        }
    }

    sort_dynamic_routes() {
        // routes with more parts first
        this.dynamic_routes = this.dynamic_routes.sort((a, b) => {
            if (a.depth < b.depth) {
                return 1;
            } else if (a.depth > b.depth) {
                return -1;
            } else {
                if (a.param_keys.length !== b.param_keys.length) {
                    return a.param_keys.length > b.param_keys.length ? 1 : -1;
                } else {
                    return a.route.length > b.route.length ? 1 : -1;
                }
            }
        });
    }

    sort_static_routes() {
        // longer routes on first
        this.static_routes = this.static_routes.sort((a, b) => {
            return a.route.length > b.route.length ? 1 : -1;
        });
    }

    listen() {
        window.addEventListener('hashchange', (event) => {
            let route = this.get_route_string();
            if (this.last_route !== route) {
                this.show(route);
            }
        });
    }

    // split and get routes
    get_route() {
        let route = this.get_route_string();
        if (route) {
            return route.split('/');
        } else {
            return [];
        }
    }

    async set_route(...parts) {
        const route = parts.join('/');

        // setting this first, does not trigger show via hashchange,
        // since we want to this with async/await, we need to trigger
        // the show method
        this.last_route = route;

        window.location.hash = route;
        await this.show(route);
    }

    async show(route) {
        if (route && route[0]==='#') {
            route = route.substr(1);
        }

        this.last_route = route;

        if (!route) {
            route = this.default;
        }
        let page = this.match(route);

        if (page) {
            if (typeof page.handler==='function') {
                await page.handler(page.params);
            } else {
                await page.handler.show(page.params);
            }
        } else {
            await this.match('not-found').handler({route: route});
        }
    }

    match(route) {
        // match static
        for(let page of this.static_routes) {
            if (page.route === route) {
                return {handler: page.handler};
            }
        }

        // match dynamic
        for(let page of this.dynamic_routes) {
            let matches = route.match(new RegExp(page.expression));

            if (matches && matches.length == page.param_keys.length + 1) {
                let params = {};
                for (let i=0; i < page.param_keys.length; i++) {
                    params[page.param_keys[i].substr(1)] = matches[i + 1];
                }
                return {handler:page.handler, params: params};
            }
        }
    }

    get_route_string() {
        let route = window.location.hash;
        if (route && route[0]==='#') {
            route = route.substr(1);
        }
        return route;
    }
};

var observable = class Observable {
	constructor() {
		this._handlers = {};
	}

    on(event, fn) {
        if (!this._handlers[event]) {
			this._handlers[event] = [];
		}
        this._handlers[event].push(fn);
    }

    async trigger(event, params) {
        if (this._handlers[event]) {
            for (let handler of this._handlers[event]) {
                await handler(params);
            }
        }
    }
};

var page = class Page extends observable {
    constructor(title) {
        super();
        this.title = title;
        this.make();
    }

    make() {
        this.wrapper = frappejs.ui.add('div', 'page hide', frappejs.desk.body);
        this.body = frappejs.ui.add('div', 'page-body', this.wrapper);
    }

    hide() {
        this.wrapper.classList.add('hide');
        this.trigger('hide');
    }

    async show(params) {
        if (frappejs.router.current_page) {
            frappejs.router.current_page.hide();
        }
        this.wrapper.classList.remove('hide');
        this.body.classList.remove('hide');

        if (this.page_error) {
            this.page_error.classList.add('hide');
        }

        frappejs.router.current_page = this;
        document.title = this.title;

        await this.trigger('show', params);
    }

    render_error(title, message) {
        if (!this.page_error) {
            this.page_error = frappejs.ui.add('div', 'page-error', this.wrapper);
        }
        this.body.classList.add('hide');
        this.page_error.classList.remove('hide');
        this.page_error.innerHTML = `<h3 class="text-extra-muted">${title ? title : ""}</h3><p class="text-muted">${message ? message : ""}</p>`;
    }
};

var list = class BaseList {
    constructor({doctype, parent, fields}) {
        this.doctype = doctype;
        this.parent = parent;
        this.fields = fields;

        this.meta = frappejs.get_meta(this.doctype);

        this.start = 0;
        this.page_length = 20;

        this.body = null;
        this.rows = [];
        this.data = [];
    }

    async run() {
        this.make_body();

        let data = await this.get_data();

        for (let i=0; i< Math.min(this.page_length, data.length); i++) {
            this.render_row(this.start + i, data[i]);
        }

        if (this.start > 0) {
            this.data = this.data.concat(data);
        } else {
            this.data = data;
        }

        this.clear_empty_rows();
        this.update_more(data.length > this.page_length);
    }

    async get_data() {
        return await frappejs.db.get_all({
            doctype: this.doctype,
            fields: this.get_fields(),
            filters: this.get_filters(),
            start: this.start,
            limit: this.page_length + 1
        });
    }

    get_fields() {
        return ['name'];
    }

    async append() {
        this.start += this.page_length;
        await this.run();
    }

    get_filters() {
        let filters = {};
        if (this.search_input.value) {
            filters.keywords = ['like', '%' + this.search_input.value + '%'];
        }
        return filters;
    }

    make_body() {
        if (!this.body) {
            this.make_toolbar();
            //this.make_new();
            this.body = frappejs.ui.add('div', 'list-body', this.parent);
            this.make_more_btn();
        }
    }

    make_toolbar() {
        this.toolbar = frappejs.ui.add('div', 'list-toolbar', this.parent);
        this.toolbar.innerHTML = `
            <div class="row">
                <div class="col-md-6 col-9">
                    <div class="input-group list-search mb-2">
                        <input class="form-control" type="text" placeholder="Search...">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary btn-search">Search</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-3">
                    <a href="#new/${frappejs.slug(this.doctype)}" class="btn btn-outline-primary">
                        New
                    </a>
                </div>
            </div>
        `;

        this.search_input = this.toolbar.querySelector('input');
        this.search_input.addEventListener('keypress', (event) => {
            if (event.keyCode===13) {
                this.run();
            }
        });

        this.search_button = this.toolbar.querySelector('.btn-search');
        this.search_button.addEventListener('click', (event) => {
            this.run();
        });
    }

    make_more_btn() {
        this.more_btn = frappejs.ui.add('button', 'btn btn-secondary hide', this.parent);
        this.more_btn.textContent = 'More';
        this.more_btn.addEventListener('click', () => {
            this.append();
        });
    }

    render_row(i, data) {
        let row = this.get_row(i);
        row.innerHTML = this.get_row_html(data);
        row.style.display = 'block';
    }

    get_row_html(data) {
        return `<a href="#edit/${this.doctype}/${data.name}">${data.name}</a>`;
    }

    get_row(i) {
        if (!this.rows[i]) {
            this.rows[i] = frappejs.ui.add('div', 'list-row py-2', this.body);
        }
        return this.rows[i];
    }

    clear_empty_rows() {
        if (this.rows.length > this.data.length) {
            for (let i=this.data.length; i < this.rows.length; i++) {
                let row = this.get_row(i);
                row.innerHTML = '';
                row.style.display = 'none';
            }
        }
    }

    update_more(show) {
        if (show) {
            this.more_btn.classList.remove('hide');
        } else {
            this.more_btn.classList.add('hide');
        }
    }

};

class BaseControl {
    constructor(docfield, form) {
        Object.assign(this, docfield);
        this.form = form;
        if (!this.fieldname) {
            this.fieldname = frappejs.slug(this.label);
        }
        this.parent = form.form;
        if (this.setup) {
            this.setup();
        }
    }

    bind(doc) {
        this.doc = doc;
        this.set_doc_value();
    }

    refresh() {
        this.make();
        this.set_doc_value();
    }

    set_doc_value() {
        if (this.doc) {
            this.set_input_value(this.doc.get(this.fieldname));
        }
    }

    make() {
        if (!this.form_group) {
            this.make_form_group();
            this.make_label();
            this.make_input();
            this.set_input_name();
            this.make_description();
            this.bind_change_event();
        }
    }

    make_form_group() {
        this.form_group = frappejs.ui.add('div', 'form-group', this.parent);
    }

    make_label() {
        this.label_element = frappejs.ui.add('label', null, this.form_group);
        this.label_element.textContent = this.label;
    }

    make_input() {
        this.input = frappejs.ui.add('input', 'form-control', this.form_group);
        this.input.setAttribute('autocomplete', 'off');
    }

    set_input_name() {
        this.input.setAttribute('name', this.fieldname);
    }

    make_description() {
        if (this.description) {
            this.description_element = frappejs.ui.add('small', 'form-text text-muted', this.form_group);
            this.description_element.textContent = this.description;
        }
    }

    set_input_value(value) {
        this.input.value = this.format(value);
    }

    format(value) {
        if (value === undefined || value === null) {
            value = '';
        }
        return value;
    }

    async get_parsed_value() {
        return await this.parse(this.input.value);
    }

    get_input_value() {
        return this.input.value;
    }

    async parse(value) {
        return value;
    }

    async validate(value) {
        return value;
    }

    bind_change_event() {
        this.input.addEventListener('change', (e) => this.handle_change(e));
    }

    async handle_change(e) {
        let value = await this.parse(this.get_input_value());
        value = await this.validate(value);
        if (this.doc[this.fieldname] !== value) {
            await this.doc.set(this.fieldname, value);
        }
    }

    disable() {
        this.input.setAttribute('disabled', 'disabled');
    }

    enable() {
        this.input.removeAttribute('disabled');
    }
}

var base = BaseControl;

class DataControl extends base {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
    }
}

var data = DataControl;

class TextControl extends base {
    make_input() {
        this.input = frappe.ui.add('textarea', 'form-control', this.form_group);
    }
    make() {
        super.make();
        this.input.setAttribute('rows', '8');
    }
}

var text = TextControl;

class SelectControl extends base {
    make_input() {
        this.input = frappe.ui.add('select', 'form-control', this.form_group);

        let options = this.options;
        if (typeof options==='string') {
            options = options.split('\n');
        }

        for (let value of options) {
            let option = frappe.ui.add('option', null, this.input);
            option.textContent = value;
            option.setAttribute('value', value);
        }
    }
    make() {
        super.make();
        this.input.setAttribute('row', '3');
    }
}

var select = SelectControl;

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var awesomplete = createCommonjsModule(function (module) {
/**
 * Simple, lightweight, usable local autocomplete library for modern browsers
 * Because there weren’t enough autocomplete scripts in the world? Because I’m completely insane and have NIH syndrome? Probably both. :P
 * @author Lea Verou http://leaverou.github.io/awesomplete
 * MIT license
 */

(function () {

var _ = function (input, o) {
	var me = this;

	// Setup

	this.isOpened = false;

	this.input = $(input);
	this.input.setAttribute("autocomplete", "off");
	this.input.setAttribute("aria-autocomplete", "list");

	o = o || {};

	configure(this, {
		minChars: 2,
		maxItems: 10,
		autoFirst: false,
		data: _.DATA,
		filter: _.FILTER_CONTAINS,
		sort: o.sort === false ? false : _.SORT_BYLENGTH,
		item: _.ITEM,
		replace: _.REPLACE
	}, o);

	this.index = -1;

	// Create necessary elements

	this.container = $.create("div", {
		className: "awesomplete",
		around: input
	});

	this.ul = $.create("ul", {
		hidden: "hidden",
		inside: this.container
	});

	this.status = $.create("span", {
		className: "visually-hidden",
		role: "status",
		"aria-live": "assertive",
		"aria-relevant": "additions",
		inside: this.container
	});

	// Bind events

	this._events = {
		input: {
			"input": this.evaluate.bind(this),
			"blur": this.close.bind(this, { reason: "blur" }),
			"keydown": function(evt) {
				var c = evt.keyCode;

				// If the dropdown `ul` is in view, then act on keydown for the following keys:
				// Enter / Esc / Up / Down
				if(me.opened) {
					if (c === 13 && me.selected) { // Enter
						evt.preventDefault();
						me.select();
					}
					else if (c === 27) { // Esc
						me.close({ reason: "esc" });
					}
					else if (c === 38 || c === 40) { // Down/Up arrow
						evt.preventDefault();
						me[c === 38? "previous" : "next"]();
					}
				}
			}
		},
		form: {
			"submit": this.close.bind(this, { reason: "submit" })
		},
		ul: {
			"mousedown": function(evt) {
				var li = evt.target;

				if (li !== this) {

					while (li && !/li/i.test(li.nodeName)) {
						li = li.parentNode;
					}

					if (li && evt.button === 0) {  // Only select on left click
						evt.preventDefault();
						me.select(li, evt.target);
					}
				}
			}
		}
	};

	$.bind(this.input, this._events.input);
	$.bind(this.input.form, this._events.form);
	$.bind(this.ul, this._events.ul);

	if (this.input.hasAttribute("list")) {
		this.list = "#" + this.input.getAttribute("list");
		this.input.removeAttribute("list");
	}
	else {
		this.list = this.input.getAttribute("data-list") || o.list || [];
	}

	_.all.push(this);
};

_.prototype = {
	set list(list) {
		if (Array.isArray(list)) {
			this._list = list;
		}
		else if (typeof list === "string" && list.indexOf(",") > -1) {
				this._list = list.split(/\s*,\s*/);
		}
		else { // Element or CSS selector
			list = $(list);

			if (list && list.children) {
				var items = [];
				slice.apply(list.children).forEach(function (el) {
					if (!el.disabled) {
						var text = el.textContent.trim();
						var value = el.value || text;
						var label = el.label || text;
						if (value !== "") {
							items.push({ label: label, value: value });
						}
					}
				});
				this._list = items;
			}
		}

		if (document.activeElement === this.input) {
			this.evaluate();
		}
	},

	get selected() {
		return this.index > -1;
	},

	get opened() {
		return this.isOpened;
	},

	close: function (o) {
		if (!this.opened) {
			return;
		}

		this.ul.setAttribute("hidden", "");
		this.isOpened = false;
		this.index = -1;

		$.fire(this.input, "awesomplete-close", o || {});
	},

	open: function () {
		this.ul.removeAttribute("hidden");
		this.isOpened = true;

		if (this.autoFirst && this.index === -1) {
			this.goto(0);
		}

		$.fire(this.input, "awesomplete-open");
	},

	destroy: function() {
		//remove events from the input and its form
		$.unbind(this.input, this._events.input);
		$.unbind(this.input.form, this._events.form);

		//move the input out of the awesomplete container and remove the container and its children
		var parentNode = this.container.parentNode;

		parentNode.insertBefore(this.input, this.container);
		parentNode.removeChild(this.container);

		//remove autocomplete and aria-autocomplete attributes
		this.input.removeAttribute("autocomplete");
		this.input.removeAttribute("aria-autocomplete");

		//remove this awesomeplete instance from the global array of instances
		var indexOfAwesomplete = _.all.indexOf(this);

		if (indexOfAwesomplete !== -1) {
			_.all.splice(indexOfAwesomplete, 1);
		}
	},

	next: function () {
		var count = this.ul.children.length;
		this.goto(this.index < count - 1 ? this.index + 1 : (count ? 0 : -1) );
	},

	previous: function () {
		var count = this.ul.children.length;
		var pos = this.index - 1;

		this.goto(this.selected && pos !== -1 ? pos : count - 1);
	},

	// Should not be used, highlights specific item without any checks!
	goto: function (i) {
		var lis = this.ul.children;

		if (this.selected) {
			lis[this.index].setAttribute("aria-selected", "false");
		}

		this.index = i;

		if (i > -1 && lis.length > 0) {
			lis[i].setAttribute("aria-selected", "true");
			this.status.textContent = lis[i].textContent;

			// scroll to highlighted element in case parent's height is fixed
			this.ul.scrollTop = lis[i].offsetTop - this.ul.clientHeight + lis[i].clientHeight;

			$.fire(this.input, "awesomplete-highlight", {
				text: this.suggestions[this.index]
			});
		}
	},

	select: function (selected, origin) {
		if (selected) {
			this.index = $.siblingIndex(selected);
		} else {
			selected = this.ul.children[this.index];
		}

		if (selected) {
			var suggestion = this.suggestions[this.index];

			var allowed = $.fire(this.input, "awesomplete-select", {
				text: suggestion,
				origin: origin || selected
			});

			if (allowed) {
				this.replace(suggestion);
				this.close({ reason: "select" });
				$.fire(this.input, "awesomplete-selectcomplete", {
					text: suggestion
				});
			}
		}
	},

	evaluate: function() {
		var me = this;
		var value = this.input.value;

		if (value.length >= this.minChars && this._list.length > 0) {
			this.index = -1;
			// Populate list with options that match
			this.ul.innerHTML = "";

			this.suggestions = this._list
				.map(function(item) {
					return new Suggestion(me.data(item, value));
				})
				.filter(function(item) {
					return me.filter(item, value);
				});

			if (this.sort !== false) {
				this.suggestions = this.suggestions.sort(this.sort);
			}

			this.suggestions = this.suggestions.slice(0, this.maxItems);

			this.suggestions.forEach(function(text) {
					me.ul.appendChild(me.item(text, value));
				});

			if (this.ul.children.length === 0) {
				this.close({ reason: "nomatches" });
			} else {
				this.open();
			}
		}
		else {
			this.close({ reason: "nomatches" });
		}
	}
};

// Static methods/properties

_.all = [];

_.FILTER_CONTAINS = function (text, input) {
	return RegExp($.regExpEscape(input.trim()), "i").test(text);
};

_.FILTER_STARTSWITH = function (text, input) {
	return RegExp("^" + $.regExpEscape(input.trim()), "i").test(text);
};

_.SORT_BYLENGTH = function (a, b) {
	if (a.length !== b.length) {
		return a.length - b.length;
	}

	return a < b? -1 : 1;
};

_.ITEM = function (text, input) {
	var html = input.trim() === "" ? text : text.replace(RegExp($.regExpEscape(input.trim()), "gi"), "<mark>$&</mark>");
	return $.create("li", {
		innerHTML: html,
		"aria-selected": "false"
	});
};

_.REPLACE = function (text) {
	this.input.value = text.value;
};

_.DATA = function (item/*, input*/) { return item; };

// Private functions

function Suggestion(data) {
	var o = Array.isArray(data)
	  ? { label: data[0], value: data[1] }
	  : typeof data === "object" && "label" in data && "value" in data ? data : { label: data, value: data };

	this.label = o.label || o.value;
	this.value = o.value;
}
Object.defineProperty(Suggestion.prototype = Object.create(String.prototype), "length", {
	get: function() { return this.label.length; }
});
Suggestion.prototype.toString = Suggestion.prototype.valueOf = function () {
	return "" + this.label;
};

function configure(instance, properties, o) {
	for (var i in properties) {
		var initial = properties[i],
		    attrValue = instance.input.getAttribute("data-" + i.toLowerCase());

		if (typeof initial === "number") {
			instance[i] = parseInt(attrValue);
		}
		else if (initial === false) { // Boolean options must be false by default anyway
			instance[i] = attrValue !== null;
		}
		else if (initial instanceof Function) {
			instance[i] = null;
		}
		else {
			instance[i] = attrValue;
		}

		if (!instance[i] && instance[i] !== 0) {
			instance[i] = (i in o)? o[i] : initial;
		}
	}
}

// Helpers

var slice = Array.prototype.slice;

function $(expr, con) {
	return typeof expr === "string"? (con || document).querySelector(expr) : expr || null;
}

function $$(expr, con) {
	return slice.call((con || document).querySelectorAll(expr));
}

$.create = function(tag, o) {
	var element = document.createElement(tag);

	for (var i in o) {
		var val = o[i];

		if (i === "inside") {
			$(val).appendChild(element);
		}
		else if (i === "around") {
			var ref = $(val);
			ref.parentNode.insertBefore(element, ref);
			element.appendChild(ref);
		}
		else if (i in element) {
			element[i] = val;
		}
		else {
			element.setAttribute(i, val);
		}
	}

	return element;
};

$.bind = function(element, o) {
	if (element) {
		for (var event in o) {
			var callback = o[event];

			event.split(/\s+/).forEach(function (event) {
				element.addEventListener(event, callback);
			});
		}
	}
};

$.unbind = function(element, o) {
	if (element) {
		for (var event in o) {
			var callback = o[event];

			event.split(/\s+/).forEach(function(event) {
				element.removeEventListener(event, callback);
			});
		}
	}
};

$.fire = function(target, type, properties) {
	var evt = document.createEvent("HTMLEvents");

	evt.initEvent(type, true, true );

	for (var j in properties) {
		evt[j] = properties[j];
	}

	return target.dispatchEvent(evt);
};

$.regExpEscape = function (s) {
	return s.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
};

$.siblingIndex = function (el) {
	/* eslint-disable no-cond-assign */
	for (var i = 0; el = el.previousElementSibling; i++);
	return i;
};

// Initialization

function init() {
	$$("input.awesomplete").forEach(function (input) {
		new _(input);
	});
}

// Are we in a browser? Check for Document constructor
if (typeof Document !== "undefined") {
	// DOM already loaded?
	if (document.readyState !== "loading") {
		init();
	}
	else {
		// Wait for it
		document.addEventListener("DOMContentLoaded", init);
	}
}

_.$ = $;
_.$$ = $$;

// Make sure to export Awesomplete on self when in a browser
if (typeof self !== "undefined") {
	self.Awesomplete = _;
}

// Expose Awesomplete as a CJS module
if ('object' === "object" && module.exports) {
	module.exports = _;
}

return _;

}());
});

class LinkControl extends base {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.awesomplete = new awesomplete(this.input, {
            autoFirst: true,
            minChars: 0,
            maxItems: 99
        });

        // rebuild the list on input
        this.input.addEventListener('input', async (event) => {
            this.awesomplete.list = await this.get_list(this.input.value);
        });
    }

    async get_list(query) {
        return (await frappejs.db.get_all({
            doctype: this.options,
            filters: this.get_filters(query),
            limit: 50
        })).map(d => d.name);
    }

    get_filters(query) {
        return { keywords: ["like", query] }
    }
}

var link = LinkControl;

class FloatControl extends base {
    make() {
        super.make();
		this.input.setAttribute('type', 'text');
		this.input.classList.add('text-right');
    }
}

var float_1 = FloatControl;

class CurrencyControl extends float_1 {
	parse(value) {
		return frappejs.parse_number(value);
	}
	format(value) {
		return frappejs.format_number(value);
	}
}

var currency = CurrencyControl;

const control_classes = {
    Data: data,
    Text: text,
    Select: select,
    Link: link,
    Float: float_1,
    Currency: currency
};

var controls = {
    get_control_class(fieldtype) {
        return control_classes[fieldtype];
    },
    make_control(field, parent) {
        const control_class = this.get_control_class(field.fieldtype);
        let control = new control_class(field, parent);
        control.make();
        return control;
    }
};

var form = class BaseForm extends observable {
    constructor({doctype, parent, submit_label='Submit'}) {
        super();
        this.parent = parent;
        this.doctype = doctype;
        this.submit_label = submit_label;

        this.controls = {};
        this.controls_list = [];

        this.meta = frappejs.get_meta(this.doctype);
        if (this.setup) {
            this.setup();
        }
        this.make();
    }

    make() {
        if (this.body || !this.parent) {
            return;
        }

        this.body = frappejs.ui.add('div', 'form-body', this.parent);
        this.make_toolbar();

        this.form = frappejs.ui.add('form', null, this.body);
        for(let df of this.meta.fields) {
            if (controls.get_control_class(df.fieldtype)) {
                let control = controls.make_control(df, this);
                this.controls_list.push(control);
                this.controls[df.fieldname] = control;
            }
        }
    }

    make_toolbar() {
        this.toolbar = frappejs.ui.add('div', 'form-toolbar text-right', this.body);
        this.toolbar.innerHTML = `
            <button class="btn btn-outline-secondary btn-delete">Delete</button>
            <button class="btn btn-primary btn-submit">Save</button>
        `;

        this.btn_submit = this.toolbar.querySelector('.btn-submit');
        this.btn_submit.addEventListener('click', async (event) => {
            this.submit();
            event.preventDefault();
        });

        this.btn_delete = this.toolbar.querySelector('.btn-delete');
        this.btn_delete.addEventListener('click', async () => {
            await this.doc.delete();
            this.show_alert('Deleted', 'success');
            this.trigger('delete');
        });
    }

    async use(doc, is_new = false) {
        if (this.doc) {
            // clear handlers of outgoing doc
            this.doc.clear_handlers();
        }
        this.clear_alert();
        this.doc = doc;
        this.is_new = is_new;
        for (let control of this.controls_list) {
            control.bind(this.doc);
        }

        // refresh value in control
        this.doc.add_handler('change', (params) => {
            let control = this.controls[params.fieldname];
            if (control && control.get_input_value() !== control.format(params.fieldname)) {
                control.set_doc_value();
            }
        });

        this.trigger('use', {doc:doc});
    }

    async submit() {
        try {
            if (this.is_new || this.doc.__not_inserted) {
                await this.doc.insert();
            } else {
                await this.doc.update();
            }
            await this.refresh();
            this.show_alert('Saved', 'success');
        } catch (e) {
            this.show_alert('Failed', 'danger');
        }
        await this.trigger('submit');
    }

    refresh() {
        for(let control of this.controls_list) {
            control.refresh();
        }
    }

    show_alert(message, type, clear_after = 5) {
        this.clear_alert();
        this.alert = frappejs.ui.add('div', `alert alert-${type}`, this.body);
        this.alert.textContent = message;
        setTimeout(() => {
            this.clear_alert();
        }, clear_after * 1000);
    }

    clear_alert() {
        if (this.alert) {
            frappejs.ui.remove(this.alert);
            this.alert = null;
        }
    }

};

var view = {
    get_form_class(doctype) {
        return this.get_view_class(doctype, 'Form', form);
    },
    get_list_class(doctype) {
        return this.get_view_class(doctype, 'List', list);
    },
    get_view_class(doctype, class_name, default_class) {
        let client_module = this.get_client_module(doctype);
        if (client_module && client_module[class_name]) {
            return client_module[class_name];
        } else {
            return default_class;
        }
    },

    get_client_module(doctype) {
        return frappe.modules[`${doctype}_client`];
    }
};

var formpage = class FormPage extends page {
	constructor(doctype) {
		let meta = frappe.get_meta(doctype);
		super(`Edit ${meta.name}`);
		this.meta = meta;

		this.form = new (view.get_form_class(doctype))({
			doctype: doctype,
			parent: this.body
		});

		this.on('show', async (params) => {
			await this.show_doc(params.doctype, params.name);
		});

		// if name is different after saving, change the route
		this.form.on('submit', async (params) => {
			let route = frappe.router.get_route();
			if (!(route && route[2] === this.form.doc.name)) {
				await frappe.router.set_route('edit', this.form.doc.doctype, this.form.doc.name);
				this.form.show_alert('Added', 'success');
			}
		});

		this.form.on('delete', async (params) => {
			await frappe.router.set_route('list', this.form.doctype);
		});
	}

	async show_doc(doctype, name) {
		try {
			this.doc = await frappe.get_doc(doctype, name);
			this.form.use(this.doc);
		} catch (e) {
			this.render_error(e.status_code, e.message);
		}
	}
};

var listpage = class FormPage extends page {
	constructor(doctype) {
		let meta = frappe.get_meta(doctype);
		super(`List ${meta.name}`);
		this.list = new (view.get_list_class(doctype))({
			doctype: doctype,
			parent: this.body
		});
		this.on('show', async () => {
			await this.list.run();
		});
	}
};

var navbar = class Navbar {
	constructor({brand_label = 'Home'} = {}) {
		Object.assign(this, arguments[0]);
		this.items = {};
		this.navbar = frappejs.ui.add('div', 'navbar navbar-expand-md border-bottom', document.querySelector('body'));

		this.brand = frappejs.ui.add('a', 'navbar-brand', this.navbar);
		this.brand.href = '#';
		this.brand.textContent = brand_label;

		this.toggler = frappejs.ui.add('button', 'navbar-toggler', this.navbar);
		this.toggler.setAttribute('type', 'button');
		this.toggler.setAttribute('data-toggle', 'collapse');
		this.toggler.setAttribute('data-target', 'desk-navbar');
		this.toggler.innerHTML = `<span class="navbar-toggler-icon"></span>`;

		this.navbar_collapse = frappejs.ui.add('div', 'collapse navbar-collapse', this.navbar);
		this.navbar_collapse.setAttribute('id', 'desk-navbar');

		this.nav = frappejs.ui.add('ul', 'navbar-nav mr-auto', this.navbar_collapse);
	}

	add_item(label, route) {
		let item = frappejs.ui.add('li', 'nav-item', this.nav);
		item.link = frappejs.ui.add('a', 'nav-link', item);
		item.link.textContent = label;
		item.link.href = route;
		this.items[label] = item;
		return item;
	}

	add_dropdown(label) {

	}

	add_search() {
		let form = frappejs.ui.add('form', 'form-inline my-2 my-md-0', this.nav);

	}
};

var desk = class Desk {
    constructor() {
        frappejs.router = new router();
        frappejs.router.listen();

        let body = document.querySelector('body');
        this.navbar = new navbar();
        this.container = frappejs.ui.add('div', 'container-fluid', body);

        this.container_row = frappejs.ui.add('div', 'row', this.container);
        this.sidebar = frappejs.ui.add('div', 'col-md-2 p-3 sidebar', this.container_row);
        this.body = frappejs.ui.add('div', 'col-md-10 p-3 main', this.container_row);

        this.sidebar_items = [];
        this.pages = {
            lists: {},
            forms: {}
        };

        this.init_routes();

        // this.search = new Search(this.nav);
    }

    init_routes() {
        frappejs.router.add('not-found', async (params) => {
            if (!this.not_found_page) {
                this.not_found_page = new page('Not Found');
            }
            await this.not_found_page.show();
            this.not_found_page.render_error('Not Found', params ? params.route : '');
        });

        frappejs.router.add('list/:doctype', async (params) => {
            let page$$1 = this.get_list_page(params.doctype);
            await page$$1.show(params);
        });

        frappejs.router.add('edit/:doctype/:name', async (params) => {
            let page$$1 = this.get_form_page(params.doctype);
            await page$$1.show(params);
        });

        frappejs.router.add('new/:doctype', async (params) => {
            let doc = await frappejs.get_new_doc(params.doctype);
            // unset the name, its local
            await frappejs.router.set_route('edit', doc.doctype, doc.name);
            await doc.set('name', '');
        });

    }

    get_list_page(doctype) {
        if (!this.pages.lists[doctype]) {
            this.pages.lists[doctype] = new listpage(doctype);
        }
        return this.pages.lists[doctype];
    }

    get_form_page(doctype) {
        if (!this.pages.forms[doctype]) {
            this.pages.forms[doctype] = new formpage(doctype);
        }
        return this.pages.forms[doctype];
    }

    add_sidebar_item(label, action) {
        let item = frappejs.ui.add('a', '', frappejs.ui.add('p', null, frappejs.desk.sidebar));
        item.textContent = label;
        if (typeof action === 'string') {
            item.href = action;
        } else {
            item.addEventHandler('click', () => {
                action();
            });
        }
    }

};

frappejs.ui = ui;


var client = {
    async start({server}) {
        window.frappe = frappejs;
        frappejs.init();
        common.init_libs(frappejs);

        frappejs.fetch = window.fetch.bind();
        frappejs.db = await new rest_client({server: server});

        frappejs.flags.cache_docs = true;

        frappejs.desk = new desk();
        await frappejs.login();
    }
};

var autoname = "hash";
var name = "ToDo";
var doctype = "DocType";
var issingle = 0;
var keyword_fields = ["subject","description"];
var fields = [{"fieldname":"subject","label":"Subject","fieldtype":"Data","reqd":1},{"fieldname":"description","label":"Description","fieldtype":"Text"},{"fieldname":"status","label":"Status","fieldtype":"Select","options":["Open","Closed"],"default":"Open","reqd":1}];
var todo = {
	autoname: autoname,
	name: name,
	doctype: doctype,
	issingle: issingle,
	keyword_fields: keyword_fields,
	fields: fields
};

var todo$1 = Object.freeze({
	autoname: autoname,
	name: name,
	doctype: doctype,
	issingle: issingle,
	keyword_fields: keyword_fields,
	fields: fields,
	default: todo
});

var require$$0$3 = ( todo$1 && todo ) || todo$1;

class ToDoMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$3);
    }
}

class ToDo extends document$1 {
    setup() {
        this.add_handler('validate');
    }
    validate() {
        if (!this.status) {
            this.status = 'Open';
        }
    }
}

var todo$2 = {
    Document: ToDo,
    Meta: ToDoMeta
};

var name$1 = "Account";
var doctype$1 = "DocType";
var issingle$1 = 0;
var keyword_fields$1 = ["name","account_type"];
var fields$1 = [{"fieldname":"name","label":"Account Name","fieldtype":"Data","reqd":1},{"fieldname":"parent_account","label":"Parent Account","fieldtype":"Link","options":"Account"},{"fieldname":"account_type","label":"Account Type","fieldtype":"Select","options":["Asset","Liability","Equity","Income","Expense"]}];
var account = {
	name: name$1,
	doctype: doctype$1,
	issingle: issingle$1,
	keyword_fields: keyword_fields$1,
	fields: fields$1
};

var account$1 = Object.freeze({
	name: name$1,
	doctype: doctype$1,
	issingle: issingle$1,
	keyword_fields: keyword_fields$1,
	fields: fields$1,
	default: account
});

var require$$0$4 = ( account$1 && account ) || account$1;

class AccountMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$4);
    }
}

class Account extends document$1 {
    setup() {
        this.add_handler('validate');
    }
    async validate() {
        if (!this.account_type) {
            if (this.parent_account) {
                this.account_type = await frappejs.db.get_value('Account', this.parent_account, 'account_type');
            } else {
                this.account_type = 'Asset';
            }
        }
    }
}

var account$2 = {
    Document: Account,
    Meta: AccountMeta
};

var name$2 = "Item";
var doctype$2 = "DocType";
var issingle$2 = 0;
var keyword_fields$2 = ["name","description"];
var fields$2 = [{"fieldname":"name","label":"Item Name","fieldtype":"Data","reqd":1},{"fieldname":"description","label":"Description","fieldtype":"Text"},{"fieldname":"unit","label":"Unit","fieldtype":"Select","options":["No","Kg","Gram","Hour","Day"]},{"fieldname":"rate","label":"Rate","fieldtype":"Currency"}];
var item$1 = {
	name: name$2,
	doctype: doctype$2,
	issingle: issingle$2,
	keyword_fields: keyword_fields$2,
	fields: fields$2
};

var item$2 = Object.freeze({
	name: name$2,
	doctype: doctype$2,
	issingle: issingle$2,
	keyword_fields: keyword_fields$2,
	fields: fields$2,
	default: item$1
});

var require$$0$5 = ( item$2 && item$1 ) || item$2;

class ItemMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$5);
    }
}

class Item extends document$1 {
}

var item$3 = {
    Document: Item,
    Meta: ItemMeta
};

var name$3 = "Customer";
var doctype$3 = "DocType";
var issingle$3 = 0;
var istable = 0;
var keyword_fields$3 = ["name"];
var fields$3 = [{"fieldname":"name","label":"Name","fieldtype":"Data","reqd":1}];
var customer = {
	name: name$3,
	doctype: doctype$3,
	issingle: issingle$3,
	istable: istable,
	keyword_fields: keyword_fields$3,
	fields: fields$3
};

var customer$1 = Object.freeze({
	name: name$3,
	doctype: doctype$3,
	issingle: issingle$3,
	istable: istable,
	keyword_fields: keyword_fields$3,
	fields: fields$3,
	default: customer
});

var require$$0$6 = ( customer$1 && customer ) || customer$1;

class CustomerMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$6);
    }
}

class Customer extends document$1 {
}

var customer$2 = {
    Document: Customer,
    Meta: CustomerMeta
};

class ToDoList extends list {
    get_fields()  {
        return ['name', 'subject', 'status'];
    }
    get_row_html(data) {
        let symbol = data.status=="Closed" ? "✔" : "";
        return `<a href="#edit/todo/${data.name}">${symbol} ${data.subject}</a>`;
    }
}

var todo_client = {
    List: ToDoList
};

class AccountList extends list {
    get_fields()  {
        return ['name', 'account_type'];
    }
    get_row_html(data) {
        return `<a href="#edit/account/${data.name}">${data.name} (${data.account_type})</a>`;
    }
}

class AccountForm extends form {
    make() {
        super.make();

        // override controller event
        this.controls['parent_account'].get_filters = (query) => {
            return {
                keywords: ["like", query],
                name: ["!=", this.doc.name]
            }
        };
    }
}

var account_client = {
    Form: AccountForm,
    List: AccountList
};

client.start({
    server: 'localhost:8000',
    container: document.querySelector('.wrapper'),
}).then(() => {

    // require modules
    frappe.modules.todo = todo$2;
    frappe.modules.account = account$2;
    frappe.modules.item = item$3;
    frappe.modules.customer = customer$2;

    frappe.modules.todo_client = todo_client;
    frappe.modules.account_client = account_client;

    frappe.desk.add_sidebar_item('ToDo', '#list/todo');
    frappe.desk.add_sidebar_item('Accounts', '#list/account');
    frappe.desk.add_sidebar_item('Items', '#list/item');
    frappe.desk.add_sidebar_item('Customers', '#list/customer');

    frappe.router.default = '#list/todo';

    frappe.router.show(window.location.hash);
});

var src = false;

return src;

}());
