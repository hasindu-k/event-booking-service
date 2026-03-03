const express = require("express");
const bookingRoutes = require("./routes/booking.routes");
const errorHandler = require("./middleware/errorHandler");
const { getDbStatus } = require("./config/db");

const app = express();

app.use(express.json());

app.get("/health/db", (req, res) => {
  const dbStatus = getDbStatus();
  const statusCode = dbStatus.state === "connected" ? 200 : 503;

  return res.status(statusCode).json({
    message:
      dbStatus.state === "connected" ? "DB connected" : "DB not connected",
    ...dbStatus,
  });
});

app.use("/bookings", bookingRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
