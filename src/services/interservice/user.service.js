const {
  buildPath,
  createHttpError,
  gatewayRequest,
} = require("./gateway.client");

const pathTemplates = {
  userLookup: process.env.GATEWAY_USER_LOOKUP_PATH || "/users/{userId}",
};

const getUserDetails = async (token) => {
  const userPath = buildPath(pathTemplates.userLookup, {});

  try {
    const response = await gatewayRequest({
      method: "GET",
      path: userPath,
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
