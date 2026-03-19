const {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent,
  cancelBookingRecord,
  updateBookingPaymentStatus,
} = require("../services/booking.service");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId, numberOfTickets } = req.body;

    if (!eventId || !numberOfTickets) {
      return errorResponse(
        res,
        "eventId and numberOfTickets are required",
        400,
      );
    }

    const booking = await createBookingRecord({
      userId,
      eventId,
      numberOfTickets,
      token: req.token,
    });
    return successResponse(res, booking, 201);
  } catch (error) {
    return next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.bookingId);

    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, booking);
  } catch (error) {
    return next(error);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const { status, sortBy, sortOrder } = req.query;
    const bookings = await getBookingsByUser(
      req.params.userId,
      status,
      sortBy,
      sortOrder,
    );
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const getCurrentUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, sortBy, sortOrder } = req.query;
    const bookings = await getBookingsByUser(userId, status, sortBy, sortOrder);
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const getEventBookings = async (req, res, next) => {
  try {
    const { status, sortBy, sortOrder } = req.query;
    const bookings = await getBookingsByEvent(
      req.params.eventId,
      status,
      sortBy,
      sortOrder,
    );
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await cancelBookingRecord(req.params.bookingId, req.token);

    if (!result) {
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, result);
  } catch (error) {
    return next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return errorResponse(res, "paymentStatus is required", 400);
    }

    const booking = await updateBookingPaymentStatus(
      req.params.bookingId,
      paymentStatus,
    );

    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, booking);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  getBooking,
  getUserBookings,
  getCurrentUserBookings,
  getEventBookings,
  cancelBooking,
  updatePaymentStatus,
};
