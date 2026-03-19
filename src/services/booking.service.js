const Booking = require("../models/booking.model");
const {
  getEventDetails,
  updateEventSeats,
} = require("./interservice/event.service");
const { refundPayment } = require("./interservice/payment.service");
const {
  sendNotificationEvent,
} = require("./interservice/notification.service");

async function dispatchNotification(payload, token) {
  try {
    await sendNotificationEvent(payload, token);
  } catch (error) {
    console.error("Failed to dispatch booking notification:", error.message);
  }
}

function buildBookingMetadata(booking) {
  return {
    bookingId: booking.id,
    eventId: booking.eventId,
    eventTitle: booking.eventName,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    totalAmount: booking.totalAmount,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
  };
}

async function notifyBookingCreated(booking, token) {
  await dispatchNotification({
    eventType: "BOOKING_PENDING",
    source: "BOOKING_SERVICE",
    entityId: booking.id,
    entityType: "BOOKING",
    actorUserId: booking.userId,
    recipients: {
      userId: booking.userId,
    },
    metadata: buildBookingMetadata(booking),
  }, token);
}

async function notifyBookingUpdated(booking, token) {
  await dispatchNotification({
    eventType: "BOOKING_UPDATED",
    source: "BOOKING_SERVICE",
    entityId: booking.id,
    entityType: "BOOKING",
    actorUserId: booking.userId,
    recipients: {
      userId: booking.userId,
    },
    metadata: buildBookingMetadata(booking),
  }, token);
}

async function notifyBookingConfirmed(booking, token) {
  await dispatchNotification({
    eventType: "BOOKING_CONFIRMED",
    source: "BOOKING_SERVICE",
    entityId: booking.id,
    entityType: "BOOKING",
    actorUserId: booking.userId,
    recipients: {
      userId: booking.userId,
    },
    metadata: buildBookingMetadata(booking),
  }, token);

  await dispatchNotification({
    eventType: "BOOKING_CONFIRMED",
    source: "BOOKING_SERVICE",
    entityId: booking.id,
    entityType: "BOOKING",
    actorUserId: booking.userId,
    recipients: {
      roles: ["ADMIN"],
    },
    title: "Booking confirmed for event",
    message: `${booking.numberOfTickets} seat(s) are booked for ${booking.eventName}.`,
    metadata: buildBookingMetadata(booking),
  }, token);
}

async function notifyBookingCancelled(booking, token) {
  await dispatchNotification({
    eventType: "BOOKING_CANCELLED",
    source: "BOOKING_SERVICE",
    entityId: booking.id,
    entityType: "BOOKING",
    actorUserId: booking.userId,
    recipients: {
      userId: booking.userId,
    },
    metadata: buildBookingMetadata(booking),
  }, token);
}

const createBookingRecord = async ({
  userId,
  eventId,
  numberOfTickets,
  token,
}) => {
  const event = await getEventDetails(eventId, token);

  const totalAmount = numberOfTickets * (event.ticketPrice || 1000);

  await updateEventSeats(eventId, numberOfTickets, "decrease", token);

  const booking = await Booking.create({
    userId,
    eventId,
    eventName: event.name,
    venue: event.venue,
    numberOfTickets,
    totalAmount,
    paymentStatus: "PENDING",
    bookingStatus: "PENDING",
  });

  await notifyBookingCreated(booking, token);

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    eventName: booking.eventName,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    status: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    totalAmount: booking.totalAmount,
  };
};

const updateBookingPaymentStatus = async (bookingId, paymentStatus, token) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return null;
  }

  const previousPaymentStatus = booking.paymentStatus;
  const previousBookingStatus = booking.bookingStatus;

  booking.paymentStatus = paymentStatus;
  if (paymentStatus === "SUCCESS") {
    booking.bookingStatus = "CONFIRMED";
  }

  await booking.save();

  const paymentStatusChanged = previousPaymentStatus !== booking.paymentStatus;
  const bookingStatusChanged = previousBookingStatus !== booking.bookingStatus;

  if (paymentStatusChanged || bookingStatusChanged) {
    if (paymentStatus === "SUCCESS") {
      await notifyBookingConfirmed(booking, token);
    } else {
      await notifyBookingUpdated(booking, token);
    }
  }

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    eventName: booking.eventName,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    totalAmount: booking.totalAmount,
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
    eventName: booking.eventName,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    totalAmount: booking.totalAmount,
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
    ({
      id,
      eventId,
      eventName,
      venue,
      numberOfTickets,
      totalAmount,
      bookingStatus,
      paymentStatus,
    }) => ({
      id,
      eventId,
      eventName,
      venue,
      numberOfTickets,
      totalAmount,
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
    ({
      id,
      userId,
      numberOfTickets,
      totalAmount,
      bookingStatus,
      paymentStatus,
    }) => ({
      id,
      userId,
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

  await notifyBookingCancelled(booking, token);

  return {
    booking: {
      id: booking.id,
      userId: booking.userId,
      eventId: booking.eventId,
      eventName: booking.eventName,
      venue: booking.venue,
      numberOfTickets: booking.numberOfTickets,
      totalAmount: booking.totalAmount,
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


