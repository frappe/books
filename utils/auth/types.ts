export type TelemetryCreds = { url: string; token: string };

export abstract class AuthDemuxBase {
  abstract getTelemetryCreds(): Promise<TelemetryCreds>
}
