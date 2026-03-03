const bookings = [];

const generateBookingId = () => {
  return `B${String(bookings.length + 1).padStart(3, "0")}`;
};

const createBooking = ({ userId, eventId, numberOfTickets, status }) => {
  const booking = {
    id: generateBookingId(),
    userId,
    eventId,
    numberOfTickets,
    status
  };

  bookings.push(booking);
  return booking;
};

const findBookingById = (bookingId) => {
  return bookings.find((booking) => booking.id === bookingId);
};

const findBookingsByUserId = (userId) => {
  return bookings.filter((booking) => booking.userId === userId);
};

const findBookingsByEventId = (eventId) => {
  return bookings.filter((booking) => booking.eventId === eventId);
};

module.exports = {
  createBooking,
  findBookingById,
  findBookingsByUserId,
  findBookingsByEventId
};
