/* eslint-disable */

import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authController.login);

router.post('/google-login', authController.googleLogin);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password/:token', authController.resetPassword);

router.patch(
  '/update-my-password',
  authMiddleware.protect,
  authController.updatePassword
);

export default router;
