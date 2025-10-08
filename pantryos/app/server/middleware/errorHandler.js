'use strict';

const logger = require('../utils/logger');

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

const errorHandler = (err, req, res, next) => {
    // Default error status and message
    let { statusCode = 500, message } = err;
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File too large';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Service unavailable';
    }

    // Log the error
    const errorDetails = {
        status: statusCode,
        message,
        stack: process.env.NODE_ENV === 'production' ? '🔒' : err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        ...(err.errors && { errors: err.errors })
    };

    logger.error(message, errorDetails);

    // Send error response
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
