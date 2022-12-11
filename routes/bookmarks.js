import express from 'express';

import authController from '../controllers/authController.js';
import authmiddleware from '../middlewares/authMiddleware.js';
import bookmarkController from '../controllers/bookmarkController.js';

const router = express.Router();

router.use(authmiddleware.protect);

router.get('/album/:albumId', bookmarkController.getOneBookmark);

router.get(
  '/admin',
  authController.restrictTo('admin'),
  bookmarkController.getAdminBookmarks
);

router
  .route('/')
  .get(bookmarkController.getBookmarks)
  .post(bookmarkController.createBookmark);

router
  .route('/:id')
  .get(bookmarkController.getBookmark)
  .patch(bookmarkController.updateBookmark)
  .delete(bookmarkController.deleteBookmark);

export default router;
