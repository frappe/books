import * as assert from 'assert';
import Observable from 'fyo/utils/observable';
import 'mocha';

enum ObsEvent {
  A = 'event-a',
  B = 'event-b',
}

describe('Observable', function () {
  const obs = new Observable();
  let counter = 0;
  const params = { aOne: 18, aTwo: 21, b: 42 };

  const listenerAOnce = (value: number) => {
    assert.strictEqual(params.aOne, value, 'listenerAOnce');
  };

  const listenerAEvery = (value: number) => {
    if (counter === 0) {
      assert.strictEqual(params.aOne, value, 'listenerAEvery 0');
    } else if (counter === 1) {
      assert.strictEqual(params.aTwo, value, 'listenerAEvery 1');
    } else {
      throw new Error("this shouldn't run");
    }
    counter += 1;
  };

  const listenerBOnce = (value: number) => {
    assert.strictEqual(params.b, value, 'listenerBOnce');
  };

  specify('set A One', function () {
    assert.strictEqual(obs.hasListener(ObsEvent.A), false, 'pre');

    obs.once(ObsEvent.A, listenerAOnce);
    assert.strictEqual(obs.hasListener(ObsEvent.A), true, 'non specific');
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAOnce),
      true,
      'specific once'
    );
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAEvery),
      false,
      'specific every'
    );
  });

  specify('set A Two', function () {
    obs.on(ObsEvent.A, listenerAEvery);
    assert.strictEqual(obs.hasListener(ObsEvent.A), true, 'non specific');
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAOnce),
      true,
      'specific once'
    );
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAEvery),
      true,
      'specific every'
    );
  });

  specify('set B', function () {
    assert.strictEqual(obs.hasListener(ObsEvent.B), false, 'pre');

    obs.once(ObsEvent.B, listenerBOnce);
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerBOnce),
      false,
      'specific false'
    );
    assert.strictEqual(
      obs.hasListener(ObsEvent.B, listenerBOnce),
      true,
      'specific true'
    );
  });

  specify('trigger A 0', async function () {
    await obs.trigger(ObsEvent.A, params.aOne);
    assert.strictEqual(obs.hasListener(ObsEvent.A), true, 'non specific');
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAOnce),
      false,
      'specific'
    );
  });

  specify('trigger A 1', async function () {
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAEvery),
      true,
      'specific pre'
    );
    await obs.trigger(ObsEvent.A, params.aTwo);
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAEvery),
      true,
      'specific post'
    );
  });

  specify('trigger B', async function () {
    assert.strictEqual(
      obs.hasListener(ObsEvent.B, listenerBOnce),
      true,
      'specific pre'
    );
    await obs.trigger(ObsEvent.B, params.b);
    assert.strictEqual(
      obs.hasListener(ObsEvent.B, listenerBOnce),
      false,
      'specific post'
    );
  });

  specify('remove A', async function () {
    obs.off(ObsEvent.A, listenerAEvery);
    assert.strictEqual(
      obs.hasListener(ObsEvent.A, listenerAEvery),
      false,
      'specific pre'
    );

    assert.strictEqual(counter, 2, 'incorrect counter');
    await obs.trigger(ObsEvent.A, 777);
  });
});
