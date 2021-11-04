import models from '../models';
import server from 'frappejs/server';
import postStart from './postStart';

async function start() {
    await server.start({
        backend: 'sqlite',
        connectionParams: { dbPath: 'test.db', enableCORS: true },
        models
    })

    await postStart();
}

start();

export default {
    start
};