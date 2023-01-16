/* eslint-disable */
import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', userController.register);

router.use(authMiddleware.protect);

router.get(
  '/stats',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  userController.getUserStats,
);

router.get(
  '/me',
  authMiddleware.protect,
  userController.getMe,
  userController.getUser,
);

router.patch(
  '/update-me',
  authMiddleware.protect,
  userController.updateMe,
);

router.delete(
  '/delete-me',
  authMiddleware.protect,
  userController.deleteMe,
);

router
  .route('/')
  .get(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    userController.getUsers,
  )
  .post(userController.createUser);

router
  .route('/:id')
  .get(authMiddleware.verifyUser, userController.getUser)
  .patch(authMiddleware.restrictTo('admin'), userController.updateUser)
  .delete(authMiddleware.restrictTo('admin'), userController.deleteUser);

export default router;
