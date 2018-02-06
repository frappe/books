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
    format(value, field) {
        if (field.fieldtype==='Currency') {
            return frappe.format_number(value);
        } else {
            return value + '';
        }
    },
    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
    },

    get_random_name() {
        return Math.random().toString(36).substr(3);
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
    common_fields: [
        {
            fieldname: 'name', fieldtype: 'Data', reqd: 1
        }
    ],
    parent_fields: [
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

    async get_doc(doctype, name) {
        let doc = this.get_doc_from_cache(doctype, name);
        if (!doc) {
            let controller_class = this.get_controller_class(doctype);
            doc = new controller_class({doctype:doctype, name: name});
            await doc.load();
            this.add_to_cache(doc);
        }
        return doc;
    },

    new_doc(data) {
        let controller_class = this.get_controller_class(data.doctype);
        return new controller_class(data);
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
        let doc = frappe.new_doc({doctype: doctype});
        doc.set_name();
        doc.__not_inserted = true;
        this.add_to_cache(doc);
        return doc;
    },

    async insert(data) {
        return await (this.new_doc(data)).insert();
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
        await this.trigger('change', { doc: this, fieldname: fieldname, value: value });
    }

    set_name() {
        // assign a random name by default
        // override this to set a name
        if (!this.name) {
            this.name = frappejs.get_random_name();
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
            return new Document(data);
        }
    }

    async validate_field(key, value) {
        let field = this.meta.get_field(key);
        if (field && field.fieldtype == 'Select') {
            return this.meta.validate_select(field, value);
        }
        return value;
    }

    get_valid_dict() {
        let data = {};
        for (let field of this.meta.get_valid_fields()) {
            data[field.fieldname] = this[field.fieldname];
        }
        return data;
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
            this.sync_values(data);
        } else {
            throw new frappejs.errors.NotFound(`Not Found: ${this.doctype} ${this.name}`);
        }
    }

    sync_values(data) {
        this.clear_values();
        Object.assign(this, data);
    }

    clear_values() {
        for (let field of this.meta.get_valid_fields()) {
            if(this[field.fieldname]) {
                delete this[field.fieldname];
            }
        }
    }

    async insert() {
        this.set_name();
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_insert');
        this.sync_values(await frappejs.db.insert(this.doctype, this.get_valid_dict()));
        await this.trigger('after_insert');
        await this.trigger('after_save');

        return this;
    }

        async update() {
        this.set_standard_values();
        this.set_keywords();
        await this.trigger('validate');
        await this.trigger('before_update');
        this.sync_values(await frappejs.db.update(this.doctype, this.get_valid_dict()));
        await this.trigger('after_update');
        await this.trigger('after_save');

        return this;
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
};

var meta = class BaseMeta extends document$1 {
    constructor(data) {
        super(data);
        this.event_handlers = {};
        this.list_options = {
            fields: ['name', 'modified']
        };
        if (this.setup_meta) {
            this.setup_meta();
        }
    }

    get_field(fieldname) {
        if (!this._field_map) {
            this._field_map = {};
            for (let field of this.fields) {
                this._field_map[field.fieldname] = field;
            }
        }
        return this._field_map[fieldname];
    }

    get_table_fields() {
        if (!this._table_fields) {
            this._table_fields = this.fields.filter(field => field.fieldtype === 'Table');
        }
        return this._table_fields;
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

    get_valid_fields({ with_children = true } = {}) {
        if (!this._valid_fields) {

            this._valid_fields = [];
            this._valid_fields_with_children = [];

            const _add = (field) => {
                this._valid_fields.push(field);
                this._valid_fields_with_children.push(field);
            };

            const doctype_fields = this.fields.map((field) => field.fieldname);

            // standard fields
            for (let field of frappejs.model.common_fields) {
                if (frappejs.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                    _add(field);
                }
            }

            if (this.is_child) {
                // child fields
                for (let field of frappejs.model.child_fields) {
                    if (frappejs.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                        _add(field);
                    }
                }
            } else {
                // parent fields
                for (let field of frappejs.model.parent_fields) {
                    if (frappejs.db.type_map[field.fieldtype] && !doctype_fields.includes(field.fieldname)) {
                        _add(field);
                    }
                }
            }

            // doctype fields
            for (let field of this.fields) {
                let include = frappejs.db.type_map[field.fieldtype];

                if (include) {
                    _add(field);
                }

                // include tables if (with_children = True)
                if (!include && field.fieldtype === 'Table') {
                    this._valid_fields_with_children.push(field);
                }
            }
        }

        if (with_children) {
            return this._valid_fields_with_children;
        } else {
            return this._valid_fields;
        }
    }

    get_keyword_fields() {
        return this.keyword_fields || this.meta.fields.filter(field => field.reqd).map(field => field.fieldname);
    }

    validate_select(field, value) {
        let options = field.options;
        if (typeof options === 'string') {
            // values given as string
            options = field.options.split('\n');
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
    constructor({field, parent, form}) {
        Object.assign(this, field);
        this.parent = parent;
        this.form = form;

        if (!this.fieldname) {
            this.fieldname = frappejs.slug(this.label);
        }
        if (!this.parent) {
            this.parent = this.form.form;
        }
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
        if (!this.input) {
            if (!this.only_input) {
                this.make_form_group();
                this.make_label();
            }
            this.make_input();
            this.set_input_name();
            if (!this.only_input) {
                this.make_description();
            }
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
        this.input = frappejs.ui.add('input', 'form-control', this.get_input_parent());
        this.input.setAttribute('autocomplete', 'off');
    }

    get_input_parent() {
        return this.form_group || this.parent;
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
            if (this.doc.set) {
                await this.doc.set(this.fieldname, value);
            }
            if (this.parent_control) {
                await this.parent_control.doc.set(this.fieldname, this.parent_control.get_input_value());
            }
        }
    }

    disable() {
        this.input.setAttribute('disabled', 'disabled');
    }

    enable() {
        this.input.removeAttribute('disabled');
    }

    set_focus() {
        this.input.focus();
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
        this.input = frappe.ui.add('textarea', 'form-control', this.get_input_parent());
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

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};



function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

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
            doctype: this.target,
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

var Sortable = createCommonjsModule(function (module) {
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */

(function sortableModule(factory) {
	if (typeof undefined === "function" && undefined.amd) {
		undefined(factory);
	}
	else {
		module.exports = factory();
	}
})(function sortableFactory() {
	if (typeof window === "undefined" || !window.document) {
		return function sortableError() {
			throw new Error("Sortable.js requires a window with a document");
		};
	}

	var dragEl,
		parentEl,
		ghostEl,
		cloneEl,
		rootEl,
		nextEl,
		lastDownEl,

		scrollEl,
		scrollParentEl,
		scrollCustomFn,

		lastEl,
		lastCSS,
		lastParentCSS,

		oldIndex,
		newIndex,

		activeGroup,
		putSortable,

		autoScroll = {},

		tapEvt,
		touchEvt,

		moved,

		/** @const */
		R_SPACE = /\s+/g,
		R_FLOAT = /left|right|inline/,

		expando = 'Sortable' + (new Date).getTime(),

		win = window,
		document = win.document,
		parseInt = win.parseInt,
		setTimeout = win.setTimeout,

		$ = win.jQuery || win.Zepto,
		Polymer = win.Polymer,

		captureMode = false,
		passiveMode = false,

		supportDraggable = ('draggable' in document.createElement('div')),
		supportCssPointerEvents = (function (el) {
			// false when IE11
			if (!!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie)/i)) {
				return false;
			}
			el = document.createElement('x');
			el.style.cssText = 'pointer-events:auto';
			return el.style.pointerEvents === 'auto';
		})(),

		_silent = false,

		abs = Math.abs,
		min = Math.min,

		savedInputChecked = [],
		touchDragOverListeners = [],

		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
			if (rootEl && options.scroll) {
				var _this = rootEl[expando],
					el,
					rect,
					sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					x = evt.clientX,
					y = evt.clientY,

					winWidth = window.innerWidth,
					winHeight = window.innerHeight,

					vx,
					vy,

					scrollOffsetX,
					scrollOffsetY;

				// Delect scrollEl
				if (scrollParentEl !== rootEl) {
					scrollEl = options.scroll;
					scrollParentEl = rootEl;
					scrollCustomFn = options.scrollFn;

					if (scrollEl === true) {
						scrollEl = rootEl;

						do {
							if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
								(scrollEl.offsetHeight < scrollEl.scrollHeight)
							) {
								break;
							}
							/* jshint boss:true */
						} while (scrollEl = scrollEl.parentNode);
					}
				}

				if (scrollEl) {
					el = scrollEl;
					rect = scrollEl.getBoundingClientRect();
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
				}


				if (!(vx || vy)) {
					vx = (winWidth - x <= sens) - (x <= sens);
					vy = (winHeight - y <= sens) - (y <= sens);

					/* jshint expr:true */
					(vx || vy) && (el = win);
				}


				if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
					autoScroll.el = el;
					autoScroll.vx = vx;
					autoScroll.vy = vy;

					clearInterval(autoScroll.pid);

					if (el) {
						autoScroll.pid = setInterval(function () {
							scrollOffsetY = vy ? vy * speed : 0;
							scrollOffsetX = vx ? vx * speed : 0;

							if ('function' === typeof(scrollCustomFn)) {
								return scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt);
							}

							if (el === win) {
								win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY);
							} else {
								el.scrollTop += scrollOffsetY;
								el.scrollLeft += scrollOffsetX;
							}
						}, 24);
					}
				}
			}
		}, 30),

		_prepareGroup = function (options) {
			function toFn(value, pull) {
				if (value === void 0 || value === true) {
					value = group.name;
				}

				if (typeof value === 'function') {
					return value;
				} else {
					return function (to, from) {
						var fromGroup = from.options.group.name;

						return pull
							? value
							: value && (value.join
								? value.indexOf(fromGroup) > -1
								: (fromGroup == value)
							);
					};
				}
			}

			var group = {};
			var originalGroup = options.group;

			if (!originalGroup || typeof originalGroup != 'object') {
				originalGroup = {name: originalGroup};
			}

			group.name = originalGroup.name;
			group.checkPull = toFn(originalGroup.pull, true);
			group.checkPut = toFn(originalGroup.put);
			group.revertClone = originalGroup.revertClone;

			options.group = group;
		};

	// Detect support a passive mode
	try {
		window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
			get: function () {
				// `false`, because everything starts to work incorrectly and instead of d'n'd,
				// begins the page has scrolled.
				passiveMode = false;
				captureMode = {
					capture: false,
					passive: passiveMode
				};
			}
		}));
	} catch (err) {}

	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */
	function Sortable(el, options) {
		if (!(el && el.nodeType && el.nodeType === 1)) {
			throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el);
		}

		this.el = el; // root element
		this.options = options = _extend({}, options);


		// Export instance
		el[expando] = this;

		// Default options
		var defaults = {
			group: Math.random(),
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			chosenClass: 'sortable-chosen',
			dragClass: 'sortable-drag',
			ignore: 'a, img',
			filter: null,
			preventOnFilter: true,
			animation: 0,
			setData: function (dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false,
			dataIdAttr: 'data-id',
			delay: 0,
			forceFallback: false,
			fallbackClass: 'sortable-fallback',
			fallbackOnBody: false,
			fallbackTolerance: 0,
			fallbackOffset: {x: 0, y: 0},
			supportPointer: Sortable.supportPointer !== false
		};


		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}

		_prepareGroup(options);

		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
				this[fn] = this[fn].bind(this);
			}
		}

		// Setup drag mode
		this.nativeDraggable = options.forceFallback ? false : supportDraggable;

		// Bind events
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);
		options.supportPointer && _on(el, 'pointerdown', this._onTapStart);

		if (this.nativeDraggable) {
			_on(el, 'dragover', this);
			_on(el, 'dragenter', this);
		}

		touchDragOverListeners.push(this._onDragOver);

		// Restore sorting
		options.store && this.sort(options.store.get(this));
	}


	Sortable.prototype = /** @lends Sortable.prototype */ {
		constructor: Sortable,

		_onTapStart: function (/** Event|TouchEvent */evt) {
			var _this = this,
				el = this.el,
				options = this.options,
				preventOnFilter = options.preventOnFilter,
				type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0]) || target,
				filter = options.filter,
				startIndex;

			_saveInputCheckedState(el);


			// Don't trigger start event when an element is been dragged, otherwise the evt.oldindex always wrong when set option.group.
			if (dragEl) {
				return;
			}

			if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
				return; // only left button or enabled
			}

			// cancel dnd if original target is content editable
			if (originalTarget.isContentEditable) {
				return;
			}

			target = _closest(target, options.draggable, el);

			if (!target) {
				return;
			}

			if (lastDownEl === target) {
				// Ignoring duplicate `down`
				return;
			}

			// Get the index of the dragged element within its parent
			startIndex = _index(target, options.draggable);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(_this, originalTarget, 'filter', target, el, el, startIndex);
					preventOnFilter && evt.preventDefault();
					return; // cancel dnd
				}
			}
			else if (filter) {
				filter = filter.split(',').some(function (criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el);

					if (criteria) {
						_dispatchEvent(_this, criteria, 'filter', target, el, el, startIndex);
						return true;
					}
				});

				if (filter) {
					preventOnFilter && evt.preventDefault();
					return; // cancel dnd
				}
			}

			if (options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}

			// Prepare `dragstart`
			this._prepareDragStart(evt, touch, target, startIndex);
		},

		_prepareDragStart: function (/** Event */evt, /** Touch */touch, /** HTMLElement */target, /** Number */startIndex) {
			var _this = this,
				el = _this.el,
				options = _this.options,
				ownerDocument = el.ownerDocument,
				dragStartFn;

			if (target && !dragEl && (target.parentNode === el)) {
				tapEvt = evt;

				rootEl = el;
				dragEl = target;
				parentEl = dragEl.parentNode;
				nextEl = dragEl.nextSibling;
				lastDownEl = target;
				activeGroup = options.group;
				oldIndex = startIndex;

				this._lastX = (touch || evt).clientX;
				this._lastY = (touch || evt).clientY;

				dragEl.style['will-change'] = 'all';

				dragStartFn = function () {
					// Delayed drag has been triggered
					// we can re-enable the events: touchmove/mousemove
					_this._disableDelayedDrag();

					// Make the element draggable
					dragEl.draggable = _this.nativeDraggable;

					// Chosen item
					_toggleClass(dragEl, options.chosenClass, true);

					// Bind the events: dragstart/dragend
					_this._triggerDragStart(evt, touch);

					// Drag start event
					_dispatchEvent(_this, rootEl, 'choose', dragEl, rootEl, rootEl, oldIndex);
				};

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(dragEl, criteria.trim(), _disableDraggable);
				});

				_on(ownerDocument, 'mouseup', _this._onDrop);
				_on(ownerDocument, 'touchend', _this._onDrop);
				_on(ownerDocument, 'touchcancel', _this._onDrop);
				_on(ownerDocument, 'selectstart', _this);
				options.supportPointer && _on(ownerDocument, 'pointercancel', _this._onDrop);

				if (options.delay) {
					// If the user moves the pointer or let go the click or touch
					// before the delay has been reached:
					// disable the delayed drag
					_on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchend', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
					_on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
					_on(ownerDocument, 'touchmove', _this._disableDelayedDrag);
					options.supportPointer && _on(ownerDocument, 'pointermove', _this._disableDelayedDrag);

					_this._dragStartTimer = setTimeout(dragStartFn, options.delay);
				} else {
					dragStartFn();
				}


			}
		},

		_disableDelayedDrag: function () {
			var ownerDocument = this.el.ownerDocument;

			clearTimeout(this._dragStartTimer);
			_off(ownerDocument, 'mouseup', this._disableDelayedDrag);
			_off(ownerDocument, 'touchend', this._disableDelayedDrag);
			_off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
			_off(ownerDocument, 'mousemove', this._disableDelayedDrag);
			_off(ownerDocument, 'touchmove', this._disableDelayedDrag);
			_off(ownerDocument, 'pointermove', this._disableDelayedDrag);
		},

		_triggerDragStart: function (/** Event */evt, /** Touch */touch) {
			touch = touch || (evt.pointerType == 'touch' ? evt : null);

			if (touch) {
				// Touch device support
				tapEvt = {
					target: dragEl,
					clientX: touch.clientX,
					clientY: touch.clientY
				};

				this._onDragStart(tapEvt, 'touch');
			}
			else if (!this.nativeDraggable) {
				this._onDragStart(tapEvt, true);
			}
			else {
				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);
			}

			try {
				if (document.selection) {
					// Timeout neccessary for IE9
					_nextTick(function () {
						document.selection.empty();
					});
				} else {
					window.getSelection().removeAllRanges();
				}
			} catch (err) {
			}
		},

		_dragStarted: function () {
			if (rootEl && dragEl) {
				var options = this.options;

				// Apply effect
				_toggleClass(dragEl, options.ghostClass, true);
				_toggleClass(dragEl, options.dragClass, false);

				Sortable.active = this;

				// Drag start event
				_dispatchEvent(this, rootEl, 'start', dragEl, rootEl, rootEl, oldIndex);
			} else {
				this._nulling();
			}
		},

		_emulateDragOver: function () {
			if (touchEvt) {
				if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
					return;
				}

				this._lastX = touchEvt.clientX;
				this._lastY = touchEvt.clientY;

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', 'none');
				}

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
				var parent = target;
				var i = touchDragOverListeners.length;

				if (target && target.shadowRoot) {
					target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
					parent = target;
				}

				if (parent) {
					do {
						if (parent[expando]) {
							while (i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}

							break;
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}

				if (!supportCssPointerEvents) {
					_css(ghostEl, 'display', '');
				}
			}
		},


		_onTouchMove: function (/**TouchEvent*/evt) {
			if (tapEvt) {
				var	options = this.options,
					fallbackTolerance = options.fallbackTolerance,
					fallbackOffset = options.fallbackOffset,
					touch = evt.touches ? evt.touches[0] : evt,
					dx = (touch.clientX - tapEvt.clientX) + fallbackOffset.x,
					dy = (touch.clientY - tapEvt.clientY) + fallbackOffset.y,
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				// only set the status to dragging, when we are actually dragging
				if (!Sortable.active) {
					if (fallbackTolerance &&
						min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
					) {
						return;
					}

					this._dragStarted();
				}

				// as well as creating the ghost element on the document body
				this._appendGhost();

				moved = true;
				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.preventDefault();
			}
		},

		_appendGhost: function () {
			if (!ghostEl) {
				var rect = dragEl.getBoundingClientRect(),
					css = _css(dragEl),
					options = this.options,
					ghostRect;

				ghostEl = dragEl.cloneNode(true);

				_toggleClass(ghostEl, options.ghostClass, false);
				_toggleClass(ghostEl, options.fallbackClass, true);
				_toggleClass(ghostEl, options.dragClass, true);

				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');
				_css(ghostEl, 'pointerEvents', 'none');

				options.fallbackOnBody && document.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

				// Fixing dimensions.
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
			}
		},

		_onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
			var _this = this;
			var dataTransfer = evt.dataTransfer;
			var options = _this.options;

			_this._offUpEvents();

			if (activeGroup.checkPull(_this, _this, dragEl, evt)) {
				cloneEl = _clone(dragEl);

				cloneEl.draggable = false;
				cloneEl.style['will-change'] = '';

				_css(cloneEl, 'display', 'none');
				_toggleClass(cloneEl, _this.options.chosenClass, false);

				// #1143: IFrame support workaround
				_this._cloneId = _nextTick(function () {
					rootEl.insertBefore(cloneEl, dragEl);
					_dispatchEvent(_this, rootEl, 'clone', dragEl);
				});
			}

			_toggleClass(dragEl, options.dragClass, true);

			if (useFallback) {
				if (useFallback === 'touch') {
					// Bind touch events
					_on(document, 'touchmove', _this._onTouchMove);
					_on(document, 'touchend', _this._onDrop);
					_on(document, 'touchcancel', _this._onDrop);

					if (options.supportPointer) {
						_on(document, 'pointermove', _this._onTouchMove);
						_on(document, 'pointerup', _this._onDrop);
					}
				} else {
					// Old brwoser
					_on(document, 'mousemove', _this._onTouchMove);
					_on(document, 'mouseup', _this._onDrop);
				}

				_this._loopId = setInterval(_this._emulateDragOver, 50);
			}
			else {
				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(_this, dataTransfer, dragEl);
				}

				_on(document, 'drop', _this);

				// #1143: Бывает элемент с IFrame внутри блокирует `drop`,
				// поэтому если вызвался `mouseover`, значит надо отменять весь d'n'd.
				// Breaking Chrome 62+
				// _on(document, 'mouseover', _this);

				_this._dragStartId = _nextTick(_this._dragStarted);
			}
		},

		_onDragOver: function (/**Event*/evt) {
			var el = this.el,
				target,
				dragRect,
				targetRect,
				revert,
				options = this.options,
				group = options.group,
				activeSortable = Sortable.active,
				isOwner = (activeGroup === group),
				isMovingBetweenSortable = false,
				canSort = options.sort;

			if (evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}

			if (dragEl.animated) {
				return;
			}

			moved = true;

			if (activeSortable && !options.disabled &&
				(isOwner
					? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
					: (
						putSortable === this ||
						(
							(activeSortable.lastPullMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) &&
							group.checkPut(this, activeSortable, dragEl, evt)
						)
					)
				) &&
				(evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
			) {
				// Smart auto-scrolling
				_autoScroll(evt, options, this.el);

				if (_silent) {
					return;
				}

				target = _closest(evt.target, options.draggable, el);
				dragRect = dragEl.getBoundingClientRect();

				if (putSortable !== this) {
					putSortable = this;
					isMovingBetweenSortable = true;
				}

				if (revert) {
					_cloneHide(activeSortable, true);
					parentEl = rootEl; // actualization

					if (cloneEl || nextEl) {
						rootEl.insertBefore(dragEl, cloneEl || nextEl);
					}
					else if (!canSort) {
						rootEl.appendChild(dragEl);
					}

					return;
				}


				if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
					(el === evt.target) && (_ghostIsLast(el, evt))
				) {
					//assign target only if condition is true
					if (el.children.length !== 0 && el.children[0] !== ghostEl && el === evt.target) {
						target = el.lastElementChild;
					}

					if (target) {
						if (target.animated) {
							return;
						}

						targetRect = target.getBoundingClientRect();
					}

					_cloneHide(activeSortable, isOwner);

					if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt) !== false) {
						if (!dragEl.contains(el)) {
							el.appendChild(dragEl);
							parentEl = el; // actualization
						}

						this._animate(dragRect, dragEl);
						target && this._animate(targetRect, target);
					}
				}
				else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
					if (lastEl !== target) {
						lastEl = target;
						lastCSS = _css(target);
						lastParentCSS = _css(target.parentNode);
					}

					targetRect = target.getBoundingClientRect();

					var width = targetRect.right - targetRect.left,
						height = targetRect.bottom - targetRect.top,
						floating = R_FLOAT.test(lastCSS.cssFloat + lastCSS.display)
							|| (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
						isWide = (target.offsetWidth > dragEl.offsetWidth),
						isLong = (target.offsetHeight > dragEl.offsetHeight),
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						nextSibling = target.nextElementSibling,
						after = false;

					if (floating) {
						var elTop = dragEl.offsetTop,
							tgTop = target.offsetTop;

						if (elTop === tgTop) {
							after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
						}
						else if (target.previousElementSibling === dragEl || dragEl.previousElementSibling === target) {
							after = (evt.clientY - targetRect.top) / height > 0.5;
						} else {
							after = tgTop > elTop;
						}
						} else if (!isMovingBetweenSortable) {
						after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
					}

					var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);

					if (moveVector !== false) {
						if (moveVector === 1 || moveVector === -1) {
							after = (moveVector === 1);
						}

						_silent = true;
						setTimeout(_unsilent, 30);

						_cloneHide(activeSortable, isOwner);

						if (!dragEl.contains(el)) {
							if (after && !nextSibling) {
								el.appendChild(dragEl);
							} else {
								target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
							}
						}

						parentEl = dragEl.parentNode; // actualization

						this._animate(dragRect, dragEl);
						this._animate(targetRect, target);
					}
				}
			}
		},

		_animate: function (prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = target.getBoundingClientRect();

				if (prevRect.nodeType === 1) {
					prevRect = prevRect.getBoundingClientRect();
				}

				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d('
					+ (prevRect.left - currentRect.left) + 'px,'
					+ (prevRect.top - currentRect.top) + 'px,0)'
				);

				target.offsetWidth; // repaint

				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');

				clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_offUpEvents: function () {
			var ownerDocument = this.el.ownerDocument;

			_off(document, 'touchmove', this._onTouchMove);
			_off(document, 'pointermove', this._onTouchMove);
			_off(ownerDocument, 'mouseup', this._onDrop);
			_off(ownerDocument, 'touchend', this._onDrop);
			_off(ownerDocument, 'pointerup', this._onDrop);
			_off(ownerDocument, 'touchcancel', this._onDrop);
			_off(ownerDocument, 'pointercancel', this._onDrop);
			_off(ownerDocument, 'selectstart', this);
		},

		_onDrop: function (/**Event*/evt) {
			var el = this.el,
				options = this.options;

			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);
			clearTimeout(this._dragStartTimer);

			_cancelNextTick(this._cloneId);
			_cancelNextTick(this._dragStartId);

			// Unbind events
			_off(document, 'mouseover', this);
			_off(document, 'mousemove', this._onTouchMove);

			if (this.nativeDraggable) {
				_off(document, 'drop', this);
				_off(el, 'dragstart', this._onDragStart);
			}

			this._offUpEvents();

			if (evt) {
				if (moved) {
					evt.preventDefault();
					!options.dropBubble && evt.stopPropagation();
				}

				ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);

				if (rootEl === parentEl || Sortable.active.lastPullMode !== 'clone') {
					// Remove clone
					cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
				}

				if (dragEl) {
					if (this.nativeDraggable) {
						_off(dragEl, 'dragend', this);
					}

					_disableDraggable(dragEl);
					dragEl.style['will-change'] = '';

					// Remove class's
					_toggleClass(dragEl, this.options.ghostClass, false);
					_toggleClass(dragEl, this.options.chosenClass, false);

					// Drag stop event
					_dispatchEvent(this, rootEl, 'unchoose', dragEl, parentEl, rootEl, oldIndex);

					if (rootEl !== parentEl) {
						newIndex = _index(dragEl, options.draggable);

						if (newIndex >= 0) {
							// Add event
							_dispatchEvent(null, parentEl, 'add', dragEl, parentEl, rootEl, oldIndex, newIndex);

							// Remove event
							_dispatchEvent(this, rootEl, 'remove', dragEl, parentEl, rootEl, oldIndex, newIndex);

							// drag from one list and drop into another
							_dispatchEvent(null, parentEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex);
							_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex);
						}
					}
					else {
						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl, options.draggable);

							if (newIndex >= 0) {
								// drag & drop within the same list
								_dispatchEvent(this, rootEl, 'update', dragEl, parentEl, rootEl, oldIndex, newIndex);
								_dispatchEvent(this, rootEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex);
							}
						}
					}

					if (Sortable.active) {
						/* jshint eqnull:true */
						if (newIndex == null || newIndex === -1) {
							newIndex = oldIndex;
						}

						_dispatchEvent(this, rootEl, 'end', dragEl, parentEl, rootEl, oldIndex, newIndex);

						// Save sorting
						this.save();
					}
				}

			}

			this._nulling();
		},

		_nulling: function() {
			rootEl =
			dragEl =
			parentEl =
			ghostEl =
			nextEl =
			cloneEl =
			lastDownEl =

			scrollEl =
			scrollParentEl =

			tapEvt =
			touchEvt =

			moved =
			newIndex =

			lastEl =
			lastCSS =

			putSortable =
			activeGroup =
			Sortable.active = null;

			savedInputChecked.forEach(function (el) {
				el.checked = true;
			});
			savedInputChecked.length = 0;
		},

		handleEvent: function (/**Event*/evt) {
			switch (evt.type) {
				case 'drop':
				case 'dragend':
					this._onDrop(evt);
					break;

				case 'dragover':
				case 'dragenter':
					if (dragEl) {
						this._onDragOver(evt);
						_globalDragOver(evt);
					}
					break;

				case 'mouseover':
					this._onDrop(evt);
					break;

				case 'selectstart':
					evt.preventDefault();
					break;
			}
		},


		/**
		 * Serializes the item into an array of string.
		 * @returns {String[]}
		 */
		toArray: function () {
			var order = [],
				el,
				children = this.el.children,
				i = 0,
				n = children.length,
				options = this.options;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, options.draggable, this.el)) {
					order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
				}
			}

			return order;
		},


		/**
		 * Sorts the elements according to the array.
		 * @param  {String[]}  order  order of the items
		 */
		sort: function (order) {
			var items = {}, rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},


		/**
		 * Save the current sorting
		 */
		save: function () {
			var store = this.options.store;
			store && store.set(this);
		},


		/**
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el
		 * @param   {String}       [selector]  default: `options.draggable`
		 * @returns {HTMLElement|null}
		 */
		closest: function (el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},


		/**
		 * Set/get option
		 * @param   {string} name
		 * @param   {*}      [value]
		 * @returns {*}
		 */
		option: function (name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;

				if (name === 'group') {
					_prepareGroup(options);
				}
			}
		},


		/**
		 * Destroy
		 */
		destroy: function () {
			var el = this.el;

			el[expando] = null;

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);
			_off(el, 'pointerdown', this._onTapStart);

			if (this.nativeDraggable) {
				_off(el, 'dragover', this);
				_off(el, 'dragenter', this);
			}

			// Remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

			this._onDrop();

			this.el = el = null;
		}
	};


	function _cloneHide(sortable, state) {
		if (sortable.lastPullMode !== 'clone') {
			state = true;
		}

		if (cloneEl && (cloneEl.state !== state)) {
			_css(cloneEl, 'display', state ? 'none' : '');

			if (!state) {
				if (cloneEl.state) {
					if (sortable.options.group.revertClone) {
						rootEl.insertBefore(cloneEl, nextEl);
						sortable._animate(dragEl, cloneEl);
					} else {
						rootEl.insertBefore(cloneEl, dragEl);
					}
				}
			}

			cloneEl.state = state;
		}
	}


	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
		if (el) {
			ctx = ctx || document;

			do {
				if ((selector === '>*' && el.parentNode === ctx) || _matches(el, selector)) {
					return el;
				}
				/* jshint boss:true */
			} while (el = _getParentOrHost(el));
		}

		return null;
	}


	function _getParentOrHost(el) {
		var parent = el.host;

		return (parent && parent.nodeType) ? parent : el.parentNode;
	}


	function _globalDragOver(/**Event*/evt) {
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = 'move';
		}
		evt.preventDefault();
	}


	function _on(el, event, fn) {
		el.addEventListener(event, fn, captureMode);
	}


	function _off(el, event, fn) {
		el.removeEventListener(event, fn, captureMode);
	}


	function _toggleClass(el, name, state) {
		if (el) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			}
			else {
				var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
				el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
			}
		}
	}


	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				}
				else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			}
			else {
				if (!(prop in style)) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}


	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}



	function _dispatchEvent(sortable, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex) {
		sortable = (sortable || rootEl[expando]);

		var evt = document.createEvent('Event'),
			options = sortable.options,
			onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

		evt.initEvent(name, true, true);

		evt.to = toEl || rootEl;
		evt.from = fromEl || rootEl;
		evt.item = targetEl || rootEl;
		evt.clone = cloneEl;

		evt.oldIndex = startIndex;
		evt.newIndex = newIndex;

		rootEl.dispatchEvent(evt);

		if (options[onName]) {
			options[onName].call(sortable, evt);
		}
	}


	function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
		var evt,
			sortable = fromEl[expando],
			onMoveFn = sortable.options.onMove,
			retVal;

		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);

		evt.to = toEl;
		evt.from = fromEl;
		evt.dragged = dragEl;
		evt.draggedRect = dragRect;
		evt.related = targetEl || toEl;
		evt.relatedRect = targetRect || toEl.getBoundingClientRect();
		evt.willInsertAfter = willInsertAfter;

		fromEl.dispatchEvent(evt);

		if (onMoveFn) {
			retVal = onMoveFn.call(sortable, evt, originalEvt);
		}

		return retVal;
	}


	function _disableDraggable(el) {
		el.draggable = false;
	}


	function _unsilent() {
		_silent = false;
	}


	/** @returns {HTMLElement|false} */
	function _ghostIsLast(el, evt) {
		var lastEl = el.lastElementChild,
			rect = lastEl.getBoundingClientRect();

		// 5 — min delta
		// abs — нельзя добавлять, а то глюки при наведении сверху
		return (evt.clientY - (rect.top + rect.height) > 5) ||
			(evt.clientX - (rect.left + rect.width) > 5);
	}


	/**
	 * Generate id
	 * @param   {HTMLElement} el
	 * @returns {String}
	 * @private
	 */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
	 * Returns the index of an element within its parent for a selected set of
	 * elements
	 * @param  {HTMLElement} el
	 * @param  {selector} selector
	 * @return {number}
	 */
	function _index(el, selector) {
		var index = 0;

		if (!el || !el.parentNode) {
			return -1;
		}

		while (el && (el = el.previousElementSibling)) {
			if ((el.nodeName.toUpperCase() !== 'TEMPLATE') && (selector === '>*' || _matches(el, selector))) {
				index++;
			}
		}

		return index;
	}

	function _matches(/**HTMLElement*/el, /**String*/selector) {
		if (el) {
			selector = selector.split('.');

			var tag = selector.shift().toUpperCase(),
				re = new RegExp('\\s(' + selector.join('|') + ')(?=\\s)', 'g');

			return (
				(tag === '' || el.nodeName.toUpperCase() == tag) &&
				(!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
			);
		}

		return false;
	}

	function _throttle(callback, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					args = void 0;
				}, ms);
			}
		};
	}

	function _extend(dst, src) {
		if (dst && src) {
			for (var key in src) {
				if (src.hasOwnProperty(key)) {
					dst[key] = src[key];
				}
			}
		}

		return dst;
	}

	function _clone(el) {
		if (Polymer && Polymer.dom) {
			return Polymer.dom(el).cloneNode(true);
		}
		else if ($) {
			return $(el).clone(true)[0];
		}
		else {
			return el.cloneNode(true);
		}
	}

	function _saveInputCheckedState(root) {
		var inputs = root.getElementsByTagName('input');
		var idx = inputs.length;

		while (idx--) {
			var el = inputs[idx];
			el.checked && savedInputChecked.push(el);
		}
	}

	function _nextTick(fn) {
		return setTimeout(fn, 0);
	}

	function _cancelNextTick(id) {
		return clearTimeout(id);
	}

	// Fixed #973:
	_on(document, 'touchmove', function (evt) {
		if (Sortable.active) {
			evt.preventDefault();
		}
	});

	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		is: function (el, selector) {
			return !!_closest(el, selector, el);
		},
		extend: _extend,
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		clone: _clone,
		index: _index,
		nextTick: _nextTick,
		cancelNextTick: _cancelNextTick
	};


	/**
	 * Create sortable instance
	 * @param {HTMLElement}  el
	 * @param {Object}      [options]
	 */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};


	// Export
	Sortable.version = '1.7.0';
	return Sortable;
});
});

var clusterize = createCommonjsModule(function (module) {
/*! Clusterize.js - v0.18.0 - 2017-11-04
* http://NeXTs.github.com/Clusterize.js/
* Copyright (c) 2015 Denis Lukov; Licensed GPLv3 */

(function(name, definition) {
    module.exports = definition();
}('Clusterize', function() {
  var ie = (function(){
    for( var v = 3,
             el = document.createElement('b'),
             all = el.all || [];
         el.innerHTML = '<!--[if gt IE ' + (++v) + ']><i><![endif]-->', all[0];
       ){}
    return v > 4 ? v : document.documentMode;
  }()),
  is_mac = navigator.platform.toLowerCase().indexOf('mac') + 1;
  var Clusterize = function(data) {
    if( ! (this instanceof Clusterize))
      return new Clusterize(data);
    var self = this;

    var defaults = {
      rows_in_block: 50,
      blocks_in_cluster: 4,
      tag: null,
      show_no_data_row: true,
      no_data_class: 'clusterize-no-data',
      no_data_text: 'No data',
      keep_parity: true,
      callbacks: {}
    };

    // public parameters
    self.options = {};
    var options = ['rows_in_block', 'blocks_in_cluster', 'show_no_data_row', 'no_data_class', 'no_data_text', 'keep_parity', 'tag', 'callbacks'];
    for(var i = 0, option; option = options[i]; i++) {
      self.options[option] = typeof data[option] != 'undefined' && data[option] != null
        ? data[option]
        : defaults[option];
    }

    var elems = ['scroll', 'content'];
    for(var i = 0, elem; elem = elems[i]; i++) {
      self[elem + '_elem'] = data[elem + 'Id']
        ? document.getElementById(data[elem + 'Id'])
        : data[elem + 'Elem'];
      if( ! self[elem + '_elem'])
        throw new Error("Error! Could not find " + elem + " element");
    }

    // tabindex forces the browser to keep focus on the scrolling list, fixes #11
    if( ! self.content_elem.hasAttribute('tabindex'))
      self.content_elem.setAttribute('tabindex', 0);

    // private parameters
    var rows = isArray(data.rows)
        ? data.rows
        : self.fetchMarkup(),
      cache = {},
      scroll_top = self.scroll_elem.scrollTop;

    // append initial data
    self.insertToDOM(rows, cache);

    // restore the scroll position
    self.scroll_elem.scrollTop = scroll_top;

    // adding scroll handler
    var last_cluster = false,
    scroll_debounce = 0,
    pointer_events_set = false,
    scrollEv = function() {
      // fixes scrolling issue on Mac #3
      if (is_mac) {
          if( ! pointer_events_set) self.content_elem.style.pointerEvents = 'none';
          pointer_events_set = true;
          clearTimeout(scroll_debounce);
          scroll_debounce = setTimeout(function () {
              self.content_elem.style.pointerEvents = 'auto';
              pointer_events_set = false;
          }, 50);
      }
      if (last_cluster != (last_cluster = self.getClusterNum()))
        self.insertToDOM(rows, cache);
      if (self.options.callbacks.scrollingProgress)
        self.options.callbacks.scrollingProgress(self.getScrollProgress());
    },
    resize_debounce = 0,
    resizeEv = function() {
      clearTimeout(resize_debounce);
      resize_debounce = setTimeout(self.refresh, 100);
    };
    on('scroll', self.scroll_elem, scrollEv);
    on('resize', window, resizeEv);

    // public methods
    self.destroy = function(clean) {
      off('scroll', self.scroll_elem, scrollEv);
      off('resize', window, resizeEv);
      self.html((clean ? self.generateEmptyRow() : rows).join(''));
    };
    self.refresh = function(force) {
      if(self.getRowsHeight(rows) || force) self.update(rows);
    };
    self.update = function(new_rows) {
      rows = isArray(new_rows)
        ? new_rows
        : [];
      var scroll_top = self.scroll_elem.scrollTop;
      // fixes #39
      if(rows.length * self.options.item_height < scroll_top) {
        self.scroll_elem.scrollTop = 0;
        last_cluster = 0;
      }
      self.insertToDOM(rows, cache);
      self.scroll_elem.scrollTop = scroll_top;
    };
    self.clear = function() {
      self.update([]);
    };
    self.getRowsAmount = function() {
      return rows.length;
    };
    self.getScrollProgress = function() {
      return this.options.scroll_top / (rows.length * this.options.item_height) * 100 || 0;
    };

    var add = function(where, _new_rows) {
      var new_rows = isArray(_new_rows)
        ? _new_rows
        : [];
      if( ! new_rows.length) return;
      rows = where == 'append'
        ? rows.concat(new_rows)
        : new_rows.concat(rows);
      self.insertToDOM(rows, cache);
    };
    self.append = function(rows) {
      add('append', rows);
    };
    self.prepend = function(rows) {
      add('prepend', rows);
    };
  };

  Clusterize.prototype = {
    constructor: Clusterize,
    // fetch existing markup
    fetchMarkup: function() {
      var rows = [], rows_nodes = this.getChildNodes(this.content_elem);
      while (rows_nodes.length) {
        rows.push(rows_nodes.shift().outerHTML);
      }
      return rows;
    },
    // get tag name, content tag name, tag height, calc cluster height
    exploreEnvironment: function(rows, cache) {
      var opts = this.options;
      opts.content_tag = this.content_elem.tagName.toLowerCase();
      if( ! rows.length) return;
      if(ie && ie <= 9 && ! opts.tag) opts.tag = rows[0].match(/<([^>\s/]*)/)[1].toLowerCase();
      if(this.content_elem.children.length <= 1) cache.data = this.html(rows[0] + rows[0] + rows[0]);
      if( ! opts.tag) opts.tag = this.content_elem.children[0].tagName.toLowerCase();
      this.getRowsHeight(rows);
    },
    getRowsHeight: function(rows) {
      var opts = this.options,
        prev_item_height = opts.item_height;
      opts.cluster_height = 0;
      if( ! rows.length) return;
      var nodes = this.content_elem.children;
      var node = nodes[Math.floor(nodes.length / 2)];
      opts.item_height = node.offsetHeight;
      // consider table's border-spacing
      if(opts.tag == 'tr' && getStyle('borderCollapse', this.content_elem) != 'collapse')
        opts.item_height += parseInt(getStyle('borderSpacing', this.content_elem), 10) || 0;
      // consider margins (and margins collapsing)
      if(opts.tag != 'tr') {
        var marginTop = parseInt(getStyle('marginTop', node), 10) || 0;
        var marginBottom = parseInt(getStyle('marginBottom', node), 10) || 0;
        opts.item_height += Math.max(marginTop, marginBottom);
      }
      opts.block_height = opts.item_height * opts.rows_in_block;
      opts.rows_in_cluster = opts.blocks_in_cluster * opts.rows_in_block;
      opts.cluster_height = opts.blocks_in_cluster * opts.block_height;
      return prev_item_height != opts.item_height;
    },
    // get current cluster number
    getClusterNum: function () {
      this.options.scroll_top = this.scroll_elem.scrollTop;
      return Math.floor(this.options.scroll_top / (this.options.cluster_height - this.options.block_height)) || 0;
    },
    // generate empty row if no data provided
    generateEmptyRow: function() {
      var opts = this.options;
      if( ! opts.tag || ! opts.show_no_data_row) return [];
      var empty_row = document.createElement(opts.tag),
        no_data_content = document.createTextNode(opts.no_data_text), td;
      empty_row.className = opts.no_data_class;
      if(opts.tag == 'tr') {
        td = document.createElement('td');
        // fixes #53
        td.colSpan = 100;
        td.appendChild(no_data_content);
      }
      empty_row.appendChild(td || no_data_content);
      return [empty_row.outerHTML];
    },
    // generate cluster for current scroll position
    generate: function (rows, cluster_num) {
      var opts = this.options,
        rows_len = rows.length;
      if (rows_len < opts.rows_in_block) {
        return {
          top_offset: 0,
          bottom_offset: 0,
          rows_above: 0,
          rows: rows_len ? rows : this.generateEmptyRow()
        }
      }
      var items_start = Math.max((opts.rows_in_cluster - opts.rows_in_block) * cluster_num, 0),
        items_end = items_start + opts.rows_in_cluster,
        top_offset = Math.max(items_start * opts.item_height, 0),
        bottom_offset = Math.max((rows_len - items_end) * opts.item_height, 0),
        this_cluster_rows = [],
        rows_above = items_start;
      if(top_offset < 1) {
        rows_above++;
      }
      for (var i = items_start; i < items_end; i++) {
        rows[i] && this_cluster_rows.push(rows[i]);
      }
      return {
        top_offset: top_offset,
        bottom_offset: bottom_offset,
        rows_above: rows_above,
        rows: this_cluster_rows
      }
    },
    renderExtraTag: function(class_name, height) {
      var tag = document.createElement(this.options.tag),
        clusterize_prefix = 'clusterize-';
      tag.className = [clusterize_prefix + 'extra-row', clusterize_prefix + class_name].join(' ');
      height && (tag.style.height = height + 'px');
      return tag.outerHTML;
    },
    // if necessary verify data changed and insert to DOM
    insertToDOM: function(rows, cache) {
      // explore row's height
      if( ! this.options.cluster_height) {
        this.exploreEnvironment(rows, cache);
      }
      var data = this.generate(rows, this.getClusterNum()),
        this_cluster_rows = data.rows.join(''),
        this_cluster_content_changed = this.checkChanges('data', this_cluster_rows, cache),
        top_offset_changed = this.checkChanges('top', data.top_offset, cache),
        only_bottom_offset_changed = this.checkChanges('bottom', data.bottom_offset, cache),
        callbacks = this.options.callbacks,
        layout = [];

      if(this_cluster_content_changed || top_offset_changed) {
        if(data.top_offset) {
          this.options.keep_parity && layout.push(this.renderExtraTag('keep-parity'));
          layout.push(this.renderExtraTag('top-space', data.top_offset));
        }
        layout.push(this_cluster_rows);
        data.bottom_offset && layout.push(this.renderExtraTag('bottom-space', data.bottom_offset));
        callbacks.clusterWillChange && callbacks.clusterWillChange();
        this.html(layout.join(''));
        this.options.content_tag == 'ol' && this.content_elem.setAttribute('start', data.rows_above);
        this.content_elem.style['counter-increment'] = 'clusterize-counter ' + (data.rows_above-1);
        callbacks.clusterChanged && callbacks.clusterChanged();
      } else if(only_bottom_offset_changed) {
        this.content_elem.lastChild.style.height = data.bottom_offset + 'px';
      }
    },
    // unfortunately ie <= 9 does not allow to use innerHTML for table elements, so make a workaround
    html: function(data) {
      var content_elem = this.content_elem;
      if(ie && ie <= 9 && this.options.tag == 'tr') {
        var div = document.createElement('div'), last;
        div.innerHTML = '<table><tbody>' + data + '</tbody></table>';
        while((last = content_elem.lastChild)) {
          content_elem.removeChild(last);
        }
        var rows_nodes = this.getChildNodes(div.firstChild.firstChild);
        while (rows_nodes.length) {
          content_elem.appendChild(rows_nodes.shift());
        }
      } else {
        content_elem.innerHTML = data;
      }
    },
    getChildNodes: function(tag) {
        var child_nodes = tag.children, nodes = [];
        for (var i = 0, ii = child_nodes.length; i < ii; i++) {
            nodes.push(child_nodes[i]);
        }
        return nodes;
    },
    checkChanges: function(type, value, cache) {
      var changed = value != cache[type];
      cache[type] = value;
      return changed;
    }
  };

  // support functions
  function on(evt, element, fnc) {
    return element.addEventListener ? element.addEventListener(evt, fnc, false) : element.attachEvent("on" + evt, fnc);
  }
  function off(evt, element, fnc) {
    return element.removeEventListener ? element.removeEventListener(evt, fnc, false) : element.detachEvent("on" + evt, fnc);
  }
  function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }
  function getStyle(prop, elem) {
    return window.getComputedStyle ? window.getComputedStyle(elem)[prop] : elem.currentStyle[prop];
  }

  return Clusterize;
}));
});

var frappeDatatable = createCommonjsModule(function (module, exports) {
(function webpackUniversalModuleDefinition(root, factory) {
	module.exports = factory(Sortable, clusterize);
})(typeof self !== 'undefined' ? self : commonjsGlobal, function(__WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_11__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = $;
function $(expr, con) {
  return typeof expr === 'string' ? (con || document).querySelector(expr) : expr || null;
}

$.each = function (expr, con) {
  return typeof expr === 'string' ? Array.from((con || document).querySelectorAll(expr)) : expr || null;
};

$.create = function (tag, o) {
  var element = document.createElement(tag);

  var _loop = function _loop(i) {
    var val = o[i];

    if (i === 'inside') {
      $(val).appendChild(element);
    } else if (i === 'around') {
      var ref = $(val);
      ref.parentNode.insertBefore(element, ref);
      element.appendChild(ref);
    } else if (i === 'styles') {
      if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
        Object.keys(val).map(function (prop) {
          element.style[prop] = val[prop];
        });
      }
    } else if (i in element) {
      element[i] = val;
    } else {
      element.setAttribute(i, val);
    }
  };

  for (var i in o) {
    _loop(i);
  }

  return element;
};

$.on = function (element, event, selector, callback) {
  if (!callback) {
    callback = selector;
    $.bind(element, event, callback);
  } else {
    $.delegate(element, event, selector, callback);
  }
};

$.off = function (element, event, handler) {
  element.removeEventListener(event, handler);
};

$.bind = function (element, event, callback) {
  event.split(/\s+/).forEach(function (event) {
    element.addEventListener(event, callback);
  });
};

$.delegate = function (element, event, selector, callback) {
  element.addEventListener(event, function (e) {
    var delegatedTarget = e.target.closest(selector);
    if (delegatedTarget) {
      e.delegatedTarget = delegatedTarget;
      callback.call(this, e, delegatedTarget);
    }
  });
};

$.unbind = function (element, o) {
  if (element) {
    var _loop2 = function _loop2(event) {
      var callback = o[event];

      event.split(/\s+/).forEach(function (event) {
        element.removeEventListener(event, callback);
      });
    };

    for (var event in o) {
      _loop2(event);
    }
  }
};

$.fire = function (target, type, properties) {
  var evt = document.createEvent('HTMLEvents');

  evt.initEvent(type, true, true);

  for (var j in properties) {
    evt[j] = properties[j];
  }

  return target.dispatchEvent(evt);
};

$.data = function (element, attrs) {
  // eslint-disable-line
  if (!attrs) {
    return element.dataset;
  }

  for (var attr in attrs) {
    element.dataset[attr] = attrs[attr];
  }
};

$.style = function (elements, styleMap) {
  // eslint-disable-line

  if (typeof styleMap === 'string') {
    return $.getStyle(elements, styleMap);
  }

  if (!Array.isArray(elements)) {
    elements = [elements];
  }

  elements.map(function (element) {
    for (var prop in styleMap) {
      element.style[prop] = styleMap[prop];
    }
  });
};

$.removeStyle = function (elements, styleProps) {
  if (!Array.isArray(elements)) {
    elements = [elements];
  }

  if (!Array.isArray(styleProps)) {
    styleProps = [styleProps];
  }

  elements.map(function (element) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = styleProps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var prop = _step.value;

        element.style[prop] = '';
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });
};

$.getStyle = function (element, prop) {
  var val = getComputedStyle(element)[prop];

  if (['width', 'height'].includes(prop)) {
    val = parseFloat(val);
  }

  return val;
};

$.closest = function (selector, element) {
  if (!element) return null;

  if (element.matches(selector)) {
    return element;
  }

  return $.closest(selector, element.parentNode);
};

$.inViewport = function (el, parentEl) {
  var _el$getBoundingClient = el.getBoundingClientRect(),
      top = _el$getBoundingClient.top,
      left = _el$getBoundingClient.left,
      bottom = _el$getBoundingClient.bottom,
      right = _el$getBoundingClient.right;

  var _parentEl$getBounding = parentEl.getBoundingClientRect(),
      pTop = _parentEl$getBounding.top,
      pLeft = _parentEl$getBounding.left,
      pBottom = _parentEl$getBounding.bottom,
      pRight = _parentEl$getBounding.right;

  return top >= pTop && left >= pLeft && bottom <= pBottom && right <= pRight;
};

$.scrollTop = function scrollTop(element, pixels) {
  requestAnimationFrame(function () {
    element.scrollTop = pixels;
  });
};
module.exports = exports['default'];

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.camelCaseToDash = camelCaseToDash;
exports.makeDataAttributeString = makeDataAttributeString;
exports.getDefault = getDefault;
exports.escapeRegExp = escapeRegExp;
exports.getCSSString = getCSSString;
exports.getCSSRuleBlock = getCSSRuleBlock;
exports.buildCSSRule = buildCSSRule;
exports.removeCSSRule = removeCSSRule;
exports.copyTextToClipboard = copyTextToClipboard;
exports.isNumeric = isNumeric;
exports.throttle = throttle;
exports.promisify = promisify;
exports.chainPromises = chainPromises;
function camelCaseToDash(str) {
  return str.replace(/([A-Z])/g, function (g) {
    return '-' + g[0].toLowerCase();
  });
}

function makeDataAttributeString(props) {
  var keys = Object.keys(props);

  return keys.map(function (key) {
    var _key = camelCaseToDash(key);
    var val = props[key];

    if (val === undefined) return '';
    return 'data-' + _key + '="' + val + '" ';
  }).join('').trim();
}

function getDefault(a, b) {
  return a !== undefined ? a : b;
}

function escapeRegExp(str) {
  // https://stackoverflow.com/a/6969486
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function getCSSString(styleMap) {
  var style = '';

  for (var prop in styleMap) {
    if (styleMap.hasOwnProperty(prop)) {
      style += prop + ': ' + styleMap[prop] + '; ';
    }
  }

  return style.trim();
}

function getCSSRuleBlock(rule, styleMap) {
  return rule + ' { ' + getCSSString(styleMap) + ' }';
}

function buildCSSRule(rule, styleMap) {
  var cssRulesString = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

  // build css rules efficiently,
  // append new rule if doesnt exist,
  // update existing ones

  var rulePatternStr = escapeRegExp(rule) + ' {([^}]*)}';
  var rulePattern = new RegExp(rulePatternStr, 'g');

  if (cssRulesString && cssRulesString.match(rulePattern)) {
    var _loop = function _loop(property) {
      var value = styleMap[property];
      var propPattern = new RegExp(escapeRegExp(property) + ':([^;]*);');

      cssRulesString = cssRulesString.replace(rulePattern, function (match, propertyStr) {
        if (propertyStr.match(propPattern)) {
          // property exists, replace value with new value
          propertyStr = propertyStr.replace(propPattern, function (match, valueStr) {
            return property + ': ' + value + ';';
          });
        }
        propertyStr = propertyStr.trim();

        var replacer = rule + ' { ' + propertyStr + ' }';

        return replacer;
      });
    };

    for (var property in styleMap) {
      _loop(property);
    }

    return cssRulesString;
  }
  // no match, append new rule block
  return '' + cssRulesString + getCSSRuleBlock(rule, styleMap);
}

function removeCSSRule(rule) {
  var cssRulesString = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var rulePatternStr = escapeRegExp(rule) + ' {([^}]*)}';
  var rulePattern = new RegExp(rulePatternStr, 'g');
  var output = cssRulesString;

  if (cssRulesString && cssRulesString.match(rulePattern)) {
    output = cssRulesString.replace(rulePattern, '');
  }

  return output.trim();
}

function copyTextToClipboard(text) {
  // https://stackoverflow.com/a/30810322/5353542
  var textArea = document.createElement('textarea');

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';

  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

function isNumeric(val) {
  return !isNaN(val);
}

// https://stackoverflow.com/a/27078401
function throttle(func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};

  var later = function later() {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  return function () {
    var now = Date.now();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}

function promisify(fn) {
  var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  return function () {
    for (var _len = arguments.length, args = Array(_len), _key2 = 0; _key2 < _len; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return new Promise(function (resolve) {
      setTimeout(function () {
        fn.apply(context, args);
        resolve('done', fn.name);
      }, 0);
    });
  };
}

function chainPromises(promises) {
  return promises.reduce(function (prev, cur) {
    return prev.then(cur);
  }, Promise.resolve());
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getRowHTML = getRowHTML;

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

var _utils = __webpack_require__(1);

var _cellmanager = __webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RowManager = function () {
  function RowManager(instance) {
    _classCallCheck(this, RowManager);

    this.instance = instance;
    this.options = this.instance.options;
    this.wrapper = this.instance.wrapper;
    this.bodyScrollable = this.instance.bodyScrollable;

    this.bindEvents();
    this.refreshRows = (0, _utils.promisify)(this.refreshRows, this);
  }

  _createClass(RowManager, [{
    key: 'bindEvents',
    value: function bindEvents() {
      this.bindCheckbox();
    }
  }, {
    key: 'bindCheckbox',
    value: function bindCheckbox() {
      var _this = this;

      if (!this.options.addCheckboxColumn) return;

      // map of checked rows
      this.checkMap = [];

      _dom2.default.on(this.wrapper, 'click', '.data-table-col[data-col-index="0"] [type="checkbox"]', function (e, $checkbox) {
        var $cell = $checkbox.closest('.data-table-col');

        var _$$data = _dom2.default.data($cell),
            rowIndex = _$$data.rowIndex,
            isHeader = _$$data.isHeader;

        var checked = $checkbox.checked;

        if (isHeader) {
          _this.checkAll(checked);
        } else {
          _this.checkRow(rowIndex, checked);
        }
      });
    }
  }, {
    key: 'refreshRows',
    value: function refreshRows() {
      this.instance.renderBody();
      this.instance.setDimensions();
    }
  }, {
    key: 'refreshRow',
    value: function refreshRow(row, rowIndex) {
      var _this2 = this;

      var _row = this.datamanager.updateRow(row, rowIndex);

      _row.forEach(function (cell) {
        _this2.cellmanager.refreshCell(cell);
      });
    }
  }, {
    key: 'getCheckedRows',
    value: function getCheckedRows() {
      if (!this.checkMap) {
        return [];
      }

      return this.checkMap.map(function (c, rowIndex) {
        if (c) {
          return rowIndex;
        }
        return null;
      }).filter(function (c) {
        return c !== null || c !== undefined;
      });
    }
  }, {
    key: 'highlightCheckedRows',
    value: function highlightCheckedRows() {
      var _this3 = this;

      this.getCheckedRows().map(function (rowIndex) {
        return _this3.checkRow(rowIndex, true);
      });
    }
  }, {
    key: 'checkRow',
    value: function checkRow(rowIndex, toggle) {
      var value = toggle ? 1 : 0;

      // update internal map
      this.checkMap[rowIndex] = value;
      // set checkbox value explicitly
      _dom2.default.each('.data-table-col[data-row-index="' + rowIndex + '"][data-col-index="0"] [type="checkbox"]', this.bodyScrollable).map(function (input) {
        input.checked = toggle;
      });
      // highlight row
      this.highlightRow(rowIndex, toggle);
    }
  }, {
    key: 'checkAll',
    value: function checkAll(toggle) {
      var value = toggle ? 1 : 0;

      // update internal map
      if (toggle) {
        this.checkMap = Array.from(Array(this.getTotalRows())).map(function (c) {
          return value;
        });
      } else {
        this.checkMap = [];
      }
      // set checkbox value
      _dom2.default.each('.data-table-col[data-col-index="0"] [type="checkbox"]', this.bodyScrollable).map(function (input) {
        input.checked = toggle;
      });
      // highlight all
      this.highlightAll(toggle);
    }
  }, {
    key: 'highlightRow',
    value: function highlightRow(rowIndex) {
      var toggle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var $row = this.getRow$(rowIndex);
      if (!$row) return;

      if (!toggle && this.bodyScrollable.classList.contains('row-highlight-all')) {
        $row.classList.add('row-unhighlight');
        return;
      }

      if (toggle && $row.classList.contains('row-unhighlight')) {
        $row.classList.remove('row-unhighlight');
      }

      this._highlightedRows = this._highlightedRows || {};

      if (toggle) {
        $row.classList.add('row-highlight');
        this._highlightedRows[rowIndex] = $row;
      } else {
        $row.classList.remove('row-highlight');
        delete this._highlightedRows[rowIndex];
      }
    }
  }, {
    key: 'highlightAll',
    value: function highlightAll() {
      var toggle = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (toggle) {
        this.bodyScrollable.classList.add('row-highlight-all');
      } else {
        this.bodyScrollable.classList.remove('row-highlight-all');
        for (var rowIndex in this._highlightedRows) {
          var $row = this._highlightedRows[rowIndex];
          $row.classList.remove('row-highlight');
        }
        this._highlightedRows = {};
      }
    }
  }, {
    key: 'getRow$',
    value: function getRow$(rowIndex) {
      return (0, _dom2.default)('.data-table-row[data-row-index="' + rowIndex + '"]', this.bodyScrollable);
    }
  }, {
    key: 'getTotalRows',
    value: function getTotalRows() {
      return this.datamanager.getRowCount();
    }
  }, {
    key: 'getFirstRowIndex',
    value: function getFirstRowIndex() {
      return 0;
    }
  }, {
    key: 'getLastRowIndex',
    value: function getLastRowIndex() {
      return this.datamanager.getRowCount() - 1;
    }
  }, {
    key: 'scrollToRow',
    value: function scrollToRow(rowIndex) {
      rowIndex = +rowIndex;
      this._lastScrollTo = this._lastScrollTo || 0;
      var $row = this.getRow$(rowIndex);
      if (_dom2.default.inViewport($row, this.bodyScrollable)) return;

      var _$row$getBoundingClie = $row.getBoundingClientRect(),
          height = _$row$getBoundingClie.height;

      var _bodyScrollable$getBo = this.bodyScrollable.getBoundingClientRect(),
          top = _bodyScrollable$getBo.top,
          bottom = _bodyScrollable$getBo.bottom;

      var rowsInView = Math.floor((bottom - top) / height);

      var offset = 0;
      if (rowIndex > this._lastScrollTo) {
        offset = height * (rowIndex + 1 - rowsInView);
      } else {
        offset = height * (rowIndex + 1 - 1);
      }

      this._lastScrollTo = rowIndex;
      _dom2.default.scrollTop(this.bodyScrollable, offset);
    }
  }, {
    key: 'datamanager',
    get: function get() {
      return this.instance.datamanager;
    }
  }, {
    key: 'cellmanager',
    get: function get() {
      return this.instance.cellmanager;
    }
  }]);

  return RowManager;
}();

exports.default = RowManager;
function getRowHTML(columns, props) {
  var dataAttr = (0, _utils.makeDataAttributeString)(props);

  return '\n    <tr class="data-table-row" ' + dataAttr + '>\n      ' + columns.map(_cellmanager.getCellHTML).join('') + '\n    </tr>\n  ';
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getCellHTML = getCellHTML;
exports.getCellContent = getCellContent;
exports.getEditCellHTML = getEditCellHTML;

var _utils = __webpack_require__(1);

var _keyboard = __webpack_require__(4);

var _keyboard2 = _interopRequireDefault(_keyboard);

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

var _columnmanager = __webpack_require__(5);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CellManager = function () {
  function CellManager(instance) {
    _classCallCheck(this, CellManager);

    this.instance = instance;
    this.wrapper = this.instance.wrapper;
    this.options = this.instance.options;
    this.style = this.instance.style;
    this.bodyScrollable = this.instance.bodyScrollable;
    this.columnmanager = this.instance.columnmanager;
    this.rowmanager = this.instance.rowmanager;
    this.datamanager = this.instance.datamanager;

    this.bindEvents();
  }

  _createClass(CellManager, [{
    key: 'bindEvents',
    value: function bindEvents() {
      this.bindFocusCell();
      this.bindEditCell();
      this.bindKeyboardSelection();
      this.bindCopyCellContents();
      this.bindMouseEvents();
    }
  }, {
    key: 'bindFocusCell',
    value: function bindFocusCell() {
      this.bindKeyboardNav();
    }
  }, {
    key: 'bindEditCell',
    value: function bindEditCell() {
      var _this = this;

      this.$editingCell = null;

      _dom2.default.on(this.bodyScrollable, 'dblclick', '.data-table-col', function (e, cell) {
        _this.activateEditing(cell);
      });

      _keyboard2.default.on('enter', function (e) {
        if (_this.$focusedCell && !_this.$editingCell) {
          // enter keypress on focused cell
          _this.activateEditing(_this.$focusedCell);
        } else if (_this.$editingCell) {
          // enter keypress on editing cell
          _this.submitEditing();
          _this.deactivateEditing();
        }
      });

      _dom2.default.on(this.bodyScrollable, 'blur', 'input', function (e, input) {
        var cell = input.closest('.data-table-col');
        if (_this.$editingCell === cell) {
          _this.submitEditing();
          _this.deactivateEditing();
        }
      });

      // $.on(document.body, 'click', e => {
      //   if (e.target.matches('.edit-cell, .edit-cell *')) return;
      //   this.deactivateEditing();
      // });
    }
  }, {
    key: 'bindKeyboardNav',
    value: function bindKeyboardNav() {
      var _this2 = this;

      var focusCell = function focusCell(direction) {
        if (!_this2.$focusedCell || _this2.$editingCell) {
          return false;
        }

        var $cell = _this2.$focusedCell;

        if (direction === 'left') {
          $cell = _this2.getLeftCell$($cell);
        } else if (direction === 'right') {
          $cell = _this2.getRightCell$($cell);
        } else if (direction === 'up') {
          $cell = _this2.getAboveCell$($cell);
        } else if (direction === 'down') {
          $cell = _this2.getBelowCell$($cell);
        }

        _this2.focusCell($cell);
        return true;
      };

      var focusLastCell = function focusLastCell(direction) {
        if (!_this2.$focusedCell || _this2.$editingCell) {
          return false;
        }

        var $cell = _this2.$focusedCell;

        var _$$data = _dom2.default.data($cell),
            rowIndex = _$$data.rowIndex,
            colIndex = _$$data.colIndex;

        if (direction === 'left') {
          $cell = _this2.getLeftMostCell$(rowIndex);
        } else if (direction === 'right') {
          $cell = _this2.getRightMostCell$(rowIndex);
        } else if (direction === 'up') {
          $cell = _this2.getTopMostCell$(colIndex);
        } else if (direction === 'down') {
          $cell = _this2.getBottomMostCell$(colIndex);
        }

        _this2.focusCell($cell);
        return true;
      };

      ['left', 'right', 'up', 'down'].map(function (direction) {
        return _keyboard2.default.on(direction, function () {
          return focusCell(direction);
        });
      });

      ['left', 'right', 'up', 'down'].map(function (direction) {
        return _keyboard2.default.on('ctrl+' + direction, function () {
          return focusLastCell(direction);
        });
      });

      _keyboard2.default.on('esc', function () {
        _this2.deactivateEditing();
      });
    }
  }, {
    key: 'bindKeyboardSelection',
    value: function bindKeyboardSelection() {
      var _this3 = this;

      var getNextSelectionCursor = function getNextSelectionCursor(direction) {
        var $selectionCursor = _this3.getSelectionCursor();

        if (direction === 'left') {
          $selectionCursor = _this3.getLeftCell$($selectionCursor);
        } else if (direction === 'right') {
          $selectionCursor = _this3.getRightCell$($selectionCursor);
        } else if (direction === 'up') {
          $selectionCursor = _this3.getAboveCell$($selectionCursor);
        } else if (direction === 'down') {
          $selectionCursor = _this3.getBelowCell$($selectionCursor);
        }

        return $selectionCursor;
      };

      ['left', 'right', 'up', 'down'].map(function (direction) {
        return _keyboard2.default.on('shift+' + direction, function () {
          return _this3.selectArea(getNextSelectionCursor(direction));
        });
      });
    }
  }, {
    key: 'bindCopyCellContents',
    value: function bindCopyCellContents() {
      var _this4 = this;

      _keyboard2.default.on('ctrl+c', function () {
        _this4.copyCellContents(_this4.$focusedCell, _this4.$selectionCursor);
      });
    }
  }, {
    key: 'bindMouseEvents',
    value: function bindMouseEvents() {
      var _this5 = this;

      var mouseDown = null;

      _dom2.default.on(this.bodyScrollable, 'mousedown', '.data-table-col', function (e) {
        mouseDown = true;
        _this5.focusCell((0, _dom2.default)(e.delegatedTarget));
      });

      _dom2.default.on(this.bodyScrollable, 'mouseup', function () {
        mouseDown = false;
      });

      var selectArea = function selectArea(e) {
        if (!mouseDown) return;
        _this5.selectArea((0, _dom2.default)(e.delegatedTarget));
      };

      _dom2.default.on(this.bodyScrollable, 'mousemove', '.data-table-col', (0, _utils.throttle)(selectArea, 50));
    }
  }, {
    key: 'focusCell',
    value: function focusCell($cell) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$skipClearSelecti = _ref.skipClearSelection,
          skipClearSelection = _ref$skipClearSelecti === undefined ? 0 : _ref$skipClearSelecti;

      if (!$cell) return;

      // don't focus if already editing cell
      if ($cell === this.$editingCell) return;

      var _$$data2 = _dom2.default.data($cell),
          colIndex = _$$data2.colIndex,
          isHeader = _$$data2.isHeader;

      if (isHeader) {
        return;
      }

      var column = this.columnmanager.getColumn(colIndex);
      if (column.focusable === false) {
        return;
      }

      this.deactivateEditing();
      if (!skipClearSelection) {
        this.clearSelection();
      }

      if (this.$focusedCell) {
        this.$focusedCell.classList.remove('selected');
      }

      this.$focusedCell = $cell;
      $cell.classList.add('selected');

      this.highlightRowColumnHeader($cell);
      this.scrollToCell($cell);
    }
  }, {
    key: 'highlightRowColumnHeader',
    value: function highlightRowColumnHeader($cell) {
      var _$$data3 = _dom2.default.data($cell),
          colIndex = _$$data3.colIndex,
          rowIndex = _$$data3.rowIndex;

      var _colIndex = this.datamanager.getColumnIndexById('_rowIndex');
      var colHeaderSelector = '.data-table-header .data-table-col[data-col-index="' + colIndex + '"]';
      var rowHeaderSelector = '.data-table-col[data-row-index="' + rowIndex + '"][data-col-index="' + _colIndex + '"]';

      if (this.lastHeaders) {
        _dom2.default.removeStyle(this.lastHeaders, 'backgroundColor');
      }

      var colHeader = (0, _dom2.default)(colHeaderSelector, this.wrapper);
      var rowHeader = (0, _dom2.default)(rowHeaderSelector, this.wrapper);

      _dom2.default.style([colHeader, rowHeader], {
        backgroundColor: '#f5f7fa' // light-bg
      });

      this.lastHeaders = [colHeader, rowHeader];
    }
  }, {
    key: 'selectAreaOnClusterChanged',
    value: function selectAreaOnClusterChanged() {
      if (!(this.$focusedCell && this.$selectionCursor)) return;

      var _$$data4 = _dom2.default.data(this.$selectionCursor),
          colIndex = _$$data4.colIndex,
          rowIndex = _$$data4.rowIndex;

      var $cell = this.getCell$(colIndex, rowIndex);

      if (!$cell || $cell === this.$selectionCursor) return;

      // selectArea needs $focusedCell
      var fCell = _dom2.default.data(this.$focusedCell);
      this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);

      this.selectArea($cell);
    }
  }, {
    key: 'focusCellOnClusterChanged',
    value: function focusCellOnClusterChanged() {
      if (!this.$focusedCell) return;

      var _$$data5 = _dom2.default.data(this.$focusedCell),
          colIndex = _$$data5.colIndex,
          rowIndex = _$$data5.rowIndex;

      var $cell = this.getCell$(colIndex, rowIndex);

      if (!$cell) return;
      // this function is called after selectAreaOnClusterChanged,
      // focusCell calls clearSelection which resets the area selection
      // so a flag to skip it
      this.focusCell($cell, { skipClearSelection: 1 });
    }
  }, {
    key: 'selectArea',
    value: function selectArea($selectionCursor) {
      if (!this.$focusedCell) return;

      if (this._selectArea(this.$focusedCell, $selectionCursor)) {
        // valid selection
        this.$selectionCursor = $selectionCursor;
      }
    }
  }, {
    key: '_selectArea',
    value: function _selectArea($cell1, $cell2) {
      var _this6 = this;

      if ($cell1 === $cell2) return false;

      var cells = this.getCellsInRange($cell1, $cell2);
      if (!cells) return false;

      this.clearSelection();
      cells.map(function (index) {
        return _this6.getCell$.apply(_this6, _toConsumableArray(index));
      }).map(function ($cell) {
        return $cell.classList.add('highlight');
      });
      return true;
    }
  }, {
    key: 'getCellsInRange',
    value: function getCellsInRange($cell1, $cell2) {
      var colIndex1 = void 0,
          rowIndex1 = void 0,
          colIndex2 = void 0,
          rowIndex2 = void 0;

      if (typeof $cell1 === 'number') {
        var _arguments = Array.prototype.slice.call(arguments);

        colIndex1 = _arguments[0];
        rowIndex1 = _arguments[1];
        colIndex2 = _arguments[2];
        rowIndex2 = _arguments[3];
      } else if ((typeof $cell1 === 'undefined' ? 'undefined' : _typeof($cell1)) === 'object') {

        if (!($cell1 && $cell2)) {
          return false;
        }

        var cell1 = _dom2.default.data($cell1);
        var cell2 = _dom2.default.data($cell2);

        colIndex1 = cell1.colIndex;
        rowIndex1 = cell1.rowIndex;
        colIndex2 = cell2.colIndex;
        rowIndex2 = cell2.rowIndex;
      }

      if (rowIndex1 > rowIndex2) {
        var _ref2 = [rowIndex2, rowIndex1];
        rowIndex1 = _ref2[0];
        rowIndex2 = _ref2[1];
      }

      if (colIndex1 > colIndex2) {
        var _ref3 = [colIndex2, colIndex1];
        colIndex1 = _ref3[0];
        colIndex2 = _ref3[1];
      }

      if (this.isStandardCell(colIndex1) || this.isStandardCell(colIndex2)) {
        return false;
      }

      var cells = [];
      var colIndex = colIndex1;
      var rowIndex = rowIndex1;
      var rowIndices = [];

      while (rowIndex <= rowIndex2) {
        rowIndices.push(rowIndex);
        rowIndex++;
      }

      rowIndices.map(function (rowIndex) {
        while (colIndex <= colIndex2) {
          cells.push([colIndex, rowIndex]);
          colIndex++;
        }
        colIndex = colIndex1;
      });

      return cells;
    }
  }, {
    key: 'clearSelection',
    value: function clearSelection() {
      _dom2.default.each('.data-table-col.highlight', this.bodyScrollable).map(function (cell) {
        return cell.classList.remove('highlight');
      });

      this.$selectionCursor = null;
    }
  }, {
    key: 'getSelectionCursor',
    value: function getSelectionCursor() {
      return this.$selectionCursor || this.$focusedCell;
    }
  }, {
    key: 'activateEditing',
    value: function activateEditing($cell) {
      var _$$data6 = _dom2.default.data($cell),
          rowIndex = _$$data6.rowIndex,
          colIndex = _$$data6.colIndex;

      var col = this.columnmanager.getColumn(colIndex);
      if (col && (col.editable === false || col.focusable === false)) {
        return;
      }

      var cell = this.getCell(colIndex, rowIndex);
      if (cell && cell.editable === false) {
        return;
      }

      if (this.$editingCell) {
        var _$$data7 = _dom2.default.data(this.$editingCell),
            _rowIndex = _$$data7._rowIndex,
            _colIndex = _$$data7._colIndex;

        if (rowIndex === _rowIndex && colIndex === _colIndex) {
          // editing the same cell
          return;
        }
      }

      this.$editingCell = $cell;
      $cell.classList.add('editing');

      var $editCell = (0, _dom2.default)('.edit-cell', $cell);
      $editCell.innerHTML = '';

      var editing = this.getEditingObject(colIndex, rowIndex, cell.content, $editCell);

      if (editing) {
        this.currentCellEditing = editing;
        // initialize editing input with cell value
        editing.initValue(cell.content, rowIndex, col);
      }
    }
  }, {
    key: 'deactivateEditing',
    value: function deactivateEditing() {
      if (!this.$editingCell) return;
      this.$editingCell.classList.remove('editing');
      this.$editingCell = null;
    }
  }, {
    key: 'getEditingObject',
    value: function getEditingObject(colIndex, rowIndex, value, parent) {
      // debugger;
      var obj = this.options.editing(colIndex, rowIndex, value, parent);
      if (obj && obj.setValue) return obj;

      // editing fallback
      var $input = _dom2.default.create('input', {
        type: 'text',
        inside: parent
      });

      return {
        initValue: function initValue(value) {
          $input.focus();
          $input.value = value;
        },
        getValue: function getValue() {
          return $input.value;
        },
        setValue: function setValue(value) {
          $input.value = value;
        }
      };
    }
  }, {
    key: 'submitEditing',
    value: function submitEditing() {
      var _this7 = this;

      if (!this.$editingCell) return;
      var $cell = this.$editingCell;

      var _$$data8 = _dom2.default.data($cell),
          rowIndex = _$$data8.rowIndex,
          colIndex = _$$data8.colIndex;

      var col = this.datamanager.getColumn(colIndex);

      if ($cell) {
        var editing = this.currentCellEditing;

        if (editing) {
          var value = editing.getValue();
          var done = editing.setValue(value, rowIndex, col);
          var oldValue = this.getCell(colIndex, rowIndex).content;

          // update cell immediately
          this.updateCell(colIndex, rowIndex, value);
          $cell.focus();

          if (done && done.then) {
            // revert to oldValue if promise fails
            done.catch(function (e) {
              console.log(e);
              _this7.updateCell(colIndex, rowIndex, oldValue);
            });
          }
        }
      }

      this.currentCellEditing = null;
    }
  }, {
    key: 'copyCellContents',
    value: function copyCellContents($cell1, $cell2) {
      var _this8 = this;

      if (!$cell2 && $cell1) {
        // copy only focusedCell
        var _$$data9 = _dom2.default.data($cell1),
            colIndex = _$$data9.colIndex,
            rowIndex = _$$data9.rowIndex;

        var cell = this.getCell(colIndex, rowIndex);
        (0, _utils.copyTextToClipboard)(cell.content);
        return;
      }
      var cells = this.getCellsInRange($cell1, $cell2);

      if (!cells) return;

      var values = cells
      // get cell objects
      .map(function (index) {
        return _this8.getCell.apply(_this8, _toConsumableArray(index));
      })
      // convert to array of rows
      .reduce(function (acc, curr) {
        var rowIndex = curr.rowIndex;

        acc[rowIndex] = acc[rowIndex] || [];
        acc[rowIndex].push(curr.content);

        return acc;
      }, [])
      // join values by tab
      .map(function (row) {
        return row.join('\t');
      })
      // join rows by newline
      .join('\n');

      (0, _utils.copyTextToClipboard)(values);
    }
  }, {
    key: 'updateCell',
    value: function updateCell(colIndex, rowIndex, value) {
      var cell = this.datamanager.updateCell(colIndex, rowIndex, {
        content: value
      });
      this.refreshCell(cell);
    }
  }, {
    key: 'refreshCell',
    value: function refreshCell(cell) {
      var $cell = (0, _dom2.default)(cellSelector(cell.colIndex, cell.rowIndex), this.bodyScrollable);
      $cell.innerHTML = getCellContent(cell);
    }
  }, {
    key: 'isStandardCell',
    value: function isStandardCell(colIndex) {
      // Standard cells are in Sr. No and Checkbox column
      return colIndex < this.columnmanager.getFirstColumnIndex();
    }
  }, {
    key: 'getCell$',
    value: function getCell$(colIndex, rowIndex) {
      return (0, _dom2.default)(cellSelector(colIndex, rowIndex), this.bodyScrollable);
    }
  }, {
    key: 'getAboveCell$',
    value: function getAboveCell$($cell) {
      var _$$data10 = _dom2.default.data($cell),
          colIndex = _$$data10.colIndex;

      var $aboveRow = $cell.parentElement.previousElementSibling;

      return (0, _dom2.default)('[data-col-index="' + colIndex + '"]', $aboveRow);
    }
  }, {
    key: 'getBelowCell$',
    value: function getBelowCell$($cell) {
      var _$$data11 = _dom2.default.data($cell),
          colIndex = _$$data11.colIndex;

      var $belowRow = $cell.parentElement.nextElementSibling;

      return (0, _dom2.default)('[data-col-index="' + colIndex + '"]', $belowRow);
    }
  }, {
    key: 'getLeftCell$',
    value: function getLeftCell$($cell) {
      return $cell.previousElementSibling;
    }
  }, {
    key: 'getRightCell$',
    value: function getRightCell$($cell) {
      return $cell.nextElementSibling;
    }
  }, {
    key: 'getLeftMostCell$',
    value: function getLeftMostCell$(rowIndex) {
      return this.getCell$(this.columnmanager.getFirstColumnIndex(), rowIndex);
    }
  }, {
    key: 'getRightMostCell$',
    value: function getRightMostCell$(rowIndex) {
      return this.getCell$(this.columnmanager.getLastColumnIndex(), rowIndex);
    }
  }, {
    key: 'getTopMostCell$',
    value: function getTopMostCell$(colIndex) {
      return this.getCell$(colIndex, this.rowmanager.getFirstRowIndex());
    }
  }, {
    key: 'getBottomMostCell$',
    value: function getBottomMostCell$(colIndex) {
      return this.getCell$(colIndex, this.rowmanager.getLastRowIndex());
    }
  }, {
    key: 'getCell',
    value: function getCell(colIndex, rowIndex) {
      return this.instance.datamanager.getCell(colIndex, rowIndex);
    }
  }, {
    key: 'getCellAttr',
    value: function getCellAttr($cell) {
      return this.instance.getCellAttr($cell);
    }
  }, {
    key: 'getRowHeight',
    value: function getRowHeight() {
      return _dom2.default.style((0, _dom2.default)('.data-table-row', this.bodyScrollable), 'height');
    }
  }, {
    key: 'scrollToCell',
    value: function scrollToCell($cell) {
      if (_dom2.default.inViewport($cell, this.bodyScrollable)) return false;

      var _$$data12 = _dom2.default.data($cell),
          rowIndex = _$$data12.rowIndex;

      this.rowmanager.scrollToRow(rowIndex);
      return false;
    }
  }, {
    key: 'getRowCountPerPage',
    value: function getRowCountPerPage() {
      return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
    }
  }]);

  return CellManager;
}();

exports.default = CellManager;
function getCellHTML(column) {
  var rowIndex = column.rowIndex,
      colIndex = column.colIndex,
      isHeader = column.isHeader;

  var dataAttr = (0, _utils.makeDataAttributeString)({
    rowIndex: rowIndex,
    colIndex: colIndex,
    isHeader: isHeader
  });

  return '\n    <td class="data-table-col noselect" ' + dataAttr + ' tabindex="0">\n      ' + getCellContent(column) + '\n    </td>\n  ';
}

function getCellContent(column) {
  var isHeader = column.isHeader;


  var editable = !isHeader && column.editable !== false;
  var editCellHTML = editable ? getEditCellHTML() : '';

  var sortable = isHeader && column.sortable !== false;
  var sortIndicator = sortable ? '<span class="sort-indicator"></span>' : '';

  var resizable = isHeader && column.resizable !== false;
  var resizeColumn = resizable ? '<span class="column-resizer"></span>' : '';

  var hasDropdown = isHeader && column.dropdown !== false;
  var dropdown = hasDropdown ? '<div class="data-table-dropdown">' + (0, _columnmanager.getDropdownHTML)() + '</div>' : '';

  return '\n    <div class="content ellipsis">\n      ' + (!column.isHeader && column.format ? column.format(column.content) : column.content) + '\n      ' + sortIndicator + '\n      ' + resizeColumn + '\n      ' + dropdown + '\n    </div>\n    ' + editCellHTML + '\n  ';
}

function getEditCellHTML() {
  return '\n    <div class="edit-cell"></div>\n  ';
}

function cellSelector(colIndex, rowIndex) {
  return '.data-table-col[data-col-index="' + colIndex + '"][data-row-index="' + rowIndex + '"]';
}

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEYCODES = {
  13: 'enter',
  91: 'meta',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  9: 'tab',
  27: 'esc',
  67: 'c'
};

var initDone = false;
var handlers = {};

function bind(dom) {
  if (initDone) return;
  _dom2.default.on(dom, 'keydown', handler);
  initDone = true;
}

function handler(e) {
  var key = KEYCODES[e.keyCode];

  if (e.shiftKey && key !== 'shift') {
    key = 'shift+' + key;
  }

  if (e.ctrlKey && key !== 'ctrl' || e.metaKey && key !== 'meta') {
    key = 'ctrl+' + key;
  }

  var _handlers = handlers[key];

  if (_handlers && _handlers.length > 0) {
    _handlers.map(function (handler) {
      var preventBubbling = handler();

      if (preventBubbling === undefined || preventBubbling === true) {
        e.preventDefault();
      }
    });
  }
}

exports.default = {
  init: function init(dom) {
    bind(dom);
  },
  on: function on(key, handler) {
    var keys = key.split(',').map(function (k) {
      return k.trim();
    });

    keys.map(function (key) {
      handlers[key] = handlers[key] || [];
      handlers[key].push(handler);
    });
  }
};
module.exports = exports['default'];

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDropdownHTML = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

var _sortablejs = __webpack_require__(9);

var _sortablejs2 = _interopRequireDefault(_sortablejs);

var _rowmanager = __webpack_require__(2);

var _utils = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ColumnManager = function () {
  function ColumnManager(instance) {
    _classCallCheck(this, ColumnManager);

    this.instance = instance;
    this.options = this.instance.options;
    this.fireEvent = this.instance.fireEvent;
    this.header = this.instance.header;
    this.datamanager = this.instance.datamanager;
    this.style = this.instance.style;
    this.wrapper = this.instance.wrapper;
    this.rowmanager = this.instance.rowmanager;

    this.bindEvents();
    exports.getDropdownHTML = getDropdownHTML = getDropdownHTML.bind(this, this.options.dropdownButton);
  }

  _createClass(ColumnManager, [{
    key: 'renderHeader',
    value: function renderHeader() {
      this.header.innerHTML = '<thead></thead>';
      this.refreshHeader();
    }
  }, {
    key: 'refreshHeader',
    value: function refreshHeader() {
      var _this = this;

      var columns = this.datamanager.getColumns();

      if (!(0, _dom2.default)('.data-table-col', this.header)) {
        // insert html
        (0, _dom2.default)('thead', this.header).innerHTML = (0, _rowmanager.getRowHTML)(columns, { isHeader: 1 });
      } else {
        // refresh dom state
        var $cols = _dom2.default.each('.data-table-col', this.header);
        if (columns.length < $cols.length) {
          // deleted column
          (0, _dom2.default)('thead', this.header).innerHTML = (0, _rowmanager.getRowHTML)(columns, { isHeader: 1 });
          return;
        }

        $cols.map(function ($col, i) {
          var column = columns[i];
          // column sorted or order changed
          // update colIndex of each header cell
          _dom2.default.data($col, {
            colIndex: column.colIndex
          });

          // refresh sort indicator
          var sortIndicator = (0, _dom2.default)('.sort-indicator', $col);
          if (sortIndicator) {
            sortIndicator.innerHTML = _this.options.sortIndicator[column.sortOrder];
          }
        });
      }
      // reset columnMap
      this.$columnMap = [];
    }
  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      this.bindDropdown();
      this.bindResizeColumn();
      this.bindMoveColumn();
    }
  }, {
    key: 'bindDropdown',
    value: function bindDropdown() {
      var _this2 = this;

      var $activeDropdown = void 0;
      _dom2.default.on(this.header, 'click', '.data-table-dropdown-toggle', function (e, $button) {
        var $dropdown = _dom2.default.closest('.data-table-dropdown', $button);

        if (!$dropdown.classList.contains('is-active')) {
          deactivateDropdown();
          $dropdown.classList.add('is-active');
          $activeDropdown = $dropdown;
        } else {
          deactivateDropdown();
        }
      });

      _dom2.default.on(document.body, 'click', function (e) {
        if (e.target.matches('.data-table-dropdown-toggle')) return;
        deactivateDropdown();
      });

      var dropdownItems = this.options.headerDropdown;

      _dom2.default.on(this.header, 'click', '.data-table-dropdown-list > div', function (e, $item) {
        var $col = _dom2.default.closest('.data-table-col', $item);

        var _$$data = _dom2.default.data($item),
            index = _$$data.index;

        var _$$data2 = _dom2.default.data($col),
            colIndex = _$$data2.colIndex;

        var callback = dropdownItems[index].action;

        callback && callback.call(_this2.instance, _this2.getColumn(colIndex));
      });

      function deactivateDropdown(e) {
        $activeDropdown && $activeDropdown.classList.remove('is-active');
        $activeDropdown = null;
      }
    }
  }, {
    key: 'bindResizeColumn',
    value: function bindResizeColumn() {
      var _this3 = this;

      var isDragging = false;
      var $resizingCell = void 0,
          startWidth = void 0,
          startX = void 0;

      _dom2.default.on(this.header, 'mousedown', '.data-table-col .column-resizer', function (e, $handle) {
        document.body.classList.add('data-table-resize');
        var $cell = $handle.parentNode.parentNode;
        $resizingCell = $cell;

        var _$$data3 = _dom2.default.data($resizingCell),
            colIndex = _$$data3.colIndex;

        var col = _this3.getColumn(colIndex);

        if (col && col.resizable === false) {
          return;
        }

        isDragging = true;
        startWidth = _dom2.default.style((0, _dom2.default)('.content', $resizingCell), 'width');
        startX = e.pageX;
      });

      _dom2.default.on(document.body, 'mouseup', function (e) {
        document.body.classList.remove('data-table-resize');
        if (!$resizingCell) return;
        isDragging = false;

        var _$$data4 = _dom2.default.data($resizingCell),
            colIndex = _$$data4.colIndex;

        _this3.setColumnWidth(colIndex);
        _this3.instance.setBodyWidth();
        $resizingCell = null;
      });

      _dom2.default.on(document.body, 'mousemove', function (e) {
        if (!isDragging) return;
        var finalWidth = startWidth + (e.pageX - startX);

        var _$$data5 = _dom2.default.data($resizingCell),
            colIndex = _$$data5.colIndex;

        if (_this3.getColumnMinWidth(colIndex) > finalWidth) {
          // don't resize past minWidth
          return;
        }
        _this3.datamanager.updateColumn(colIndex, { width: finalWidth });
        _this3.setColumnHeaderWidth(colIndex);
      });
    }
  }, {
    key: 'bindMoveColumn',
    value: function bindMoveColumn() {
      var _this4 = this;

      var initialized = void 0;

      var initialize = function initialize() {
        if (initialized) {
          _dom2.default.off(document.body, 'mousemove', initialize);
          return;
        }
        var ready = (0, _dom2.default)('.data-table-col', _this4.header);
        if (!ready) return;

        var $parent = (0, _dom2.default)('.data-table-row', _this4.header);

        _this4.sortable = _sortablejs2.default.create($parent, {
          onEnd: function onEnd(e) {
            var oldIndex = e.oldIndex,
                newIndex = e.newIndex;

            var $draggedCell = e.item;

            var _$$data6 = _dom2.default.data($draggedCell),
                colIndex = _$$data6.colIndex;

            if (+colIndex === newIndex) return;

            _this4.switchColumn(oldIndex, newIndex);
          },
          preventOnFilter: false,
          filter: '.column-resizer, .data-table-dropdown',
          animation: 150
        });
      };

      _dom2.default.on(document.body, 'mousemove', initialize);
    }
  }, {
    key: 'bindSortColumn',
    value: function bindSortColumn() {
      var _this5 = this;

      _dom2.default.on(this.header, 'click', '.data-table-col .column-title', function (e, span) {
        var $cell = span.closest('.data-table-col');

        var _$$data7 = _dom2.default.data($cell),
            colIndex = _$$data7.colIndex,
            sortOrder = _$$data7.sortOrder;

        sortOrder = (0, _utils.getDefault)(sortOrder, 'none');
        var col = _this5.getColumn(colIndex);

        if (col && col.sortable === false) {
          return;
        }

        // reset sort indicator
        (0, _dom2.default)('.sort-indicator', _this5.header).textContent = '';
        _dom2.default.each('.data-table-col', _this5.header).map(function ($cell) {
          _dom2.default.data($cell, {
            sortOrder: 'none'
          });
        });

        var nextSortOrder = void 0,
            textContent = void 0;
        if (sortOrder === 'none') {
          nextSortOrder = 'asc';
          textContent = '▲';
        } else if (sortOrder === 'asc') {
          nextSortOrder = 'desc';
          textContent = '▼';
        } else if (sortOrder === 'desc') {
          nextSortOrder = 'none';
          textContent = '';
        }

        _dom2.default.data($cell, {
          sortOrder: nextSortOrder
        });
        (0, _dom2.default)('.sort-indicator', $cell).textContent = textContent;

        _this5.sortColumn(colIndex, nextSortOrder);
      });
    }
  }, {
    key: 'sortColumn',
    value: function sortColumn(colIndex, nextSortOrder) {
      var _this6 = this;

      this.instance.freeze();
      this.sortRows(colIndex, nextSortOrder).then(function () {
        _this6.refreshHeader();
        return _this6.rowmanager.refreshRows();
      }).then(function () {
        return _this6.instance.unfreeze();
      }).then(function () {
        _this6.fireEvent('onSortColumn', _this6.getColumn(colIndex));
      });
    }
  }, {
    key: 'removeColumn',
    value: function removeColumn(colIndex) {
      var _this7 = this;

      var removedCol = this.getColumn(colIndex);
      this.instance.freeze();
      this.datamanager.removeColumn(colIndex).then(function () {
        _this7.refreshHeader();
        return _this7.rowmanager.refreshRows();
      }).then(function () {
        return _this7.instance.unfreeze();
      }).then(function () {
        _this7.fireEvent('onRemoveColumn', removedCol);
      });
    }
  }, {
    key: 'switchColumn',
    value: function switchColumn(oldIndex, newIndex) {
      var _this8 = this;

      this.instance.freeze();
      this.datamanager.switchColumn(oldIndex, newIndex).then(function () {
        _this8.refreshHeader();
        return _this8.rowmanager.refreshRows();
      }).then(function () {
        _this8.setColumnWidth(oldIndex);
        _this8.setColumnWidth(newIndex);
        _this8.instance.unfreeze();
      }).then(function () {
        _this8.fireEvent('onSwitchColumn', _this8.getColumn(oldIndex), _this8.getColumn(newIndex));
      });
    }
  }, {
    key: 'setDimensions',
    value: function setDimensions() {
      this.setHeaderStyle();
      this.setupMinWidth();
      this.setupNaturalColumnWidth();
      this.distributeRemainingWidth();
      this.setColumnStyle();
    }
  }, {
    key: 'setHeaderStyle',
    value: function setHeaderStyle() {
      if (!this.options.takeAvailableSpace) {
        // setting width as 0 will ensure that the
        // header doesn't take the available space
        _dom2.default.style(this.header, {
          width: 0
        });
      }

      _dom2.default.style(this.header, {
        margin: 0
      });

      // don't show resize cursor on nonResizable columns
      var nonResizableColumnsSelector = this.datamanager.getColumns().filter(function (col) {
        return col.resizable === false;
      }).map(function (col) {
        return col.colIndex;
      }).map(function (i) {
        return '.data-table-header [data-col-index="' + i + '"]';
      }).join();

      this.style.setStyle(nonResizableColumnsSelector, {
        cursor: 'pointer'
      });
    }
  }, {
    key: 'setupMinWidth',
    value: function setupMinWidth() {
      var _this9 = this;

      _dom2.default.each('.data-table-col', this.header).map(function (col) {
        var width = _dom2.default.style((0, _dom2.default)('.content', col), 'width');

        var _$$data8 = _dom2.default.data(col),
            colIndex = _$$data8.colIndex;

        var column = _this9.getColumn(colIndex);

        if (!column.minWidth) {
          // only set this once
          _this9.datamanager.updateColumn(colIndex, { minWidth: width });
        }
      });
    }
  }, {
    key: 'setupNaturalColumnWidth',
    value: function setupNaturalColumnWidth() {
      var _this10 = this;

      // set initial width as naturally calculated by table's first row
      _dom2.default.each('.data-table-row[data-row-index="0"] .data-table-col', this.bodyScrollable).map(function ($cell) {
        var _$$data9 = _dom2.default.data($cell),
            colIndex = _$$data9.colIndex;

        if (_this10.getColumn(colIndex).width > 0) {
          // already set
          return;
        }

        var width = _dom2.default.style((0, _dom2.default)('.content', $cell), 'width');
        var minWidth = _this10.getColumnMinWidth(colIndex);

        if (width < minWidth) {
          width = minWidth;
        }
        _this10.datamanager.updateColumn(colIndex, { width: width });
      });
    }
  }, {
    key: 'distributeRemainingWidth',
    value: function distributeRemainingWidth() {
      var _this11 = this;

      if (!this.options.takeAvailableSpace) return;

      var wrapperWidth = _dom2.default.style(this.instance.datatableWrapper, 'width');
      var headerWidth = _dom2.default.style(this.header, 'width');

      if (headerWidth >= wrapperWidth) {
        // don't resize, horizontal scroll takes place
        return;
      }

      var resizableColumns = this.datamanager.getColumns().filter(function (col) {
        return col.resizable === undefined || col.resizable;
      });

      var deltaWidth = (wrapperWidth - headerWidth) / resizableColumns.length;

      resizableColumns.map(function (col) {
        var width = _dom2.default.style(_this11.getColumnHeaderElement(col.colIndex), 'width');
        var finalWidth = Math.min(width + deltaWidth) - 2;

        _this11.datamanager.updateColumn(col.colIndex, { width: finalWidth });
      });
    }
  }, {
    key: 'setDefaultCellHeight',
    value: function setDefaultCellHeight(height) {
      this.style.setStyle('.data-table-col .content', {
        height: height + 'px'
      });
      this.style.setStyle('.data-table-col .edit-cell', {
        height: height + 'px'
      });
    }
  }, {
    key: 'setColumnStyle',
    value: function setColumnStyle() {
      var _this12 = this;

      // align columns
      this.getColumns().map(function (column) {
        // alignment
        if (['left', 'center', 'right'].includes(column.align)) {
          _this12.style.setStyle('[data-col-index="' + column.colIndex + '"]', {
            'text-align': column.align
          });
        }
        // width
        _this12.setColumnHeaderWidth(column.colIndex);
        _this12.setColumnWidth(column.colIndex);
      });
      this.instance.setBodyWidth();
      this.setDefaultCellHeight(_dom2.default.style(this.instance.datatableWrapper.querySelector('.data-table-col'), 'height'));
    }
  }, {
    key: 'sortRows',
    value: function sortRows(colIndex, sortOrder) {
      return this.datamanager.sortRows(colIndex, sortOrder);
    }
  }, {
    key: 'getColumn',
    value: function getColumn(colIndex) {
      return this.datamanager.getColumn(colIndex);
    }
  }, {
    key: 'getColumns',
    value: function getColumns() {
      return this.datamanager.getColumns();
    }
  }, {
    key: 'setColumnWidth',
    value: function setColumnWidth(colIndex) {
      colIndex = +colIndex;
      this._columnWidthMap = this._columnWidthMap || [];

      var _getColumn = this.getColumn(colIndex),
          width = _getColumn.width;

      var index = this._columnWidthMap[colIndex];
      var selector = '[data-col-index="' + colIndex + '"] .content, [data-col-index="' + colIndex + '"] .edit-cell';
      var styles = {
        width: width + 'px'
      };

      index = this.style.setStyle(selector, styles, index);
      this._columnWidthMap[colIndex] = index;
    }
  }, {
    key: 'setColumnHeaderWidth',
    value: function setColumnHeaderWidth(colIndex) {
      colIndex = +colIndex;
      this.$columnMap = this.$columnMap || [];
      var selector = '[data-col-index="' + colIndex + '"][data-is-header] .content';

      var _getColumn2 = this.getColumn(colIndex),
          width = _getColumn2.width;

      var $column = this.$columnMap[colIndex];
      if (!$column) {
        $column = this.header.querySelector(selector);
        this.$columnMap[colIndex] = $column;
      }

      $column.style.width = width + 'px';
    }
  }, {
    key: 'getColumnMinWidth',
    value: function getColumnMinWidth(colIndex) {
      colIndex = +colIndex;
      return this.getColumn(colIndex).minWidth || 24;
    }
  }, {
    key: 'getFirstColumnIndex',
    value: function getFirstColumnIndex() {
      if (this.options.addCheckboxColumn && this.options.addSerialNoColumn) {
        return 2;
      }

      if (this.options.addCheckboxColumn || this.options.addSerialNoColumn) {
        return 1;
      }

      return 0;
    }
  }, {
    key: 'getHeaderCell$',
    value: function getHeaderCell$(colIndex) {
      return (0, _dom2.default)('.data-table-col[data-col-index="' + colIndex + '"]', this.header);
    }
  }, {
    key: 'getLastColumnIndex',
    value: function getLastColumnIndex() {
      return this.datamanager.getColumnCount() - 1;
    }
  }, {
    key: 'getColumnHeaderElement',
    value: function getColumnHeaderElement(colIndex) {
      colIndex = +colIndex;
      if (colIndex < 0) return null;
      return (0, _dom2.default)('.data-table-col[data-is-header][data-col-index="' + colIndex + '"]', this.wrapper);
    }
  }, {
    key: 'getSerialColumnIndex',
    value: function getSerialColumnIndex() {
      var columns = this.datamanager.getColumns();

      return columns.findIndex(function (column) {
        return column.content.includes('Sr. No');
      });
    }
  }]);

  return ColumnManager;
}();

// eslint-disable-next-line


exports.default = ColumnManager;
var getDropdownHTML = function getDropdownHTML() {
  var dropdownButton = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'v';

  // add dropdown buttons
  var dropdownItems = this.options.headerDropdown;

  return '<div class="data-table-dropdown-toggle">' + dropdownButton + '</div>\n    <div class="data-table-dropdown-list">\n      ' + dropdownItems.map(function (d, i) {
    return '<div data-index="' + i + '">' + d.label + '</div>';
  }).join('') + '\n    </div>\n  ';
};

exports.getDropdownHTML = getDropdownHTML;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _datatable = __webpack_require__(7);

var _datatable2 = _interopRequireDefault(_datatable);

var _package = __webpack_require__(19);

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_datatable2.default.__version__ = _package2.default.version;

exports.default = _datatable2.default;
module.exports = exports['default'];

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

var _datamanager = __webpack_require__(8);

var _datamanager2 = _interopRequireDefault(_datamanager);

var _cellmanager = __webpack_require__(3);

var _cellmanager2 = _interopRequireDefault(_cellmanager);

var _columnmanager = __webpack_require__(5);

var _columnmanager2 = _interopRequireDefault(_columnmanager);

var _rowmanager = __webpack_require__(2);

var _rowmanager2 = _interopRequireDefault(_rowmanager);

var _bodyRenderer = __webpack_require__(10);

var _bodyRenderer2 = _interopRequireDefault(_bodyRenderer);

var _style = __webpack_require__(12);

var _style2 = _interopRequireDefault(_style);

var _keyboard = __webpack_require__(4);

var _keyboard2 = _interopRequireDefault(_keyboard);

var _defaults = __webpack_require__(13);

var _defaults2 = _interopRequireDefault(_defaults);

__webpack_require__(14);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataTable = function () {
  function DataTable(wrapper, options) {
    _classCallCheck(this, DataTable);

    DataTable.instances++;

    if (typeof wrapper === 'string') {
      // css selector
      wrapper = document.querySelector(wrapper);
    }
    this.wrapper = wrapper;
    if (!(this.wrapper instanceof HTMLElement)) {
      throw new Error('Invalid argument given for `wrapper`');
    }

    this.options = Object.assign({}, _defaults2.default, options);
    this.options.headerDropdown = _defaults2.default.headerDropdown.concat(options.headerDropdown || []);
    // custom user events
    this.events = Object.assign({}, _defaults2.default.events, options.events || {});
    this.fireEvent = this.fireEvent.bind(this);

    this.prepare();

    this.style = new _style2.default(this);
    this.datamanager = new _datamanager2.default(this.options);
    this.rowmanager = new _rowmanager2.default(this);
    this.columnmanager = new _columnmanager2.default(this);
    this.cellmanager = new _cellmanager2.default(this);
    this.bodyRenderer = new _bodyRenderer2.default(this);

    _keyboard2.default.init(this.wrapper);

    if (this.options.data) {
      this.refresh();
    }
  }

  _createClass(DataTable, [{
    key: 'prepare',
    value: function prepare() {
      this.prepareDom();
      this.unfreeze();
    }
  }, {
    key: 'prepareDom',
    value: function prepareDom() {
      this.wrapper.innerHTML = '\n      <div class="data-table">\n        <table class="data-table-header">\n        </table>\n        <div class="body-scrollable">\n        </div>\n        <div class="freeze-container">\n          <span>' + this.options.freezeMessage + '</span>\n        </div>\n        <div class="data-table-footer">\n        </div>\n      </div>\n    ';

      this.datatableWrapper = (0, _dom2.default)('.data-table', this.wrapper);
      this.header = (0, _dom2.default)('.data-table-header', this.wrapper);
      this.bodyScrollable = (0, _dom2.default)('.body-scrollable', this.wrapper);
      this.freezeContainer = (0, _dom2.default)('.freeze-container', this.wrapper);
    }
  }, {
    key: 'refresh',
    value: function refresh(data) {
      this.datamanager.init(data);
      this.render();
      this.setDimensions();
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.wrapper.innerHTML = '';
      this.style.destroy();
    }
  }, {
    key: 'appendRows',
    value: function appendRows(rows) {
      this.datamanager.appendRows(rows);
      this.rowmanager.refreshRows();
    }
  }, {
    key: 'refreshRow',
    value: function refreshRow(row, rowIndex) {
      this.rowmanager.refreshRow(row, rowIndex);
    }
  }, {
    key: 'render',
    value: function render() {
      this.renderHeader();
      this.renderBody();
    }
  }, {
    key: 'renderHeader',
    value: function renderHeader() {
      this.columnmanager.renderHeader();
    }
  }, {
    key: 'renderBody',
    value: function renderBody() {
      this.bodyRenderer.render();
    }
  }, {
    key: 'setDimensions',
    value: function setDimensions() {
      this.columnmanager.setDimensions();

      this.setBodyWidth();

      _dom2.default.style(this.bodyScrollable, {
        marginTop: _dom2.default.style(this.header, 'height') + 'px'
      });

      _dom2.default.style((0, _dom2.default)('table', this.bodyScrollable), {
        margin: 0
      });
    }
  }, {
    key: 'setBodyWidth',
    value: function setBodyWidth() {
      var width = _dom2.default.style(this.header, 'width');

      _dom2.default.style(this.bodyScrollable, { width: width + 'px' });
    }
  }, {
    key: 'getColumn',
    value: function getColumn(colIndex) {
      return this.datamanager.getColumn(colIndex);
    }
  }, {
    key: 'getCell',
    value: function getCell(colIndex, rowIndex) {
      return this.datamanager.getCell(colIndex, rowIndex);
    }
  }, {
    key: 'getColumnHeaderElement',
    value: function getColumnHeaderElement(colIndex) {
      return this.columnmanager.getColumnHeaderElement(colIndex);
    }
  }, {
    key: 'getViewportHeight',
    value: function getViewportHeight() {
      if (!this.viewportHeight) {
        this.viewportHeight = _dom2.default.style(this.bodyScrollable, 'height');
      }

      return this.viewportHeight;
    }
  }, {
    key: 'sortColumn',
    value: function sortColumn(colIndex, sortOrder) {
      this.columnmanager.sortColumn(colIndex, sortOrder);
    }
  }, {
    key: 'removeColumn',
    value: function removeColumn(colIndex) {
      this.columnmanager.removeColumn(colIndex);
    }
  }, {
    key: 'scrollToLastColumn',
    value: function scrollToLastColumn() {
      this.datatableWrapper.scrollLeft = 9999;
    }
  }, {
    key: 'freeze',
    value: function freeze() {
      _dom2.default.style(this.freezeContainer, {
        display: ''
      });
    }
  }, {
    key: 'unfreeze',
    value: function unfreeze() {
      _dom2.default.style(this.freezeContainer, {
        display: 'none'
      });
    }
  }, {
    key: 'fireEvent',
    value: function fireEvent(eventName) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.events[eventName].apply(this, args);
    }
  }, {
    key: 'log',
    value: function log() {
      if (this.options.enableLogs) {
        console.log.apply(console, arguments);
      }
    }
  }]);

  return DataTable;
}();

DataTable.instances = 0;

exports.default = DataTable;
module.exports = exports['default'];

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataError = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = __webpack_require__(1);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _extendableBuiltin(cls) {
  function ExtendableBuiltin() {
    var instance = Reflect.construct(cls, Array.from(arguments));
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    return instance;
  }

  ExtendableBuiltin.prototype = Object.create(cls.prototype, {
    constructor: {
      value: cls,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ExtendableBuiltin, cls);
  } else {
    ExtendableBuiltin.__proto__ = cls;
  }

  return ExtendableBuiltin;
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataManager = function () {
  function DataManager(options) {
    _classCallCheck(this, DataManager);

    this.options = options;
    this.sortRows = (0, _utils.promisify)(this.sortRows, this);
    this.switchColumn = (0, _utils.promisify)(this.switchColumn, this);
    this.removeColumn = (0, _utils.promisify)(this.removeColumn, this);
  }

  _createClass(DataManager, [{
    key: 'init',
    value: function init(data) {
      if (!data) {
        data = this.options.data;
      }

      this.data = data;

      this.rowCount = 0;
      this.columns = [];
      this.rows = [];

      this.prepareColumns();
      this.prepareRows();

      this.prepareNumericColumns();
    }

    // computed property

  }, {
    key: 'prepareColumns',
    value: function prepareColumns() {
      var columns = this.options.columns;
      this.validateColumns(columns);

      if (this.options.addSerialNoColumn && !this.hasColumnById('_rowIndex')) {
        var val = {
          id: '_rowIndex',
          content: '',
          align: 'center',
          editable: false,
          resizable: true,
          focusable: false,
          dropdown: false
        };

        columns = [val].concat(columns);
      }

      if (this.options.addCheckboxColumn && !this.hasColumnById('_checkbox')) {
        var _val = {
          id: '_checkbox',
          content: 'Checkbox',
          editable: false,
          resizable: false,
          sortable: false,
          focusable: false,
          dropdown: false,
          format: function format(val) {
            return '<input type="checkbox" />';
          }
        };

        columns = [_val].concat(columns);
      }

      this.columns = _prepareColumns(columns);
    }
  }, {
    key: 'prepareNumericColumns',
    value: function prepareNumericColumns() {
      var row0 = this.getRow(0);
      if (!row0) return;
      this.columns = this.columns.map(function (column, i) {

        var cellValue = row0[i].content;
        if (!column.align && cellValue && (0, _utils.isNumeric)(cellValue)) {
          column.align = 'right';
        }

        return column;
      });
    }
  }, {
    key: 'prepareRows',
    value: function prepareRows() {
      var _this = this;

      this.validateRows(this.data);

      this.rows = this.data.map(function (d, i) {
        var index = _this._getNextRowCount();

        var row = [];

        if (Array.isArray(d)) {
          // row is an array
          if (_this.options.addSerialNoColumn) {
            row.push(index + 1 + '');
          }

          if (_this.options.addCheckboxColumn) {
            row.push(_this.getCheckboxHTML());
          }
          row = row.concat(d);
        } else {
          // row is a dict
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _this.columns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var col = _step.value;

              if (col.id === '_rowIndex') {
                row.push(index + 1 + '');
              } else if (col.id === '_checkbox') {
                row.push(_this.getCheckboxHTML());
              } else {
                row.push(col.format(d[col.id]));
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }

        return prepareRow(row, index);
      });
    }
  }, {
    key: 'validateColumns',
    value: function validateColumns(columns) {
      if (!Array.isArray(columns)) {
        throw new DataError('`columns` must be an array');
      }

      columns.forEach(function (column, i) {
        if (typeof column !== 'string' && (typeof column === 'undefined' ? 'undefined' : _typeof(column)) !== 'object') {
          throw new DataError('column "' + i + '" must be a string or an object');
        }
      });
    }
  }, {
    key: 'validateRows',
    value: function validateRows(rows) {
      if (!Array.isArray(rows)) {
        throw new DataError('`rows` must be an array');
      }
    }
  }, {
    key: 'appendRows',
    value: function appendRows(rows) {
      this.validateRows(rows);

      this.rows = this.rows.concat(this.prepareRows(rows));
    }
  }, {
    key: 'sortRows',
    value: function sortRows(colIndex) {
      var sortOrder = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'none';

      colIndex = +colIndex;

      // reset sortOrder and update for colIndex
      this.getColumns().map(function (col) {
        if (col.colIndex === colIndex) {
          col.sortOrder = sortOrder;
        } else {
          col.sortOrder = 'none';
        }
      });

      this._sortRows(colIndex, sortOrder);
    }
  }, {
    key: '_sortRows',
    value: function _sortRows(colIndex, sortOrder) {

      if (this.currentSort.colIndex === colIndex) {
        // reverse the array if only sortOrder changed
        if (this.currentSort.sortOrder === 'asc' && sortOrder === 'desc' || this.currentSort.sortOrder === 'desc' && sortOrder === 'asc') {
          this.reverseArray(this.rows);
          this.currentSort.sortOrder = sortOrder;
          return;
        }
      }

      this.rows.sort(function (a, b) {
        var _aIndex = a[0].rowIndex;
        var _bIndex = b[0].rowIndex;
        var _a = a[colIndex].content;
        var _b = b[colIndex].content;

        if (sortOrder === 'none') {
          return _aIndex - _bIndex;
        } else if (sortOrder === 'asc') {
          if (_a < _b) return -1;
          if (_a > _b) return 1;
          if (_a === _b) return 0;
        } else if (sortOrder === 'desc') {
          if (_a < _b) return 1;
          if (_a > _b) return -1;
          if (_a === _b) return 0;
        }
        return 0;
      });

      if (this.hasColumnById('_rowIndex')) {
        // update row index
        var srNoColIndex = this.getColumnIndexById('_rowIndex');
        this.rows = this.rows.map(function (row, index) {
          return row.map(function (cell) {
            if (cell.colIndex === srNoColIndex) {
              cell.content = index + 1 + '';
            }
            return cell;
          });
        });
      }
    }
  }, {
    key: 'reverseArray',
    value: function reverseArray(array) {
      var left = null;
      var right = null;
      var length = array.length;

      for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
        var temporary = array[left];

        array[left] = array[right];
        array[right] = temporary;
      }
    }
  }, {
    key: 'switchColumn',
    value: function switchColumn(index1, index2) {
      // update columns
      var temp = this.columns[index1];
      this.columns[index1] = this.columns[index2];
      this.columns[index2] = temp;

      this.columns[index1].colIndex = index1;
      this.columns[index2].colIndex = index2;

      // update rows
      this.rows = this.rows.map(function (row) {
        var newCell1 = Object.assign({}, row[index1], { colIndex: index2 });
        var newCell2 = Object.assign({}, row[index2], { colIndex: index1 });

        var newRow = row.map(function (cell) {
          // make object copy
          return Object.assign({}, cell);
        });

        newRow[index2] = newCell1;
        newRow[index1] = newCell2;

        return newRow;
      });
    }
  }, {
    key: 'removeColumn',
    value: function removeColumn(index) {
      index = +index;
      var filter = function filter(cell) {
        return cell.colIndex !== index;
      };
      var map = function map(cell, i) {
        return Object.assign({}, cell, { colIndex: i });
      };
      // update columns
      this.columns = this.columns.filter(filter).map(map);

      // update rows
      this.rows = this.rows.map(function (row) {
        var newRow = row.filter(filter).map(map);

        return newRow;
      });
    }
  }, {
    key: 'updateRow',
    value: function updateRow(row, rowIndex) {
      if (row.length < this.columns.length) {
        if (this.hasColumnById('_rowIndex')) {
          var val = rowIndex + 1 + '';

          row = [val].concat(row);
        }

        if (this.hasColumnById('_checkbox')) {
          var _val2 = '<input type="checkbox" />';

          row = [_val2].concat(row);
        }
      }

      var _row = prepareRow(row, rowIndex);
      var index = this.rows.findIndex(function (row) {
        return row[0].rowIndex === rowIndex;
      });
      this.rows[index] = _row;

      return _row;
    }
  }, {
    key: 'updateCell',
    value: function updateCell(colIndex, rowIndex, options) {
      var cell = void 0;
      if ((typeof colIndex === 'undefined' ? 'undefined' : _typeof(colIndex)) === 'object') {
        // cell object was passed,
        // must have colIndex, rowIndex
        cell = colIndex;
        colIndex = cell.colIndex;
        rowIndex = cell.rowIndex;
        // the object passed must be merged with original cell
        options = cell;
      }
      cell = this.getCell(colIndex, rowIndex);

      // mutate object directly
      for (var key in options) {
        var newVal = options[key];
        if (newVal !== undefined) {
          cell[key] = newVal;
        }
      }

      // update model
      if (!Array.isArray(this.data[rowIndex])) {
        var col = this.getColumn(colIndex);
        this.data[rowIndex][col.id] = options.content;
      }

      return cell;
    }
  }, {
    key: 'updateColumn',
    value: function updateColumn(colIndex, keyValPairs) {
      var column = this.getColumn(colIndex);
      for (var key in keyValPairs) {
        var newVal = keyValPairs[key];
        if (newVal !== undefined) {
          column[key] = newVal;
        }
      }
      return column;
    }
  }, {
    key: 'getRowCount',
    value: function getRowCount() {
      return this.rowCount;
    }
  }, {
    key: '_getNextRowCount',
    value: function _getNextRowCount() {
      var val = this.rowCount;

      this.rowCount++;
      return val;
    }
  }, {
    key: 'getRows',
    value: function getRows(start, end) {
      return this.rows.slice(start, end);
    }
  }, {
    key: 'getColumns',
    value: function getColumns(skipStandardColumns) {
      var columns = this.columns;

      if (skipStandardColumns) {
        columns = columns.slice(this.getStandardColumnCount());
      }

      return columns;
    }
  }, {
    key: 'getStandardColumnCount',
    value: function getStandardColumnCount() {
      if (this.options.addCheckboxColumn && this.options.addSerialNoColumn) {
        return 2;
      }

      if (this.options.addCheckboxColumn || this.options.addSerialNoColumn) {
        return 1;
      }

      return 0;
    }
  }, {
    key: 'getColumnCount',
    value: function getColumnCount(skipStandardColumns) {
      var val = this.columns.length;

      if (skipStandardColumns) {
        val = val - this.getStandardColumnCount();
      }

      return val;
    }
  }, {
    key: 'getColumn',
    value: function getColumn(colIndex) {
      colIndex = +colIndex;
      return this.columns.find(function (col) {
        return col.colIndex === colIndex;
      });
    }
  }, {
    key: 'getRow',
    value: function getRow(rowIndex) {
      rowIndex = +rowIndex;
      return this.rows.find(function (row) {
        return row[0].rowIndex === rowIndex;
      });
    }
  }, {
    key: 'getCell',
    value: function getCell(colIndex, rowIndex) {
      rowIndex = +rowIndex;
      colIndex = +colIndex;
      return this.rows.find(function (row) {
        return row[0].rowIndex === rowIndex;
      })[colIndex];
    }
  }, {
    key: 'get',
    value: function get() {
      return {
        columns: this.columns,
        rows: this.rows
      };
    }
  }, {
    key: 'hasColumn',
    value: function hasColumn(name) {
      return Boolean(this.columns.find(function (col) {
        return col.content === name;
      }));
    }
  }, {
    key: 'hasColumnById',
    value: function hasColumnById(id) {
      return Boolean(this.columns.find(function (col) {
        return col.id === id;
      }));
    }
  }, {
    key: 'getColumnIndex',
    value: function getColumnIndex(name) {
      return this.columns.findIndex(function (col) {
        return col.content === name;
      });
    }
  }, {
    key: 'getColumnIndexById',
    value: function getColumnIndexById(id) {
      return this.columns.findIndex(function (col) {
        return col.id === id;
      });
    }
  }, {
    key: 'getCheckboxHTML',
    value: function getCheckboxHTML() {
      return '<input type="checkbox" />';
    }
  }, {
    key: 'currentSort',
    get: function get() {
      var col = this.columns.find(function (col) {
        return col.sortOrder !== 'none';
      });
      return col || {
        colIndex: -1,
        sortOrder: 'none'
      };
    }
  }]);

  return DataManager;
}();

exports.default = DataManager;


function prepareRow(row, i) {
  var baseRowCell = {
    rowIndex: i
  };

  return row.map(prepareCell).map(function (cell) {
    return Object.assign({}, baseRowCell, cell);
  });
}

function _prepareColumns(columns) {
  var baseColumn = {
    isHeader: 1,
    editable: true,
    sortable: true,
    resizable: true,
    focusable: true,
    dropdown: true,
    format: function format(value) {
      return value + '';
    }
  };

  return columns.map(prepareCell).map(function (col) {
    return Object.assign({}, baseColumn, col);
  });
}

function prepareCell(col, i) {
  var baseCell = {
    content: '',
    align: 'left',
    sortOrder: 'none',
    colIndex: 0,
    width: 0
  };

  if (typeof col === 'string') {
    col = {
      content: col
    };
  }

  return Object.assign({}, baseCell, col, {
    colIndex: i
  });
}

// Custom Errors

var DataError = exports.DataError = function (_extendableBuiltin2) {
  _inherits(DataError, _extendableBuiltin2);

  function DataError() {
    _classCallCheck(this, DataError);

    return _possibleConstructorReturn(this, (DataError.__proto__ || Object.getPrototypeOf(DataError)).apply(this, arguments));
  }

  return DataError;
}(_extendableBuiltin(TypeError));



/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getBodyHTML = getBodyHTML;

var _dom = __webpack_require__(0);

var _dom2 = _interopRequireDefault(_dom);

var _clusterize = __webpack_require__(11);

var _clusterize2 = _interopRequireDefault(_clusterize);

var _rowmanager = __webpack_require__(2);

var _utils = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BodyRenderer = function () {
  function BodyRenderer(instance) {
    _classCallCheck(this, BodyRenderer);

    this.instance = instance;
    this.options = instance.options;
    this.datamanager = instance.datamanager;
    this.rowmanager = instance.rowmanager;
    this.cellmanager = instance.cellmanager;
    this.bodyScrollable = instance.bodyScrollable;
    this.log = instance.log;
    this.appendRemainingData = (0, _utils.promisify)(this.appendRemainingData, this);
  }

  _createClass(BodyRenderer, [{
    key: 'render',
    value: function render() {
      if (this.options.enableClusterize) {
        this.renderBodyWithClusterize();
      } else {
        this.renderBodyHTML();
      }
    }
  }, {
    key: 'renderBodyHTML',
    value: function renderBodyHTML() {
      var rows = this.datamanager.getRows();

      this.bodyScrollable.innerHTML = '\n      <table class="data-table-body">\n        ' + getBodyHTML(rows) + '\n      </table>\n    ';
      this.instance.setDimensions();
    }
  }, {
    key: 'renderBodyWithClusterize',
    value: function renderBodyWithClusterize() {
      var _this = this;

      // first page
      var rows = this.datamanager.getRows(0, 20);
      var initialData = this.getDataForClusterize(rows);

      if (!this.clusterize) {
        // empty body
        this.bodyScrollable.innerHTML = '\n        <table class="data-table-body">\n          ' + getBodyHTML([]) + '\n        </table>\n      ';

        // first 20 rows will appended
        // rest of them in nextTick
        this.clusterize = new _clusterize2.default({
          rows: initialData,
          scrollElem: this.bodyScrollable,
          contentElem: (0, _dom2.default)('tbody', this.bodyScrollable),
          callbacks: {
            clusterChanged: function clusterChanged() {
              _this.rowmanager.highlightCheckedRows();
              _this.cellmanager.selectAreaOnClusterChanged();
              _this.cellmanager.focusCellOnClusterChanged();
            }
          },
          /* eslint-disable */
          no_data_text: this.options.loadingText,
          no_data_class: 'empty-state'
          /* eslint-enable */
        });

        // setDimensions requires atleast 1 row to exist in dom
        this.instance.setDimensions();
      } else {
        this.clusterize.update(initialData);
      }

      this.appendRemainingData();
    }
  }, {
    key: 'appendRemainingData',
    value: function appendRemainingData() {
      var rows = this.datamanager.getRows(20);
      var data = this.getDataForClusterize(rows);
      this.clusterize.append(data);
    }
  }, {
    key: 'getDataForClusterize',
    value: function getDataForClusterize(rows) {
      return rows.map(function (row) {
        return (0, _rowmanager.getRowHTML)(row, { rowIndex: row[0].rowIndex });
      });
    }
  }]);

  return BodyRenderer;
}();

exports.default = BodyRenderer;


function getBodyHTML(rows) {
  return '\n    <tbody>\n      ' + rows.map(function (row) {
    return (0, _rowmanager.getRowHTML)(row, { rowIndex: row[0].rowIndex });
  }).join('') + '\n    </tbody>\n  ';
}

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_11__;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = __webpack_require__(1);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Style = function () {
  function Style(datatable) {
    _classCallCheck(this, Style);

    this.datatable = datatable;
    this.scopeClass = 'datatable-instance-' + datatable.constructor.instances;
    datatable.datatableWrapper.classList.add(this.scopeClass);

    var styleEl = document.createElement('style');
    datatable.wrapper.insertBefore(styleEl, datatable.datatableWrapper);
    this.styleEl = styleEl;
    this.styleSheet = styleEl.sheet;
  }

  _createClass(Style, [{
    key: 'destroy',
    value: function destroy() {
      this.styleEl.remove();
    }
  }, {
    key: 'setStyle',
    value: function setStyle(rule, styleMap) {
      var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -1;

      var styles = Object.keys(styleMap).map(function (prop) {
        if (!prop.includes('-')) {
          prop = (0, _utils.camelCaseToDash)(prop);
        }
        return prop + ':' + styleMap[prop] + ';';
      }).join('');
      var ruleString = '.' + this.scopeClass + ' ' + rule + ' { ' + styles + ' }';

      var _index = this.styleSheet.cssRules.length;
      if (index !== -1) {
        this.styleSheet.deleteRule(index);
        _index = index;
      }

      this.styleSheet.insertRule(ruleString, _index);
      return _index;
    }
  }]);

  return Style;
}();

exports.default = Style;
module.exports = exports['default'];

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  columns: [],
  data: [],
  dropdownButton: '▼',
  headerDropdown: [{
    label: 'Sort Ascending',
    action: function action(column) {
      this.sortColumn(column.colIndex, 'asc');
    }
  }, {
    label: 'Sort Descending',
    action: function action(column) {
      this.sortColumn(column.colIndex, 'desc');
    }
  }, {
    label: 'Reset sorting',
    action: function action(column) {
      this.sortColumn(column.colIndex, 'none');
    }
  }, {
    label: 'Remove column',
    action: function action(column) {
      this.removeColumn(column.colIndex);
    }
  }],
  events: {
    onRemoveColumn: function onRemoveColumn(column) {},
    onSwitchColumn: function onSwitchColumn(column1, column2) {},
    onSortColumn: function onSortColumn(column) {}
  },
  sortIndicator: {
    asc: '↑',
    desc: '↓',
    none: ''
  },
  freezeMessage: 'Loading...',
  editing: function editing() {},
  addSerialNoColumn: true,
  addCheckboxColumn: false,
  enableClusterize: true,
  enableLogs: false,
  takeAvailableSpace: false,
  loadingText: 'Loading...'
};
module.exports = exports['default'];

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(15);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {};
options.transform = transform;
// add the styles to the DOM
var update = __webpack_require__(17)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(16)(false);
// imports


// module
exports.push([module.i, "/* variables */\n/* resets */\n*, *::after, *::before {\n  box-sizing: border-box; }\n\n.data-table button, .data-table input {\n  overflow: visible;\n  font-family: inherit;\n  font-size: inherit;\n  line-height: inherit;\n  margin: 0;\n  padding: 0; }\n\n/* styling */\n.data-table * {\n  outline: none; }\n\n.data-table {\n  width: 100%;\n  position: relative;\n  overflow: auto; }\n  .data-table table {\n    border-collapse: collapse; }\n  .data-table table td {\n    padding: 0;\n    border: 1px solid #d1d8dd; }\n  .data-table thead td {\n    border-bottom-width: 1px; }\n  .data-table .freeze-container {\n    display: flex;\n    justify-content: center;\n    align-content: center;\n    position: absolute;\n    left: 0;\n    right: 0;\n    top: 0;\n    bottom: 0;\n    background-color: #f5f7fa;\n    opacity: 0.5;\n    font-size: 2em; }\n    .data-table .freeze-container span {\n      position: absolute;\n      top: 50%;\n      transform: translateY(-50%); }\n  .data-table .trash-container {\n    position: absolute;\n    bottom: 0;\n    left: 30%;\n    right: 30%;\n    height: 70px;\n    background: palevioletred;\n    opacity: 0.5; }\n\n.body-scrollable {\n  max-height: 500px;\n  overflow: auto;\n  border-bottom: 1px solid #d1d8dd; }\n  .body-scrollable.row-highlight-all .data-table-row:not(.row-unhighlight) {\n    background-color: #f5f7fa; }\n\n.data-table-header {\n  position: absolute;\n  top: 0;\n  left: 0;\n  background-color: white;\n  font-weight: bold; }\n  .data-table-header .content span:not(.column-resizer) {\n    cursor: pointer; }\n  .data-table-header .column-resizer {\n    display: none;\n    position: absolute;\n    right: 0;\n    top: 0;\n    width: 0.25rem;\n    height: 100%;\n    background-color: #5292f7;\n    cursor: col-resize; }\n  .data-table-header .data-table-dropdown {\n    position: absolute;\n    right: 10px;\n    display: inline-flex;\n    vertical-align: top;\n    text-align: left; }\n    .data-table-header .data-table-dropdown.is-active .data-table-dropdown-list {\n      display: block; }\n    .data-table-header .data-table-dropdown.is-active .data-table-dropdown-toggle {\n      display: block; }\n  .data-table-header .data-table-dropdown-toggle {\n    display: none;\n    background-color: transparent;\n    border: none; }\n  .data-table-header .data-table-dropdown-list {\n    display: none;\n    font-weight: normal;\n    position: absolute;\n    min-width: 8rem;\n    top: 100%;\n    right: 0;\n    z-index: 1;\n    background-color: white;\n    border-radius: 3px;\n    box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);\n    padding-bottom: 0.5rem;\n    padding-top: 0.5rem; }\n    .data-table-header .data-table-dropdown-list > div {\n      padding: 0.5rem 1rem; }\n      .data-table-header .data-table-dropdown-list > div:hover {\n        background-color: #f5f7fa; }\n  .data-table-header .data-table-col.remove-column {\n    background-color: #FD8B8B;\n    transition: 300ms background-color ease-in-out; }\n  .data-table-header .data-table-col.sortable-chosen {\n    background-color: #f5f7fa; }\n\n.data-table-col {\n  position: relative; }\n  .data-table-col .content {\n    padding: 0.25rem;\n    border: 2px solid transparent; }\n    .data-table-col .content.ellipsis {\n      text-overflow: ellipsis;\n      white-space: nowrap;\n      overflow: hidden; }\n  .data-table-col .edit-cell {\n    display: none;\n    padding: 0.25rem;\n    background: #fff;\n    z-index: 1;\n    height: 100%; }\n    .data-table-col .edit-cell input {\n      outline: none;\n      width: 100%;\n      border: none; }\n  .data-table-col.selected .content {\n    border: 2px solid #5292f7; }\n  .data-table-col.editing .content {\n    display: none; }\n  .data-table-col.editing .edit-cell {\n    border: 2px solid #5292f7;\n    display: block; }\n  .data-table-col.highlight {\n    background-color: #f5f7fa; }\n  .data-table-col:hover .column-resizer {\n    display: inline-block; }\n  .data-table-col:hover .data-table-dropdown-toggle {\n    display: block; }\n\n.data-table-row.row-highlight {\n  background-color: #f5f7fa; }\n\n.noselect {\n  -webkit-touch-callout: none;\n  -webkit-user-select: none;\n  -khtml-user-select: none;\n  -moz-user-select: none;\n  -ms-user-select: none;\n  user-select: none; }\n\nbody.data-table-resize {\n  cursor: col-resize; }\n", ""]);

// exports


/***/ }),
/* 16 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(18);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto);

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media);
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 18 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = {"name":"frappe-datatable","version":"0.0.1","description":"A modern datatable library for the web","main":"lib/frappe-datatable.js","scripts":{"start":"npm run dev","build":"webpack --env build","dev":"webpack --progress --colors --watch --env dev","test":"mocha --compilers js:babel-core/register --colors ./test/*.spec.js","test:watch":"mocha --compilers js:babel-core/register --colors -w ./test/*.spec.js"},"devDependencies":{"babel-cli":"6.24.1","babel-core":"6.24.1","babel-eslint":"7.2.3","babel-loader":"7.0.0","babel-plugin-add-module-exports":"0.2.1","babel-plugin-transform-builtin-extend":"^1.1.2","babel-preset-env":"^1.6.1","chai":"3.5.0","css-loader":"^0.28.7","eslint":"3.19.0","eslint-loader":"1.7.1","mocha":"3.3.0","node-sass":"^4.5.3","sass-loader":"^6.0.6","style-loader":"^0.18.2","webpack":"^3.1.0","yargs":"7.1.0"},"repository":{"type":"git","url":"https://github.com/frappe/datatable.git"},"keywords":["webpack","es6","starter","library","universal","umd","commonjs"],"author":"Faris Ansari","license":"MIT","bugs":{"url":"https://github.com/frappe/datatable/issues"},"homepage":"https://frappe.github.io/datatable","dependencies":{"clusterize.js":"^0.18.0","sortablejs":"^1.7.0"}};

/***/ })
/******/ ]);
});
//# sourceMappingURL=frappe-datatable.js.map
});

unwrapExports(frappeDatatable);

class TableControl extends base {
    make() {
        if (!this.datatable) {
            this.wrapper = frappejs.ui.add('div', 'datatable-wrapper', this.get_input_parent());
            this.datatable = new frappeDatatable(this.wrapper, {
                columns: this.get_columns(),
                data: this.get_table_data(),
                takeAvailableSpace: true,
                enableClusterize: true,
                editing: this.get_table_input.bind(this),

            });
            this.datatable.datatableWrapper.style = 'height: 300px';
        }
    }

    get_input_value() {
        return this.doc[this.fieldname];
    }

    set_input_value(value) {
        this.datatable.refresh(this.get_table_data(value));
    }

    get_table_data(value) {
        return value || this.get_default_data();
    }

    get_table_input(colIndex, rowIndex, value, parent) {
        let field = this.datatable.getColumn(colIndex).field;
        field.only_input = true;
        const control = controls$1.make_control({field: field, parent: parent});

		return {
			initValue: (value, rowIndex, column) => {
                control.parent_control = this;
                control.doc = this.doc[this.fieldname][rowIndex];
                control.set_focus();
				return control.set_input_value(value);
			},
			setValue: (value, rowIndex, column) => {
                return control.set_input_value(value);
			},
			getValue: () => {
				return control.get_input_value();
            }
        }
    }

    get_columns() {
        return this.get_child_fields().map(field => {
            return {
                id: field.fieldname,
                field: field,
                content: field.label,
                editable: true,
                width: 120,
                align: ['Int', 'Float', 'Currency'].includes(field.fieldtype) ? 'right' : 'left',
                format: (value) => frappejs.format(value, field)
            }
        });
    }

    get_child_fields() {
        return frappejs.get_meta(this.childtype).fields;
    }

    get_default_data() {
        // build flat table
        if (!this.doc) {
            return [];
        }
        if (!this.doc[this.fieldname]) {
            this.doc[this.fieldname] = [{}];
        }

        return this.doc[this.fieldname];
    }
}

var table = TableControl;

const control_classes = {
    Data: data,
    Text: text,
    Select: select,
    Link: link,
    Float: float_1,
    Currency: currency,
    Table: table
};

var controls$1 = {
    get_control_class(fieldtype) {
        return control_classes[fieldtype];
    },
    make_control({field, form, parent}) {
        const control_class = this.get_control_class(field.fieldtype);
        let control = new control_class({field:field, form:form, parent:parent});
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
        for(let field of this.meta.fields) {
            if (controls$1.get_control_class(field.fieldtype)) {
                let control = controls$1.make_control({field: field, form: this});
                this.controls_list.push(control);
                this.controls[field.fieldname] = control;
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
			if (this.form.doc.name && !(route && route[2] === this.form.doc.name)) {
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
var is_single = 0;
var keyword_fields = ["subject","description"];
var fields = [{"fieldname":"subject","label":"Subject","fieldtype":"Data","reqd":1},{"fieldname":"description","label":"Description","fieldtype":"Text"},{"fieldname":"status","label":"Status","fieldtype":"Select","options":["Open","Closed"],"default":"Open","reqd":1}];
var todo = {
	autoname: autoname,
	name: name,
	doctype: doctype,
	is_single: is_single,
	keyword_fields: keyword_fields,
	fields: fields
};

var todo$1 = Object.freeze({
	autoname: autoname,
	name: name,
	doctype: doctype,
	is_single: is_single,
	keyword_fields: keyword_fields,
	fields: fields,
	default: todo
});

var require$$0$4 = ( todo$1 && todo ) || todo$1;

class ToDoMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$4);
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
var is_single$1 = 0;
var keyword_fields$1 = ["name","account_type"];
var fields$1 = [{"fieldname":"name","label":"Account Name","fieldtype":"Data","reqd":1},{"fieldname":"parent_account","label":"Parent Account","fieldtype":"Link","target":"Account"},{"fieldname":"account_type","label":"Account Type","fieldtype":"Select","options":["Asset","Liability","Equity","Income","Expense"]}];
var account = {
	name: name$1,
	doctype: doctype$1,
	is_single: is_single$1,
	keyword_fields: keyword_fields$1,
	fields: fields$1
};

var account$1 = Object.freeze({
	name: name$1,
	doctype: doctype$1,
	is_single: is_single$1,
	keyword_fields: keyword_fields$1,
	fields: fields$1,
	default: account
});

var require$$0$5 = ( account$1 && account ) || account$1;

class AccountMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$5);
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
var is_single$2 = 0;
var keyword_fields$2 = ["name","description"];
var fields$2 = [{"fieldname":"name","label":"Item Name","fieldtype":"Data","reqd":1},{"fieldname":"description","label":"Description","fieldtype":"Text"},{"fieldname":"unit","label":"Unit","fieldtype":"Select","options":["No","Kg","Gram","Hour","Day"]},{"fieldname":"rate","label":"Rate","fieldtype":"Currency"}];
var item$1 = {
	name: name$2,
	doctype: doctype$2,
	is_single: is_single$2,
	keyword_fields: keyword_fields$2,
	fields: fields$2
};

var item$2 = Object.freeze({
	name: name$2,
	doctype: doctype$2,
	is_single: is_single$2,
	keyword_fields: keyword_fields$2,
	fields: fields$2,
	default: item$1
});

var require$$0$6 = ( item$2 && item$1 ) || item$2;

class ItemMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$6);
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
var is_single$3 = 0;
var istable = 0;
var keyword_fields$3 = ["name"];
var fields$3 = [{"fieldname":"name","label":"Name","fieldtype":"Data","reqd":1}];
var customer = {
	name: name$3,
	doctype: doctype$3,
	is_single: is_single$3,
	istable: istable,
	keyword_fields: keyword_fields$3,
	fields: fields$3
};

var customer$1 = Object.freeze({
	name: name$3,
	doctype: doctype$3,
	is_single: is_single$3,
	istable: istable,
	keyword_fields: keyword_fields$3,
	fields: fields$3,
	default: customer
});

var require$$0$7 = ( customer$1 && customer ) || customer$1;

class CustomerMeta extends meta {
    setup_meta() {
        Object.assign(this, require$$0$7);
    }
}

class Customer extends document$1 {
}

var customer$2 = {
    Document: Customer,
    Meta: CustomerMeta
};

var name$4 = "Invoice";
var doctype$4 = "DocType";
var is_single$4 = 0;
var istable$1 = 0;
var keyword_fields$4 = [];
var fields$4 = [{"fieldname":"customer","label":"Customer","fieldtype":"Link","target":"Customer","reqd":1},{"fieldname":"items","label":"Items","fieldtype":"Table","childtype":"Invoice Item","reqd":1},{"fieldname":"total","label":"Total","fieldtype":"Currency","formula":"doc.get_total()","reqd":1}];
var invoice = {
	name: name$4,
	doctype: doctype$4,
	is_single: is_single$4,
	istable: istable$1,
	keyword_fields: keyword_fields$4,
	fields: fields$4
};

var invoice$1 = Object.freeze({
	name: name$4,
	doctype: doctype$4,
	is_single: is_single$4,
	istable: istable$1,
	keyword_fields: keyword_fields$4,
	fields: fields$4,
	default: invoice
});

var require$$0$8 = ( invoice$1 && invoice ) || invoice$1;

class InvoiceMeta extends meta {
	setup_meta() {
		Object.assign(this, require$$0$8);
	}
}

class Invoice extends document$1 {
	setup() {
		this.add_handler('validate');
	}

	validate() {
		this.total = this.get_total();
	}

	get_total() {
		return this.items.map(d => (d.amount || 0)).reduce((a, b) => a + b, 0);
	}
}

var invoice$2 = {
	Document: Invoice,
	Meta: InvoiceMeta
};

var name$5 = "Invoice Item";
var doctype$5 = "DocType";
var is_single$5 = 0;
var is_child = 1;
var keyword_fields$5 = [];
var fields$5 = [{"fieldname":"item","label":"Item","fieldtype":"Link","target":"Item","reqd":1},{"fieldname":"description","label":"Description","fieldtype":"Text","fetch":"item.description","reqd":1},{"fieldname":"quantity","label":"Quantity","fieldtype":"Float","reqd":1},{"fieldname":"rate","label":"Rate","fieldtype":"Currency","reqd":1},{"fieldname":"amount","label":"Amount","fieldtype":"Currency","read_only":1,"formula":"doc.quantity * doc.rate"}];
var invoice_item = {
	name: name$5,
	doctype: doctype$5,
	is_single: is_single$5,
	is_child: is_child,
	keyword_fields: keyword_fields$5,
	fields: fields$5
};

var invoice_item$1 = Object.freeze({
	name: name$5,
	doctype: doctype$5,
	is_single: is_single$5,
	is_child: is_child,
	keyword_fields: keyword_fields$5,
	fields: fields$5,
	default: invoice_item
});

var require$$0$9 = ( invoice_item$1 && invoice_item ) || invoice_item$1;

class InvoiceItemMeta extends meta {
	setup_meta() {
		Object.assign(this, require$$0$9);
	}
}

class InvoiceItem extends document$1 {
}

var invoice_item$2 = {
	Document: InvoiceItem,
	Meta: InvoiceItemMeta
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
    frappe.modules.invoice = invoice$2;
    frappe.modules.invoice_item = invoice_item$2;

    frappe.modules.todo_client = todo_client;
    frappe.modules.account_client = account_client;

    frappe.desk.add_sidebar_item('ToDo', '#list/todo');
    frappe.desk.add_sidebar_item('Accounts', '#list/account');
    frappe.desk.add_sidebar_item('Items', '#list/item');
    frappe.desk.add_sidebar_item('Customers', '#list/customer');
    frappe.desk.add_sidebar_item('Invoice', '#list/invoice');

    frappe.router.default = '#list/todo';

    frappe.router.show(window.location.hash);
});

var src = false;

return src;

}());
