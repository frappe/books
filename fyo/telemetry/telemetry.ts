import { Fyo } from 'fyo';
import { cloneDeep } from 'lodash';
import { DateTime } from 'luxon';
import {
  getCountry,
  getDeviceId,
  getInstanceId,
  getLanguage,
  getVersion,
} from './helpers';
import { Noun, Platform, Telemetry, Verb } from './types';

/**
 * # Telemetry
 * Used to check if people are using Books or not. All logging
 * happens using navigator.sendBeacon
 *
 * ## `start`
 * Used to initialize state. It should be called before any logging and after an
 * instance has loaded.
 * It is called on three events:
 * 1. When Desk is opened, i.e. when the usage starts, this also sends a started
 *    log.
 * 2. On visibility change if not started, eg: when user minimizeds Books and
 *      then comes back later.
 * 3. When `log` is called, but telemetry wasn't initialized.
 *
 * ## `log`
 * Used to log activity.
 *
 * ## `stop`
 * This is to be called when a session is being stopped. It's called on two events
 * 1. When the db is being changed.
 * 2. When the visiblity has changed which happens when either the app is being shut or
 *      the app is hidden.
 */

export class TelemetryManager {
  #url: string = '';
  #token: string = '';
  #started = false;
  #telemetryObject: Partial<Telemetry> = {};
  fyo: Fyo;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

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

  async start(openCount?: number) {
    this.#telemetryObject.country ||= getCountry(this.fyo);
    this.#telemetryObject.language ??= getLanguage(this.fyo);
    this.#telemetryObject.deviceId ||= getDeviceId(this.fyo);
    this.#telemetryObject.instanceId ||= await getInstanceId(this.fyo);
    this.#telemetryObject.version ||= await getVersion(this.fyo);

    this.#started = true;
    await this.#setCreds();

    if (typeof openCount === 'number') {
      this.#telemetryObject.openCount = openCount;
      this.log(Verb.Started, 'telemetry');
    } else {
      this.log(Verb.Resumed, 'telemetry');
    }
  }

  stop() {
    if (!this.started) {
      return;
    }

    this.log(Verb.Stopped, 'telemetry');
    this.#started = false;
    this.#clear();
  }

  log(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.#started && this.fyo.db.isConnected) {
      this.start().then(() => this.#sendBeacon(verb, noun, more));
      return;
    }

    this.#sendBeacon(verb, noun, more);
  }

  #sendBeacon(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.hasCreds) {
      return;
    }

    const telemetryData: Telemetry = this.#getTelemtryData(verb, noun, more);
    const data = JSON.stringify({
      token: this.#token,
      telemetryData,
    });

    navigator.sendBeacon(this.#url, data);
  }

  async #setCreds() {
    if (this.hasCreds) {
      return;
    }

    const { telemetryUrl, tokenString } = await this.fyo.auth.getCreds();
    this.#url = telemetryUrl;
    this.#token = tokenString;
  }

  #getTelemtryData(
    verb: Verb,
    noun: Noun,
    more?: Record<string, unknown>
  ): Telemetry {
    return {
      country: this.#telemetryObject.country!,
      language: this.#telemetryObject.language!,
      deviceId: this.#telemetryObject.deviceId!,
      instanceId: this.#telemetryObject.instanceId!,
      version: this.#telemetryObject.version!,
      openCount: this.#telemetryObject.openCount!,
      timestamp: DateTime.now().toMillis().toString(),
      verb,
      noun,
      more,
    };
  }

  #clear() {
    delete this.#telemetryObject.country;
    delete this.#telemetryObject.language;
    delete this.#telemetryObject.deviceId;
    delete this.#telemetryObject.instanceId;
    delete this.#telemetryObject.version;
    delete this.#telemetryObject.openCount;
  }
}
