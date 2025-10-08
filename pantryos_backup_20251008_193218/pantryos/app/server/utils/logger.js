'use strict';

const fs = require('fs');
const path = require('path');
const { createGzip } = require('zlib');
const { Transform } = require('stream');
const { format } = require('date-fns');

class Logger {
    constructor(options = {}) {
        this.logLevels = ['error', 'warn', 'info', 'debug'];
        this.logLevel = options.logLevel || 'info';
        this.logToConsole = options.logToConsole !== false;
        this.logToFile = options.logToFile || false;
        this.logDirectory = options.logDirectory || './logs';
        this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB
        this.maxFiles = options.maxFiles || 5;
        this.filename = options.filename || 'pantryos.log';
        
        if (this.logToFile) {
            this.ensureLogDirectory();
            this.setupWriteStream();
        }
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    setupWriteStream() {
        this.currentLogFile = path.join(this.logDirectory, this.filename);
        this.writeStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
        
        // Handle errors on the write stream
        this.writeStream.on('error', (err) => {
            console.error('Error writing to log file:', err);
        });
    }

    shouldLog(level) {
        return this.logLevels.indexOf(level) <= this.logLevels.indexOf(this.logLevel);
    }

    rotateLogsIfNeeded() {
        if (!this.logToFile) return;

        try {
            const stats = fs.statSync(this.currentLogFile);
            if (stats.size >= this.maxFileSize) {
                this.rotateLogs();
            }
        } catch (err) {
            // File might not exist yet, which is fine
            if (err.code !== 'ENOENT') {
                console.error('Error checking log file size:', err);
            }
        }
    }

    rotateLogs() {
        if (!this.logToFile) return;

        try {
            // Close the current stream
            if (this.writeStream) {
                this.writeStream.end();
            }

            // Compress the current log file
            const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
            const compressedFile = `${this.currentLogFile}.${timestamp}.gz`;
            
            const readStream = fs.createReadStream(this.currentLogFile);
            const writeStream = fs.createWriteStream(compressedFile);
            const compress = createGzip();
            
            readStream.pipe(compress).pipe(writeStream);

            // Clean up old log files
            this.cleanupOldLogs();

            // Start a new log file
            fs.writeFileSync(this.currentLogFile, '');
            this.setupWriteStream();
        } catch (err) {
            console.error('Error rotating logs:', err);
        }
    }

    cleanupOldLogs() {
        try {
            const files = fs.readdirSync(this.logDirectory)
                .filter(file => file.startsWith(this.filename) && file.endsWith('.gz'))
                .map(file => ({
                    name: file,
                    time: fs.statSync(path.join(this.logDirectory, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            // Remove oldest files if we have more than maxFiles
            while (files.length > this.maxFiles) {
                const fileToDelete = files.pop();
                fs.unlinkSync(path.join(this.logDirectory, fileToDelete.name));
            }
        } catch (err) {
            console.error('Error cleaning up old logs:', err);
        }
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta,
            pid: process.pid
        };

        const logString = JSON.stringify(logEntry) + '\n';

        // Log to console if enabled
        if (this.logToConsole) {
            const logLevelColors = {
                ERROR: '\x1b[31m', // Red
                WARN: '\x1b[33m',  // Yellow
                INFO: '\x1b[36m',  // Cyan
                DEBUG: '\x1b[35m', // Magenta
                RESET: '\x1b[0m'   // Reset
            };
            
            const color = logLevelColors[logEntry.level] || '';
            const reset = logLevelColors.RESET;
            
            console[level](`${color}${timestamp} [${logEntry.level}] ${message}${reset}`, 
                Object.keys(meta).length ? meta : '');
        }

        // Log to file if enabled
        if (this.logToFile) {
            this.rotateLogsIfNeeded();
            this.writeStream.write(logString);
        }
    }

    error(message, meta) {
        this.log('error', message, meta);
    }

    warn(message, meta) {
        this.log('warn', message, meta);
    }

    info(message, meta) {
        this.log('info', message, meta);
    }

    debug(message, meta) {
        this.log('debug', message, meta);
    }

    // Request logging middleware
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            const { method, originalUrl, ip, headers } = req;
            
            // Log the incoming request
            this.info('Request started', {
                method,
                url: originalUrl,
                ip,
                userAgent: headers['user-agent']
            });

            // Log the response when it's finished
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.info('Request completed', {
                    method,
                    url: originalUrl,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    contentLength: res.get('Content-Length') || '0',
                    responseTime: duration
                });
            });

            next();
        };
    }
}

// Create a default instance
const logger = new Logger({
    logLevel: process.env.LOG_LEVEL || 'info',
    logToFile: process.env.NODE_ENV === 'production',
    logDirectory: path.join(process.cwd(), 'logs')
});

module.exports = logger;
