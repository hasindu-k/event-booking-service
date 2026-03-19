const { createHttpError } = require("./gateway.client");

const gatewayUrl = process.env.API_GATEWAY_URL;
const notificationEventsPath =
  process.env.GATEWAY_NOTIFICATION_EVENTS_PATH || "/api/notifications/events";
const notificationTimeoutMs = Number(
  process.env.GATEWAY_TIMEOUT_MS || 5000,
);

function buildNotificationUrl() {
  if (!gatewayUrl) {
    throw createHttpError("API_GATEWAY_URL is not configured", 500);
  }

  const normalizedBase = gatewayUrl.endsWith("/")
    ? gatewayUrl.slice(0, -1)
    : gatewayUrl;
  const normalizedPath = notificationEventsPath.startsWith("/")
    ? notificationEventsPath
    : `/${notificationEventsPath}`;

  return `${normalizedBase}${normalizedPath}`;
}

async function sendNotificationEvent(payload, token) {
  if (!token) {
    throw createHttpError("Notification gateway request requires a user token", 401);
  }

  const serviceToken =
    process.env.INTERNAL_SERVICE_TOKEN || "shared_service_secret";
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    notificationTimeoutMs,
  );

  try {
    const response = await fetch(buildNotificationUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-service-token": serviceToken,
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    const responseText = await response.text();
    const parsedResponse = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      throw createHttpError(
        parsedResponse?.message ||
          `Notification request failed with status ${response.status}`,
        response.status,
      );
    }

    return parsedResponse;
  } catch (error) {
    if (error.name === "AbortError") {
      throw createHttpError("Notification request timed out", 504);
    }

    if (error.statusCode) {
      throw error;
    }

    throw createHttpError(
      `Notification request failed: ${error.message}`,
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  sendNotificationEvent,
};
