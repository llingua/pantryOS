'use strict';

const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const logger = require('../utils/logger');

// Load package.json for version info
const packageJson = require('../../../../../package.json');

// Define the OpenAPI specification
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PantryOS API',
      version: packageJson.version || '1.0.0',
      description: 'API documentation for PantryOS - Pantry Management System',
      contact: {
        name: 'Support',
        url: 'https://github.com/llingua/pantryOS/issues',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
        },
        BadRequest: {
          description: 'The request was invalid or cannot be served',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'Invalid input data',
                errors: [
                  {
                    field: 'name',
                    message: 'Name is required',
                  },
                ],
              },
            },
          },
        },
        NotFound: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                status: 'error',
                message: 'Resource not found',
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error', 'success'],
            },
            message: {
              type: 'string',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Item: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the item',
            },
            name: {
              type: 'string',
              description: 'Name of the item',
            },
            quantity: {
              type: 'number',
              description: 'Current quantity in stock',
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement (e.g., kg, g, L, pcs)',
            },
            category: {
              type: 'string',
              description: 'Category of the item',
            },
            location: {
              type: 'string',
              description: 'Storage location',
            },
            expiryDate: {
              type: 'string',
              format: 'date',
              description: 'Expiration date (YYYY-MM-DD)',
            },
            barcode: {
              type: 'string',
              description: 'Barcode or product code',
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
      },
    },
  },
  // Path to the API docs
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '**/*.yaml'),
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Function to serve Swagger UI
function serveSwaggerUI() {
  return (req, res, next) => {
    // Serve Swagger UI at /api-docs
    if (req.path === '/api-docs' || req.path === '/api-docs/') {
      return res.redirect('/api-docs/index.html');
    }
    next();
  };
}

// Function to serve Swagger JSON
function serveSwaggerJSON() {
  return (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  };
}

// Function to generate Swagger documentation
function generateSwaggerDocs() {
  try {
    // Ensure the docs directory exists
    const docsDir = path.join(__dirname, '../../../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    // Write the OpenAPI specification to a file
    const outputFile = path.join(docsDir, 'openapi.json');
    fs.writeFileSync(outputFile, JSON.stringify(swaggerSpec, null, 2));
    
    logger.info(`OpenAPI documentation generated at ${outputFile}`);
    return true;
  } catch (error) {
    logger.error('Error generating Swagger documentation', {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

module.exports = {
  serveSwaggerUI,
  serveSwaggerJSON,
  generateSwaggerDocs,
  swaggerUi,
  swaggerSpec,
  
  // Helper to apply all Swagger middleware
  applySwagger: (app) => {
    try {
      // Generate documentation
      generateSwaggerDocs();
      
      // Serve Swagger UI
      app.use(
        '/api-docs',
        swaggerUi.serve,
        serveSwaggerUI(),
        swaggerUi.setup(swaggerSpec, {
          explorer: true,
          customSiteTitle: 'PantryOS API Documentation',
          customCss: '.swagger-ui .topbar { display: none }',
          customfavIcon: '/favicon.ico',
        })
      );
      
      // Serve raw Swagger JSON
      app.get('/api-docs.json', serveSwaggerJSON());
      
      logger.info('Swagger documentation available at /api-docs');
      return true;
    } catch (error) {
      logger.error('Error applying Swagger middleware', {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  },
};
