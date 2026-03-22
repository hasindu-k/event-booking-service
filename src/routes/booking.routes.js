const express = require("express");
const {
  createBooking,
  getBooking,
  getUserBookings,
  getCurrentUserBookings,
  getEventBookings,
  cancelBooking,
  updatePaymentStatus,
  listBookings,
} = require("../controllers/booking.controller");
const verifyToken = require("../middleware/auth.middleware");
const verifyAdmin = require("../middleware/admin.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/", verifyAdmin, listBookings);
router.post("/", createBooking);
router.get("/user/me", getCurrentUserBookings);
router.get("/user/:userId", getUserBookings);
router.get("/event/:eventId", getEventBookings);
router.get("/:bookingId", getBooking);
router.delete("/:bookingId", cancelBooking);
router.patch("/:bookingId/payment", updatePaymentStatus);

module.exports = router;
