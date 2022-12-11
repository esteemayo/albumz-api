import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', userController.register);

router.use(authMiddleware.protect);

router.get(
  '/stats',
  authController.restrictTo('admin'),
  userController.getUserStats
);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/update-me', userController.updateMe);

router.delete('/delete-me', userController.deleteMe);

router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authController.restrictTo('admin'), userController.updateUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser);

export default router;
