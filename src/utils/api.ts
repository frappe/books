export async function sendAPIRequest(
  endpoint: string,
  options: RequestInit | undefined
) {
  return await ipc.sendAPIRequest(endpoint, options);
}
