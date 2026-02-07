/**
 * Custom Error Class
 * For operational errors that we can predict and handle
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Centralized Error Handler Middleware
 * Handles all errors in one place with consistent format
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log error for debugging
    console.error('Error:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        error.message = 'Duplicate entry found';
        error.statusCode = 400;
    }

    // MySQL foreign key constraint error
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        error.message = 'Cannot delete: record is referenced by other data';
        error.statusCode = 400;
    }

    // MySQL connection error
    if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        error.message = 'Database connection error';
        error.statusCode = 500;
    }

    // Send error response
    res.status(error.statusCode).json({
        error: error.message || 'Server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { AppError, errorHandler };
