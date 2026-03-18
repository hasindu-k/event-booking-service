const Booking = require("../models/booking.model");
const { ensureEventExists } = require("./interservice/event.service");
const {
  createPayment,
  refundPayment,
} = require("./interservice/payment.service");

const createBookingRecord = async ({
  userId,
  eventId,
  numberOfTickets,
  token,
}) => {
  await ensureEventExists(eventId, token);

  const totalAmount = numberOfTickets * 1000;

  const booking = await Booking.create({
    userId,
    eventId,
    numberOfTickets,
    totalAmount,
    paymentStatus: "PENDING",
    bookingStatus: "PENDING",
  });

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    numberOfTickets: booking.numberOfTickets,
    status: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalAmount: booking.totalAmount,
  };
};

const updateBookingPaymentStatus = async (bookingId, paymentStatus) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return null;
  }

  booking.paymentStatus = paymentStatus;
  if (paymentStatus === "SUCCESS") {
    booking.bookingStatus = "CONFIRMED";
  }

  await booking.save();

  return {
    id: booking.id,
    status: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
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

const getBookingsByUser = async (userId, status) => {
  const query = { userId };
  if (status) {
    query.bookingStatus = status;
  }
  const bookings = await Booking.find(query);

  return bookings.map(
    ({ id, eventId, numberOfTickets, bookingStatus, paymentStatus }) => ({
      id,
      eventId,
      numberOfTickets,
      status: bookingStatus,
      paymentStatus,
    }),
  );
};

const getBookingsByEvent = async (eventId, status) => {
  const query = { eventId };
  if (status) {
    query.bookingStatus = status;
  }
  const bookings = await Booking.find(query);

  return bookings.map(
    ({ id, userId, numberOfTickets, bookingStatus, paymentStatus }) => ({
      id,
      userId,
      numberOfTickets,
      status: bookingStatus,
      paymentStatus,
    }),
  );
};

const cancelBookingRecord = async (bookingId, token) => {
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

  await refundPayment({
    bookingId: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    totalAmount: booking.totalAmount,
    token,
  });

  booking.bookingStatus = "CANCELLED";
  booking.paymentStatus = "REFUNDED";
  await booking.save();

  return {
    booking: {
      id: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      numberOfTickets: booking.numberOfTickets,
      status: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
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
  updateBookingPaymentStatus,
};
