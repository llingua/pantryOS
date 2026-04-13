'use strict';

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: API for managing pantry items
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter items by category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter items by location
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    // In a real implementation, this would fetch items from the database
    const items = [];
    res.json(items);
  } catch (error) {
    logger.error('Error fetching items', { error: error.message });
    throw error;
  }
}));

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // In a real implementation, this would fetch the item from the database
    const item = { id, name: 'Sample Item' };
    
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    logger.error(`Error fetching item ${req.params.id}`, { error: error.message });
    throw error;
  }
}));

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       201:
 *         description: The created item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', asyncHandler(async (req, res) => {
  try {
    // In a real implementation, this would save the item to the database
    const newItem = { id: 'generated-id', ...req.body, createdAt: new Date().toISOString() };
    res.status(201).json(newItem);
  } catch (error) {
    logger.error('Error creating item', { error: error.message });
    throw error;
  }
}));

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update an existing item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       200:
 *         description: The updated item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // In a real implementation, this would update the item in the database
    const updatedItem = { id, ...req.body, updatedAt: new Date().toISOString() };
    res.json(updatedItem);
  } catch (error) {
    logger.error(`Error updating item ${req.params.id}`, { error: error.message });
    throw error;
  }
}));

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // In a real implementation, this would delete the item from the database
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting item ${req.params.id}`, { error: error.message });
    throw error;
  }
}));

module.exports = router;
