import { DoctypeName } from 'models/types';

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
}

export enum Verb {
  Saved = 'saved',
  Submitted = 'sumbitted',
  Canceled = 'canceled',
  Deleted = 'deleted',
  Navigated = 'navigated',
}

export enum Noun {}
