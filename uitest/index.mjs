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
  window.setDefaultTimeout(60_000);

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

  test('fill setup form', async (t) => {
    await window.getByTestId('create-new-file').click();
    await window.getByTestId('submit-button').waitFor();

    t.equal(
      await window.getByTestId('submit-button').isDisabled(),
      true,
      'submit button is disabled before form fill'
    );

    await window.getByPlaceholder('Company Name').fill('Test Company');
    await window.getByPlaceholder('John Doe').fill('Test Owner');
    await window.getByPlaceholder('john@doe.com').fill('test@example.com');
    await window.getByPlaceholder('Select Country').fill('India');
    await window.getByPlaceholder('Select Country').blur();
    await window.getByPlaceholder('Prime Bank').fill('Test Bank');
    await window.getByPlaceholder('Prime Bank').blur();

    t.equal(
      await window.getByTestId('submit-button').isDisabled(),
      false,
      'submit button enabled after form fill'
    );
  });

  test('create new instance', async (t) => {
    await window.getByTestId('submit-button').click();
    t.equal(
      await window.getByTestId('company-name').innerText(),
      'Test Company',
      'new instance created, company name found in sidebar'
    );
  });

  test('close app', async (t) => {
    await electronApp.close();
    t.ok(true, 'app closed without errors');
  });
})();
