const mongoose = require("mongoose");

const mapReadyState = (state) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[state] || "unknown";
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

const getDbStatus = () => {
  return {
    state: mapReadyState(mongoose.connection.readyState),
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
};

module.exports = {
  connectDB,
  getDbStatus,
};
