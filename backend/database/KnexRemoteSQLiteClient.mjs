import KnexBetterSqlite3Client from 'knex/lib/dialects/better-sqlite3';
import fetch from 'node-fetch';

class SQLiteServerClient extends KnexBetterSqlite3Client {
  async acquireRawConnection() {
    return new this.driver(':memory:');
  }

  async _query(_, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const response = await fetch(this.connectionSettings.filename, {
      method: 'POST',
      body: JSON.stringify(obj),
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  }
}

export default SQLiteServerClient;
