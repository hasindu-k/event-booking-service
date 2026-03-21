const { createHttpError, gatewayRequest } = require("./gateway.client");

const pathTemplates = {
  paymentCharge: process.env.GATEWAY_PAYMENT_CHARGE_PATH || "/payments",
  paymentRefund: process.env.GATEWAY_PAYMENT_REFUND_PATH || "/payments/refund",
};

const createPayment = async ({
  userId,
  eventId,
  numberOfTickets,
  totalAmount,
  token,
}) => {
  try {
    const paymentResponse = await gatewayRequest({
      method: "POST",
      path: pathTemplates.paymentCharge,
      token,
      body: {
        userId,
        eventId,
        numberOfTickets,
        amount: totalAmount,
      },
    });

    const paymentData = paymentResponse?.data || paymentResponse;
    const paymentStatus = paymentData?.status || "SUCCESS";

    if (paymentStatus === "FAILED") {
      throw createHttpError("Payment failed", 402);
    }

    return {
      status: paymentStatus,
      referenceId: paymentData?.id || paymentData?.referenceId || null,
    };
  } catch (error) {
    if (error.statusCode && error.statusCode < 500) {
      throw error;
    }

    throw createHttpError(`Unable to process payment: ${error.message}`, 502);
  }
};

const refundPayment = async ({ bookingId, userId, eventId, totalAmount, token }) => {
  try {
    await gatewayRequest({
      method: "POST",
      path: pathTemplates.paymentRefund,
      token,
      body: {
        bookingId,
        userId,
        eventId,
        amount: totalAmount,
      },
    });
  } catch (error) {
    throw createHttpError(`Unable to refund payment: ${error.message}`, 502);
  }
};

module.exports = {
  createPayment,
  refundPayment,
};
