const {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent,
  cancelBookingRecord,
} = require("../services/booking.service");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const createBooking = async (req, res, next) => {
  try {
    const { userId, eventId, numberOfTickets } = req.body;

    if (!userId || !eventId || !numberOfTickets) {
      return errorResponse(
        res,
        "userId, eventId, and numberOfTickets are required",
        400,
      );
    }

    const booking = await createBookingRecord({
      userId,
      eventId,
      numberOfTickets,
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
    const bookings = await getBookingsByUser(req.params.userId);
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const getEventBookings = async (req, res, next) => {
  try {
    const bookings = await getBookingsByEvent(req.params.eventId);
    return successResponse(res, bookings);
  } catch (error) {
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await cancelBookingRecord(req.params.bookingId);

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
