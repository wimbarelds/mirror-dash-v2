/** The OV API is reachable, but the browser blocked its response because of CORS */
export class OVCorsError extends Error {
  readonly cause: unknown;

  constructor(cause?: unknown) {
    super('OV API request was blocked by CORS');
    this.name = 'OVCorsError';
    this.cause = cause;
  }
}

/** Whether the URL answers when CORS is not enforced */
function isUrlReachable(url: string) {
  return fetch(url, {
    mode: 'no-cors',
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  }).then(
    () => true,
    () => false,
  );
}

/** Browsers don't report CORS errors to scripts, so detect them to avoid retrying forever */
export async function handleFetchError(url: string, error: unknown): Promise<never> {
  if (error instanceof TypeError && (await isUrlReachable(url))) throw new OVCorsError(error);
  throw error;
}

export function isOVCorsError(error: unknown) {
  return error instanceof OVCorsError;
}
