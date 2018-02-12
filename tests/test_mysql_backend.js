const server = require('frappejs/server');
server.start({
    backend: 'mysql',
    connection_params: {
	host     : "test_frappejs",
        username : "test_frappejs",
        password : "test_frappejs",
        db_name  : "test_frappejs"
    }
});
