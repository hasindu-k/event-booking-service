const express = require("express");
const {
  createBooking,
  getBooking,
  getUserBookings,
  getEventBookings,
  cancelBooking,
} = require("../controllers/booking.controller");
const verifyToken = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.post("/", createBooking);
router.get("/user/:userId", getUserBookings);
router.get("/event/:eventId", getEventBookings);
router.get("/:bookingId", getBooking);
router.delete("/:bookingId", cancelBooking);

module.exports = router;
