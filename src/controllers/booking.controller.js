const {
  createBookingRecord,
  getBookingById,
  getBookingsByUser,
  getBookingsByEvent,
  cancelBookingRecord,
  updateBookingPaymentStatus,
  getAllBookings,
} = require("../services/booking.service");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { eventId, numberOfTickets } = req.body;

    if (!eventId || !numberOfTickets) {
      console.warn("[createBooking] Missing fields");
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
    console.error("[createBooking] Error:", error);
    return next(error);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.bookingId);

    if (!booking) {
      console.warn("[getBooking] Booking not found", req.params.bookingId);
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, booking);
  } catch (error) {
    console.error("[getBooking] Error:", error);
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
    console.error("[getUserBookings] Error:", error);
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
    console.error("[getCurrentUserBookings] Error:", error);
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
    console.error("[getEventBookings] Error:", error);
    return next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await cancelBookingRecord(req.params.bookingId, req.token);

    if (!result) {
      console.warn("[cancelBooking] Booking not found", req.params.bookingId);
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, result);
  } catch (error) {
    console.error("[cancelBooking] Error:", error);
    return next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      console.warn("[updatePaymentStatus] Missing paymentStatus");
      return errorResponse(res, "paymentStatus is required", 400);
    }

    const booking = await updateBookingPaymentStatus(
      req.params.bookingId,
      paymentStatus,
      req.token,
    );

    if (!booking) {
      console.warn(
        "[updatePaymentStatus] Booking not found",
        req.params.bookingId,
      );
      return errorResponse(res, "Booking not found", 404);
    }

    return successResponse(res, booking);
  } catch (error) {
    console.error("[updatePaymentStatus] Error:", error);
    return next(error);
  }
};

const listBookings = async (req, res, next) => {
  try {
    const { status, userName, eventId, sortBy, sortOrder, page, limit } =
      req.query;
    const bookings = await getAllBookings(
      { status, userName, eventId },
      sortBy,
      sortOrder,
      Number.parseInt(page) || 1,
      Number.parseInt(limit) || 10,
    );
    return successResponse(res, bookings);
  } catch (error) {
    console.error("[listBookings] Error:", error);
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
  listBookings,
};
