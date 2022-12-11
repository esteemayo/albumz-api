import express from 'express';

import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import reviewController from '../controllers/reviewController.js';

const router = express.Router({ mergeParams: true });

router.get('/top', reviewController.getTopReviews);

router.use(authMiddleware.protect);

router
  .route('/')
  .get(reviewController.getReviews)
  .post(authController.restrictTo('user'), reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default router;
