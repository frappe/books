const assert = require('assert');
const frappe = require('frappejs');
const helpers = require('./helpers');

describe('Database CRUD', () => {
  before(async function() {
    await helpers.initSqlite();
  });

  beforeEach(async () => {
    await frappe.db.sql('delete from todo');

    await frappe.insert({
      doctype: 'ToDo',
      subject: 'testing 1',
      status: 'Open'
    });
    await frappe.insert({
      doctype: 'ToDo',
      subject: 'testing 3',
      status: 'Open'
    });
    await frappe.insert({
      doctype: 'ToDo',
      subject: 'testing 2',
      status: 'Closed'
    });
  });

  it('should insert and get values', async () => {
    let subjects = await frappe.db.getAll({
      doctype: 'ToDo',
      fields: ['name', 'subject']
    });
    subjects = subjects.map(d => d.subject);

    assert.ok(subjects.includes('testing 1'));
    assert.ok(subjects.includes('testing 2'));
    assert.ok(subjects.includes('testing 3'));
  });

  it('should filter correct values', async () => {
    let todos = await frappe.db.getAll({
      doctype: 'ToDo',
      fields: ['name', 'subject'],
      filters: { status: 'Open' }
    });
    let subjects = todos.map(d => d.subject);

    assert.ok(subjects.includes('testing 1'));
    assert.ok(subjects.includes('testing 3'));
    assert.equal(subjects.includes('testing 2'), false);

    todos = await frappe.db.getAll({
      doctype: 'ToDo',
      fields: ['name', 'subject'],
      filters: { status: 'Closed' }
    });
    subjects = todos.map(d => d.subject);

    assert.equal(subjects.includes('testing 1'), false);
    assert.equal(subjects.includes('testing 3'), false);
    assert.ok(subjects.includes('testing 2'));
  });

  it('should delete records', async () => {
    let todos = await frappe.db.getAll({ doctype: 'ToDo' });
    frappe.db.delete('ToDo', todos[0].name);

    todos = await frappe.db.getAll({ doctype: 'ToDo' });
    assert.equal(todos.length, 2);
  });

  it('should update records', async () => {
    let todo = (await frappe.db.getAll({ doctype: 'ToDo', limit: 1 }))[0];

    frappe.db.update('ToDo', {
      name: todo.name,
      subject: 'updated subject'
    });

    todo = (
      await frappe.db.getAll({
        doctype: 'ToDo',
        fields: ['subject'],
        filters: { name: todo.name }
      })
    )[0];

    assert.equal(todo.subject, 'updated subject');
  });
});
