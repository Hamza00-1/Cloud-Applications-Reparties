import { Router } from 'express';
import { branchController } from './branch.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createBranchSchema, updateBranchSchema, branchIdParam } from './branch.schemas';

const router = Router();

/**
 * @swagger
 * /api/branches:
 *   get:
 *     tags: [Branches]
 *     summary: List all branches
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of branches with counts
 */
router.get('/', authenticate, branchController.findAll);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     tags: [Branches]
 *     summary: Get a branch by ID
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Branch details
 *       404:
 *         description: Branch not found
 */
router.get('/:id', authenticate, validate({ params: branchIdParam }), branchController.findById);

/**
 * @swagger
 * /api/branches:
 *   post:
 *     tags: [Branches]
 *     summary: Create a new branch (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name: { type: string, example: "Casablanca Campus" }
 *               location: { type: string, example: "Boulevard Zerktouni, Casablanca" }
 *     responses:
 *       201:
 *         description: Branch created
 */
router.post('/', authenticate, requireRole('Admin'), validate({ body: createBranchSchema }), branchController.create);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     tags: [Branches]
 *     summary: Update a branch (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Branch updated
 */
router.put('/:id', authenticate, requireRole('Admin'), validate({ params: branchIdParam, body: updateBranchSchema }), branchController.update);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     tags: [Branches]
 *     summary: Delete a branch (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Branch deleted
 *       409:
 *         description: Branch has dependent records
 */
router.delete('/:id', authenticate, requireRole('Admin'), validate({ params: branchIdParam }), branchController.delete);

export default router;
