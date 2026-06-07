import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validator';
import { createUserSchema, updateUserSchema, userIdParam, userQuerySchema } from './user.schemas';

const router = Router();

/** @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List users (filterable, paginated)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: role, schema: { type: string, enum: [Admin, Scolarite, Enseignant, Etudiant] } }
 *       - { in: query, name: branchId, schema: { type: string, format: uuid } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Paginated user list */
router.get('/', authenticate, requireRole('Admin', 'Scolarite'), validate({ query: userQuerySchema }), userController.findAll);

/** @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: User details */
router.get('/:id', authenticate, validate({ params: userIdParam }), userController.findById);

/** @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, branchId]
 *             properties:
 *               name: { type: string, example: "New Teacher" }
 *               email: { type: string, example: "teacher2@campusops.ma" }
 *               password: { type: string, example: "Teacher123!" }
 *               branchId: { type: string, format: uuid }
 *               role: { type: string, enum: [Admin, Scolarite, Enseignant, Etudiant], default: Etudiant }
 *     responses:
 *       201:
 *         description: User created */
router.post('/', authenticate, requireRole('Admin'), validate({ body: createUserSchema }), userController.create);

/** @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [Admin, Scolarite, Enseignant, Etudiant] }
 *               branchId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User updated */
router.put('/:id', authenticate, requireRole('Admin'), validate({ params: userIdParam, body: updateUserSchema }), userController.update);

/** @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: User deleted */
router.delete('/:id', authenticate, requireRole('Admin'), validate({ params: userIdParam }), userController.delete);

export default router;
