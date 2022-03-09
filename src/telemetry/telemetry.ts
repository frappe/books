import { getCounts, getDeviceId, getInstanceId, getLocale } from './helpers';
import { Noun, Telemetry, Verb } from './types';

class TelemetryManager {
  #started = false;
  #telemetryObject: Partial<Telemetry> = {};

  start() {
    if (this.#started) {
      return;
    }
    this.#telemetryObject.locale = getLocale();
    this.#telemetryObject.deviceId = getDeviceId();
    this.#telemetryObject.instanceId = getInstanceId();
    this.#telemetryObject.openTime = new Date().valueOf();
    this.#telemetryObject.timeline = [];
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
    this.#telemetryObject.counts = await getCounts();
    this.#telemetryObject.closeTime = new Date().valueOf();
  }
}

export const telemetryManager = new TelemetryManager();
