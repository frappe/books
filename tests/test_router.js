const Router = require('frappe-core/common/router');
const assert = require('assert');

describe('Router', () => {
	it('router should sort static routes', () => {
		let router = new Router();
		router.add('/a', 'x');
		router.add('/a/b', 'y');
		router.add('/a/b/clong/', 'z');

		assert.equal(router.match('/a/b').handler, 'y');
		assert.equal(router.match('/a').handler, 'x');
		assert.equal(router.match('/a/b/clong/').handler, 'z');
	});

	it('router should sort dynamic routes', () => {
		let router = new Router();
		router.add('/edit/todo/mytest', 'static');
		router.add('/edit/:doctype/:name', 'all');
		router.add('/edit/todo/:name', 'todo');

		assert.equal(router.match('/edit/todo/test').handler, 'todo');
		assert.equal(router.match('/edit/user/test').handler, 'all');
		assert.equal(router.match('/edit/todo/mytest').handler, 'static');
	});


});