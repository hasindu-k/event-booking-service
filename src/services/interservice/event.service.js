const {
  buildPath,
  createHttpError,
  gatewayRequest,
} = require("./gateway.client");

const pathTemplates = {
  eventLookup: process.env.GATEWAY_EVENT_LOOKUP_PATH || "/events/{eventId}",
  eventSeatUpdate:
    process.env.GATEWAY_EVENT_SEAT_UPDATE_PATH || "/events/{eventId}/seats",
};

const getEventDetails = async (eventId, token) => {
  const eventPath = buildPath(pathTemplates.eventLookup, { eventId });

  try {
    const response = await gatewayRequest({
      method: "GET",
      path: eventPath,
      token,
    });
    return response.data;
  } catch (error) {
    if (error.statusCode === 404) {
      throw createHttpError("Event not found", 404);
    }

    throw createHttpError(`Unable to validate event: ${error.message}`, 502);
  }
};

const updateEventSeats = async (eventId, seatChange, operation, token) => {
  const eventSeatUpdatePath = buildPath(pathTemplates.eventSeatUpdate, {
    eventId,
  });
  await gatewayRequest({
    method: "PUT",
    path: eventSeatUpdatePath,
    token,
    body: { quantity: seatChange, operation: operation },
  });
};

module.exports = {
  getEventDetails,
  updateEventSeats,
};
