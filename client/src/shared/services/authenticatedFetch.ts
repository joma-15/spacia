import { BASE_URL } from "@/shared/config/api";
import { clearTokens, getAccessToken, getRefreshToken, updateAccessToken } from "@/shared/components/auth/session";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function responseError(response: Response): Promise<ApiRequestError> {
  let body: { code?: string; message?: string } | null = null;
  try {
    body = await response.clone().json();
  } catch {
    // Non-JSON errors still expose their HTTP status to callers.
  }
  return new ApiRequestError(body?.message ?? `Request failed with status ${response.status}`, response.status, body?.code);
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      if (!response.ok) return null;

      const body: { access_token?: string } = await response.json();
      if (!body.access_token) return null;
      await updateAccessToken(body.access_token);
      return body.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function hasExpiredAccessToken(response: Response, error: ApiRequestError): boolean {
  return response.status === 401 && error.code === "token_expired";
}

/** Sends an authenticated request and retries it once after a shared token refresh. */
export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = async (accessToken: string): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(`${BASE_URL}${path}`, { ...init, headers });
  };

  const accessToken = await getAccessToken();
  if (!accessToken) throw new ApiRequestError("No access token is available", 401, "token_missing");

  let response = await send(accessToken);
  if (response.ok) return response;

  const error = await responseError(response);
  if (!hasExpiredAccessToken(response, error)) throw error;

  const refreshedAccessToken = await refreshAccessToken();
  if (!refreshedAccessToken) {
    await clearTokens();
    throw new ApiRequestError("Authentication session has expired", 401, "refresh_failed");
  }

  response = await send(refreshedAccessToken);
  if (response.ok) return response;
  throw await responseError(response);
}
