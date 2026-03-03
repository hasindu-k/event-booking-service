const Booking = require("../models/booking.model");
const { ensureUserExists } = require("./interservice/user.service");
const { ensureEventExists } = require("./interservice/event.service");
const {
  createPayment,
  refundPayment,
} = require("./interservice/payment.service");

const createBookingRecord = async ({ userId, eventId, numberOfTickets }) => {
  await ensureUserExists(userId);
  await ensureEventExists(eventId);

  const totalAmount = numberOfTickets * 1000;
  const payment = await createPayment({
    userId,
    eventId,
    numberOfTickets,
    totalAmount,
  });

  const booking = await Booking.create({
    userId,
    eventId,
    numberOfTickets,
    totalAmount,
    paymentStatus: payment.status,
    bookingStatus: "CONFIRMED",
  });

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    numberOfTickets: booking.numberOfTickets,
    status: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    paymentReferenceId: payment.referenceId,
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

  await refundPayment({
    bookingId: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    totalAmount: booking.totalAmount,
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
};
