export type AppVersion = string;
export type UniqueId = string;
export type Timestamp = string;

export type Platform = 'Windows' | 'Mac' | 'Linux';

export enum Verb {
  Created = 'created',
  Deleted = 'deleted',
  Submitted = 'submitted',
  Cancelled = 'cancelled',
  Imported = 'imported',
  Exported = 'exported',
  Stopped = 'stopped',
  Started = 'started',
  Resumed = 'resumed',
}

export type Noun = string;

export interface Telemetry {
  device: UniqueId;
  instance: UniqueId;
  platform?: Platform;
  country: string;
  language: string;
  version: AppVersion;
  timestamp: Timestamp;
  openCount: number;
  verb: Verb;
  noun: Noun;
  more?: Record<string, unknown>
}
