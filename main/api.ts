import fetch, { RequestInit } from 'node-fetch';

export async function sendAPIRequest(
  endpoint: string,
  options: RequestInit | undefined
) {
  return (await fetch(endpoint, options)).json() as unknown as {
    [key: string]: string | number | boolean;
  }[];
}
