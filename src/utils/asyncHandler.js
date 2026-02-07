/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors and pass to error middleware
 * Eliminates need for try-catch blocks in every controller
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
