import { cloneDeep } from 'lodash';
import { getCounts, getDeviceId, getInstanceId, getLocale } from './helpers';
import { Noun, Telemetry, Verb } from './types';

class TelemetryManager {
  #started = false;
  #telemetryObject: Partial<Telemetry> = {};

  start() {
    this.#telemetryObject.locale ||= getLocale();
    this.#telemetryObject.deviceId ||= getDeviceId();
    this.#telemetryObject.instanceId ||= getInstanceId();
    this.#telemetryObject.openTime ||= new Date().valueOf();
    this.#telemetryObject.timeline ??= [];
    this.#started = true;
  }

  log(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.#started) {
      this.start();
    }

    const time = new Date().valueOf();
    if (this.#telemetryObject.timeline === undefined) {
      this.#telemetryObject.timeline = [];
    }

    this.#telemetryObject.timeline.push({ time, verb, noun, more });
  }

  async stop() {
    // Will set ids if not set.
    this.start();

    this.#telemetryObject.counts = await getCounts();
    this.#telemetryObject.closeTime = new Date().valueOf();
  }

  get telemetryObject(): Readonly<Partial<Telemetry>> {
    return cloneDeep(this.#telemetryObject);
  }
}

export default new TelemetryManager();
