import { DoctypeName } from 'models/types';

export type AppVersion = string;
export type UniqueId = string;
export type Timestamp = number;

export interface InteractionEvent {
  time: Timestamp;
  verb: Verb;
  noun: Noun;
  more?: Record<string, unknown>;
}

export interface Locale {
  country: string;
  language: string;
}

export type Count = Partial<{
  [key in DoctypeName]: number;
}>;

export interface Telemetry {
  deviceId: UniqueId;
  instanceId: UniqueId;
  openTime: Timestamp;
  closeTime: Timestamp;
  timeline?: InteractionEvent[];
  counts?: Count;
  locale: Locale;
  version: AppVersion;
}

export enum Verb {
  Created = 'created',
  Deleted = 'deleted',
  Navigated = 'navigated',
  Imported = 'imported',
  Exported = 'exported',
}

export enum NounEnum {
  Route = 'route',
}

export type Noun = string | NounEnum;
