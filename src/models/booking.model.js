const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  numberOfTickets: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, default: "SUCCESS" }, // PENDING, SUCCESS, FAILED
  bookingStatus: { type: String, default: "CONFIRMED" }, // PENDING, CONFIRMED, CANCELLED
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
