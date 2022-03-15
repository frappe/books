import config, { ConfigKeys, TelemetrySetting } from '@/config';
import frappe from 'frappe';
import { cloneDeep } from 'lodash';
import { getCounts, getDeviceId, getInstanceId, getLocale } from './helpers';
import { Noun, NounEnum, Telemetry, Verb } from './types';

class TelemetryManager {
  #url: string = '';
  #token: string = '';
  #started = false;
  #telemetryObject: Partial<Telemetry> = {};

  start() {
    this.#telemetryObject.locale = getLocale();
    this.#telemetryObject.deviceId ||= getDeviceId();
    this.#telemetryObject.instanceId ||= getInstanceId();
    this.#telemetryObject.openTime ||= new Date().valueOf();
    this.#telemetryObject.timeline ??= [];
    this.#telemetryObject.errors ??= {};
    this.#started = true;
  }

  getCanLog(): boolean {
    const telemetrySetting = config.get(ConfigKeys.Telemetry) as string;
    return telemetrySetting === TelemetrySetting.allow;
  }

  setCreds(url: string, token: string) {
    this.#url ||= url;
    this.#token ||= token;
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

  async setCount() {
    this.#telemetryObject.counts = this.getCanLog() ? await getCounts() : {};
  }

  stop() {
    // Will set ids if not set.
    this.start();

    //@ts-ignore
    this.#telemetryObject.version = frappe.store.appVersion ?? '';
    this.#telemetryObject.closeTime = new Date().valueOf();

    const telemetryObject = this.#telemetryObject;

    this.#started = false;
    this.#telemetryObject = {};

    if (config.get(ConfigKeys.Telemetry) === TelemetrySetting.dontLogAnything) {
      return;
    }

    const data = JSON.stringify({
      token: this.#token,
      telemetryData: telemetryObject,
    });

    navigator.sendBeacon(this.#url, data);
  }

  finalLogAndStop() {
    this.log(Verb.Stopped, NounEnum.Telemetry);
    this.stop();
  }

  get telemetryObject(): Readonly<Partial<Telemetry>> {
    return cloneDeep(this.#telemetryObject);
  }
}

export default new TelemetryManager();
