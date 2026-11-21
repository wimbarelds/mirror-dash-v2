/**
 * Thrown when the OV API is reachable but the browser refuses to hand us its response because of CORS.
 */
export class OVCorsError extends Error {
  readonly cause: unknown;

  constructor(cause?: unknown) {
    super('OV API request was blocked by CORS');
    this.name = 'OVCorsError';
    this.cause = cause;
  }
}

/** Checks if the URL is reachable without CORS */
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

/**
 * Browsers don't tell scripts if a failed request is due to a CORS error.
 * We detect CORS errors so we can avoid retrying continuously.
 */
export async function handleFetchError(url: string, error: unknown): Promise<never> {
  if (error instanceof TypeError && (await isUrlReachable(url))) throw new OVCorsError(error);
  throw error;
}

export function isOVCorsError(error: unknown) {
  return error instanceof OVCorsError;
}
