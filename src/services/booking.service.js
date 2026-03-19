const Booking = require("../models/booking.model");
const {
  getEventDetails,
  updateEventSeats,
} = require("./interservice/event.service");
const { getUserDetails } = require("./interservice/user.service");
const { refundPayment } = require("./interservice/payment.service");

const buildSortOptions = (sortBy, sortOrder) => {
  const allowedSortFields = ["createdAt", "eventDate"];
  const normalizedSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";
  const normalizedSortOrder =
    String(sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

  return { [normalizedSortBy]: normalizedSortOrder };
};

const createBookingRecord = async ({
  userId,
  eventId,
  numberOfTickets,
  token,
}) => {
  const [event, user] = await Promise.all([
    getEventDetails(eventId, token),
    getUserDetails(token),
  ]);

  const totalAmount = numberOfTickets * (event.ticketPrice || 1000);

  await updateEventSeats(eventId, numberOfTickets, "decrease", token);

  const booking = await Booking.create({
    userId,
    userName: user.name,
    eventId,
    eventName: event.name,
    eventDate: event.date,
    venue: event.venue,
    numberOfTickets,
    totalAmount,
    paymentStatus: "PENDING",
    bookingStatus: "PENDING",
  });

  return {
    id: booking.id,
    userId: booking.userId,
    userName: booking.userName,
    eventId: booking.eventId,
    eventName: booking.eventName,
    eventDate: booking.eventDate,
    createdAt: booking.createdAt,
    venue: booking.venue,
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
    userName: booking.userName,
    eventId: booking.eventId,
    eventName: booking.eventName,
    eventDate: booking.eventDate,
    createdAt: booking.createdAt,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    totalAmount: booking.totalAmount,
    status: booking.bookingStatus,
  };
};

const getBookingsByUser = async (userId, status, sortBy, sortOrder) => {
  const query = { userId };
  if (status) {
    query.bookingStatus = status;
  }
  const sortOptions = buildSortOptions(sortBy, sortOrder);
  const bookings = await Booking.find(query).sort(sortOptions);

  return bookings.map(
    ({
      id,
      eventId,
      eventName,
      eventDate,
      createdAt,
      venue,
      numberOfTickets,
      totalAmount,
      bookingStatus,
      paymentStatus,
      userName,
    }) => ({
      id,
      userId,
      userName,
      eventId,
      eventName,
      eventDate,
      createdAt,
      venue,
      numberOfTickets,
      totalAmount,
      status: bookingStatus,
      paymentStatus,
    }),
  );
};

const getBookingsByEvent = async (eventId, status, sortBy, sortOrder) => {
  const query = { eventId };
  if (status) {
    query.bookingStatus = status;
  }
  const sortOptions = buildSortOptions(sortBy, sortOrder);
  const bookings = await Booking.find(query).sort(sortOptions);

  return bookings.map(
    ({
      id,
      userId,
      userName,
      eventName,
      eventDate,
      createdAt,
      venue,
      numberOfTickets,
      totalAmount,
      bookingStatus,
      paymentStatus,
    }) => ({
      id,
      userId,
      userName,
      eventName,
      eventDate,
      createdAt,
      venue,
      numberOfTickets,
      totalAmount,
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

  await updateEventSeats(
    booking.eventId,
    booking.numberOfTickets,
    "increase",
    token,
  );

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
