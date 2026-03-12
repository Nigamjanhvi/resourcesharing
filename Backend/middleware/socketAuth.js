const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connections (read-only)
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id firstName lastName');

    if (!user) {
      socket.user = null;
      return next();
    }

    socket.user = user;
    next();
  } catch (err) {
    // Invalid token — allow connection but without user
    socket.user = null;
    next();
  }
};

module.exports = socketAuth;