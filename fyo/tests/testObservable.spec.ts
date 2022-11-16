import { strictEqual } from 'assert';
import { assertThrows } from 'backend/database/tests/helpers';
import Observable from 'fyo/utils/observable';
import test from 'tape';

enum ObsEvent {
  A = 'event-a',
  B = 'event-b',
}

const obs = new Observable();
let counter = 0;
const params = { aOne: 18, aTwo: 21, b: 42 };

const listenerAOnce = (value: number) => {
  strictEqual(params.aOne, value, 'listenerAOnce');
};

const listenerAEvery = (value: number) => {
  if (counter === 0) {
    strictEqual(params.aOne, value, 'listenerAEvery 0');
  } else if (counter === 1) {
    strictEqual(params.aTwo, value, 'listenerAEvery 1');
  } else {
    throw new Error("this shouldn't run");
  }
  counter += 1;
};

const listenerBOnce = (value: number) => {
  strictEqual(params.b, value, 'listenerBOnce');
};

test('set A One', (t) => {
  t.equal(obs.hasListener(ObsEvent.A), false, 'pre');

  obs.once(ObsEvent.A, listenerAOnce);
  t.equal(obs.hasListener(ObsEvent.A), true, 'non specific');
  t.equal(obs.hasListener(ObsEvent.A, listenerAOnce), true, 'specific once');
  t.equal(obs.hasListener(ObsEvent.A, listenerAEvery), false, 'specific every');
  t.end();
});

test('set A Two', (t) => {
  obs.on(ObsEvent.A, listenerAEvery);
  t.equal(obs.hasListener(ObsEvent.A), true, 'non specific');
  t.equal(obs.hasListener(ObsEvent.A, listenerAOnce), true, 'specific once');
  t.equal(obs.hasListener(ObsEvent.A, listenerAEvery), true, 'specific every');
  t.end();
});

test('set B', (t) => {
  t.equal(obs.hasListener(ObsEvent.B), false, 'pre');

  obs.once(ObsEvent.B, listenerBOnce);
  t.equal(obs.hasListener(ObsEvent.A, listenerBOnce), false, 'specific false');
  t.equal(obs.hasListener(ObsEvent.B, listenerBOnce), true, 'specific true');
  t.end();
});

test('trigger A 0', async (t) => {
  await obs.trigger(ObsEvent.A, params.aOne);
  t.equal(obs.hasListener(ObsEvent.A), true, 'non specific');
  t.equal(obs.hasListener(ObsEvent.A, listenerAOnce), false, 'specific');
});

test('trigger A 1', async (t) => {
  t.equal(obs.hasListener(ObsEvent.A, listenerAEvery), true, 'specific pre');
  await obs.trigger(ObsEvent.A, params.aTwo);
  t.equal(obs.hasListener(ObsEvent.A, listenerAEvery), true, 'specific post');
});

test('trigger B', async (t) => {
  t.equal(obs.hasListener(ObsEvent.B, listenerBOnce), true, 'specific pre');
  await obs.trigger(ObsEvent.B, params.b);
  t.equal(obs.hasListener(ObsEvent.B, listenerBOnce), false, 'specific post');
});

test('remove A', async (t) => {
  obs.off(ObsEvent.A, listenerAEvery);
  t.equal(obs.hasListener(ObsEvent.A, listenerAEvery), false, 'specific pre');

  t.equal(counter, 2, 'incorrect counter');
  await obs.trigger(ObsEvent.A, 777);
});

test('observable trigger error propagation', async (t) => {
  const obs = new Observable();
  obs.on('testOne', () => {
    throw new Error('stuff');
  });

  await assertThrows(async () => {
    await obs.trigger('testOne');
    t.ok(false, 'trigger should throw error');
  });

  t.ok(true, 'assert throws success');
});
