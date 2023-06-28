import { Fyo } from 'fyo';
import { Noun, Telemetry, Verb } from './types';
import { ModelNameEnum } from 'models/types';

/**
 * # Telemetry
 * Used to check if people are using Books or not. All logging
 * happens using navigator.sendBeacon
 *
 * ## `start`
 * Used to initialize state. It should be called before any logging and after an
 * instance has loaded.
 * It is called on three events:
 * 1. When Desk is opened, i.e. when the usage starts, this also sends a
 *      Opened instance log.
 * 2. On visibility change if not started, eg: when user minimizes Books and
 *      then comes back later.
 * 3. When `log` is called, but telemetry isn't initialized.
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

const ignoreList: string[] = [
  ModelNameEnum.AccountingLedgerEntry,
  ModelNameEnum.StockLedgerEntry,
];

export class TelemetryManager {
  #url = '';
  #token = '';
  #started = false;
  fyo: Fyo;

  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  get hasCreds() {
    return !!this.#url && !!this.#token;
  }

  get started() {
    return this.#started;
  }

  async start(isOpened?: boolean) {
    this.#started = true;
    await this.#setCreds();

    if (isOpened) {
      this.log(Verb.Opened, 'instance');
    } else {
      this.log(Verb.Resumed, 'instance');
    }
  }

  stop() {
    if (!this.started) {
      return;
    }

    this.log(Verb.Closed, 'instance');
    this.#started = false;
  }

  log(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (!this.#started && this.fyo.db.isConnected) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.start().then(() => this.#sendBeacon(verb, noun, more));
      return;
    }

    this.#sendBeacon(verb, noun, more);
  }

  async logOpened() {
    await this.#setCreds();
    this.#sendBeacon(Verb.Opened, 'app');
  }

  #sendBeacon(verb: Verb, noun: Noun, more?: Record<string, unknown>) {
    if (
      !this.hasCreds ||
      this.fyo.store.skipTelemetryLogging ||
      ignoreList.includes(noun)
    ) {
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
    const countryCode = this.fyo.singles.SystemSettings?.countryCode;
    return {
      country: countryCode ?? '',
      language: this.fyo.store.language,
      deviceId:
        this.fyo.store.deviceId || (this.fyo.config.get('deviceId') ?? '-'),
      instanceId: this.fyo.store.instanceId,
      version: this.fyo.store.appVersion,
      openCount: this.fyo.store.openCount,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, -1),
      platform: this.fyo.store.platform,
      verb,
      noun,
      more,
    };
  }
}
