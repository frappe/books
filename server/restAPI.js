const frappe = require('frappejs');
const path = require('path');
const multer = require('multer');

module.exports = {
    setup(app) {
        // get list
        app.get('/api/resource/:doctype', frappe.asyncHandler(async function(request, response) {
            for (let key of ['fields', 'filters']) {
                if (request.query[key]) {
                    request.query[key] = JSON.parse(request.query[key]);
                }
            }

            let data = await frappe.db.getAll({
                doctype: request.params.doctype,
                fields: request.query.fields,
                filters: request.query.filters,
                start: request.query.start || 0,
                limit: request.query.limit || 20,
                order_by: request.query.order_by,
                order: request.query.order
            });

            return response.json(data);
        }));

        // create
        app.post('/api/resource/:doctype', frappe.asyncHandler(async function(request, response) {
            let data = request.body;
            data.doctype = request.params.doctype;
            let doc = frappe.newDoc(data);
            await doc.insert();
            await frappe.db.commit();
            return response.json(doc.getValidDict());
        }));

        // update
        app.put('/api/resource/:doctype/:name', frappe.asyncHandler(async function(request, response) {
            let data = request.body;
            let doc = await frappe.getDoc(request.params.doctype, request.params.name);
            Object.assign(doc, data);
            await doc.update();
            await frappe.db.commit();
            return response.json(doc.getValidDict());
        }));

        const upload = multer({
          storage: multer.diskStorage({
            destination: (req, file, cb) => {
              cb(null, frappe.conf.staticPath)
            },
            filename: (req, file, cb) => {
              const filename = file.originalname.split('.')[0];
              const extension = path.extname(file.originalname);
              const now = Date.now();
              cb(null, filename + '-' + now + extension);
            }
          })
        });

        app.post('/api/upload/:doctype/:name/:fieldname', upload.array('files', 10), frappe.asyncHandler(async function(request, response) {
          const files = request.files;
          const { doctype, name, fieldname } = request.params;

          let fileDocs = [];
          for (let file of files) {
            const doc = frappe.newDoc({
              doctype: 'File',
              name: path.join('/', file.path),
              filename: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              referenceDoctype: doctype,
              referenceName: name,
              referenceFieldname: fieldname
            });
            await doc.insert();

            await frappe.db.setValue(doctype, name, fieldname, doc.name);

            fileDocs.push(doc.getValidDict());
          }

          return response.json(fileDocs);
        }));

        // get document
        app.get('/api/resource/:doctype/:name', frappe.asyncHandler(async function(request, response) {
            let doc = await frappe.getDoc(request.params.doctype, request.params.name);
            return response.json(doc.getValidDict());
        }));

        // get value
        app.get('/api/resource/:doctype/:name/:fieldname', frappe.asyncHandler(async function(request, response) {
            let value = await frappe.db.getValue(request.params.doctype, request.params.name, request.params.fieldname);
            return response.json({value: value});
        }));

        // delete
        app.delete('/api/resource/:doctype/:name', frappe.asyncHandler(async function(request, response) {
            let doc = await frappe.getDoc(request.params.doctype, request.params.name)
            await doc.delete();
            return response.json({});
        }));

        // delete many
        app.delete('/api/resource/:doctype', frappe.asyncHandler(async function(request, response) {
            let names = request.body;
            for (let name of names) {
                let doc = await frappe.getDoc(request.params.doctype, name);
                await doc.delete();
            }
            return response.json({});
        }));
    }
};
