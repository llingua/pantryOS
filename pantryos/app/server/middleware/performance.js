'use strict';

const compression = require('compression');
const etag = require('etag');
const fresh = require('fresh');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Cache configuration
const CACHE_CONTROL = {
    // Static assets (1 year)
    static: 'public, max-age=31536000, immutable',
    // API responses (5 minutes)
    api: 'no-cache, max-age=300, must-revalidate',
    // HTML pages (5 minutes)
    html: 'no-cache, max-age=300, must-revalidate'
};

// File extensions to cache
const CACHEABLE_EXTENSIONS = new Set([
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'
]);

// Compression options
const compressionOptions = {
    level: zlib.constants.Z_BEST_COMPRESSION,
    threshold: '1kb',
    filter: (req, res) => {
        // Don't compress responses with these content types
        const contentType = res.getHeader('Content-Type') || '';
        return !contentType.includes('image/') && 
               !contentType.includes('video/') && 
               !contentType.includes('application/octet-stream');
    }
};

/**
 * Middleware to compress responses
 */
function compress() {
    return compression(compressionOptions);
}

/**
 * Middleware to set cache headers
 */
function cacheControl(req, res, next) {
    const pathname = req.path.toLowerCase();
    
    // Skip cache for API requests
    if (pathname.startsWith('/api/')) {
        res.setHeader('Cache-Control', CACHE_CONTROL.api);
        return next();
    }
    
    // For static assets
    const ext = path.extname(pathname).toLowerCase();
    if (CACHEABLE_EXTENSIONS.has(ext)) {
        res.setHeader('Cache-Control', CACHE_CONTROL.static);
    } 
    // For HTML pages
    else if (ext === '.html' || ext === '') {
        res.setHeader('Cache-Control', CACHE_CONTROL.html);
    }
    
    next();
}

/**
 * Middleware to handle conditional GET requests with ETags
 */
function conditionalGet() {
    return (req, res, next) => {
        // Only handle GET and HEAD requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }
        
        // Skip for API requests
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        const originalSend = res.send;
        
        // Override the send method to handle ETags
        res.send = function (body) {
            // Only process successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Generate ETag for the response body
                const etagValue = etag(body);
                res.setHeader('ETag', etagValue);
                
                // Check if the client's cache is still valid
                if (fresh(req.headers, { 'etag': etagValue })) {
                    // Client's cache is still valid
                    res.statusCode = 304;
                    res.end();
                    return res;
                }
            }
            
            // Call the original send method
            return originalSend.call(this, body);
        };
        
        next();
    };
}

/**
 * Middleware to serve pre-compressed files if available
 */
function serveCompressed() {
    return (req, res, next) => {
        // Only handle GET and HEAD requests
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }
        
        // Skip for API requests
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        // Check if client accepts gzip encoding
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (!acceptEncoding.includes('gzip')) {
            return next();
        }
        
        // Check if the file has a .gz version
        const filePath = path.join(process.cwd(), 'public', req.path);
        const gzPath = `${filePath}.gz`;
        
        // Check if the .gz file exists
        if (fs.existsSync(gzPath)) {
            // Set appropriate headers
            res.setHeader('Content-Encoding', 'gzip');
            
            // Set Vary header for proper caching
            const vary = res.getHeader('Vary') || '';
            if (!vary.includes('Accept-Encoding')) {
                res.setHeader('Vary', vary ? `${vary}, Accept-Encoding` : 'Accept-Encoding');
            }
            
            // Update the request path to the compressed file
            req.url = `${req.path}.gz`;
            
            // Remove .gz extension from Content-Type
            const ext = path.extname(filePath).toLowerCase();
            if (ext === '.gz') {
                const originalExt = path.extname(path.basename(filePath, '.gz'));
                const contentType = getContentType(originalExt);
                if (contentType) {
                    res.setHeader('Content-Type', contentType);
                }
            }
        }
        
        next();
    };
}

// Helper function to get content type based on file extension
function getContentType(ext) {
    const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.ico': 'image/x-icon'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
}

module.exports = {
    compress,
    cacheControl,
    conditionalGet,
    serveCompressed,
    
    // Helper to apply all performance optimizations
    applyPerformance: (app) => {
        // Apply compression
        app.use(compress());
        
        // Apply cache control headers
        app.use(cacheControl);
        
        // Apply conditional GET with ETags
        app.use(conditionalGet());
        
        // Serve pre-compressed files if available
        app.use(serveCompressed());
        
        console.log('Performance optimizations applied');
    }
};
