const express = require("express");
const path = require("node:path");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const bookingRoutes = require("./routes/booking.routes");
const errorHandler = require("./middleware/errorHandler");
const { getDbStatus } = require("./config/db");

const app = express();
app.use(
  cors({
    origin: [
      process.env.API_GATEWAY_URL,
      process.env.FRONTEND_URL,
      "http://localhost:8086",
    ],
  }),
);
const swaggerDocument = YAML.load(
  path.join(__dirname, "..", "swagger", "swagger.yaml"),
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  console.log("Booking service received:", req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Booking Service",
    status: "Updated and Running",
  });
});

app.get("/health/db", (req, res) => {
  const dbStatus = getDbStatus();
  const statusCode = dbStatus.state === "connected" ? 200 : 503;

  return res.status(statusCode).json({
    message:
      dbStatus.state === "connected" ? "DB connected" : "DB not connected",
    ...dbStatus,
  });
});

app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
