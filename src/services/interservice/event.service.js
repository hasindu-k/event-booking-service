const {
  buildPath,
  createHttpError,
  gatewayRequest,
} = require("./gateway.client");

const pathTemplates = {
  eventLookup: process.env.GATEWAY_EVENT_LOOKUP_PATH || "/events/{eventId}",
};

const ensureEventExists = async (eventId) => {
  const eventPath = buildPath(pathTemplates.eventLookup, { eventId });

  try {
    await gatewayRequest({ method: "GET", path: eventPath });
  } catch (error) {
    if (error.statusCode === 404) {
      throw createHttpError("Event not found", 404);
    }

    throw createHttpError(`Unable to validate event: ${error.message}`, 502);
  }
};

module.exports = {
  ensureEventExists,
};
