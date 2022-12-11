import express from 'express';

import authMiddleware from '../middlewares/authMiddleware.js';
import * as bookmarkController from '../controllers/bookmarkController.js';

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/album/:albumId', bookmarkController.getOneBookmark);

router.get(
  '/admin',
  authMiddleware.restrictTo('admin'),
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
