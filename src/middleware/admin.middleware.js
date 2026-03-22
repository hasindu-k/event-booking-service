const verifyAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "ADMIN")) {
    next();
  } else {
    res.status(403).json({ message: "Access Denied: Admins Only" });
  }
};

module.exports = verifyAdmin;
