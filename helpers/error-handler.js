function errorHandler(err, req, res, next) {
  // JWT authentication error
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "The user is not authorized" });
  }

  // Validation Error
  if (err.name === "ValidationError") {
    return res.status(401).json({ message: err });
  }

  // Default to 500 server error
  return res.status(500).json(err);
}

module.exports = errorHandler
