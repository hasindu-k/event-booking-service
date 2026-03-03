const Booking = require("../models/booking.model");

const createBookingRecord = async ({ userId, eventId, numberOfTickets }) => {
  const booking = await Booking.create({
    userId,
    eventId,
    numberOfTickets,
    totalAmount: numberOfTickets * 1000,
    paymentStatus: "SUCCESS",
    bookingStatus: "CONFIRMED",
  });

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    numberOfTickets: booking.numberOfTickets,
    status: booking.bookingStatus,
  };
};

const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return null;
  }

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    numberOfTickets: booking.numberOfTickets,
    status: booking.bookingStatus,
  };
};

const getBookingsByUser = async (userId) => {
  const bookings = await Booking.find({ userId });

  return bookings.map(({ id, eventId, numberOfTickets }) => ({
    id,
    eventId,
    numberOfTickets,
  }));
};

const getBookingsByEvent = async (eventId) => {
  const bookings = await Booking.find({ eventId });

  return bookings.map(({ id, userId, numberOfTickets }) => ({
    id,
    userId,
    numberOfTickets,
  }));
};

const cancelBookingRecord = async (bookingId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return null;
  }

  if (booking.bookingStatus === "CANCELLED") {
    return {
      booking: {
        id: booking.id,
        userId: booking.userId,
        eventId: booking.eventId,
        numberOfTickets: booking.numberOfTickets,
        status: booking.bookingStatus,
      },
      paymentRefunded: false,
      seatsRestored: false,
      message: "Booking is already cancelled",
    };
  }

  booking.bookingStatus = "CANCELLED";
  await booking.save();

  return {
    booking: {
      id: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      numberOfTickets: booking.numberOfTickets,
      status: booking.bookingStatus,
    },
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
