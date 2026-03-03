const express = require("express");
const bookingRoutes = require("./routes/booking.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use("/bookings", bookingRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
