const {
  createHttpError,
  gatewayRequest,
} = require("./gateway.client");

const userLookupPath = process.env.GATEWAY_USER_LOOKUP_PATH || "/api/users/me";

const getUserDetails = async (token) => {
  try {
    const response = await gatewayRequest({
      method: "GET",
      path: userLookupPath,
      token,
    });
    return response;
  } catch (error) {
    if (error.statusCode === 404) {
      throw createHttpError("User not found", 404);
    }

    throw createHttpError(`Unable to validate user: ${error.message}`, 502);
  }
};

module.exports = {
  getUserDetails,
};
