export type AppVersion = string;
export type UniqueId = string;
export type Timestamp = number;

export interface InteractionEvent {
  time: Timestamp;
  verb: Verb;
  noun: Noun;
  more?: Record<string, unknown>;
}

export type Count = Record<string, number>;
export type Platform = 'Windows' | 'Mac' | 'Linux';

export interface Telemetry {
  deviceId: UniqueId;
  instanceId: UniqueId;
  openTime: Timestamp;
  platform?: Platform;
  closeTime: Timestamp;
  timeline?: InteractionEvent[];
  counts?: Count;
  errors: Record<string, number>;
  country: string;
  language: string;
  version: AppVersion;
}

export enum Verb {
  Created = 'created',
  Deleted = 'deleted',
  Navigated = 'navigated',
  Imported = 'imported',
  Exported = 'exported',
  Stopped = 'stopped',
  Started = 'stopped',
}

export enum NounEnum {
  Route = 'route',
  Telemetry = 'telemetry',
}

export type Noun = string | NounEnum;

export enum TelemetrySetting {
  allow = 'allow',
  dontLogUsage = 'dontLogUsage',
  dontLogAnything = 'dontLogAnything',
}
