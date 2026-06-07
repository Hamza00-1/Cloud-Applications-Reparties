import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from './auth.schemas';

// ============================================
// Auth Routes
// ============================================

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new account. Requires a valid branch ID from the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, branchId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@campusops.ma
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MyPass123!
 *                 description: "Must contain: uppercase, lowercase, number, special char"
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of an existing branch
 *               role:
 *                 type: string
 *                 enum: [Admin, Scolarite, Enseignant, Etudiant]
 *                 default: Etudiant
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error (weak password, invalid email, etc.)
 *       409:
 *         description: Email already exists
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Returns an access token (15min) and refresh token (7 days).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@campusops.ma
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login successful — returns user + tokens
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access + refresh token pair. Uses token rotation (old refresh token is invalidated).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token from login
 *     responses:
 *       200:
 *         description: New token pair generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (invalidate refresh token)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password
 *     description: Changes the authenticated user's password. Forces re-login after success.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Admin123!
 *               newPassword:
 *                 type: string
 *                 example: NewPass456!
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password is incorrect
 */
router.put('/change-password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile including branch info.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     description: Sends an email with a reset link valid for 15 minutes. Always returns 200 to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@uemf.ma
 *     responses:
 *       200:
 *         description: Reset link sent (always, regardless of whether email exists)
 */
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a token
 *     description: Applies the new password. Token is invalidated immediately after use (one-time only).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reset token from the email link
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Token is invalid or expired
 */
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);

export default router;
