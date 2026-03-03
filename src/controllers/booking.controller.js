const {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent,
  cancelBookingRecord,
} = require("../services/booking.service");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const createBooking = (req, res, next) => {
  try {
    const { userId, eventId, numberOfTickets } = req.body;

    if (!userId || !eventId || !numberOfTickets) {
      return errorResponse(
        res,
        "userId, eventId, and numberOfTickets are required",
        400,
      );
    }

    const booking = createBookingRecord({ userId, eventId, numberOfTickets });
    return successResponse(res, booking, 201);
  } catch (error) {
    return next(error);
  }
};

const getBooking = (req, res, next) => {
  try {
    const booking = getBookingById(req.params.bookingId);

    if (!booking) {
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, booking);
  } catch (error) {
    return next(error);
  }
};

const getUserBookings = (req, res, next) => {
  try {
    const bookings = getBookingsByUser(req.params.userId);
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const getEventBookings = (req, res, next) => {
  try {
    const bookings = getBookingsByEvent(req.params.eventId);
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = (req, res, next) => {
  try {
    const result = cancelBookingRecord(req.params.bookingId);

    if (!result) {
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBooking,
  getBooking,
  getUserBookings,
  getEventBookings,
  cancelBooking,
};
