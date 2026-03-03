const {
  createBooking,
  findBookingById,
  findBookingsByUserId,
  findBookingsByEventId
} = require("../models/booking.model");

const createBookingRecord = ({ userId, eventId, numberOfTickets }) => {
  return createBooking({
    userId,
    eventId,
    numberOfTickets,
    status: "CONFIRMED"
  });
};

const getBookingById = (bookingId) => {
  return findBookingById(bookingId);
};

const getBookingsByUser = (userId) => {
  return findBookingsByUserId(userId).map(({ id, eventId, numberOfTickets }) => ({
    id,
    eventId,
    numberOfTickets
  }));
};

const getBookingsByEvent = (eventId) => {
  return findBookingsByEventId(eventId).map(({ id, userId, numberOfTickets }) => ({
    id,
    userId,
    numberOfTickets
  }));
};

module.exports = {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent
};
