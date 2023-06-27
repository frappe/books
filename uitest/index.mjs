import path from 'path';
import { _electron } from 'playwright';
import { fileURLToPath } from 'url';
import test from 'tape';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..');
const appSourcePath = path.join(root, 'dist_electron', 'build', 'main.js');

(async function run() {
  const electronApp = await _electron.launch({ args: [appSourcePath] });
  const window = await electronApp.firstWindow();

  test('load app', async (t) => {
    t.equal(await window.title(), 'Frappe Books', 'title matches');

    await new Promise((r) => window.once('load', () => r()));
    t.ok(true, 'window has loaded');
  });

  test('navigate to database selector', async (t) => {
    /**
     * When running on local, Frappe Books will open
     * the last selected database.
     */
    const changeDb = window.getByTestId('change-db');
    const createNew = window.getByTestId('create-new-file');

    const changeDbPromise = changeDb
      .waitFor({ state: 'visible' })
      .then(() => 'change-db');
    const createNewPromise = createNew
      .waitFor({ state: 'visible' })
      .then(() => 'create-new-file');

    const el = await Promise.race([changeDbPromise, createNewPromise]);
    if (el === 'change-db') {
      await changeDb.click();
      await createNewPromise;
    }

    t.ok(await createNew.isVisible(), 'create new is visible');
  });

  test('create new instance', async (t) => {
    // await window.getByTestId('create-new-file').click();
    t.ok(true, '...');
  });

  test('close app', async (t) => {
    await electronApp.close();
    t.ok(true, 'app closed without errors');
  });
})();
