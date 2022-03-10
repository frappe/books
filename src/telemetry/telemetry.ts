import config, { ConfigKeys, telemetryOptions } from '@/config';
import frappe from 'frappe';
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
    this.#telemetryObject.errors ??= {};
    this.#started = true;
  }

  getCanLog(): boolean {
    const telemetrySetting = config.get(ConfigKeys.Telemetry) as string;
    return telemetrySetting === telemetryOptions.allow;
  }

  log(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.#started) {
      this.start();
    }

    if (!this.getCanLog()) {
      return;
    }

    const time = new Date().valueOf();
    if (this.#telemetryObject.timeline === undefined) {
      this.#telemetryObject.timeline = [];
    }

    this.#telemetryObject.timeline.push({ time, verb, noun, more });
  }

  error(name: string) {
    if (this.#telemetryObject.errors === undefined) {
      this.#telemetryObject.errors = {};
    }

    this.#telemetryObject.errors[name] ??= 0;
    this.#telemetryObject.errors[name] += 1;
  }

  async stop() {
    // Will set ids if not set.
    this.start();

    //@ts-ignore
    this.#telemetryObject.version = frappe.store.appVersion ?? '';
    this.#telemetryObject.counts = this.getCanLog() ? await getCounts() : {};
    this.#telemetryObject.closeTime = new Date().valueOf();

    if (config.get(ConfigKeys.Telemetry) === telemetryOptions.dontLogAnything) {
      return;
    }
  }

  get telemetryObject(): Readonly<Partial<Telemetry>> {
    return cloneDeep(this.#telemetryObject);
  }
}

export default new TelemetryManager();
