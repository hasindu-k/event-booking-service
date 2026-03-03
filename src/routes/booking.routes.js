const express = require("express");
const {
  createBooking,
  getBooking,
  getUserBookings,
  getEventBookings,
  cancelBooking,
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", createBooking);
router.get("/user/:userId", getUserBookings);
router.get("/event/:eventId", getEventBookings);
router.get("/:bookingId", getBooking);
router.delete("/:bookingId", cancelBooking);

module.exports = router;
