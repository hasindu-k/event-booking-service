const Booking = require("../models/booking.model");
const {
  getEventDetails,
  updateEventSeats,
} = require("./interservice/event.service");
const { getUserDetails } = require("./interservice/user.service");
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
  await dispatchNotification(
    {
      eventType: "BOOKING_PENDING",
      source: "BOOKING_SERVICE",
      entityId: booking.id,
      entityType: "BOOKING",
      actorUserId: booking.userId,
      recipients: {
        userId: booking.userId,
      },
      metadata: buildBookingMetadata(booking),
    },
    token,
  );
}

async function notifyBookingUpdated(booking, token) {
  await dispatchNotification(
    {
      eventType: "BOOKING_UPDATED",
      source: "BOOKING_SERVICE",
      entityId: booking.id,
      entityType: "BOOKING",
      actorUserId: booking.userId,
      recipients: {
        userId: booking.userId,
      },
      metadata: buildBookingMetadata(booking),
    },
    token,
  );
}

async function notifyBookingConfirmed(booking, token) {
  await dispatchNotification(
    {
      eventType: "BOOKING_CONFIRMED",
      source: "BOOKING_SERVICE",
      entityId: booking.id,
      entityType: "BOOKING",
      actorUserId: booking.userId,
      recipients: {
        userId: booking.userId,
      },
      metadata: buildBookingMetadata(booking),
    },
    token,
  );

  await dispatchNotification(
    {
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
    },
    token,
  );
}

async function notifyBookingCancelled(booking, token) {
  await dispatchNotification(
    {
      eventType: "BOOKING_CANCELLED",
      source: "BOOKING_SERVICE",
      entityId: booking.id,
      entityType: "BOOKING",
      actorUserId: booking.userId,
      recipients: {
        userId: booking.userId,
      },
      metadata: buildBookingMetadata(booking),
    },
    token,
  );
}

const buildSortOptions = (sortBy, sortOrder) => {
  const allowedSortFields = [
    "createdAt",
    "eventDate",
    "totalAmount",
    "numberOfTickets",
  ];
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

  const total = numberOfTickets * (event.ticketPrice || 1000);
  const serviceFee = Math.round(total * 0.1);
  const totalAmount = total + serviceFee;

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
    serviceFee,
    paymentStatus: "PENDING",
    bookingStatus: "PENDING",
  });

  await notifyBookingCreated(booking, token);

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
    serviceFee: booking.serviceFee,
  };
};

const updateBookingPaymentStatus = async (bookingId, paymentStatus, token) => {
  const bookingStatus = paymentStatus === "SUCCESS" ? "CONFIRMED" : "PENDING";

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      $set: {
        paymentStatus,
        bookingStatus,
      },
    },
    { new: true, runValidators: false },
  );

  if (!booking) {
    return null;
  }

  if (paymentStatus === "SUCCESS") {
    await notifyBookingConfirmed(booking, token);
  } else {
    await notifyBookingUpdated(booking, token);
  }

  return {
    id: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    eventName: booking.eventName,
    venue: booking.venue,
    numberOfTickets: booking.numberOfTickets,
    totalAmount: booking.totalAmount,
    serviceFee: booking.serviceFee,
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
    serviceFee: booking.serviceFee,
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
      serviceFee,
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
      serviceFee,
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
      serviceFee,
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
      serviceFee,
      status: bookingStatus,
      paymentStatus,
    }),
  );
};

const getAllBookings = async (
  filters,
  sortBy,
  sortOrder,
  page = 1,
  limit = 10,
) => {
  const query = {};
  if (filters.status) query.bookingStatus = filters.status;
  if (filters.userName) {
    query.userName = { $regex: filters.userName, $options: "i" };
  }
  if (filters.eventId) query.eventId = filters.eventId;

  const sortOptions = buildSortOptions(sortBy, sortOrder);

  const skip = (page - 1) * limit;
  const total = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const mappedBookings = bookings.map(
    ({
      _id,
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
      bookingStatus,
      paymentStatus,
      serviceFee,
    }) => ({
      id: _id || id,
      userId,
      userName,
      eventId,
      eventName,
      eventDate,
      createdAt,
      venue,
      numberOfTickets,
      totalAmount,
      serviceFee,
      status: bookingStatus,
      paymentStatus,
    }),
  );

  // Return paginated response
  return {
    data: mappedBookings,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
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
      serviceFee: booking.serviceFee,
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
  getAllBookings,
};
