const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: Invalid Token Format" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied: Token Missing" });
  }

  try {
    // Optionally verify token here if a secret or public key is available
    // For now, we pass the token forward
    req.user = undefined; // decoded user data would go here
    req.token = token;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

module.exports = verifyToken;
