const Router = require('frappejs/common/router');
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
        router.add('/edit/:doctype', 'catch');
        router.add('/edit/:doctype/:name', 'all');
        router.add('/edit/ToDo/:name', 'ToDo');
        router.add('/edit/ToDo/mytest', 'static');

        assert.equal(router.match('/edit/ToDo/test').handler, 'ToDo');
        assert.equal(router.match('/edit/user/test').handler, 'all');
        assert.equal(router.match('/edit/ToDo/mytest').handler, 'static');
        assert.equal(router.match('/edit/user').handler, 'catch');
    });


});