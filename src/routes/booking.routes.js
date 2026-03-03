const express = require("express");
const {
  createBooking,
  getBooking,
  getUserBookings,
  getEventBookings
} = require("../controllers/booking.controller");

const router = express.Router();

router.post("/", createBooking);
router.get("/user/:userId", getUserBookings);
router.get("/event/:eventId", getEventBookings);
router.get("/:bookingId", getBooking);

module.exports = router;
