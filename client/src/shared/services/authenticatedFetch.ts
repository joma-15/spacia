import { BASE_URL } from "@/shared/config/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from "@/shared/components/auth/session";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);

    this.name = "ApiRequestError";
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Converts an HTTP error response into an ApiRequestError.
 */
async function responseError(
  response: Response,
): Promise<ApiRequestError> {
  let body: {
    code?: string;
    message?: string;
  } | null = null;

  try {
    body = await response.clone().json();
  } catch {
    // Response isn't JSON.
  }

  console.log("❌ API RESPONSE ERROR:", {
    status: response.status,
    code: body?.code,
    message: body?.message,
  });

  return new ApiRequestError(
    body?.message ??
      `Request failed with status ${response.status}`,
    response.status,
    body?.code,
  );
}

/**
 * Refreshes the access token using the stored refresh token.
 *
 * Only one refresh request is allowed to run at a time.
 */
async function refreshAccessToken(): Promise<string | null> {
  // If another refresh request is already running,
  // wait for that request instead of creating another one.
  if (refreshInFlight) {
    console.log("⏳ Token refresh already in progress...");
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    console.log("🔄 Starting token refresh...");

    const refreshToken = await getRefreshToken();

    console.log(
      "🔑 Refresh token available:",
      !!refreshToken,
    );

    if (!refreshToken) {
      console.log("❌ No refresh token available.");
      return null;
    }

    try {
      const refreshUrl = `${BASE_URL}/auth/refresh`;

      console.log("📡 Refresh request:", refreshUrl);

      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          Accept: "application/json",
        },
      });

      console.log(
        "🔄 Refresh response status:",
        response.status,
      );

      if (!response.ok) {
        console.log(
          "❌ Token refresh failed with status:",
          response.status,
        );

        try {
          const errorBody = await response.clone().json();

          console.log(
            "❌ Refresh error body:",
            errorBody,
          );
        } catch {
          console.log(
            "❌ Refresh response was not JSON.",
          );
        }

        return null;
      }

      const body: {
        access_token?: string;
      } = await response.json();

      console.log(
        "🔐 New access token received:",
        !!body.access_token,
      );

      if (!body.access_token) {
        console.log(
          "❌ Refresh succeeded but no access_token was returned.",
        );

        return null;
      }

      await updateAccessToken(body.access_token);

      console.log(
        "✅ Access token successfully updated.",
      );

      return body.access_token;
    } catch (error) {
      console.log(
        "❌ Token refresh request failed:",
        error,
      );

      return null;
    } finally {
      refreshInFlight = null;

      console.log(
        "🔓 Token refresh process finished.",
      );
    }
  })();

  return refreshInFlight;
}

/**
 * Determines whether the API response indicates
 * that the access token has expired.
 */
function hasExpiredAccessToken(
  response: Response,
  error: ApiRequestError,
): boolean {
  return (
    response.status === 401 &&
    error.code === "token_expired"
  );
}

/**
 * Sends an authenticated API request.
 *
 * If the access token has expired:
 * 1. Refresh the access token.
 * 2. Save the new access token.
 * 3. Retry the original request once.
 *
 * If refreshing fails:
 * 1. Clear the stored tokens.
 * 2. Throw an authentication error.
 */
export async function authenticatedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  console.log("");
  console.log("====================================");
  console.log("🌐 authenticatedFetch()");
  console.log("====================================");

  console.log("📍 Path:", path);
  console.log("🌍 BASE_URL:", BASE_URL);

  /**
   * Sends the actual HTTP request.
   */
  const send = async (
    accessToken: string,
  ): Promise<Response> => {
    const url = `${BASE_URL}${path}`;

    const headers = new Headers(init.headers);

    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );

    headers.set(
      "Accept",
      "application/json",
    );

    console.log("📡 Sending API request:");
    console.log("   URL:", url);
    console.log("   Method:", init.method ?? "GET");
    console.log("   Has access token:", !!accessToken);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
      });

      console.log(
        "📥 API response status:",
        response.status,
      );

      return response;
    } catch (error) {
      console.log(
        "🚨 FETCH NETWORK ERROR:",
        error,
      );

      throw error;
    }
  };

  /**
   * Get the currently stored access token.
   */
  console.log("🔑 Getting access token...");

  const accessToken = await getAccessToken();

  console.log(
    "🔑 Access token available:",
    !!accessToken,
  );

  /**
   * No access token means the user isn't authenticated.
   */
  if (!accessToken) {
    console.log(
      "❌ authenticatedFetch: NO ACCESS TOKEN",
    );

    throw new ApiRequestError(
      "No access token is available",
      401,
      "token_missing",
    );
  }

  /**
   * First API request.
   */
  let response = await send(accessToken);

  /**
   * Request succeeded.
   */
  if (response.ok) {
    console.log("✅ API request successful.");

    return response;
  }

  /**
   * Convert failed response to ApiRequestError.
   */
  const error = await responseError(response);

  /**
   * If this isn't an expired-token error,
   * don't attempt to refresh.
   */
  if (!hasExpiredAccessToken(response, error)) {
    console.log("❌ API request failed.");
    console.log("   Status:", response.status);
    console.log("   Code:", error.code);
    console.log("   Message:", error.message);

    throw error;
  }

  /**
   * Access token expired.
   */
  console.log(
    "⚠️ Access token expired. Attempting refresh...",
  );

  const refreshedAccessToken =
    await refreshAccessToken();

  /**
   * Refresh failed.
   */
  if (!refreshedAccessToken) {
    console.log(
      "❌ Could not refresh access token.",
    );

    console.log(
      "🧹 Clearing stored authentication tokens...",
    );

    await clearTokens();

    throw new ApiRequestError(
      "Authentication session has expired",
      401,
      "refresh_failed",
    );
  }

  /**
   * Retry the original request using the new token.
   */
  console.log(
    "🔁 Retrying original API request with new token...",
  );

  response = await send(
    refreshedAccessToken,
  );

  /**
   * Retry succeeded.
   */
  if (response.ok) {
    console.log(
      "✅ Retry request successful.",
    );

    return response;
  }

  /**
   * Retry also failed.
   */
  console.log(
    "❌ Retry request failed.",
  );

  throw await responseError(response);
}