const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Protect routes: requires valid JWT bearer token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret_key"
      );

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Not authorized, user account no longer exists",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error("JWT verification failed:", error.message);
      return res.status(401).json({
        success: false,
        error: "Not authorized, token is invalid or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized, no token provided in Authorization header",
    });
  }
};

/**
 * Optional authentication: attaches req.user if valid token exists,
 * but allows request to continue if unauthenticated.
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret_key"
      );
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      // Continue without user
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
