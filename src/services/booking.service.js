const {
  createBooking,
  findBookingById,
  findBookingsByUserId,
  findBookingsByEventId,
  updateBookingStatus,
} = require("../models/booking.model");

const createBookingRecord = ({ userId, eventId, numberOfTickets }) => {
  return createBooking({
    userId,
    eventId,
    numberOfTickets,
    status: "CONFIRMED",
  });
};

const getBookingById = (bookingId) => {
  return findBookingById(bookingId);
};

const getBookingsByUser = (userId) => {
  return findBookingsByUserId(userId).map(
    ({ id, eventId, numberOfTickets }) => ({
      id,
      eventId,
      numberOfTickets,
    }),
  );
};

const getBookingsByEvent = (eventId) => {
  return findBookingsByEventId(eventId).map(
    ({ id, userId, numberOfTickets }) => ({
      id,
      userId,
      numberOfTickets,
    }),
  );
};

const cancelBookingRecord = (bookingId) => {
  const booking = findBookingById(bookingId);

  if (!booking) {
    return null;
  }

  if (booking.status === "CANCELLED") {
    return {
      booking,
      paymentRefunded: false,
      seatsRestored: false,
      message: "Booking is already cancelled",
    };
  }

  const updatedBooking = updateBookingStatus(bookingId, "CANCELLED");

  return {
    booking: updatedBooking,
    paymentRefunded: true,
    seatsRestored: true,
    message: "Booking cancelled successfully",
  };
};

module.exports = {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent,
  cancelBookingRecord,
};
