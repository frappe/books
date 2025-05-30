// eslint-disable-next-line
const { parentPort } = require('worker_threads');

if (parentPort) {
  // eslint-disable-next-line
  parentPort.postMessage({ type: 'trigger-erpnext-sync' });
}
