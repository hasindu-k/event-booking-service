const gatewayUrl = process.env.API_GATEWAY_URL;
const gatewayTimeoutMs = Number(process.env.GATEWAY_TIMEOUT_MS || 5000);

const createHttpError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildPath = (template, replacements = {}) => {
  return Object.entries(replacements).reduce((resolvedPath, [key, value]) => {
    return resolvedPath.replace(`{${key}}`, encodeURIComponent(String(value)));
  }, template);
};

const gatewayRequest = async ({ method = "GET", path, body }) => {
  if (!gatewayUrl) {
    throw createHttpError("API_GATEWAY_URL is not configured", 500);
  }

  const normalizedBase = gatewayUrl.endsWith("/")
    ? gatewayUrl.slice(0, -1)
    : gatewayUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), gatewayTimeoutMs);

  try {
    const response = await fetch(`${normalizedBase}${normalizedPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: abortController.signal,
    });

    const responseText = await response.text();
    const parsedResponse = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
      const upstreamMessage =
        parsedResponse?.message ||
        `${method} ${normalizedPath} failed with status ${response.status}`;
      throw createHttpError(upstreamMessage, response.status);
    }

    return parsedResponse;
  } catch (error) {
    if (error.name === "AbortError") {
      throw createHttpError("Gateway request timed out", 504);
    }

    if (error.statusCode) {
      throw error;
    }

    throw createHttpError(`Gateway request failed: ${error.message}`, 502);
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  buildPath,
  createHttpError,
  gatewayRequest,
};
