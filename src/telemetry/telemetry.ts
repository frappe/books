import config, { ConfigKeys, TelemetrySetting } from '@/config';
import frappe from 'frappe';
import { cloneDeep } from 'lodash';
import {
  getCountry,
  getCounts,
  getCreds,
  getDeviceId,
  getInstanceId,
  getLanguage,
} from './helpers';
import { Noun, NounEnum, Platform, Telemetry, Verb } from './types';

/**
 * # Telemetry
 *
 * ## `start`
 * Used to initialize state. It should be called before interaction.
 * It is called on three events:
 * 1. On db initialization which happens everytime a db is loaded or changed.
 * 2. On visibility change if not started, eg: when user minimizeds Books and
 *      then comes back later.
 * 3. When `log` is called if not initialized.
 *
 * ## `log`
 * Used to make entries in the `timeline` which happens only if telmetry
 * is set to 'Allow Telemetry`
 *
 * ## `error`
 * Called in errorHandling.ts and maintains a count of errors that were
 * thrown during usage.
 *
 * ## `stop`
 * This is to be called when a session is being stopped. It's called on two events
 * 1. When the db is being changed.
 * 2. When the visiblity has changed which happens when either the app is being shut or
 *      the app is hidden.
 *
 * This function can't be async as it's called when visibility changes to 'hidden'
 * at which point async doesn't seem to work and hence count is captured on `start()`
 *
 * ## `finalLogAndStop`
 * Called when telemetry is set to "Don't Log Anything" so as to indicate cessation of
 * telemetry and not app usage.
 */

class TelemetryManager {
  #url: string = '';
  #token: string = '';
  #started = false;
  #telemetryObject: Partial<Telemetry> = {};

  set platform(value: Platform) {
    this.#telemetryObject.platform ||= value;
  }

  get hasCreds() {
    return !!this.#url && !!this.#token;
  }

  get started() {
    return this.#started;
  }

  get telemetryObject(): Readonly<Partial<Telemetry>> {
    return cloneDeep(this.#telemetryObject);
  }

  async start() {
    this.#telemetryObject.country ||= getCountry();
    this.#telemetryObject.language ??= getLanguage();
    this.#telemetryObject.deviceId ||= getDeviceId();
    this.#telemetryObject.instanceId ||= getInstanceId();
    this.#telemetryObject.openTime ||= new Date().valueOf();
    this.#telemetryObject.timeline ??= [];
    this.#telemetryObject.errors ??= {};
    this.#telemetryObject.counts ??= {};
    this.#started = true;

    await this.#postStart();
  }

  async log(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.#started) {
      await this.start();
    }

    if (!this.#getCanLog()) {
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

  stop() {
    this.#started = false;

    //@ts-ignore
    this.#telemetryObject.version = frappe.store.appVersion ?? '';
    this.#telemetryObject.closeTime = new Date().valueOf();

    const data = JSON.stringify({
      token: this.#token,
      telemetryData: this.#telemetryObject,
    });

    this.#clear();

    if (config.get(ConfigKeys.Telemetry) === TelemetrySetting.dontLogAnything) {
      return;
    }
    navigator.sendBeacon(this.#url, data);
  }

  finalLogAndStop() {
    this.log(Verb.Stopped, NounEnum.Telemetry);
    this.stop();
  }

  async #postStart() {
    await this.#setCount();
    await this.#setCreds();
  }

  async #setCount() {
    if (!this.#getCanLog()) {
      return;
    }

    this.#telemetryObject.counts = await getCounts();
  }

  async #setCreds() {
    if (this.hasCreds) {
      return;
    }

    const { url, token } = await getCreds();
    this.#url = url;
    this.#token = token;
  }

  #getCanLog(): boolean {
    const telemetrySetting = config.get(ConfigKeys.Telemetry) as string;
    return telemetrySetting === TelemetrySetting.allow;
  }

  #clear() {
    // Delete only what varies
    delete this.#telemetryObject.openTime;
    delete this.#telemetryObject.closeTime;
    delete this.#telemetryObject.errors;
    delete this.#telemetryObject.counts;
    delete this.#telemetryObject.timeline;
    delete this.#telemetryObject.instanceId;
    delete this.#telemetryObject.country;
  }
}

export default new TelemetryManager();
