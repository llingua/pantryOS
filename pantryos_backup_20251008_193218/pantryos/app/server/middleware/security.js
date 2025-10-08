'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const logger = require('../utils/logger');

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method
        });
        res.status(options.statusCode).json({
            status: 'error',
            message: options.message
        });
    }
});

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8123',
            'http://homeassistant.local:8123',
            // Add other allowed origins here
        ];

        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            logger.warn('CORS violation', { origin });
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Security headers middleware
const securityHeaders = [
    // Prevent clickjacking
    (req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    },
    
    // Content Security Policy
    (req, res, next) => {
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: http:",
            "font-src 'self' data:",
            "connect-src 'self' https: http:",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'"
        ].join('; ');
        
        res.setHeader('Content-Security-Policy', csp);
        next();
    },
    
    // HSTS (only in production)
    (req, res, next) => {
        if (req.secure || process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        next();
    }
];

// Request sanitization
const sanitizeRequest = (req, res, next) => {
    // Remove any null, undefined, or empty string from request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === null || req.body[key] === undefined || req.body[key] === '') {
                delete req.body[key];
            }
        });
    }
    
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                // Basic XSS protection
                req.query[key] = req.query[key]
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }
        });
    }
    
    next();
};

// Log security-related events
const securityLogger = (req, res, next) => {
    // Log authentication failures
    if (req.path.includes('/login') && req.method === 'POST') {
        const originalSend = res.send;
        res.send = function(body) {
            if (res.statusCode === 401 || res.statusCode === 403) {
                logger.warn('Authentication failure', {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    path: req.path,
                    statusCode: res.statusCode
                });
            }
            originalSend.call(this, body);
        };
    }
    
    next();
};

module.exports = {
    apiLimiter,
    corsOptions,
    securityHeaders,
    sanitizeRequest,
    securityLogger,
    
    // Helper to apply all security middleware
    applySecurity: (app) => {
        // Apply helmet with security best practices
        app.use(helmet());
        
        // Apply custom security headers
        app.use(securityHeaders);
        
        // Apply CORS with our configuration
        app.use(cors(corsOptions));
        
        // Apply rate limiting to API routes
        app.use('/api/', apiLimiter);
        
        // Apply request sanitization
        app.use(sanitizeRequest);
        
        // Apply security logging
        app.use(securityLogger);
        
        logger.info('Security middleware applied');
    }
};
